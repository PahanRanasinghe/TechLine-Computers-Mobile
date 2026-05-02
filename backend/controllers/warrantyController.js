const WarrantyClaim = require('../models/WarrantyClaim');
const Notification = require('../models/Notification');

// ─── POST /api/warranty  (auth required) ────────────────────────────────────
exports.submitClaim = async (req, res) => {
  try {
    const { productCode, productName, issueDescription } = req.body;

    if (!productCode || !issueDescription) {
      return res.status(400).json({ success: false, message: 'Product code and issue description are required.' });
    }

    const claim = await WarrantyClaim.create({
      customerId:       req.user._id,
      customerName:     `${req.user.firstName} ${req.user.lastName}`.trim(),
      customerEmail:    req.user.email,
      productCode:      productCode.trim(),
      productName:      productName || '',
      issueDescription: issueDescription.trim(),
    });

    res.status(201).json({
      success: true,
      message: '✅ Your warranty claim has been successfully submitted!',
      data: claim,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/warranty/my  (auth required) ───────────────────────────────────
// Returns all claims for the logged-in customer
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await WarrantyClaim.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/warranty  (admin only) ─────────────────────────────────────────
exports.getAllClaims = async (req, res) => {
  try {
    const claims = await WarrantyClaim.find()
      .populate('customerId', 'firstName lastName email username')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/warranty/:id/status  (admin only) ────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Resolved'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const claim = await WarrantyClaim.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

    // Send notification
    await Notification.create({
      userId: claim.customerId,
      message: `Your warranty claim for ${claim.productCode} is now: ${status}.`,
      link: '/(tabs)/warranty'
    });

    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
