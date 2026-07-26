# 🏦 Mini Bank Management System

A full-stack web-based banking application built with Node.js, Express.js, MongoDB, and React.js (Vite).

---

## 🏗️ Project Structure

```
minibank/
├── backend/                   # Node.js + Express.js API
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── transactionController.js
│   │   ├── loanController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + RBAC middleware
│   │   └── errorHandler.js
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Transaction.js
│   │   ├── Loan.js
│   │   ├── Branch.js
│   │   ├── AuditLog.js
│   │   └── SystemConfig.js
│   ├── routes/                # Express routers
│   │   ├── auth.js
│   │   ├── accounts.js
│   │   ├── transactions.js
│   │   ├── loans.js
│   │   └── admin.js
│   ├── utils/
│   │   ├── email.js           # Nodemailer email helpers
│   │   ├── audit.js           # Audit logger
│   │   ├── generateToken.js   # JWT generator
│   │   ├── pdfStatement.js    # PDFKit statement generator
│   │   └── seed.js            # Database seeder
│   ├── server.js              # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                  # React.js (Vite) SPA
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── utils/api.js        # Axios instance
    │   ├── components/common/
    │   │   ├── Sidebar.jsx
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── auth/           Login, Register
    │   │   ├── customer/       Dashboard, Accounts, Transactions, Transfer, Loans, Profile
    │   │   ├── officer/        Dashboard, Accounts, Transactions, Loans
    │   │   └── admin/          Dashboard, Users, Branches, Reports, Config, AuditLogs
    │   ├── App.jsx             # Routes + role-based protection
    │   ├── main.jsx
    │   └── index.css           # Global styles
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1. Backend Setup

```bash
cd minibank/backend

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/minibank
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=MiniBank <noreply@minibank.com>

CLIENT_URL=http://localhost:5173
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App passwords → Generate one for "Mail".

```bash
# Seed the database with demo data
npm run seed

# Start development server
npm run dev
```

API runs at: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd minibank/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Demo Login Credentials

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@minibank.com       | Admin@1234    |
| Officer  | officer@minibank.com     | Officer@1234  |
| Customer | customer@minibank.com    | Customer@1234 |

---

## 📋 Features by Role

### 👤 Customer
- Register and login with JWT authentication
- Open savings or current account (with branch selection)
- Deposit and withdraw funds from active accounts
- Transfer funds to any other MiniBank account (atomic)
- View paginated transaction history with filters
- Download PDF bank statement for any date range
- Apply for loans (EMI preview before submission)
- View loan status and pay monthly installments
- Change password from profile page

### 👮 Bank Officer
- Review and approve / reject pending account requests
- Process over-the-counter deposits and withdrawals
- Review all loan applications with EMI calculator
- Approve loans (sets interest rate, disburses to account)
- Reject loans with reason
- View full transaction history with filters

### 🔐 Administrator
- Dashboard with system-wide stats and 7-day transaction chart
- Create and manage bank officer accounts
- Suspend / activate any user account
- Full branch management (create, edit)
- System configuration (interest rates, limits, etc.)
- Generate financial reports with date range filters
- View complete audit logs with action filtering

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | All users |
| PUT | /api/auth/password | All users |

### Accounts
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/accounts | Customer |
| GET | /api/accounts/my | Customer |
| GET | /api/accounts/pending | Officer/Admin |
| GET | /api/accounts/all | Officer/Admin |
| PUT | /api/accounts/:id/approve | Officer/Admin |
| PUT | /api/accounts/:id/reject | Officer/Admin |
| PUT | /api/accounts/:id/freeze | Admin |
| GET | /api/accounts/:id/statement | Owner/Officer/Admin |

### Transactions
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/transactions/deposit | All |
| POST | /api/transactions/withdraw | All |
| POST | /api/transactions/transfer | Customer |
| GET | /api/transactions/:accountId | Owner/Officer/Admin |
| GET | /api/transactions/all | Officer/Admin |

### Loans
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/loans | Customer |
| GET | /api/loans/my | Customer |
| GET | /api/loans/all | Officer/Admin |
| GET | /api/loans/:id | Owner/Officer/Admin |
| PUT | /api/loans/:id/approve | Officer/Admin |
| PUT | /api/loans/:id/reject | Officer/Admin |
| PUT | /api/loans/:id/repay/:installmentId | Customer |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/admin/dashboard | Admin |
| GET/POST | /api/admin/users | Admin |
| POST | /api/admin/users/officer | Admin |
| PUT | /api/admin/users/:id/status | Admin |
| GET/POST | /api/admin/branches | Admin |
| PUT | /api/admin/branches/:id | Admin |
| GET/POST | /api/admin/config | Admin |
| GET | /api/admin/audit-logs | Admin |
| GET | /api/admin/reports | Admin |

---

## 🔒 Security Features

- **JWT Authentication** — All protected routes require Bearer token
- **bcrypt Password Hashing** — Salt factor 10
- **Role-Based Access Control (RBAC)** — Middleware enforces role per route
- **Atomic Transactions** — MongoDB sessions for fund transfers (prevents race conditions)
- **Audit Logging** — All critical actions logged with user, timestamp, IP
- **Input Validation** — Server-side validation on all inputs
- **CORS** — Only allows configured frontend origin

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose ODM |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Frontend | React.js (Vite), React Router v6 |
| HTTP Client | Axios |
| Email | Nodemailer |
| PDF Generation | PDFKit |
| Styling | Pure CSS (custom design system) |

---

## 📦 Future Improvements

- React Native mobile app
- Two-Factor Authentication (OTP)
- WebSocket real-time notifications
- Fixed deposit module
- Inter-bank transfer (BEFTN integration)
- AI fraud detection
- Dockerization for deployment
