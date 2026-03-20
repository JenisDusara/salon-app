# Salon Management System

A comprehensive Salon Management System built with a FastAPI backend and a React (Vite) frontend. This application helps manage customers, employees, services, billing, expenses, and memberships for a salon business.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS (Modern, Premium Design)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Data Export**: XLSX (Excel)
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Environment Management**: Python Dotenv
- **Server**: Uvicorn

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (3.8 or higher)
- [PostgreSQL](https://www.postgresql.org/)

## ⚙️ Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **macOS/Linux**: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv
   ```

5. Configure environment variables:
   Create a `.env` file in the `backend/` directory with the following content:
   ```env
   SECRET_KEY=your-secret-key
   DB_NAME=salondb
   DB_USER=postgres
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=5432
   SHOP_NAME=My Salon
   SHOP_ADDRESS=123 Main Street, City
   ```

6. Ensure PostgreSQL is running and the database `salondb` is created.

7. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## ✨ Key Features

- **Dashboard**: Real-time overview of revenue, customers, and active memberships.
- **Customer Management**: Maintain a database of customers and their visit history.
- **Employee Management**: Manage staff details and performance.
- **Service Catalog**: Define and price salon services.
- **Billing System**: Generate invoices with support for services and memberships.
- **Membership Management**: Create and track membership plans for loyal customers.
- **Expense Tracking**: Monitor salon expenses and overheads.
- **Marketing**: Tools for promotional activities and customer outreach.

## 📁 Project Structure

```text
salon-app/
├── backend/            # FastAPI application
│   ├── app/           # Core logic (models, routes, database)
│   ├── main.py        # Entry point
│   └── .env           # Configuration (ignore in git)
├── frontend/           # React application
│   ├── src/           # Components, pages, and assets
│   ├── package.json   # Frontend dependencies
│   └── vite.config.js # Vite configuration
└── README.md          # Project documentation
```

## 📝 License

This project is licensed under the MIT License.
