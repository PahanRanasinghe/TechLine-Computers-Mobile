const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a supplier
// @route   POST /api/suppliers
// @access  Private/Admin
const addSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, deliveryReliabilityScore } = req.body;

    const supplier = await Supplier.create({
      name,
      contactPerson,
      email,
      phone,
      deliveryReliabilityScore: deliveryReliabilityScore || 5,
    });

    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
const updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, deliveryReliabilityScore } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, contactPerson, email, phone, deliveryReliabilityScore },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    await supplier.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Supplier removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
};
