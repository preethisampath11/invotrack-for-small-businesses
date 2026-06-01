# Implementation Plan: SaaS Invoice Tracker & Inventory Manager

This plan outlines the architecture, data models, workflows, and pages for building a premium, real-time SaaS Invoice Tracker and Inventory Management system from scratch. The application supports two role tiers (Admin and Staff), direct Google OAuth, inventory management, secure staff invites, partial/full payment tracking, and real-time Socket.io synchronization.

---

## User Review Required

Please review the revised architectural scope and detailed flows before approval:

> [!IMPORTANT]
> **Staff Verification & Secure Invite Flow:**
> 1. The Admin inputs a staff member's email address in the **Staff Manager** page.
> 2. The backend generates a secure token that expires in exactly **72 hours (3 days)**.
> 3. An invite link is generated: `http://localhost:5173/register?token=INVITE_TOKEN`.
> 4. The Admin can copy and share this link directly with the staff member.
> 5. **Single-Use Guard:** Once a staff member registers/logs in using the token, the invite token is immediately invalidated (`status: 'accepted'`).
> 6. **Admin Activation Guard:** The staff member's account starts as `pending` and cannot view or edit any company files until the Admin toggles their status to `active`.

> [!TIP]
> **Inventory & Payments Synergy:**
> *   Creating an invoice will automatically update inventory stock for physical goods (decrementing items).
> *   Recording a payment will automatically recalculate the outstanding balance on the invoice, shifting its state from `unpaid` $\rightarrow$ `partially paid` $\rightarrow$ `paid`.

> [!IMPORTANT]
> **Staff Inventory Access & Notification Safeguard:**
> *   Only Staff members granted permission by the Admin (`canEditInventory: true`) can modify item pricing, descriptions, or stock levels.
> *   Any such inventory modification triggers an **instant Socket.io alert** and writes to the **Real-time Activity Log** for the Admin to see: *"Staff [Name] updated item [Product Name] stock to [New Stock]"*.

---

## Technical Features Agreed

*   **Dynamic Currency:** Admin can fully customize the currency (e.g. `USD ($)`, `INR (₹)`, `EUR (€)`) in the Business Settings page, updating all invoices, dashboards, and charts.
*   **Inventory Permission Switch:** Admin can activate or deactivate the `canEditInventory` flag for any staff member in the Staff Directory.

---

## Core Pages & Features

### 1. Unified Auth & Registration Screen (`/auth`)
*   Sleek glassmorphism backdrop with interactive styling.
*   Single click Google OAuth + email/password login and sign-up form.
*   Auto-detects invite tokens in the URL to link registering staff to their correct company.

### 2. Live Dashboard (`/dashboard`)
*   **Stats Panels:** Total Billed, Payments Received (Revenue), Outstanding Receivables, Active Inventory Items.
*   **Visual Charts (Recharts):**
    *   Monthly Invoice billing vs. Payments collected (Double Area/Bar Chart).
    *   Invoice distribution chart (Draft, Sent, Paid, Overdue).
*   **Real-time Activity Stream:** Instant notifications for actions across the company: *"Staff Preethi logged a $500 cash payment for INV-004"* or *"Admin approved Staff member John"*.

### 3. Invoice Live Builder (`/invoices`)
*   **List view:** Dynamic sorting, status filters, global search.
*   **Interactive Designer (`/invoices/new` / `/invoices/:id/edit`):**
    *   Left side: Form panel where users add invoice details, select clients from a dropdown, and search/select **Inventory Items** which automatically populates item description, rate, and tax values.
    *   Right side: A gorgeous real-time visual invoice preview rendered with the company's brand color, logo, and terms & conditions.
*   **Invoice Detail Viewer (`/invoices/:id`):**
    *   Branded print-ready layout.
    *   **Payment Ledger:** View full payments history and record new partial/full payments.
    *   PDF download triggers.

### 4. Inventory / Items Manager (`/inventory`)
*   Create and manage services (virtual) and physical products.
*   Tracks item Name, SKU, Description, Unit Price, and current **Stock Count**.
*   Low stock warnings (color-coded indicators in red/yellow).

### 5. Client Directory (`/clients`)
*   Manage client accounts, contact emails, phone numbers, and physical addresses.
*   Overview cards displaying billing history and remaining outstanding balance for each client.

### 6. Staff Directory (`/staff` - Admin Only)
*   Generate new invitation tokens.
*   Accept, deactivate, or delete staff members.
*   Toggle staff inventory edit permissions (`canEditInventory`).
*   Status badges (`active`, `pending`, `deactivated`).

### 7. User Profile (`/profile`)
*   View/update personal user name, password, and upload custom profile avatars.

### 8. Company Settings (`/settings` - Admin Only)
*   Configure company profile (Legal name, registration/tax numbers, address, support email).
*   Upload company logo.
*   Invoice customizer: Primary brand colors, base tax rates, default payment terms, and custom notes.

---

## Proposed Database Schemas (MongoDB & Mongoose)

### 1. User Schema (`User.js`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
  canEditInventory: { type: Boolean, default: false }, // Only editable by Admin
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  status: { type: String, enum: ['pending', 'active'], default: 'active' },
  googleId: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Company Schema (`Company.js`)
```javascript
{
  name: { type: String, required: true },
  logoUrl: { type: String },
  address: { street: String, city: String, state: String, zip: String, country: String },
  phone: String,
  email: String,
  taxId: String,
  settings: {
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    taxRate: { type: Number, default: 0 },
    invoicePrefix: { type: String, default: 'INV-' },
    themeColor: { type: String, default: '#6366f1' },
    defaultNotes: String
  }
}
```

### 3. Invitation Schema (`Invitation.js`)
```javascript
{
  email: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  role: { type: String, default: 'staff' },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  expiresAt: { type: Date, required: true }
}
```

### 4. Client Schema (`Client.js`)
```javascript
{
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: { street: String, city: String, state: String, zip: String, country: String }
}
```

### 5. Inventory Item Schema (`Item.js`)
```javascript
{
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  sku: { type: String },
  description: String,
  unitPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: null }, // Null represents services (infinite stock)
  createdAt: { type: Date, default: Date.now }
}
```

### 6. Invoice Schema (`Invoice.js`)
```javascript
{
  invoiceNumber: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  items: [{
    itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 }
  }],
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  taxTotal: { type: Number, required: true },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 }, // Dynamically updated on payments
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}
```

### 7. Payment Schema (`Payment.js`)
```javascript
{
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Stripe', 'PayPal', 'Other'], default: 'Cash' },
  referenceNumber: String,
  notes: String,
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}
```

---

## Proposed Changes

We will construct a monorepo setup directly inside the workspace:
*   `server/` - Node.js, Express, MongoDB models, Auth, Socket.io integration.
*   `client/` - React, Vite, Tailwind CSS, Lucide icons, Recharts dashboards.

### Backend [Component Name: server]
*   `[NEW]` [server/package.json](file:///c:/desktop/yayyyyyyyyfin/server/package.json) - Node dependencies.
*   `[NEW]` [server/server.js](file:///c:/desktop/yayyyyyyyyfin/server/server.js) - Entry point & Socket.io setup.
*   `[NEW]` [server/models/](file:///c:/desktop/yayyyyyyyyfin/server/models/) - MongoDB Schemas.
*   `[NEW]` [server/controllers/](file:///c:/desktop/yayyyyyyyyfin/server/controllers/) - Controllers handling items, payments, invoices, clients, auth, settings.
*   `[NEW]` [server/routes/](file:///c:/desktop/yayyyyyyyyfin/server/routes/) - API bindings.

### Frontend [Component Name: client]
*   `[NEW]` [client/package.json](file:///c:/desktop/yayyyyyyyyfin/client/package.json) - React dependencies.
*   `[NEW]` [client/tailwind.config.js](file:///c:/desktop/yayyyyyyyyfin/client/tailwind.config.js) - Color/visual configs.
*   `[NEW]` [client/src/index.css](file:///c:/desktop/yayyyyyyyyfin/client/src/index.css) - Premium visual design styling sheets.
*   `[NEW]` [client/src/App.jsx](file:///c:/desktop/yayyyyyyyyfin/client/src/App.jsx) - Routing.
*   `[NEW]` [client/src/pages/](file:///c:/desktop/yayyyyyyyyfin/client/src/pages/) - Dashboard, Invoices, Inventory, Clients, Staff, Profile, Settings, Auth.

---

## Verification Plan

We will perform comprehensive verification steps to ensure production readiness:

### 1. Functional Verification
*   **Stock Control:** Verify that when we create an invoice with physical items, the stock is correctly decremented on the backend.
*   **Payment Calculation:** Add partial payments to a $1000 invoice and check that the invoice state changes dynamically to `partially paid` (e.g. after a $400 payment) and then `paid` (after adding the remaining $600).
*   **Token Expiry & Security:** Verify that an expired token (set manually in DB) throws an error during staff registration, and verified/accepted invites cannot be reused.

### 2. Real-Time Synchronization Verification
*   We will run parallel browser views showing Admin and Staff sessions side by side.
*   Add payment details or change inventory stock as a Staff member, and observe immediate DOM changes in the Admin's view.
