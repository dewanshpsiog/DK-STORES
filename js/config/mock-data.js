(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.mockData = {
    categories: [
      { id: "CAT-001", name: "Electronics", description: "Devices and everyday technology", isActive: true, createdAt: "2026-01-05T10:00:00.000Z" },
      { id: "CAT-002", name: "Fashion", description: "Apparel and accessories", isActive: true, createdAt: "2026-01-06T10:00:00.000Z" },
      { id: "CAT-003", name: "Home & Kitchen", description: "Essentials for modern homes", isActive: true, createdAt: "2026-01-07T10:00:00.000Z" },
      { id: "CAT-004", name: "Beauty", description: "Personal care and wellness", isActive: true, createdAt: "2026-01-08T10:00:00.000Z" },
      { id: "CAT-005", name: "Sports", description: "Fitness and outdoor gear", isActive: true, createdAt: "2026-01-09T10:00:00.000Z" }
    ],
    products: [
      { id: "PRD-001", cat_id: "CAT-001", title: "Wireless Headphones", description: "Immersive sound with 30-hour battery life.", qty: 48, price: 2499, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-01-10T10:00:00.000Z", updatedAt: "2026-01-10T10:00:00.000Z" },
      { id: "PRD-002", cat_id: "CAT-001", title: "Smart Watch", description: "Fitness tracking and notifications on your wrist.", qty: 12, price: 3999, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-01-11T10:00:00.000Z", updatedAt: "2026-01-11T10:00:00.000Z" },
      { id: "PRD-003", cat_id: "CAT-001", title: "Portable Speaker", description: "Compact wireless speaker with deep bass.", qty: 120, price: 1799, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-01-12T10:00:00.000Z", updatedAt: "2026-01-12T10:00:00.000Z" },
      { id: "PRD-004", cat_id: "CAT-002", title: "Classic Sneakers", description: "Comfortable everyday sneakers.", qty: 75, price: 2199, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-02-01T10:00:00.000Z", updatedAt: "2026-02-01T10:00:00.000Z" },
      { id: "PRD-005", cat_id: "CAT-002", title: "Leather Backpack", description: "Stylish and durable daily backpack.", qty: 22, price: 2899, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-02-03T10:00:00.000Z", updatedAt: "2026-02-03T10:00:00.000Z" },
      { id: "PRD-006", cat_id: "CAT-003", title: "Electric Kettle", description: "Fast-boiling stainless steel kettle.", qty: 55, price: 1499, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-02-08T10:00:00.000Z", updatedAt: "2026-02-08T10:00:00.000Z" },
      { id: "PRD-007", cat_id: "CAT-003", title: "Non-stick Cookware Set", description: "Five-piece everyday cookware set.", qty: 8, price: 3499, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-02-10T10:00:00.000Z", updatedAt: "2026-02-10T10:00:00.000Z" },
      { id: "PRD-008", cat_id: "CAT-003", title: "Desk Lamp", description: "Adjustable LED lamp for focused work.", qty: 140, price: 999, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-02-12T10:00:00.000Z", updatedAt: "2026-02-12T10:00:00.000Z" },
      { id: "PRD-009", cat_id: "CAT-004", title: "Skincare Set", description: "Daily cleanse, hydrate and protect routine.", qty: 34, price: 1999, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-03-01T10:00:00.000Z", updatedAt: "2026-03-01T10:00:00.000Z" },
      { id: "PRD-010", cat_id: "CAT-004", title: "Hair Dryer", description: "Lightweight dryer with multiple heat settings.", qty: 18, price: 1299, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-03-04T10:00:00.000Z", updatedAt: "2026-03-04T10:00:00.000Z" },
      { id: "PRD-011", cat_id: "CAT-005", title: "Yoga Mat", description: "Non-slip exercise mat with carry strap.", qty: 92, price: 899, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-03-10T10:00:00.000Z", updatedAt: "2026-03-10T10:00:00.000Z" },
      { id: "PRD-012", cat_id: "CAT-005", title: "Dumbbell Set", description: "Adjustable weights for home workouts.", qty: 10, price: 2799, image: "assets/images/placeholder.svg", isActive: true, createdAt: "2026-03-12T10:00:00.000Z", updatedAt: "2026-03-12T10:00:00.000Z" }
    ],
    customers: [
      { id: "CUS-001", name: "Arjun Sharma", email: "customer@shop.com", mobile: "9876543210", creditLimit: 1000, outstandingCredit: 0, isActive: true },
      { id: "CUS-002", name: "Priya Patel", email: "priya@example.com", mobile: "9876501234", creditLimit: 5000, outstandingCredit: 1200, isActive: true },
      { id: "CUS-003", name: "Rahul Verma", email: "rahul@example.com", mobile: "9123456780", creditLimit: 2500, outstandingCredit: 2500, isActive: true },
      { id: "CUS-004", name: "Sneha Iyer", email: "sneha@example.com", mobile: "9988776655", creditLimit: 3000, outstandingCredit: 450, isActive: false }
    ],
    orders: [
      {
        id: "ORD-20260101-0001",
        customerId: "CUS-001",
        orderDate: "2026-03-18T12:30:00.000Z",
        items: [{ productId: "PRD-001", title: "Wireless Headphones", quantity: 1, unitPrice: 2499, lineTotal: 2499, categoryId: "CAT-001" }],
        subtotal: 2499,
        total: 2499,
        paymentMethod: "CASH",
        status: "DELIVERED"
      }
    ],
    users: [
      { id: "ADM-001", name: "Shop Administrator", email: "admin@shop.com", role: "ADMIN", isActive: true, password: "Admin@123" },
      { id: "CUS-001", name: "Arjun Sharma", email: "customer@shop.com", role: "CUSTOMER", isActive: true, password: "Customer@123" }
    ]
  };
})();
