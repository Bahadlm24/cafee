const { saveDB } = require('./database');
const { v4: uuidv4 } = require('uuid');

console.log('🌱 Seeding database...');

const categories = [
  { id: uuidv4(), name: 'Yiyecekler', icon: '🍔', sort_order: 1, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'İçecekler', icon: '☕', sort_order: 2, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Meşrubatlar', icon: '🥤', sort_order: 3, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Tatlılar', icon: '🍰', sort_order: 4, created_at: new Date().toISOString() },
];

const productData = [
  { cat: 0, name: 'Klasik Burger', description: 'Özel soslu, taze sebzeli klasik burger', ingredients: 'Dana eti, marul, domates, soğan, özel sos, susamlı ekmek', price: 180 },
  { cat: 0, name: 'Tavuk Wrap', description: 'Izgara tavuk parçalı, taze sebzeli wrap', ingredients: 'Tavuk göğsü, lavaş, marul, domates, ranch sos', price: 150 },
  { cat: 0, name: 'Karışık Tost', description: 'Bol malzemeli kaşarlı tost', ingredients: 'Kaşar peyniri, sucuk, domates, yeşillik, tost ekmeği', price: 90 },
  { cat: 0, name: 'Caesar Salata', description: 'Çıtır krutonlu, parmesan peynirli salata', ingredients: 'Marul, kruton, parmesan, caesar sos, tavuk', price: 120 },
  { cat: 0, name: 'Patates Kızartması', description: 'Çıtır çıtır patates kızartması', ingredients: 'Patates, tuz, özel baharat', price: 60 },
  { cat: 1, name: 'Türk Kahvesi', description: 'Geleneksel Türk kahvesi', ingredients: 'Türk kahvesi, su', price: 50 },
  { cat: 1, name: 'Latte', description: 'Sütlü espresso bazlı kahve', ingredients: 'Espresso, süt, süt köpüğü', price: 75 },
  { cat: 1, name: 'Americano', description: 'Klasik amerikan kahvesi', ingredients: 'Espresso, sıcak su', price: 65 },
  { cat: 1, name: 'Çay', description: 'Demlik çay', ingredients: 'Siyah çay', price: 25 },
  { cat: 1, name: 'Sıcak Çikolata', description: 'Kremşantili sıcak çikolata', ingredients: 'Çikolata, süt, kremşanti', price: 70 },
  { cat: 2, name: 'Coca-Cola', description: '330ml kutu kola', ingredients: '', price: 40 },
  { cat: 2, name: 'Fanta', description: '330ml kutu portakallı gazoz', ingredients: '', price: 40 },
  { cat: 2, name: 'Sprite', description: '330ml kutu limonlu gazoz', ingredients: '', price: 40 },
  { cat: 2, name: 'Soda', description: 'Sade veya meyveli soda', ingredients: '', price: 30 },
  { cat: 2, name: 'Ayran', description: 'Taze ayran', ingredients: 'Yoğurt, su, tuz', price: 25 },
  { cat: 3, name: 'Cheesecake', description: 'New York usulü cheesecake', ingredients: 'Krem peynir, bisküvi tabanı, vanilya', price: 90 },
  { cat: 3, name: 'Brownie', description: 'Çikolatalı brownie, dondurma ile', ingredients: 'Çikolata, un, yumurta, tereyağı', price: 85 },
  { cat: 3, name: 'Tiramisu', description: 'İtalyan usulü tiramisu', ingredients: 'Mascarpone, espresso, kedi dili bisküvi, kakao', price: 95 },
];

const products = productData.map((p, i) => ({
  id: uuidv4(),
  category_id: categories[p.cat].id,
  name: p.name,
  description: p.description,
  ingredients: p.ingredients,
  price: p.price,
  image_url: '',
  is_available: true,
  sort_order: i,
  created_at: new Date().toISOString()
}));

const tables = [
  { id: uuidv4(), name: 'Masa 1', section: 'indoor', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Masa 2', section: 'indoor', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Masa 3', section: 'indoor', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Masa 4', section: 'indoor', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Masa 5', section: 'indoor', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Bahçe 1', section: 'garden', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Bahçe 2', section: 'garden', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Bahçe 3', section: 'garden', is_occupied: false, created_at: new Date().toISOString() },
  { id: uuidv4(), name: 'Bahçe 4', section: 'garden', is_occupied: false, created_at: new Date().toISOString() },
];

const data = {
  categories,
  products,
  tables,
  orders: [],
  orderItems: []
};

saveDB(data);

console.log('✅ Seed complete!');
console.log(`   ${categories.length} kategori`);
console.log(`   ${products.length} ürün`);
console.log(`   ${tables.length} masa`);
