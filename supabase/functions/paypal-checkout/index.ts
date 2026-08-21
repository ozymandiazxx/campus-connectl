// ============================================
// CAMPUS CONNECT — Confirmación de pago PayPal
// ============================================
// Esta función corre en el servidor (Supabase Edge Function), no en el
// navegador. Es la única pieza autorizada para marcar una orden como
// "paid": el monto se calcula SIEMPRE desde las órdenes reales en la base
// de datos (nunca desde lo que mande el cliente), y la aprobación del pago
// se verifica llamando a PayPal directamente con el Client Secret — nunca
// se confía en que el navegador diga "ya pagué".

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYPAL_API_BASE = Deno.env.get('PAYPAL_API_BASE') ?? 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!;
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!;

// Estas tres las inyecta Supabase automáticamente en toda Edge Function,
// no hace falta configurarlas a mano.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPaypalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'No se pudo autenticar con PayPal');
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'No autorizado' }, 401);

  // Cliente "como el usuario": solo para confirmar quién es, respeta su JWT.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'No autorizado' }, 401);

  // Cliente con service role: solo se usa DESPUÉS de validar que las
  // órdenes en cuestión son del usuario autenticado (ver abajo).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { action?: string; orderIds?: string[]; paypalOrderId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const { action, orderIds, paypalOrderId } = body;
  console.log(`[paypal-checkout] action=${action} user=${user.id} orderIds=${JSON.stringify(orderIds)} paypalOrderId=${paypalOrderId ?? '(ninguno)'}`);

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return json({ error: 'Faltan orderIds' }, 400);
  }

  const { data: orders, error } = await adminClient
    .from('orders')
    .select('id, total, buyer_id, payment_status')
    .in('id', orderIds);

  if (error || !orders || orders.length !== orderIds.length) {
    console.log(`[paypal-checkout] órdenes no encontradas: esperaba ${orderIds.length}, encontró ${orders?.length ?? 0}. error=${error?.message}`);
    return json({ error: 'Alguna orden no existe' }, 400);
  }
  if (orders.some((o) => o.buyer_id !== user.id)) {
    console.log(`[paypal-checkout] rechazado: órdenes no pertenecen a user=${user.id}`);
    return json({ error: 'Estas órdenes no te pertenecen' }, 403);
  }
  if (orders.some((o) => o.payment_status === 'paid')) {
    console.log(`[paypal-checkout] rechazado: alguna orden ya estaba paid`);
    return json({ error: 'Alguna de estas órdenes ya está pagada' }, 409);
  }

  const total = orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2);
  console.log(`[paypal-checkout] total calculado=${total}`);

  try {
    const accessToken = await getPaypalAccessToken();

    if (action === 'create') {
      const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ amount: { currency_code: 'USD', value: total } }],
        }),
      });
      const data = await res.json();
      if (!res.ok) return json({ error: data.message || 'PayPal rechazó la orden' }, 502);
      return json({ paypalOrderId: data.id });
    }

    if (action === 'capture') {
      if (!paypalOrderId) return json({ error: 'Falta paypalOrderId' }, 400);

      const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      console.log(`[paypal-checkout] respuesta de captura de PayPal: status=${res.status} body=${JSON.stringify(data)}`);

      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
      const approved = data.status === 'COMPLETED' && capture?.status === 'COMPLETED';
      const paidAmount = Number(capture?.amount?.value ?? 0);

      // Tolerancia de 1 centavo por redondeo; si PayPal cobró menos de lo
      // que realmente cuesta el pedido, no se confirma.
      if (!approved || paidAmount < Number(total) - 0.01) {
        console.log(`[paypal-checkout] captura NO aprobada: approved=${approved} paidAmount=${paidAmount} totalEsperado=${total}`);
        return json({ error: 'El pago no se pudo verificar con PayPal' }, 402);
      }

      const { error: updateError } = await adminClient
        .from('orders')
        .update({ payment_status: 'paid' })
        .in('id', orderIds);
      if (updateError) {
        console.log(`[paypal-checkout] pago aprobado por PayPal PERO falló el update en Supabase: ${updateError.message}`);
        return json({ error: updateError.message }, 500);
      }

      console.log(`[paypal-checkout] éxito: orderIds=${JSON.stringify(orderIds)} marcadas como paid`);
      return json({ ok: true });
    }

    console.log(`[paypal-checkout] acción desconocida: ${action}`);
    return json({ error: 'Acción inválida' }, 400);
  } catch (err) {
    console.log(`[paypal-checkout] excepción no controlada: ${err}`);
    return json({ error: String(err) }, 500);
  }
});
