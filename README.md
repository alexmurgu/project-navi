# Project Navi

**Advanced Finance Protocol** - A high-performance, glassmorphism-themed financial dashboard for family wealth tracking.

## 🚀 Features

- **Advanced Dashboard**: Real-time visualization of financial trends, net balance, and categorical spending.
- **Protocol Branding**: Clean, authoritative UI powered by the Maia "achyVBA" preset.
- **Visual Attribution**: Track income and expenses per family member using an intuitive avatar-based system.
- **Dynamic Category Mapping**: Assign custom high-contrast colors to any category for personalized data visualization.
- **Integrated CSV Engine**: Bulk import bank statements with automated parsing for European formats and real-time review.
- **Secure Authorization**: Powered by Better Auth with admin-exclusive management protocols.
- **Brutalist Aesthetic**: Strictly square-edged UI (zero border-radius) layered over a deep glassmorphism theme.

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI (Base UI & Lucide Icons)
- **Database**: Local SQLite via Drizzle ORM
- **Authentication**: Better Auth
- **Charts**: Recharts
- **Parsing**: PapaParse

## 🏁 Getting Started

### 1. Environment Configuration
Create a `.env` file in the root directory:

```env
DATABASE_URL="file:local.db"
BETTER_AUTH_SECRET="your_secret_here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="alex@aftermind.net"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
Sync the schema with your local SQLite file:
```bash
npx drizzle-kit push
```

### 4. Launch Protocol
```bash
npm run dev
```

## 📋 Administration

- **/admin/users**: Manage family member accounts and access levels.
- **/admin/categories**: Define category identities and custom color signatures.

## 🛡 Security & Design Mandates

- **Zero Radius**: All interactive elements MUST maintain a `rounded-none` state.
- **Glassmorphism**: Visual hierarchy is established through backdrop blurs (`blur-xl`) and border-opacities.
- **Local First**: All financial data is stored in the `local.db` file for maximum privacy.

---
**Project Navi** - *Advanced Finance Protocol*
