# 🎯 Golf Draw System

A full-stack subscription-based golf platform combining performance tracking, monthly prize draws, and charitable giving. Built as part of the Digital Heroes Full-Stack Development Trainee Selection Process.

---

## 🚀 Live Demo

- **User Panel:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)
- **Admin Panel:** [your-vercel-url.vercel.app/admin/login](https://your-vercel-url.vercel.app/admin/login)

---

## ✨ Features

### User Features
- 🔐 JWT-based authentication (register, login, logout)
- ⛳ Golf score entry (1–45 Stableford format, rolling 5-score system)
- 🎲 Monthly draw participation with score snapshot
- 🏆 Winner calculation (3, 4, 5 number matches)
- 💚 Charity selection with contribution percentage
- 💳 Subscription system (Monthly & Yearly via Razorpay)

### Admin Features
- 👥 User management (view, delete, promote to admin)
- 🎯 Draw management (create, run, delete)
- 🏆 Winner management (verify, mark as paid, reject)
- 💚 Charity management (add, feature, delete)
- 💳 Subscription management (view, update status)
- 📊 Analytics dashboard (stats, prize pool, match breakdown)

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma v5 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Payments | Razorpay |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## 🗄️ Database Schema

```
User          → id, email, password, role, charityId, charityContribution
Score         → id, userId, value, date
Draw          → id, numbers, month, status
Entry         → id, userId, drawId, snapshot
Winner        → id, userId, drawId, matchCount, amount, status
Charity       → id, name, description, image, featured
Subscription  → id, userId, plan, status, razorpayOrderId, razorpayPaymentId, currentPeriodEnd
```

---

## ⚙️ API Routes

### Auth
```
POST /api/auth/register        → Register new user
POST /api/auth/login           → Login user
POST /api/auth/admin_login     → Login admin
```

### Scores
```
POST /api/scores/add           → Add score (auth required)
```

### Draw
```
POST /api/draw/create          → Create monthly draw
POST /api/draw/run             → Run draw & calculate winners
GET  /api/draw/current         → Get current open draw
```

### Entry
```
POST /api/entry/create         → Enter draw (auth required)
```

### Charities
```
GET  /api/charities            → List all charities
GET  /api/charities/select     → Get user's charity
POST /api/charities/select     → Select charity
```

### Subscription
```
POST   /api/subscription/create-order  → Create Razorpay order
POST   /api/subscription/verify        → Verify payment
GET    /api/subscription/status        → Get subscription status
DELETE /api/subscription/status        → Cancel subscription
```

### Admin
```
GET/DELETE/PATCH /api/admin/users
GET/DELETE       /api/admin/draws
GET/PATCH/DELETE /api/admin/winners
GET/POST/PATCH/DELETE /api/admin/charities
GET/PATCH        /api/admin/subscriptions
GET              /api/admin/analytics
```

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- Razorpay account (test mode)

### Setup

**1. Clone the repository:**
```bash
git clone https://github.com/yourusername/golf-draw-system.git
cd golf-draw-system
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment variables:**
```bash
# Create .env file
cp .env.example .env
```

Fill in your `.env`:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

**4. Run database migrations:**
```bash
npx prisma migrate deploy
npx prisma generate
```

**5. Start development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Test Credentials

### User Account
```
Register at: /register
Email: any email
Password: min 6 characters
```

### Admin Account
```
Login at: /admin/login
(Promote a user to ADMIN via Prisma Studio or the Admin Users panel)
```

### Test Payment
```
Card: 4111 1111 1111 1111
Expiry: any future date
CVV: any 3 digits
UPI: success@razorpay
```

---

## 📁 Project Structure

```
golf_app/
├── app/
│   ├── api/
│   │   ├── auth/          → login, register, admin_login
│   │   ├── draw/          → create, run, current
│   │   ├── entry/         → create
│   │   ├── scores/        → add
│   │   ├── charities/     → list, select
│   │   ├── subscription/  → create-order, verify, status
│   │   └── admin/         → users, draws, winners, charities, subscriptions, analytics
│   ├── admin/             → Admin dashboard pages
│   ├── charities/         → Charity listing page
│   ├── enter/             → Competition entry page
│   ├── login/             → User login page
│   ├── pricing/           → Subscription pricing page
│   ├── register/          → User register page
│   └── score/             → Score entry page
├── lib/
│   ├── prisma.ts          → Prisma client
│   ├── auth.ts            → JWT verify utility
│   └── adminAuth.ts       → Admin auth helper
└── prisma/
    ├── schema.prisma      → Database schema
    └── migrations/        → Migration history
```

---

## 🎯 Draw System Logic

```
1. Admin creates monthly draw (5 unique random numbers 1-45)
2. Users add 5 golf scores (Stableford format)
3. Users enter the draw → snapshot of 5 scores stored
4. Admin runs the draw → snapshots compared to draw numbers
5. 3+ matches = winner
6. Winners stored with match count and prize amount
7. Admin verifies and marks winners as paid
```

### Prize Distribution
| Matches | Prize |
|---|---|
| 3 matches | ₹300 |
| 4 matches | ₹400 |
| 5 matches | ₹500 |

---

## 🚀 Deployment

- **Frontend + Backend:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Payments:** Razorpay (Test Mode)

---

## 👨‍💻 Built By

Built for the **Digital Heroes Full-Stack Development Trainee Selection Process**

---

## 📄 License

This project is for evaluation purposes only.