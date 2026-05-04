const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Cloudinary storage — images go straight to the cloud ─────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'techline-products',          // folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // auto-resize
  },
});

// File size limit (5 MB)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── POST /api/upload  —  upload a single product image ───────────────────────
router.post('/', protect, adminOnly, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // Cloudinary returns the permanent CDN URL in req.file.path
    const imageUrl = req.file.path;

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: { imageUrl, filename: req.file.filename },
    });
  });
});

module.exports = router;
