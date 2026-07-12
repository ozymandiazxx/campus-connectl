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

  if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  if (filters.sort === 'price-asc') query = query.order('price', { ascending: true });
  else if (filters.sort === 'price-desc') query = query.order('price', { ascending: false });
  else if (filters.sort === 'alpha') query = query.order('title', { ascending: true });
  else query = query.order('created_at', { ascending: false });

  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) { console.error(error); return []; }

  // Filtra en cliente por categoría/universidad porque PostgREST no permite
  // filtrar por columnas de tablas embebidas cuando el embed es a-uno.
  let list = data;
  if (filters.categorySlugs?.length) list = list.filter(p => filters.categorySlugs.includes(p.categories?.slug));
  if (filters.universityCodes?.length) list = list.filter(p => filters.universityCodes.includes(p.universities?.short_name));
  return list;
}

async function fetchProductById(id) {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).single();
  if (error) { console.error(error); return null; }
  return data;
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
  const { data: { user } } = await supabase.auth.getUser();
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
    const ext = file.name.split('.').pop();
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

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function fetchMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('*, universities(short_name)').eq('id', user.id).single();
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
async function createOrder({ productId, sellerId, quantity, unitPrice, paymentMethod }) {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: { message: 'Debes iniciar sesión para comprar.' } };

  const subtotal = unitPrice * quantity;
  const fee = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + fee).toFixed(2);

  return supabase.from('orders').insert({
    buyer_id: user.id,
    seller_id: sellerId,
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    subtotal,
    marketplace_fee: fee,
    total,
    payment_method: paymentMethod,
    payment_status: 'pending',
    delivery_status: 'pending',
  }).select().single();
}
