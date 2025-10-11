# Customer Self-Service QR Code System - Setup Guide

## Overview

Successfully implemented a complete customer self-service ordering system with QR codes! Customers can now scan a QR code at their table to create their own orders without waiter assistance.

---

## Architecture

### Components Created:

1. **Backend API** (Express + MongoDB)

   - Customer model for tracking customer data
   - Enhanced Table model with QR code tokens
   - Enhanced Order model supporting customer self-service
   - Public API endpoints (no authentication required)
   - QR code generation and management

2. **Customer App** (React - Separate Frontend)

   - Mobile-first responsive design
   - Scan QR → Create command → Browse menu → Order
   - Real-time order tracking
   - Request bill functionality

3. **Admin Updates** (Existing Admin/Staff App)
   - QR code generation per table
   - Download/Print QR codes
   - Visual indicators for customer orders
   - Real-time notifications

---

## File Structure

```
marambaia-pdv/
├── server/
│   ├── models/
│   │   ├── Customer.js              [NEW] Customer model
│   │   ├── Table.js                 [UPDATED] Added qrToken, qrCodeUrl
│   │   └── Order.js                 [UPDATED] Added customer, orderType
│   ├── controllers/
│   │   ├── qrcodeController.js     [NEW] QR code generation
│   │   └── customerController.js   [NEW] Customer order management
│   ├── routes/
│   │   ├── qrcodeRoutes.js         [NEW] QR code routes
│   │   └── customerRoutes.js       [NEW] Public customer routes
│   ├── config/
│   │   └── socket.js               [UPDATED] Customer events
│   └── server.js                   [UPDATED] New routes registered
│
├── client/ (Admin/Staff App)
│   └── src/components/Tables/
│       ├── QRCodeModal.js          [NEW] QR code management
│       └── TableCard.js            [UPDATED] QR code button
│
└── customer-app/                   [NEW] Complete customer app
    ├── src/
    │   ├── pages/
    │   │   ├── ScanTable.js        Landing page from QR scan
    │   │   ├── CreateCommand.js    Name + CPF form
    │   │   ├── Menu.js             Browse products
    │   │   └── MyOrder.js          View order + request bill
    │   ├── services/
    │   │   └── api.js              API client
    │   └── App.js                  Routes + theme
    └── .env
```

---

## Setup Instructions

### 1. Backend Setup

The backend is already configured! Dependencies installed:

- `qrcode` - QR code image generation
- `uuid` - Secure token generation

### 2. Customer App Setup

```bash
cd /Users/eto/Documents/pdvmar/marambaia-pdv/customer-app

# Install dependencies (already done)
npm install

# Configure environment
# Edit customer-app/.env and set:
APP_API_URL=http://localhost:5000/api
PORT=3001

# Start customer app
npm start
```

The customer app will run on **http://localhost:3001**

### 3. Server Configuration

Add to `server/.env` or `server/.env.production`:

```env
# Customer app URL (for QR code generation)
CUSTOMER_APP_URL=http://localhost:3001

# For production:
# CUSTOMER_APP_URL=https://menu.yourdomain.com
```

### 4. Start All Services

```bash
# Terminal 1 - Backend
cd marambaia-pdv/server
npm start

# Terminal 2 - Admin App
cd marambaia-pdv/client
npm start

# Terminal 3 - Customer App
cd marambaia-pdv/customer-app
npm start
```

---

## How to Use

### For Administrators:

1. **Generate QR Codes:**

   - Go to "Mesas" (Tables) page
   - Click menu (⋮) on any table
   - Click "QR Code"
   - Click "Gerar QR Code"
   - Download or print the QR code

2. **Print QR Codes:**
   - Each table should have its QR code printed and displayed
   - Customers scan these to start ordering

### For Customers:

1. **Scan QR Code** at the table
2. **Create Command** (Name + CPF optional)
3. **Browse Menu** by category
4. **Add Items** to order
5. **View Order** and total
6. **Request Bill** when finished

### For Staff:

- Real-time notifications when:
  - Customer creates a new order
  - Customer adds items
  - Customer requests the bill
- Visual indicators show customer vs waiter orders
- Can still manage customer orders like regular orders

---

## API Endpoints

### Public Endpoints (No Auth):

- `GET /api/qrcode/table/:token` - Get table by QR token
- `POST /api/public/commands` - Create customer command
- `GET /api/public/products` - List available products
- `GET /api/public/categories` - List categories
- `GET /api/public/orders/:orderId` - Get customer order
- `POST /api/public/orders/:orderId/items` - Add item
- `DELETE /api/public/orders/:orderId/items/:itemId` - Remove item
- `POST /api/public/orders/:orderId/request-bill` - Request bill

### Protected Endpoints (Require Auth):

- `POST /api/qrcode/generate/:id` - Generate QR for table
- `POST /api/qrcode/generate-all` - Generate QR for all tables
- `POST /api/qrcode/regenerate/:id` - Regenerate QR (security)

---

## Database Changes

### Table Model:

```javascript
{
  qrToken: String,      // UUID for secure access
  qrCodeUrl: String     // Data URL of QR code image
}
```

### Customer Model (NEW):

```javascript
{
  name: String,
  cpf: String,
  phone: String,
  email: String,
  currentOrder: ObjectId,
  visitCount: Number,
  orderHistory: [ObjectId]
}
```

### Order Model:

```javascript
{
  customer: ObjectId,           // Reference to Customer
  orderType: String,            // 'waiter' | 'customer_self'
  waiter: ObjectId (optional)   // Now optional for self-service
}
```

---

## Socket.io Events

### New Customer Events:

- `customerOrderCreated` - Customer created new command
- `billRequested` - Customer wants to pay
- Room: `customerNotifications` - Staff join to receive alerts

---

## Deployment Options

### Option 1: Same Server

Host customer app on same server as admin app:

```bash
cd customer-app
npm run build
# Move build folder to server/customer-build
```

### Option 2: Separate Deployment (Recommended)

Deploy customer app separately (Vercel, Netlify):

- Better performance
- Independent scaling
- Easier updates
- Update `CUSTOMER_APP_URL` in server env

### Option 3: Subdomain

- Admin: `https://admin.marambaia.com.br`
- Customer: `https://menu.marambaia.com.br`

---

## Security Features

✅ QR tokens are UUID-based (not sequential)
✅ Customer endpoints are read-only for products
✅ No sensitive data exposed to customers
✅ Each table has unique, regenerable token
✅ CORS properly configured
✅ Customer can only modify their own pending items

---

## Testing Checklist

- [ ] Start all 3 services (server, admin, customer app)
- [ ] Generate QR code for a table (admin app)
- [ ] Scan QR code or visit URL directly
- [ ] Create customer command with name + CPF
- [ ] Browse menu and add items
- [ ] View order page and check total
- [ ] Remove an item (only pending items)
- [ ] Add more items
- [ ] Request bill
- [ ] Verify staff receives notification
- [ ] Staff closes the table with payment

---

## Production Deployment

### Before Going Live:

1. **Update Environment Variables:**

   ```env
   # server/.env.production
   CUSTOMER_APP_URL=https://your-customer-app-url.com
   FRONTEND_URL=https://your-admin-app-url.com
   ```

2. **Build Customer App:**

   ```bash
   cd customer-app
   npm run build
   ```

3. **Deploy Customer App:**

   - Upload to Vercel/Netlify OR
   - Host on same server under `/customer` route

4. **Print QR Codes:**

   - Generate QR for all tables
   - Print on waterproof material
   - Display at each table

5. **Train Staff:**
   - Show how to monitor customer orders
   - How to handle bill requests
   - How to regenerate QR codes if needed

---

## Next Steps / Enhancements

### Possible Improvements:

1. **WhatsApp Integration** - Send order confirmation to customer
2. **Payment Gateway** - Allow customers to pay via Pix/Card
3. **Order History** - Show past orders to returning customers
4. **Favorites** - Let customers save favorite items
5. **Dietary Filters** - Vegetarian, vegan, gluten-free tags
6. **Multiple Languages** - PT/EN/ES support
7. **Order Status** - Show preparation progress to customer
8. **Split Bill** - Allow customers to split payment
9. **Loyalty Program** - Points for frequent customers
10. **Feedback System** - Rate dishes after ordering

---

## Troubleshooting

### QR Code not generating?

- Check that `qrcode` and `uuid` are installed
- Verify `CUSTOMER_APP_URL` is set in server env

### Customer app can't connect to API?

- Check `APP_API_URL` in customer-app/.env
- Verify CORS settings in server config
- Check that server is running on expected port

### Socket events not working?

- Verify Socket.io connection in browser console
- Check that admin app joins `customerNotifications` room
- Verify server config/socket.js has new events

### CPF validation failing?

- CPF is optional, should not block order creation
- Check Customer model validation rules

---

## Support

For issues or questions:

1. Check server logs for errors
2. Check browser console for client errors
3. Verify all environment variables are set
4. Ensure all dependencies are installed
5. Test with `npm run dev` in development first

---

**Implementation completed successfully! 🎉**

All 12 tasks completed:
✅ Backend models updated
✅ QR code generation system
✅ Customer self-service controllers
✅ Public API routes
✅ Socket.io real-time events
✅ Customer React app created
✅ All customer pages built
✅ Admin QR code management
✅ Ready for testing!
