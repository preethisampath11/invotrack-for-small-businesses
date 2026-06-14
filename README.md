# InvoTrack

**InvoTrack** is a modern SaaS invoicing and business management platform designed specifically for small businesses and freelancers. It offers a beautiful, responsive interface to manage clients, inventory, payments, and staff seamlessly.

## ✨ Features

- **Native Gmail Integration**: Connect your personal or Google Workspace account via OAuth2. InvoTrack sends professional PDF invoices directly from your actual Gmail outbox, avoiding spam filters and SMTP spoofing limitations.
- **Dynamic Dashboard**: Track your revenue, pending invoices, and recent activity with beautiful, real-time charts powered by Recharts.
- **Invoice Management**: Create, edit, preview, download as PDF, and email invoices. Supports multi-currency with automatic real-time exchange rate conversions.
- **Team & Staff Management**: Role-Based Access Control (Admin vs Staff). Invite team members via magic links and assign granular permissions (e.g., *can edit inventory*, *can create invoices*).
- **Real-Time Collaboration**: Powered by Socket.IO. When a team member creates an invoice or makes a payment, the entire team's dashboard updates instantly.
- **Client & Inventory Tracking**: Keep a database of all your clients and standardized inventory items/services for rapid invoice generation.
- **Cloud-Ready File Uploads**: Upload company logos and user avatars securely. (Configured to convert images to Base64 to survive ephemeral file systems like Render's free tier).

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- React Router (SPA routing)
- Tailwind CSS
- Recharts
- Socket.IO Client
- jsPDF (for client-side PDF generation)

**Backend**
- Node.js & Express
- MongoDB & Mongoose
- Socket.IO
- Nodemailer & Google Auth Library
- Multer (Memory Storage)
- Express-Rate-Limit

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 🚀 Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/invotrack-for-small-businesses.git
cd invotrack-for-small-businesses
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
CLIENT_URL=http://localhost:5173
```
Run the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```
Run the frontend:
```bash
npm run dev
```

## 🔮 Future Work & Roadmap

We are constantly looking to improve InvoTrack. Here are some of the major features planned for the future:

1. **Modern SaaS Multi-Workspace Architecture:** Transitioning from a single-tenant model to a multi-workspace model. This will allow a single user (email) to join multiple companies with different roles and easily switch between them without logging out.
2. **Stripe / Payment Gateway Integration:** Add "Pay Now" buttons directly to the PDF and email invoices, allowing clients to pay online via credit card.
3. **Recurring Invoices:** Automatically generate and email invoices on a daily, weekly, or monthly schedule for subscription-based clients.
4. **Advanced Tax & Accounting Reports:** Export detailed CSVs and reports tailored for tax season.
5. **Estimate / Quote Generation:** Allow businesses to send estimates that clients can approve, which then automatically convert into Invoices.
