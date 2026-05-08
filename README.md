TechLine Computers — Mobile Application

> A full-stack mobile application for TechLine Computers (Pvt) Ltd, a computer hardware and spare parts retailer based in Sri Lanka. Built as part of the **SE2020 Web & Mobile Technologies** group assignment at SLIIT.

---

Live Demo

**Backend API** - https://techline-backend-dy9j.onrender.com 
**Web Version** - https://techline-computers.vercel.app 
**GitHub Repo** - https://github.com/PahanRanasinghe/TechLine-Computers-Mobile 

---

Group — WMT_IT_17

IT24104295 - Gunarathna U.P.T.N - Warranty & Service Management
IT24100247 - Kavindi M.N.H.S - Inventory Management
IT24101792 - Theekshana A.P.N - Order & Sales Handling
IT24100644 - Ranasinghe P.S - Supplier & Procurement Management

---

Features:

Customer:
**Landing Page** — Featured products, store overview, and TechBot chatbot
**Store** — Browse products by category, search by name/brand/code
**Product Detail** — Full specs, warranty period, and add-to-cart
**Shopping Cart** — Add, remove, and checkout with delivery/payment selection
**Purchase History** — View past orders with warranty badges per item
**Warranty Claims** — Submit and track warranty claims on purchased products
**Service Tickets** — Submit repair/return/replacement service requests
**Notifications** — Status update alerts from admin
**Profile** — View and edit account details

Admin:
**Dashboard** — Live stats: users, revenue, low stock count, pending claims
**Inventory** — Full product CRUD, low-stock filter, image upload via Cloudinary
**Sales / Orders** — View and update all customer orders
**Warranty & Service** — Manage all warranty claims and service tickets
**Suppliers** — Add, view, and delete supplier records
**Purchase Orders** — Create and track procurement orders
**User Management** — View, edit, and delete user accounts

AI Chatbot — TechBot
**Accessible by all users** — no login required
**Queries the MongoDB product database** first for real pricing and stock info
**Falls back to Google Gemini AI** (`gemini-2.0-flash`) for general hardware advice
**Floating Action Button (FAB)** on Landing Page and Store

---

Tech Stack:

**Mobile Frontend** - React Native (Expo SDK 55), Expo Router
**Backend API** - Node.js, Express.js
**Database** - MongoDB Atlas (Mongoose ODM)
**Authentication** - JWT (`jsonwebtoken`) + bcryptjs
**Image Storage** - Cloudinary CDN
**AI Chatbot** - Google Gemini API (`gemini-2.0-flash`)
**Backend Hosting** - Render
**Web Hosting** - Vercel
**Mobile Build** - Expo EAS Build

---

Project Structure

```
TechLine-Computers-Mobile/
├── backend/                    # Node.js + Express REST API
│   ├── config/
│   │   └── db.js               # MongoDB Atlas connection
│   ├── controllers/            # Business logic for all modules
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect + adminOnly
│   │   └── errorMiddleware.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── WarrantyClaim.js
│   │   ├── ServiceTicket.js
│   │   ├── Supplier.js
│   │   ├── PurchaseOrder.js
│   │   └── Notification.js
│   ├── routes/                 # Express route definitions (12 route groups)
│   ├── uploads/                # Local fallback (dev only; production uses Cloudinary)
│   ├── server.js               # App entry point
│   └── package.json
│
├── mobile/                     # React Native (Expo) app
│   ├── app/
│   │   ├── (auth)/             # Login & Register screens
│   │   ├── (tabs)/             # Customer tab navigation
│   │   │   ├── index.jsx       # Landing page
│   │   │   ├── store.jsx
│   │   │   ├── cart.jsx
│   │   │   ├── purchase-history.jsx
│   │   │   ├── warranty.jsx
│   │   │   ├── service-ticket.jsx
│   │   │   ├── notifications.jsx
│   │   │   └── profile.jsx
│   │   ├── (admin)/            # Admin screens (protected)
│   │   │   ├── dashboard.jsx
│   │   │   ├── inventory.jsx
│   │   │   ├── sales.jsx
│   │   │   ├── warranty.jsx
│   │   │   ├── suppliers.jsx
│   │   │   ├── users.jsx
│   │   │   └── purchase-orders/
│   │   └── product/[id].jsx    # Dynamic product detail
│   ├── components/
│   │   └── TechBotChat.jsx     # TechBot FAB + chat modal
│   ├── context/
│   │   ├── AuthContext.jsx     # Global auth state (JWT, user)
│   │   └── CartContext.jsx     # Global cart state
│   ├── services/
│   │   └── api.js              # Axios instance with JWT interceptor
│   ├── assets/                 # App icons and splash screen
│   ├── app.json                # Expo config
│   ├── eas.json                # EAS Build profiles
│   └── package.json
│
├── render.yaml                 # Render deployment blueprint
└── .gitignore
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js >= 18
- Expo Go app on your Android/iOS device
- MongoDB Atlas account
- (Optional) Cloudinary account for image uploads

### 1. Clone the repo
```bash
git clone https://github.com/PahanRanasinghe/TechLine-Computers-Mobile.git
cd TechLine-Computers-Mobile
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
GEMINI_API_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the backend:
```bash
npm run dev
```

### 3. Set up the mobile app
```bash
cd ../mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone. Make sure your phone and PC are on the **same Wi-Fi network**.

---

## 🌐 API Endpoints

The backend exposes **42 endpoints** across 12 route groups:

| Group | Base Path | Auth |
|---|---|---|
| Authentication | `/api/auth` | Public / User |
| Products | `/api/products` | Public / Admin |
| Orders | `/api/orders` | User / Admin |
| Warranty Claims | `/api/warranty` | User / Admin |
| Service Tickets | `/api/service-tickets` | User / Admin |
| Suppliers | `/api/suppliers` | Admin |
| Purchase Orders | `/api/purchase-orders` | Admin |
| Users | `/api/users` | Admin |
| Notifications | `/api/notifications` | User / Admin |
| Admin Dashboard | `/api/admin` | Admin |
| Image Upload | `/api/upload` | Admin |
| TechBot Chatbot | `/api/chatbot` | **Public** |

---

## 📦 Deployment

### Backend → Render
- Connect the GitHub repo to Render
- Set **Root Directory** to `backend`
- Build: `npm install` | Start: `npm start`
- Add all environment variables from `.env` in the Render dashboard

### Web → Vercel
- Connect the GitHub repo to Vercel
- Set **Root Directory** to `mobile`
- Build Command: `npx expo export --platform web`
- Output Directory: `dist`

### Android APK → Expo EAS Build
```bash
cd mobile
eas build --platform android --profile preview
```
Download the `.apk` from the link provided and install on any Android device.

---

## License

This project was developed for academic purposes as part of the **SE2020** module at the **Sri Lanka Institute of Information Technology (SLIIT)**.

© 2026 WMT_IT_17 — Faculty of Computing, SLIIT
