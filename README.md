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
- No Node.js runtime for the customer/admin web pages; Firebase Functions use Node.js 22
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

Customer accounts are created through the signup page. The first admin account must be provisioned in Firebase as described below.
If an Auth-only customer account already exists, signing in after deploying the Firestore rules creates its missing customer profile with the `CUSTOMER` role.

## Firebase setup

Firebase Auth and Firestore are configured in the static client. The Firebase web API key is intended to be used in browser configuration, but restrict it in Google Cloud API credentials to the required Firebase APIs and application domains. Never put a Firebase service-account key or Admin SDK credentials in this repository or frontend.

1. In Firebase Console, open the `dewansh-ecom` project and add/select its Web app.
2. Copy the complete web app config into `api/firebaseConfig.js`. The existing file is missing the Web App `appId` and `messagingSenderId`; replace both empty values from the Firebase Console.
3. In **Authentication > Sign-in method**, enable **Email/Password**.
4. In **Authentication > Settings > Authorized domains**, add `localhost` and your GitHub Pages hostname.
5. Create a Firestore database.
6. Install the Firebase CLI, sign in, and from this directory run:

   ```powershell
   npm install --global firebase-tools
   firebase login
   npm ci --prefix functions
   firebase deploy --only firestore:rules,functions
   ```

   Cloud Functions deployment requires the project to have billing enabled. The callable `createOrder` function validates prices, credit, and stock and commits the order and inventory changes in a Firestore transaction.
7. Create the first admin user in Firebase Authentication. In Firestore Console, create `users/{AUTH_UID}` with fields `id` (string, same UID), `name` (string), `email` (string), `role` (string `ADMIN`), `isActive` (boolean `true`) and `createdAt` (string). Admin role assignment is intentionally not allowed from the public signup form.
8. Sign in as that admin and open the dashboard. It seeds the initial categories and products once, recorded in `appMetadata/catalog-seed-v1`.

The client uses Firebase Authentication for sessions, Firestore for catalog/customer/order data, and browser storage only for the cart. Firestore rules are in `firestore.rules`; admin-only writes are enforced there. Do not loosen these rules to make a client-side write succeed.

## Appearance

The site defaults to the Ember theme, using the orange `hsl(28.11deg 70.28% 48.82%)` brand color with black accents. Use the fixed Theme selector to switch between Ember, Light, Dark, and Blue; the selected theme is saved in this browser. Theme tokens and shared styling live in `css/theme.css`.
