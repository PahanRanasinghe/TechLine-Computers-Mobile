const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update any user (admin can change role, activate/deactivate)
// @route   PUT /api/users/:id
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, address, contactNumber, role, isActive } = req.body;

    // Prevent admin from accidentally deleting last admin
    if (role === 'ROLE_USER') {
      const adminCount = await User.countDocuments({ role: 'ROLE_ADMIN', isActive: true });
      const targetUser = await User.findById(req.params.id);
      if (targetUser && targetUser.role === 'ROLE_ADMIN' && adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last admin user',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, address, contactNumber, role, isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User "${user.username}" has been deleted`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
