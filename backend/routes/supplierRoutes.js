const express = require('express');
const router = express.Router();
const { getSuppliers, addSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getSuppliers)
  .post(protect, adminOnly, addSupplier);

router.route('/:id')
  .delete(protect, adminOnly, deleteSupplier);

module.exports = router;
