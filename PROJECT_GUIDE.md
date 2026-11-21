# ShopHub / DK Stores: A Beginner's Guide

This guide explains what is in this project, how the pages work together, where information is stored, and what happens when someone shops or uses the admin area. It is written for someone who is new to software development.

You do not need to understand every file before you can use the website. Start with **The short version**, then use the sections below as a reference.

## The short version

This is a website made of separate pages:

- **HTML** describes what each page contains.
- **CSS** controls how those pages look.
- **JavaScript** makes the pages respond to clicks, forms, and data.
- **Firebase** stores accounts and store data online.
- **A Cloud Function** securely completes purchases.

The customer and admin website is static: a web server sends files to the browser, and the browser runs the website. There is no separate web server application for the pages. Firebase supplies the online account and database services.

The main path through the code is:

```text
HTML page
  -> page-specific JavaScript
  -> a service (products, cart, sign-in, orders, etc.)
  -> Firestore service
  -> Firebase, or the browser's local storage for cart/theme settings
```

For a purchase, the last steps are different:

```text
Checkout page
  -> order service
  -> Firebase Cloud Function named createOrder
  -> one Firestore transaction saves the order and updates stock/credit
```

The browser displays information and collects input. Firebase security rules and the Cloud Function make the final decisions about which data may be read or changed.

## Project map

The actual website project is the `online-shopping` folder. Run commands from that folder.

| Folder or file | In plain language |
| --- | --- |
| [index.html](./index.html) | Store home page. |
| [products.html](./products.html), [product-details.html](./product-details.html) | Product list and individual product page. |
| [cart.html](./cart.html), [checkout.html](./checkout.html), [order-success.html](./order-success.html), [order-history.html](./order-history.html) | Shopping cart, checkout, confirmation, and customer orders. |
| [login.html](./login.html), [signup.html](./signup.html), [forgot-password.html](./forgot-password.html) | Account entry and password reset pages. |
| [admin/](./admin/) | Admin dashboard, inventory, categories, customers, orders, and reports. |
| [css/](./css/) | Shared visual design, responsive layout, and themes. |
| [js/customer/](./js/customer/) | Page behavior for shopping and customer tasks. |
| [js/admin/](./js/admin/) | Page behavior for the admin area. |
| [js/components/](./js/components/) | Reusable pieces such as the top navigation, admin sidebar, product card, and notifications. |
| [js/services/](./js/services/) | Reusable operations for products, customers, authentication, cart, and orders. |
| [js/config/](./js/config/) | Shared settings and initial sample catalog data. |
| [js/utils/](./js/utils/) | Small shared helpers such as validation and currency/date formatting. |
| [api/firebase.js](./api/firebase.js), [api/firebaseConfig.js](./api/firebaseConfig.js) | Connect the browser to Firebase and hold the Firebase web-app configuration. |
| [firestore.rules](./firestore.rules) | Rules that restrict what signed-in customers and admins may do in Firestore. |
| [functions/](./functions/) | Trusted server-side checkout code, deployed as a Firebase Cloud Function. |
| [firebase.json](./firebase.json) | Tells the Firebase CLI where the Firestore rules and Functions code are. |
| [.github/workflows/](./.github/workflows/) | Automatic checks and GitHub Pages deployment instructions. |
| [package.json](./package.json) | Commands and tools for checking the website code. |
| [README.md](./README.md) | Short setup and deployment instructions. |
| [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) | This longer explanation. |

### A few words you will see

- **Browser:** The app that opens websites, such as Chrome or Edge.
- **Page:** One screen in this website, such as `products.html`.
- **Script:** A JavaScript file. It tells a page what to do.
- **Service:** A reusable script that performs one type of task, such as looking up products.
- **Database:** An online place to keep information between visits.
- **Firestore:** The Firebase database used here.
- **Authentication (Auth):** Firebase's account and password system.
- **UID:** Firebase's unique ID for an account. It is used to link that account to its Firestore records.
- **Document:** One saved record in Firestore, similar to one row in a spreadsheet.
- **Collection:** A group of similar Firestore documents, similar to a spreadsheet tab.
- **Cloud Function:** Code that runs on Firebase's servers instead of in the visitor's browser.
- **Deploy:** Publish a code change so that users can access it online.

## How a page starts

Each screen is its own HTML file. The website does not use a single-page router; clicking a link usually opens another HTML page.

When a page opens:

1. The browser reads the page's HTML.
2. It loads Bootstrap (the shared layout and control library), the site's CSS, and the page's JavaScript files.
3. `css/style.css` imports `css/theme.css`. The theme file supplies the colors and reusable design choices used across the site.
4. `js/config/app-config.js` creates the shared `window.ShopApp` object. It applies the saved theme, adds the theme picker and favicon, and starts Firebase initialization.
5. Firebase is initialized by `api/firebase.js`. The app waits for this using `window.ShopApp.firebaseReady`.
6. The page-specific script waits until the HTML is ready, asks the appropriate services for data, and fills in the page.
7. When a visitor clicks a button or submits a form, the page script calls a service rather than duplicating database logic in every page.

Most scripts are included near the bottom of their HTML page. The order matters: shared configuration and services load before the page-specific script that uses them.

`window.ShopApp` is a shared shelf for the app's settings and services. For example, `window.ShopApp.productService` means “the product-related operations available to this page.”

## How products work

The file you highlighted, [js/services/product-service.js](./js/services/product-service.js), is the shared product desk. It is not the page itself and it is not the database. It validates product information, then asks the Firestore service to read or write product records.

### Customer product browsing

1. [products.html](./products.html) provides the product-list layout and its filter controls.
2. [js/customer/products.js](./js/customer/products.js) loads products and categories by calling `productService` and `categoryService`.
3. The page script filters the loaded products by text, category, price, and sort order. It also shows one page of results at a time.
4. [js/components/product-card.js](./js/components/product-card.js) turns one product record into the visible product card.
5. Clicking a card opens `product-details.html` with the product ID in the web address. The details script uses that ID to load one product.
6. Clicking **Add to cart** calls `cartService`. It checks that the product is active and that the requested quantity is available before updating the cart.

The filters and pagination happen in the browser after the product list is loaded. They are not separate database searches for every keystroke.

### Admin inventory changes

1. An admin opens [admin/inventory.html](./admin/inventory.html).
2. [js/admin/inventory.js](./js/admin/inventory.js) loads product/category data and draws the inventory table.
3. The admin can add, edit, activate/deactivate, or delete a product.
4. The page sends the change to `productService`.
5. `productService` checks required fields and numeric values. It then asks `firestoreService` to write the change to Firestore.
6. Firestore rules verify that the signed-in account is an active admin. Hiding an admin button in the browser would not be enough protection by itself.

When a new product is created, the service gives it a generated product ID and saves timestamps. A product record typically contains:

| Field | Meaning |
| --- | --- |
| `id` | Product ID (also the Firestore document ID). |
| `title`, `description` | The name and description shown to shoppers. |
| `cat_id` | The ID of the product's category. |
| `qty` | Current stock count. |
| `price` | Current unit price. |
| `image` | Image path or URL. |
| `isActive` | Whether the product is available in the shop. |
| `createdAt`, `updatedAt` | When it was added and last changed. |

### Initial catalog

The admin dashboard calls `productService.seedInitialCatalog()`. If its one-time marker, `appMetadata/catalog-seed-v1`, does not exist, the app checks whether the categories and products collections are empty. It fills an empty collection from [js/config/mock-data.js](./js/config/mock-data.js), then writes the marker.

This seed operation does not continually replace the catalog. Existing product/category collections are not overwritten. The sample customer, order, and user values in `mock-data.js` are not the Firebase sign-in system; real accounts are handled by Firebase Authentication.

## How accounts and roles work

An account has two related parts:

1. **Firebase Authentication** checks the email and password and gives the signed-in person a UID.
2. **Firestore `users/{uid}`** holds the app-specific profile, including the person's role and whether the account is active.

The UID connects the two. A customer also has a `customers/{uid}` record with their contact details and credit information.

### Signup and sign-in

- [js/register.js](./js/register.js) checks that the signup fields look valid.
- `authService.signup()` creates the Firebase Auth account and then writes the matching `users/{uid}` and `customers/{uid}` records together in a Firestore batch.
- `authService.login()` signs in with Firebase Auth, reads the `users/{uid}` profile, checks the role and active status, and returns a small session description to the page.
- [login.html](./login.html) sends admins to `admin/dashboard.html` and customers to the storefront.
- The navigation and admin sidebar also check the session to display the right links or send a non-admin away from the admin area.

If a Firebase Auth account exists but its Firestore profile is missing, the login service can create a basic **CUSTOMER** profile. This repair requires the current Firestore rules to be deployed. It never gives a person an admin role.

### Creating the first admin

Public signup intentionally cannot make someone an admin. To create the first admin:

1. Create the account in **Firebase Console → Authentication** and note its UID.
2. In Firestore, create `users/{UID}` (the document ID must be the same UID).
3. Add the fields `id` (that UID), `name`, `email`, `role` set to `ADMIN`, `isActive` set to `true`, and `createdAt`.
4. Do this before the first sign-in with that account. If the profile is missing when it signs in, the safe repair behavior creates a customer profile instead.

Firebase Console administration is different from the public website: trusted project administrators can set up the first admin profile there. Do not give anyone an admin role just by changing browser code.

## What is saved, and where

The app uses both Firestore and browser storage. They are not the same place.

### Firestore collections

| Collection | What it stores |
| --- | --- |
| `categories` | Category names, descriptions, and active status. |
| `products` | Product descriptions, prices, stock, category IDs, and images. |
| `users` | App role and active status for each Firebase Auth UID. |
| `customers` | Customer contact information, credit limit, and outstanding credit. |
| `orders` | Completed order details and a snapshot of what was purchased. |
| `checkoutRequests` | Private request IDs used to prevent duplicate orders on a repeated checkout request. Client access is blocked by the rules. |
| `appMetadata` | Admin-only setup markers, including whether the starter catalog was seeded. |

The exact permissions are in [firestore.rules](./firestore.rules). In broad terms, products and categories can be viewed publicly but are changed by admins; customers can read their own profile; and admins can manage privileged records.

### Browser storage

- The cart is saved in this browser's local storage, so it remains when that browser revisits the site. It is not automatically shared across devices.
- The selected color theme is also saved in local storage.
- Authentication is managed by Firebase Auth, not by a password saved in the website's local storage.
- Product, customer, and order records are stored in Firestore.

Clearing browser site data can remove the local cart and theme choice. It does not erase the Firestore catalog or orders.

## How a purchase is protected

The checkout page checks the form and gives the customer a useful early warning about stock and available credit. Those browser checks improve the experience, but the browser cannot be trusted to decide the final price or stock count.

When the customer submits checkout:

1. [js/customer/checkout.js](./js/customer/checkout.js) checks required address/contact fields and the selected payment method.
2. [js/services/order-service.js](./js/services/order-service.js) sends only the product IDs and quantities, plus the payment and delivery information, to the callable `createOrder` function.
3. [functions/index.js](./functions/index.js) verifies the signed-in customer, reads the current product prices and stock from Firestore, checks credit, and calculates the true total itself.
4. The function uses a Firestore transaction to save the order, reduce stock, update outstanding credit for a credit payment, and save the checkout request ID.
5. A repeated request with the same ID returns the earlier order instead of charging/creating another order.
6. On success, the browser clears the cart and opens the confirmation page. The new order starts with **PENDING** status; it appears first in the customer's order history.

This is why the Cloud Function must be deployed for real checkout. The client cannot safely create orders by trusting the price sent from the browser.

The current payment choices record **CASH** or **CREDIT** on the order; there is no card processor or online payment gateway connected. A cash order is recorded, not charged. A credit order updates the customer's outstanding credit.

## Admin area

The admin pages live in [admin/](./admin/), with their behavior in [js/admin/](./js/admin/).

| Screen | What it is for |
| --- | --- |
| Dashboard | Counts customers/products/orders, shows low stock and recent orders, and can seed the starter catalog once. |
| Categories | Add, edit, activate/deactivate, or delete categories. A category containing products cannot be deleted. |
| Inventory | Add, edit, activate/deactivate, search, filter, and delete products. |
| Customers | Search customers, change credit limits, and activate/deactivate accounts. |
| Orders | Filter orders and change their status. |
| Reports | Review sales, stock, product, and customer summaries and download the displayed report as CSV. |

The admin sidebar checks the signed-in user's Firestore profile and role before showing the admin section. Firestore rules provide the actual database protection behind the interface.

## Themes and visual design

The current theme is selected from the floating palette button. The selection is saved in the browser and applies on other pages opened in that same browser.

- **Ember** is the default, with the requested orange and dark accents.
- **Light** is a cleaner white/neutral version.
- **Dark** uses dark surfaces with warm accents.
- **Blue** uses blue accents and pale blue surfaces.

The shared tokens and theme-specific overrides are in [css/theme.css](./css/theme.css). [css/style.css](./css/style.css) imports that file, so pages using the shared stylesheet get the themes without each page implementing its own color system. The product-card and layout styling is in [css/components.css](./css/components.css), [css/admin.css](./css/admin.css), and [css/responsive.css](./css/responsive.css).

The logo and favicon images are in [assets/images/](./assets/images/). Keep those files in the repository when publishing so the site can load them.

## Running it on your computer

You need to serve the folder over a local web address; do not open the HTML file by double-clicking it. Firebase uses browser modules and web requests that expect a website address.

In PowerShell:

```powershell
cd path\to\online-shopping
python -m http.server 8000
```

Then open `http://localhost:8000/index.html` in your browser. Leave the PowerShell window running while you use the site. Press **Ctrl+C** in that same window to stop the server.

Node.js and npm are used for code checks and the Firebase Functions project, not to serve the customer/admin pages. After installing the website's development tools once with `npm ci`, run:

```powershell
npm run lint
```

The Cloud Function uses Node.js 22. Its separate code checks can be run with:

```powershell
npm ci --prefix functions
npm --prefix functions run lint
```

## Publishing and Firebase are separate

There are two different kinds of deployment:

### Publish the website pages

The workflow [.github/workflows/deploy.yml](./.github/workflows/deploy.yml) publishes the static files to GitHub Pages when changes are pushed to `main` (or when manually run in GitHub Actions). GitHub Pages must be enabled for the repository with **GitHub Actions** as the deployment source.

The CI workflow [.github/workflows/ci.yml](./.github/workflows/ci.yml) checks HTML, CSS, browser JavaScript, and Functions code on pushes and pull requests. A passing lint check does not publish Firebase rules or functions.

### Publish Firebase rules and checkout code

The Firebase CLI deploys the Firestore rules and Cloud Function separately. From this project folder, after Firebase CLI sign-in and project setup, the usual command is:

```powershell
firebase deploy --only firestore:rules,functions
```

Cloud Functions deployment may require billing to be enabled on the Firebase project. Editing `firestore.rules` or `functions/index.js` locally does not change the live Firebase project until those resources are deployed. Checkout reports a specific message if the `createOrder` function has not been deployed.

## Common problems and what to check

| What you see | What it usually means / what to check |
| --- | --- |
| “Firebase setup failed” | Confirm the Firebase web-app configuration is complete in `api/firebaseConfig.js`, the app is served over HTTP(S), and the browser can reach Firebase. Do not paste private service-account credentials into frontend files. |
| “Your account profile is missing” or profile repair is denied | The Auth account and Firestore profile are separate. Deploy the current `firestore.rules`, then sign in again as the customer. Admin profiles must be created with the correct role in Firestore first. |
| “Missing or insufficient permissions” | Check that the rules were deployed to the same Firebase project named in the web configuration, and that the account has the right role/active status. Do not solve this by opening all database access. |
| Checkout does not complete | The `createOrder` Cloud Function must be deployed and reachable in the configured region; check Functions logs and Firebase billing/setup. |
| The store has no starter products | Sign in as an admin and open the dashboard to run its one-time seed check. If the seed marker already exists, inspect the `products` and `categories` collections rather than expecting the seed to run again. |
| Images do not appear | Check that the product's `image` path points to an existing file or valid URL. Local relative paths begin at the website root. |
| GitHub Pages shows an old version or a 404 | Check that the latest changes were pushed, the Pages deployment workflow succeeded, and Pages is configured to use GitHub Actions. |
| The theme did not change | Use the palette button, choose a theme, and reload. The preference is per-browser; clearing that browser's site data resets it to Ember. |

## Security notes

- Do not put Firebase Admin SDK keys, service-account JSON files, passwords, or other private credentials in browser code or GitHub.
- The Firebase web-app API key is browser configuration, not an admin password. Restrict its allowed APIs and website domains in Google Cloud/Firebase settings.
- Firestore rules are important even though the app hides admin controls from customers. The rules, not the appearance of a button, protect the database.
- The checkout function recalculates trusted totals on the server. Do not replace that with totals supplied by the browser.
- The sample values in `js/config/mock-data.js` are starter/demo data, not real customer accounts.

## Suggested learning path

If you want to understand the code gradually, follow these files in order:

1. Read [products.html](./products.html) to see the product page's visible structure.
2. Read [js/customer/products.js](./js/customer/products.js) to see how that page loads, filters, and displays products.
3. Read [js/components/product-card.js](./js/components/product-card.js) to see how one product becomes a card.
4. Read [js/services/product-service.js](./js/services/product-service.js) to see the shared product operations and validation.
5. Read [js/services/firestore-service.js](./js/services/firestore-service.js) to see the small layer that reads and writes Firestore documents.
6. Read [firestore.rules](./firestore.rules) to see which users are allowed to perform those operations.
7. Follow the same pattern for cart and checkout: `cart.html` → `js/customer/cart.js` → `js/services/cart-service.js`; then `checkout.html` → `js/customer/checkout.js` → `js/services/order-service.js` → `functions/index.js`.

You do not need to memorize these files. The useful habit is to follow one user action from the page, to its page script, to the relevant service, and finally to the database or function.
