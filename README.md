# Bizhub Ng 🚀

Bizhub Ng is a comprehensive business management suite designed to empower merchants and organizations. It provides robust tools for handling team payroll, transaction management, real-time team communication, live wallet funding, automated SMS bank synchronization, and a dedicated super-admin dashboard for overarching platform control.

---

## 🏗 Project Architecture

This repository is structured as a monorepo containing multiple distinct specialized services:

| Component | Description | Location |
| :--- | :--- | :--- |
| **Backend API** | The core REST/Graph API managing authentication, payments, webhooks, and the real-time chat gateway. | `/backend/` |
| **Merchant Frontend** | The primary web application dashboard for business owners to manage operations, transactions, and staff. | `/web app/frontend/` |
| **Admin Panel** | A dedicated Superadmin dashboard to oversee platform metrics, manage users, and resolve support tickets. | `/organization 2/bizhubadmin/` |
| **Mobile App** | A cross-platform mobile application providing on-the-go access to Bizhub features. | `/mobile app/bizhub_mobile/` |

---

## ✨ Core Features

- 💸 **Transaction Management**: Manually record transactions or sync them automatically.
- 📱 **Automated SMS Bank Sync**: Webhook integrations to parse Android SMS Forwarder payloads and natively register credit alerts into the business ledger.
- 💳 **Wallet & Payroll**: Directly fund business wallets securely via **Paystack** and handle employee payroll disbursements.
- 💬 **Real-Time Communication**: Integrated WebSocket (Socket.io) chat modules for seamless internal team communication.
- 🎫 **Support Ticketing**: Users can open support tickets natively from the app, which administrators review and resolve in the Admin Panel using a sleek, glassmorphic UI.

---

## 🛠 Tech Stack

**Backend**
* [NestJS](https://nestjs.com) - Progressive Node.js framework
* [Prisma ORM](https://www.prisma.io) - Next-generation Node.js and TypeScript ORM
* [PostgreSQL](https://www.postgresql.org) - Robust relational database
* [Socket.io](https://socket.io) - Real-time websocket engine

**Frontend (Merchant & Admin)**
* [React 18](https://reactjs.org) - UI Library
* [Vite](https://vitejs.dev) - Lightning-fast build tool
* [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
* [Framer Motion](https://www.framer.com/motion/) - Animation library
* [TanStack React Query](https://tanstack.com/query) - Asynchronous state management

**Mobile**
* [Flutter](https://flutter.dev) - UI toolkit for building natively compiled applications

---

## 🚀 Getting Started

To run the full stack locally, you need to spin up the backend and the various frontends independently.

### 1. Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
> Ensure your PostgreSQL instance is running and mapped appropriately in the backend `.env`.

### 2. Merchant Web App
```bash
cd "web app/frontend"
npm install
npm run dev
```

### 3. Admin Dashboard
```bash
cd "organization 2/bizhubadmin"
npm install
npm run dev
```

---

## 🔐 Environment Variables

Ensure you create `.env` files in the respective directories containing the necessary secret keys.

**Backend (`backend/.env`)**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/bizhub"
JWT_SECRET="your_jwt_secret"
PAYSTACK_SECRET_KEY="sk_test_..."
```

**Frontend (`web app/frontend/.env`)**
```env
VITE_API_URL="http://localhost:3333/api"
VITE_PAYSTACK_PUBLIC_KEY="pk_test_..."
```

---

*Built with ❤️ for merchants across Nigeria.*
