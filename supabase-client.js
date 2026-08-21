/* ============================================
   CAMPUS CONNECT — Cliente Supabase
   ============================================ */

var SUPABASE_URL = 'https://pncoixqprmcwtafadsul.supabase.co';
var SUPABASE_KEY = 'sb_publishable_zhoWAR7oEPXOTk3f0K7-OQ_Toz6Nb4Y';
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var PRODUCT_SELECT = `
  id, title, slug, description, price, currency, condition, delivery_type,
  stock, image_urls, status, views, is_featured, created_at, seller_id,
  category_id, university_id,
  categories ( name, slug, icon ),
  universities ( short_name, name ),
  profiles ( first_name, last_name, rating, total_sales, avatar_url )
`;

// ─── Productos ───
async function fetchProducts(filters = {}) {
  let query = supabase.from('products').select(PRODUCT_SELECT).eq('status', 'active');

  if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);
  if (filters.ids) query = query.in('id', filters.ids);
  if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  if (filters.sort === 'price-asc') query = query.order('price', { ascending: true });
  else if (filters.sort === 'price-desc') query = query.order('price', { ascending: false });
  else if (filters.sort === 'alpha') query = query.order('title', { ascending: true });
  // "featured" = más vistas primero. No es una etiqueta manual: se calcula
  // solo con el contador real de vistas (ver incrementProductViews), así
  // que no hay forma de que un vendedor se auto-declare "destacado".
  else if (filters.sort === 'featured') query = query.order('views', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) { console.error(error); return []; }

  // Filtra en cliente por categoría/universidad porque PostgREST no permite
  // filtrar por columnas de tablas embebidas cuando el embed es a-uno.
  let list = data;
  if (filters.categorySlugs?.length) list = list.filter(p => filters.categorySlugs.includes(p.categories?.slug));
  if (filters.universityCodes?.length) list = list.filter(p => filters.universityCodes.includes(p.universities?.short_name));
  if (filters.conditions?.length) list = list.filter(p => filters.conditions.includes(p.condition));
  return list;
}

// IDs de los productos con más vistas — se usa para pintar el badge
// "Destacado" en cualquier grilla, sin importar el orden en que esa
// grilla esté mostrando los productos.
async function fetchFeaturedProductIds(limit = 6) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('status', 'active')
    .gt('views', 0)
    .order('views', { ascending: false })
    .limit(limit);
  if (error) { console.error(error); return new Set(); }
  return new Set(data.map(p => p.id));
}

async function fetchProductById(id) {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).single();
  if (error) { console.error(error); return null; }
  return data;
}

// Suma 1 a las vistas de un producto vía RPC (bypassea RLS solo para esta
// columna: cualquier visitante puede sumar una vista, no solo el dueño).
async function incrementProductViews(productId) {
  const { error } = await supabase.rpc('increment_product_views', { product_id: productId });
  if (error) console.error('Error incrementando vistas:', error);
}

async function fetchRelatedProducts(categoryId, excludeId, limit = 3) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .limit(limit);
  if (error) { console.error(error); return []; }
  return data;
}

async function createProduct(productData) {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: { message: 'Debes iniciar sesión para publicar.' } };

  const slug = productData.title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  return supabase.from('products').insert({
    seller_id: user.id,
    title: productData.title,
    slug,
    description: productData.description,
    category_id: productData.categoryId,
    university_id: productData.universityId,
    price: productData.price,
    condition: productData.condition,
    delivery_type: productData.deliveryType,
    image_urls: productData.imageUrls || [],
    status: 'active',
  }).select().single();
}

async function updateProduct(productId, productData) {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: { message: 'Debes iniciar sesión para editar.' } };

  return supabase.from('products').update({
    title: productData.title,
    description: productData.description,
    category_id: productData.categoryId,
    university_id: productData.universityId,
    price: productData.price,
    condition: productData.condition,
    delivery_type: productData.deliveryType,
    image_urls: productData.imageUrls,
  }).eq('id', productId).eq('seller_id', user.id).select().single();
}

async function deleteProduct(productId) {
  const user = await getCurrentUser();
  if (!user) return { error: { message: 'Debes iniciar sesión.' } };
  return supabase.from('products').delete().eq('id', productId).eq('seller_id', user.id);
}

async function updateProductStatus(productId, status) {
  const user = await getCurrentUser();
  if (!user) return { error: { message: 'Debes iniciar sesión.' } };
  return supabase.from('products').update({ status }).eq('id', productId).eq('seller_id', user.id);
}

// ─── Subir fotos de producto a Storage, devuelve array de URLs públicas ───
async function uploadProductImages(files) {
  const user = await getCurrentUser();
  if (!user || !files || files.length === 0) return [];

  const urls = [];
  for (const file of files) {
    const rawExt = file.name.split('.').pop() || 'jpg';
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toLowerCase() || 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) {
      console.error('Error subiendo imagen:', error);
      continue;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

// ─── Subir foto de perfil (siempre sobrescribe el mismo archivo del
// usuario, así no se acumulan avatares viejos en el bucket) ───
async function uploadAvatar(file) {
  const user = await getCurrentUser();
  if (!user) return { url: null, error: { message: 'Debes iniciar sesión.' } };

  const rawExt = file.name.split('.').pop() || 'jpg';
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toLowerCase() || 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // cache-bust: el navegador (y otros usuarios) deben ver la foto nueva, no la vieja con la misma URL
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id);
  if (updateError) return { url: null, error: updateError };

  return { url, error: null };
}

// ─── Catálogos ───
async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order');
  if (error) { console.error(error); return []; }
  return data;
}

async function fetchUniversities() {
  const { data, error } = await supabase.from('universities').select('*').eq('is_active', true).order('name');
  if (error) { console.error(error); return []; }
  return data;
}

// Perfil público de cualquier usuario (para la página perfil.html). Mismas
// columnas seguras que PROFILE_SELECT — email/phone no son legibles vía API
// para nadie, ni siquiera para el dueño de la fila cuando la consulta viene
// de aquí.
async function fetchPublicProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .single();
  if (error) { console.error(error); return null; }
  return data;
}

async function fetchReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url)')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

// ─── Auth ───
async function signUp({ email, password, firstName, lastName, universityId }) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName, university_id: universityId } },
  });
}

async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

async function signOutUser() {
  return supabase.auth.signOut();
}

// Envía el correo de "recuperar contraseña". El link de ese correo trae a
// la persona de vuelta a cuenta.html con una sesión temporal de recuperación;
// eso se maneja con supabase.auth.onAuthStateChange en cuenta.html.
async function requestPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
}

async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

// Columnas explícitas (sin email/phone: esos ya no son legibles vía API,
// el correo se lee de la sesión de auth con getCurrentUser()).
const PROFILE_SELECT = 'id, university_id, first_name, last_name, career, bio, avatar_url, rating, total_sales, total_purchases, is_verified, is_active, created_at, universities(short_name)';

async function fetchMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).eq('id', user.id).single();
  if (error) { console.error(error); return null; }
  return data;
}

async function fetchMySellerStats() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase.from('v_seller_stats').select('*').eq('seller_id', user.id).maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}

// ─── Órdenes ───
// El precio y el vendedor se leen del producto en la base de datos (no del
// carrito del cliente) para que nadie pueda alterar el monto de una compra
// editando el localStorage o la petición.
async function createOrder({ productId, quantity, paymentMethod, notes, paymentReference }) {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: { message: 'Debes iniciar sesión para comprar.' } };

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price, seller_id, status')
    .eq('id', productId)
    .single();
  if (productError || !product) return { data: null, error: { message: 'Producto no encontrado.' } };
  if (product.status !== 'active') return { data: null, error: { message: 'Este producto ya no está disponible.' } };
  if (product.seller_id === user.id) return { data: null, error: { message: 'No puedes comprar tu propio producto.' } };

  const unitPrice = Number(product.price);
  const subtotal = unitPrice * quantity;
  const fee = +(subtotal * 0.02).toFixed(2);
  const total = +(subtotal + fee).toFixed(2);

  return supabase.from('orders').insert({
    buyer_id: user.id,
    seller_id: product.seller_id,
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    subtotal,
    marketplace_fee: fee,
    total,
    payment_method: paymentMethod,
    payment_status: 'pending',
    payment_reference: paymentReference || null,
    delivery_status: 'pending',
    notes: notes || null,
  }).select().single();
}

// ─── Comprobante de transferencia — bucket privado (no público como
// product-images/avatars): solo el comprador y el vendedor de esa orden
// pueden verlo, vía las políticas RLS de storage.objects. La ruta
// {orderId}/... es lo que esas políticas usan para saber a quién
// pertenece cada archivo, así que el orden importa: la orden ya debe
// existir antes de subir el comprobante. ───
async function uploadPaymentReceipt(orderId, file) {
  const user = await getCurrentUser();
  if (!user) return { path: null, error: { message: 'Debes iniciar sesión.' } };

  const rawExt = file.name.split('.').pop() || 'jpg';
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toLowerCase() || 'jpg';
  const path = `${orderId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('payment-receipts').upload(path, file);
  if (error) return { path: null, error };
  return { path, error: null };
}

// Adjunta el mismo comprobante a todas las órdenes de un mismo checkout
// (un carrito con varios productos crea una orden por producto, pero la
// transferencia y el comprobante son uno solo para todo el total).
async function attachPaymentProof(orderIds, path) {
  return supabase.from('orders').update({ payment_proof_url: path }).in('id', orderIds);
}

// Genera una URL temporal para ver un comprobante — el bucket es privado,
// así que no existe una URL pública fija como con las fotos de producto.
async function getPaymentReceiptUrl(path, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage.from('payment-receipts').createSignedUrl(path, expiresInSeconds);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

async function updateOrderDeliveryStatus(orderId, deliveryStatus) {
  const user = await getCurrentUser();
  if (!user) return { error: { message: 'Debes iniciar sesión.' } };
  return supabase.from('orders').update({ delivery_status: deliveryStatus }).eq('id', orderId).eq('seller_id', user.id);
}

// ─── Reseñas ───
// La validación de que la orden es real, está pagada y reviewedId es
// justo la contraparte de esa orden vive en la política RLS de `reviews`,
// no aquí (mismo patrón que createOrder: no confiar solo en el cliente).
async function createReview({ orderId, revieweeId, rating, comment }) {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: { message: 'Debes iniciar sesión.' } };

  return supabase.from('reviews').insert({
    order_id: orderId,
    reviewer_id: user.id,
    reviewed_id: revieweeId,
    rating,
    comment: comment || null,
  }).select().single();
}

// Reseñas que YO ya hice, indexadas por order_id, para no mostrar
// "Calificar" dos veces sobre la misma orden.
async function fetchMyReviewsByOrder() {
  const user = await getCurrentUser();
  if (!user) return {};
  const { data, error } = await supabase.from('reviews').select('order_id, rating, comment').eq('reviewer_id', user.id);
  if (error) { console.error(error); return {}; }
  return Object.fromEntries(data.map(r => [r.order_id, r]));
}

// ─── Reportes ───
// Cualquiera puede reportar un producto o un vendedor; la política RLS
// de `reports` exige reporter_id = auth.uid() y solo el admin puede leer
// reportes ajenos, así que no hay forma de espiar reportes de otros.
async function createReport({ reportedUserId, reportedProductId, reason, description }) {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: { message: 'Debes iniciar sesión para reportar.' } };

  return supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId || null,
    reported_product_id: reportedProductId || null,
    reason,
    description: description || null,
  }).select().single();
}

// ─── Admin ───
// am_i_admin() es un RPC (no una columna del perfil) para no exponer
// is_admin en una consulta pública de profiles.
async function amIAdmin() {
  const { data, error } = await supabase.rpc('am_i_admin');
  if (error) { console.error(error); return false; }
  return data === true;
}

async function fetchPendingTransfers() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, total, subtotal, marketplace_fee, payment_reference, payment_proof_url, created_at,
      buyer:profiles!orders_buyer_id_fkey(first_name, last_name),
      seller:profiles!orders_seller_id_fkey(first_name, last_name),
      products(title)
    `)
    .eq('payment_method', 'transfer')
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

async function approveTransfer(orderId) {
  return supabase.rpc('admin_approve_transfer', { p_order_id: orderId });
}

async function rejectTransfer(orderId) {
  return supabase.rpc('admin_reject_transfer', { p_order_id: orderId });
}

async function fetchPendingReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, reason, description, status, created_at,
      reporter:profiles!reports_reporter_id_fkey(first_name, last_name),
      reported_user:profiles!reports_reported_user_id_fkey(id, first_name, last_name),
      reported_product:products!reports_reported_product_id_fkey(id, title)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

async function resolveReport(reportId, status) {
  return supabase.from('reports').update({ status, resolved_at: new Date().toISOString() }).eq('id', reportId);
}
