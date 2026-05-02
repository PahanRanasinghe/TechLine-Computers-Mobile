const Product = require('../models/Product');

// ─── Sample seed data ───────────────────────────────────────────────────────
const SEED_PRODUCTS = [
  // Processors
  { name: 'Intel Core i9-13900K', code: 'CPU-001', category: 'Processors', brand: 'Intel', unitPrice: 125000, quantityInStock: 15, warrantyPeriod: 3, description: '24-core, 32-thread, 5.8GHz Turbo Boost' },
  { name: 'Intel Core i7-13700K', code: 'CPU-002', category: 'Processors', brand: 'Intel', unitPrice: 85000, quantityInStock: 20, warrantyPeriod: 3, description: '16-core, 24-thread, 5.4GHz Turbo Boost' },
  { name: 'AMD Ryzen 9 7950X',    code: 'CPU-003', category: 'Processors', brand: 'AMD',   unitPrice: 115000, quantityInStock: 10, warrantyPeriod: 3, description: '16-core, 32-thread, 5.7GHz Max Boost' },
  { name: 'AMD Ryzen 5 7600X',    code: 'CPU-004', category: 'Processors', brand: 'AMD',   unitPrice: 45000, quantityInStock: 25, warrantyPeriod: 3, description: '6-core, 12-thread, 5.3GHz Max Boost' },
  // Graphics Cards
  { name: 'NVIDIA RTX 4070 Ti',   code: 'GPU-001', category: 'Graphics Cards', brand: 'NVIDIA', unitPrice: 210000, quantityInStock: 8, warrantyPeriod: 3, description: '12GB GDDR6X, Ada Lovelace Architecture' },
  { name: 'NVIDIA RTX 3060',      code: 'GPU-002', category: 'Graphics Cards', brand: 'NVIDIA', unitPrice: 95000, quantityInStock: 12, warrantyPeriod: 2, description: '12GB GDDR6, Ampere Architecture' },
  { name: 'AMD Radeon RX 7900 XTX', code: 'GPU-003', category: 'Graphics Cards', brand: 'AMD', unitPrice: 195000, quantityInStock: 5, warrantyPeriod: 3, description: '24GB GDDR6, RDNA 3 Architecture' },
  // Memory
  { name: 'Kingston Fury Beast 16GB DDR5', code: 'RAM-001', category: 'Memory (RAM)', brand: 'Kingston', unitPrice: 22000, quantityInStock: 30, warrantyPeriod: 2, description: 'DDR5-5200, CL40, XMP 3.0' },
  { name: 'Corsair Vengeance 32GB DDR4',   code: 'RAM-002', category: 'Memory (RAM)', brand: 'Corsair',  unitPrice: 18000, quantityInStock: 20, warrantyPeriod: 2, description: 'DDR4-3600, CL18, 2×16GB Kit' },
  { name: 'G.Skill Trident Z5 32GB RGB',   code: 'RAM-003', category: 'Memory (RAM)', brand: 'G.Skill', unitPrice: 28000, quantityInStock: 15, warrantyPeriod: 2, description: 'DDR5-6000, CL36, RGB Lighting' },
  // Storage
  { name: 'Samsung 990 Pro 1TB NVMe', code: 'SSD-001', category: 'Storage', brand: 'Samsung',        unitPrice: 32000, quantityInStock: 25, warrantyPeriod: 5, description: 'M.2 PCIe Gen4, 7450MB/s Read' },
  { name: 'WD Black SN850X 2TB',      code: 'SSD-002', category: 'Storage', brand: 'Western Digital', unitPrice: 55000, quantityInStock: 10, warrantyPeriod: 5, description: 'M.2 PCIe Gen4, 7300MB/s Read' },
  { name: 'Seagate Barracuda 2TB',    code: 'HDD-001', category: 'Storage', brand: 'Seagate',         unitPrice: 12000, quantityInStock: 40, warrantyPeriod: 2, description: '3.5" SATA, 7200 RPM, CMR' },
  // Motherboards
  { name: 'ASUS ROG Strix Z790-E',   code: 'MB-001', category: 'Motherboards', brand: 'ASUS', unitPrice: 98000, quantityInStock: 8, warrantyPeriod: 3, description: 'LGA1700, DDR5, PCIe 5.0, WiFi 6E' },
  { name: 'MSI MAG B650 Tomahawk',   code: 'MB-002', category: 'Motherboards', brand: 'MSI',  unitPrice: 55000, quantityInStock: 12, warrantyPeriod: 3, description: 'AM5 Socket, DDR5, ATX, WiFi' },
  // Power Supplies
  { name: 'Corsair RM1000x 1000W', code: 'PSU-001', category: 'Power Supplies', brand: 'Corsair', unitPrice: 42000, quantityInStock: 15, warrantyPeriod: 10, description: '80+ Gold Certified, Fully Modular' },
  { name: 'Seasonic PRIME TX-850', code: 'PSU-002', category: 'Power Supplies', brand: 'Seasonic', unitPrice: 52000, quantityInStock: 8, warrantyPeriod: 12, description: '80+ Titanium, Fully Modular' },
  // Cooling
  { name: 'NZXT Kraken 360 RGB AIO',     code: 'COOL-001', category: 'Cooling', brand: 'NZXT',      unitPrice: 45000, quantityInStock: 10, warrantyPeriod: 6, description: '360mm AIO Liquid Cooler, RGB Pump Head' },
  { name: "be quiet! Dark Rock Pro 4",   code: 'COOL-002', category: 'Cooling', brand: 'be quiet!', unitPrice: 22000, quantityInStock: 18, warrantyPeriod: 3, description: 'Dual-Tower Air Cooler, 250W TDP' },
  // Peripherals
  { name: 'Logitech G Pro X Superlight 2', code: 'PER-001', category: 'Peripherals', brand: 'Logitech', unitPrice: 28000, quantityInStock: 20, warrantyPeriod: 2, description: 'Wireless Gaming Mouse, HERO 25K Sensor' },
  { name: 'Samsung 27" Odyssey G7',        code: 'MON-001', category: 'Monitors',    brand: 'Samsung',  unitPrice: 145000, quantityInStock: 6, warrantyPeriod: 3, description: '1440p QHD, 240Hz, 1ms, VA Panel' },
];

// ─── GET /api/products ─────────────────────────────────────────────────────
// Public — search & category filter supported
exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isActive: true };

    if (search && search.trim()) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { code:        { $regex: search, $options: 'i' } },
        { brand:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ category: 1, name: 1 });

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/products/categories ─────────────────────────────────────────
// Public — returns all distinct categories
exports.getCategories = async (req, res) => {
  try {
    const cats = await Product.distinct('category', { isActive: true });
    res.json({ success: true, data: ['All', ...cats.sort()] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/products/:id ─────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/products/seed  (dev helper) ─────────────────────────────────
exports.seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    const result = await Product.insertMany(SEED_PRODUCTS);
    res.json({ success: true, message: `✅ Seeded ${result.length} products successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/products/admin/all  (admin) ──────────────────────────────────
// Returns ALL products (including inactive) with optional search & lowStockOnly filter
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { search, lowStockOnly } = req.query;
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { code:        { $regex: search, $options: 'i' } },
        { brand:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (lowStockOnly === 'true') {
      filter.quantityInStock = { $lte: 5 };
    }

    const products = await Product.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/products  (admin) ───────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { name, code, category, brand, description, unitPrice, quantityInStock, warrantyPeriod, imageUrl } = req.body;
    if (!name || !code || !category || unitPrice == null) {
      return res.status(400).json({ success: false, message: 'Name, code, category and price are required.' });
    }
    const product = await Product.create({
      name, code, category, brand: brand || '',
      description: description || '',
      unitPrice, quantityInStock: quantityInStock || 0,
      warrantyPeriod: warrantyPeriod || 0,
      imageUrl: imageUrl || '',
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: `Product code "${req.body.code}" already exists.` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/products/:id  (admin) ────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { name, code, category, brand, description, unitPrice, quantityInStock, warrantyPeriod, isActive, imageUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, code, category, brand, description, unitPrice, quantityInStock, warrantyPeriod, isActive, imageUrl },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: `Product code already exists.` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/products/:id  (admin) ─────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: `"${product.name}" has been deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

