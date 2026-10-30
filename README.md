# SmashCity — Full-Stack Burger Ordering Platform

SmashCity is a responsive, full-stack food-ordering web application for a premium urban burger brand, pairing an aesthetic React 19 + Vite frontend with a Python Django REST Framework backend.

## Quick Start (Windows PowerShell)

### 1. Start the Django Backend (Port 8000)
```powershell
cd c:\Users\vishn\Downloads\SmashCity-main
.\backend\.venv\Scripts\Activate.ps1
python backend\manage.py migrate
python backend\manage.py seed_data
python backend\manage.py runserver 127.0.0.1:8000
```
- **API Base:** `http://127.0.0.1:8000/api/`
- **Django Admin Portal:** `http://127.0.0.1:8000/admin/` (`admin` / `admin123`)

### 2. Start the React Frontend (Port 5173)
```powershell
cd c:\Users\vishn\Downloads\SmashCity-main\SmashCity-main
npm install
npx vite --host 127.0.0.1 --port 5173
```
- **Web App:** `http://127.0.0.1:5173/`

For comprehensive documentation, architecture breakdown, Razorpay credentials configuration, and full API endpoint specs, see [FULLSTACK_SETUP.md](FULLSTACK_SETUP.md).
