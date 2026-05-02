const ServiceTicket = require('../models/ServiceTicket');
const Notification = require('../models/Notification');

// ─── POST /api/service-tickets  (auth required) ──────────────────────────────
exports.submitTicket = async (req, res) => {
  try {
    const { productCode, productName, serviceType, description } = req.body;

    if (!productCode || !description) {
      return res.status(400).json({ success: false, message: 'Product code and description are required.' });
    }

    const ticket = await ServiceTicket.create({
      customerId:    req.user._id,
      customerName:  `${req.user.firstName} ${req.user.lastName}`.trim(),
      customerEmail: req.user.email,
      productCode:   productCode.trim(),
      productName:   productName || '',
      serviceType:   serviceType || 'Repair',
      description:   description.trim(),
    });

    res.status(201).json({
      success: true,
      message: "✅ Your service request has been submitted! We'll be in touch shortly.",
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/service-tickets/my  (auth required) ────────────────────────────
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await ServiceTicket.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/service-tickets  (admin only) ──────────────────────────────────
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await ServiceTicket.find()
      .populate('customerId', 'firstName lastName email username')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/service-tickets/:id/status  (admin only) ─────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'In Progress', 'Completed', 'Rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const ticket = await ServiceTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Send notification
    await Notification.create({
      userId: ticket.customerId,
      message: `Your service request for ${ticket.productCode} is now: ${status}.`,
      link: '/(tabs)/service-ticket'
    });

    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
