# SmashCity Full-Stack Burger Food Ordering System
## Complete Architecture & Setup Guide

SmashCity is a production-grade full-stack burger food ordering web application combining a React 19 + Vite frontend with a Python Django REST Framework backend, SQLite / PostgreSQL database support, Django Admin management portal, secure authentication, Razorpay online payments, Cash on Delivery (COD), dynamic menu management, cart synchronization, and live 6-stage delivery status tracking.

---

## 1. Project Architecture & Structure

```
SmashCity-main/
│
├── backend/                             # Python Django REST Backend
│   ├── .venv/                           # Python Virtual Environment
│   ├── manage.py                        # Django Management Utility
│   ├── requirements.txt                 # Backend Python Dependencies
│   ├── .env.example                     # Environment Template
│   ├── .env                             # Local Environment Variables
│   ├── db.sqlite3                       # Local SQLite Database
│   │
│   ├── config/                          # Project Configuration
│   │   ├── settings.py                  # Django & DRF Settings, CORS, Razorpay
│   │   ├── urls.py                      # Root URL Routing & Media Serving
│   │   ├── wsgi.py                      # Production WSGI Entry
│   │   └── asgi.py                      # ASGI Entry
│   │
│   ├── accounts/                        # Authentication & Customer Profiles
│   │   ├── models.py                    # UserProfile & Saved Delivery Addresses
│   │   ├── serializers.py              # Register, Login, User, Address Serializers
│   │   ├── views.py                     # RegisterView, LoginView, LogoutView, AddressViews
│   │   ├── urls.py                      # /api/auth/ Endpoints
│   │   └── admin.py                     # Customized User & Address Admin Inlines
│   │
│   ├── menu/                            # Menu & Product Management
│   │   ├── models.py                    # Category & Product with pricing & stock
│   │   ├── serializers.py              # Category & Product Serializers
│   │   ├── views.py                     # Category & Product List/Detail APIs
│   │   ├── urls.py                      # /api/menu/ Endpoints
│   │   ├── admin.py                     # Product Admin with Image Previews & Filters
│   │   └── management/commands/
│   │       └── seed_data.py             # Pre-populates all SmashCity burgers, sides & coupons
│   │
│   ├── cart/                            # Persistent Shopping Cart
│   │   ├── models.py                    # Cart & CartItem
│   │   ├── serializers.py              # Cart & Item Serializers with calculations
│   │   ├── views.py                     # Cart GET, Item Add, Patch Qty, Delete
│   │   ├── urls.py                      # /api/cart/ Endpoints
│   │   └── admin.py                     # Cart Admin Inspection
│   │
│   ├── orders/                          # Order Processing & History
│   │   ├── models.py                    # Order, OrderItem, OrderStatusHistory, Coupon
│   │   ├── serializers.py              # Order & Status History Serializers
│   │   ├── views.py                     # Order Placement, Detail, Cancellation, Coupon Validation
│   │   ├── urls.py                      # /api/orders/ Endpoints
│   │   └── admin.py                     # Order Admin with Status Action Dropdowns
│   │
│   ├── payments/                        # Payment Gateway Integration
│   │   ├── models.py                    # Payment Record with Gateway IDs & Status
│   │   ├── services.py                  # Razorpay Order Creation & SHA256 Signature Verification
│   │   ├── views.py                     # Payment Create, Verify, and Webhook Views
│   │   ├── urls.py                      # /api/payments/ Endpoints
│   │   └── admin.py                     # Payment Audit Admin
│   │
│   └── delivery/                        # Live Delivery Status & Tracking
│       ├── views.py                     # 6-Step Stepper Tracking API & Staff Status Updaters
│       └── urls.py                      # /api/delivery/ Endpoints
│
├── SmashCity-main/                      # React 19 + Vite Frontend (UI/UX 100% Preserved)
│   ├── public/                          # WebP Images, SVG Icons, Fonts
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Header with Cart Badge, Account Dropdown, Mobile Drawer
│   │   │   ├── Hero.jsx                 # Cinematic Hero Section with smooth CTA triggers
│   │   │   ├── BurgerShowcase.jsx       # 4-Column Visual Cards
│   │   │   ├── Hook.jsx                 # "No Shortcuts" Quality Section
│   │   │   ├── Menu.jsx                 # Dynamic Django-fed Menu with "Add to Order" Controls
│   │   │   ├── Locations.jsx            # Downtown HQ Info & Quick Order CTAs
│   │   │   ├── Footer.jsx               # Footer, Links, Socials, App badges
│   │   │   ├── AuthModal.jsx            # Member Portal Sign In & Sign Up Modal
│   │   │   ├── CartDrawer.jsx           # Slide-out Smash Bag with Coupon Code & Pricing Breakdown
│   │   │   ├── CheckoutModal.jsx        # Delivery Address & COD / Razorpay Payment Flow
│   │   │   ├── OrderTrackingModal.jsx   # Live 6-Stage Delivery Progress Stepper (Auto-polling)
│   │   │   ├── OrderHistoryModal.jsx    # Previous Orders History with Tracking Links
│   │   │   └── UserProfileModal.jsx     # Profile Name, Phone & Saved Addresses Manager
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # User Token & Session Provider
│   │   │   └── CartContext.jsx          # Live Shopping Bag State & Backend Sync
│   │   ├── services/
│   │   │   └── api.js                   # REST API Service Client
│   │   ├── App.jsx                      # App Shell with State Providers & Modals
│   │   └── index.css                    # Tailwind CSS Theme & Styling
│   ├── package.json                     # Frontend Node Dependencies
│   └── vite.config.js                   # Vite Bundler Config
```

---

## 2. Windows PowerShell Setup & Run Instructions

Open **two separate PowerShell terminals** in VS Code:

### Terminal 1: Backend (Django REST Framework)

```powershell
# 1. Navigate to the root directory
cd c:\Users\vishn\Downloads\SmashCity-main

# 2. Activate Python Virtual Environment (already created)
.\backend\.venv\Scripts\Activate.ps1

# (Optional: If activating for the first time, install requirements)
pip install -r backend\requirements.txt

# 3. Apply Database Migrations (already prepared)
python backend\manage.py migrate

# 4. (Optional) Re-seed initial burgers, categories, coupons and admin user
python backend\manage.py seed_data

# 5. Start the Django Development Server on port 8000
python backend\manage.py runserver 127.0.0.1:8000
```

> **Default Superuser Credentials:**
> - **URL:** http://127.0.0.1:8000/admin/
> - **Username:** `admin`
> - **Password:** `admin123`

---

### Terminal 2: Frontend (React 19 + Vite)

```powershell
# 1. Navigate to the frontend directory
cd c:\Users\vishn\Downloads\SmashCity-main\SmashCity-main

# 2. (Optional: If not yet installed)
npm install

# 3. Start the Vite Frontend Dev Server
npx vite --host 127.0.0.1 --port 5173
```

Open your browser at: **`http://127.0.0.1:5173/`**

---

## 3. Environment Variables Configuration (`backend/.env`)

The `backend/.env` file is pre-configured for local development:

```ini
# Django Settings
SECRET_KEY=smashcity-insecure-development-secret-key-change-in-production-2026
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,testserver

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Razorpay Payment Gateway Credentials
# For production or test with real keys, replace these with your actual Razorpay Key ID and Secret
RAZORPAY_KEY_ID=rzp_test_SmashCityDevKey
RAZORPAY_KEY_SECRET=SmashCitySecretTestModeOnly
RAZORPAY_WEBHOOK_SECRET=SmashCityWebhookSecretKey

# Test Gateway Mode (True enables clear simulated payment verification when real keys are pending)
RAZORPAY_TEST_MODE=True
```

---

## 4. API Endpoints Reference

All endpoints are hosted at `http://127.0.0.1:8000/api/`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| **POST** | `/api/auth/register/` | Register customer account with email, username, phone, name | No |
| **POST** | `/api/auth/login/` | Log in with username or email + password | No |
| **POST** | `/api/auth/logout/` | Invalidate customer session token | Yes (Token) |
| **GET** | `/api/auth/me/` | Fetch authenticated customer profile and saved addresses | Yes (Token) |
| **PATCH**| `/api/auth/me/` | Update customer name or phone number | Yes (Token) |
| **GET** | `/api/auth/addresses/` | List customer's saved delivery addresses | Yes (Token) |
| **POST** | `/api/auth/addresses/` | Add a new saved delivery address | Yes (Token) |
| **GET** | `/api/menu/categories/` | Fetch menu categories (Burgers, Sides, Sauces, Drinks) | No |
| **GET** | `/api/menu/products/` | Fetch products with category filter, search, availability | No |
| **GET** | `/api/menu/products/<id>/` | Fetch single product details | No |
| **GET** | `/api/cart/` | Fetch user or guest shopping bag with recalculated subtotal | Optional |
| **POST** | `/api/cart/items/` | Add product to shopping bag | Optional |
| **PATCH**| `/api/cart/items/<id>/` | Update item quantity in bag | Optional |
| **DELETE**| `/api/cart/items/<id>/` | Remove item from bag | Optional |
| **POST** | `/api/orders/validate-coupon/` | Validate coupon code (e.g. `SMASH10`, `BURGER5`) | No |
| **POST** | `/api/orders/` | Place new order with server-side pricing & idempotency | Optional |
| **GET** | `/api/orders/` | View customer order history (restricted to owner) | Yes / Guest |
| **GET** | `/api/orders/<order_number>/` | Fetch complete order breakdown & payment info | Optional |
| **POST** | `/api/orders/<order_number>/cancel/` | Cancel order (allowed only if placed/confirmed) | Yes / Owner |
| **POST** | `/api/payments/create/` | Create Razorpay order with currency & subunit amount | No |
| **POST** | `/api/payments/verify/` | Verify HMAC SHA256 payment signature & mark paid | No |
| **POST** | `/api/payments/webhook/` | Secure Razorpay webhook listener | Gateway |
| **GET** | `/api/delivery/<order_number>/` | Live 6-stage delivery stepper status & timeline | No |
| **POST** | `/api/delivery/<order_number>/status/` | Staff status advancement API (e.g. Preparing) | Yes (Staff) |

---

## 5. Live 6-Stage Delivery Tracking Lifecycle

Orders progress through six verified stages:

```
[1. Order Placed] ──> [2. Order Confirmed] ──> [3. Preparing] ──> [4. Ready for Pickup] ──> [5. Out for Delivery] ──> [6. Delivered]
       │                       │
       └─── [Cancelled] <──────┘
```

1. **Order Placed**: Customer placed order; kitchen notification sent.
2. **Order Confirmed**: Kitchen accepted order; grill preparation scheduled.
3. **Preparing**: Patty smashed on 400-degree grill, melted American cheese, potato bun toasted.
4. **Ready for Pickup**: Bagged with hot fries and signature sauces.
5. **Out for Delivery**: Courier is en route to customer street address.
6. **Delivered**: Handed to customer; COD payment automatically updated to `PAID`.

---

## 6. How to Test the Complete Flow

1. Open **`http://127.0.0.1:5173/`**.
2. Click **"Sign In"** in the top navigation. Switch to **"Sign Up"**, enter details, and register. The navigation bar immediately reflects your login status with customer avatar and greeting.
3. Scroll down to **"THE MENU"**. Notice burgers and sides loaded dynamically from the Django database.
4. Click **"Add to Order"** on **The Classic Smash** ($8.50) and **Crispy Fries** ($4.00). The **Smash Bag** drawer slides out.
5. In the coupon box, enter **`SMASH10`** and click **"Apply"**. A 10% discount is applied to your order.
6. Click **"Proceed to Checkout"**. Select **Cash on Delivery** or **Razorpay Online Payment**, enter delivery address, and click **"Confirm & Place Order"**.
7. The **Live Delivery Tracking** modal opens instantly with your unique order number (e.g., `SC-20261021-XXXX`), showing the animated live stepper and estimated delivery time.
8. In a separate tab, open **`http://127.0.0.1:8000/admin/`**, log in with `admin`/`admin123`, open **Orders**, and select **"Set status: Preparing"** from the action dropdown. Refresh or watch your tracking modal advance to step 3 in real time!
