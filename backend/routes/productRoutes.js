const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getProducts,
  getCategories,
  getProductById,
  seedProducts,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// ── Public routes (customers & guests) ───────────────────────────────────────
router.get('/categories',    getCategories);     // GET /api/products/categories
router.get('/',              getProducts);        // GET /api/products?search=&category=
router.get('/:id',           getProductById);     // GET /api/products/:id

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all',     protect, adminOnly, getAllProductsAdmin);  // GET  /api/products/admin/all
router.post('/',             protect, adminOnly, createProduct);        // POST /api/products
router.put('/:id',           protect, adminOnly, updateProduct);        // PUT  /api/products/:id
router.delete('/:id',        protect, adminOnly, deleteProduct);        // DEL  /api/products/:id

// Dev-only seed route
router.post('/seed',         seedProducts);       // POST /api/products/seed

module.exports = router;
