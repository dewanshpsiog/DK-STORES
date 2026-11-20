# ShopHub

ShopHub is a static, modular online-shopping application using HTML, CSS, JavaScript, jQuery, Bootstrap 5, and Bootstrap Icons.

## Phase 1

The first implementation phase includes:

- Shared storefront and admin CSS foundations
- Centralized application configuration
- Mock categories, products, customers, orders, and users
- LocalStorage-backed storage abstraction
- Consistent asynchronous API response conventions
- Authentication, category, product, customer, and order service modules
- Shared currency, validation, and date utilities

## Phase 2

The storefront now includes:

- Responsive home page with featured products
- Shared customer navigation and cart badge
- Product listing search, category and price filters
- Price and newest sorting
- Product pagination
- Product detail quantity controls
- Persistent cart add, remove and quantity updates
- Authentication entry pages
- Checkout, credit validation and order confirmation

## Phase 3

The checkout and order lifecycle now includes:

- Delivery address, city and PIN-code capture
- Customer and stock validation before placement
- Cash and credit payment selection
- Available-credit enforcement
- Unique order IDs and historical line-item prices
- Customer snapshots and delivery-address snapshots on each order
- Individual order bills with printable modal views

## Phase 4

The admin application now includes:

- Dashboard totals, low-stock alerts, recent orders and sales chart
- Category create, edit, activate/deactivate and confirmed delete
- Inventory create, edit, activate/deactivate and confirmed delete
- Product search, category filtering and pagination
- Customer search, credit-limit updates and account activation
- Order date, customer, payment and status filters
- Sales, inventory and customer reports
- CSV export for report tables

## Phase 5

The project includes:

- GitHub Actions CI validation for HTML, CSS and JavaScript
- GitHub Pages deployment for the `main` branch
- Node.js-based validation tooling only; no application runtime dependency
- Setup and demo instructions

## Development validation

```powershell
cd online-shopping
npm install
npm run lint
```

Start the static application:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/index.html`.

## GitHub Pages setup

1. Push the project to a GitHub repository.
2. Open **Settings > Pages**.
3. Set **Build and deployment** source to **GitHub Actions**.
4. Push a commit to `main` or run the **Deploy to GitHub Pages** workflow manually.
5. Open the URL shown in the workflow deployment environment.

The deployment workflow publishes only the `online-shopping` directory.

## Run locally

Serve the `online-shopping` directory with any static server, for example:

```powershell
cd online-shopping
python -m http.server 8000
```

Open `http://localhost:8000/index.html`.

## Demo accounts

- Admin: `admin@shop.com` / `Admin@123`
- Customer: `customer@shop.com` / `Customer@123`

Demo authentication is for UI development only and is not production security.
