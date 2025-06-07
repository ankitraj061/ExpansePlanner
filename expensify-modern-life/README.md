# 💸 Expense Planner

A full-stack Expense Tracking application that allows users to record, categorize, and monitor their expenses and income efficiently.

---

## ✨ Features

### ✅ Expense Management
- Add new expenses with date, category, amount, and description
- View recent expenses
- Categorize expenses (Food, Travel, Education, etc.)

### ✅ Income Management
- Add income entries
- Track income by type and amount
- View recent income records

### ✅ Authentication
- JWT-based login system
- User-specific data (expenses and income stored per user)

---

## 🛠️ Tech Stack

### Frontend
- **React** (with TypeScript)
- **Tailwind CSS**
- **Lucide Icons**
- **Context API** for global state
- **Recharts** (optional, if you're adding graphs)

### Backend
- **Node.js + Express**
- **PostgreSQL** (using pg package)
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS & dotenv** for environment and security management

---

## 📁 Project Structure

Expense-Planner/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── hooks/
│ │ ├── context/
│ │ └── App.tsx
│ └── tailwind.config.ts
├── backend/
│ ├── index.js
│ ├── db.js
│ ├── routes/
│ └── middleware/
└── README.md
