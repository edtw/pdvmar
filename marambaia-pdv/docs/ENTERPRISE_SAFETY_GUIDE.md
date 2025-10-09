# Enterprise Safety & Security Guide
## Marambaia PDV System - Professional Restaurant Management

---

## 🔒 Current Security Implementation

### ✅ **Already Implemented**

1. **CPF-Based Access Control**
   - Customers must verify CPF to access orders
   - Prevents unauthorized modifications to orders
   - Location: `/server/middlewares/orderAccess.js`

2. **Customer Data Persistence**
   - Full customer history tracking (name, CPF, phone, email)
   - Visit count and last visit date
   - Order history for returning customers
   - Location: `/server/models/Customer.js`

3. **Role-Based Access (RBAC)**
   - Admin, Manager, Waiter, Kitchen roles
   - Staff can override customer restrictions
   - Location: `/server/middlewares/auth.js`

4. **QR Code Security**
   - Unique UUID tokens per table (non-sequential)
   - Tokens don't expire (persistent)
   - Location: `/server/models/Table.js`

---

## 🚨 Critical Safety Recommendations

### **Priority 1: Prevent Dine-and-Dash (Customers Leaving Without Payment)**

#### **Problem**
Currently, customers can leave without paying because:
- No payment verification before table closure
- No automated alerts for unpaid tables
- No physical/system barriers

#### **Solutions (Implement ALL)**

**A. Payment Hold System**
```javascript
// Before allowing table closure, check payment status
if (table.currentOrder.paymentStatus !== 'paid') {
  throw new Error('Pagamento pendente. Finalize o pagamento antes de fechar a mesa.');
}
```

**B. Waiter Approval for Closure**
- NEVER allow customer app to close tables directly
- Only waiters/managers can mark tables as closed
- Customer app can only REQUEST bill (already implemented ✅)

**C. Automated Alerts**
```javascript
// Send alert if table occupied > 2 hours without payment
if (occupationTime > 2 * 60 * 60 * 1000 && paymentStatus === 'pending') {
  sendAlertToManager({
    table: table.number,
    customer: customer.name,
    total: order.total,
    duration: occupationTime
  });
}
```

**D. Customer Blacklist**
```javascript
// Track customers who left without paying
CustomerSchema.add({
  blacklisted: { type: Boolean, default: false },
  blacklistReason: String,
  unpaidOrders: [{
    orderId: ObjectId,
    amount: Number,
    date: Date
  }]
});
```

**E. Payment Verification Photos**
- Take photo of payment receipt/transaction
- Store proof of payment with order
- Useful for disputes

---

### **Priority 2: Cash Register Integrity**

#### **Problem**
Cash discrepancies lead to revenue loss

#### **Solutions**

**A. Dual Verification**
- Require manager PIN for cash register close
- Daily reconciliation report sent via email
- Flag discrepancies > 5%

**B. Cash Flow Tracking**
```javascript
// Already implemented, but enhance:
CashTransactionSchema.add({
  authorizedBy: { type: ObjectId, ref: 'User' }, // Who approved
  proofImage: String, // Photo of cash/receipt
  reconciled: { type: Boolean, default: false },
  reconciliationNotes: String
});
```

**C. Security Cameras Integration**
- Timestamp cash transactions
- Cross-reference with camera footage
- Deterrent for theft

---

### **Priority 3: Order Tampering Prevention**

#### **Problem**
Staff or customers could modify orders after placement

#### **Solutions**

**A. Order Audit Trail**
```javascript
OrderItemSchema.add({
  modifications: [{
    field: String, // 'quantity', 'status', etc.
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    modifiedBy: { type: ObjectId, ref: 'User' },
    modifiedAt: { type: Date, default: Date.now },
    reason: String
  }]
});
```

**B. Lock Orders After Kitchen Preparation**
```javascript
// Prevent modifications once item status = 'preparing'
if (item.status !== 'pending') {
  throw new Error('Item já está em preparo. Não pode ser modificado.');
}
```

**C. Cancellation Approval**
- Items > R$50 require manager approval to cancel
- Track cancellation rate per waiter (detect fraud)

---

### **Priority 4: Customer Data Protection (LGPD Compliance)**

#### **Brazil's LGPD Law Requirements**

**A. Consent**
```javascript
CustomerSchema.add({
  gdprConsent: {
    marketing: { type: Boolean, default: false },
    dataStorage: { type: Boolean, required: true },
    consentDate: Date
  }
});
```

**B. Data Retention**
- Delete customer data after 2 years of inactivity
- Provide customer data export on request
- Allow customer to delete their account

**C. Secure CPF Storage**
```javascript
// Encrypt CPF before storing
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

function encryptCPF(cpf) {
  const cipher = crypto.createCipher(algorithm, process.env.CPF_ENCRYPTION_KEY);
  return cipher.update(cpf, 'utf8', 'hex') + cipher.final('hex');
}
```

---

### **Priority 5: Inventory Theft Prevention**

#### **Problem**
Kitchen staff taking ingredients/products

#### **Solutions**

**A. Product Usage Tracking**
```javascript
// Track expected vs actual product usage
ProductSchema.add({
  expectedUsage: Number, // Based on orders
  actualStock: Number,
  discrepancy: Number,
  lastStockCheck: Date
});
```

**B. Daily Stock Audits**
- Count high-value items daily
- Flag products with >10% discrepancy
- Require manager approval for waste/spoilage

**C. Waste/Spoilage Log**
```javascript
const WasteLogSchema = new Schema({
  product: { type: ObjectId, ref: 'Product' },
  quantity: Number,
  reason: { type: String, enum: ['spoiled', 'damaged', 'expired', 'mistake'] },
  reportedBy: { type: ObjectId, ref: 'User' },
  approvedBy: { type: ObjectId, ref: 'User' },
  photo: String, // Proof
  date: { type: Date, default: Date.now }
});
```

---

## 📊 Recommended Monitoring & Alerts

### **Real-Time Alerts**

1. **High-Risk Events**
   - Table occupied > 2 hours without payment
   - Order total > R$500 (potential fraud)
   - Customer blacklisted attempting new order
   - Cash discrepancy > R$50
   - Product stock discrepancy > 10%

2. **Daily Reports (Email/SMS)**
   - Total revenue vs expected
   - Cash register discrepancies
   - Cancelled orders report
   - Customer visit statistics
   - Product waste summary

3. **Weekly Analysis**
   - Waiter performance (sales, cancellations, customer complaints)
   - Peak hours and table turnover rate
   - Most profitable products
   - Customer retention rate

---

## 🛡️ Best Practices from Successful Restaurants

### **1. Toast POS (USA Market Leader)**
- **Feature**: Automatic tip calculation with suggested percentages
- **Security**: All orders timestamped with location data
- **Anti-fraud**: Void/refund transactions require manager PIN

### **2. Square for Restaurants**
- **Feature**: Contactless payment integration (Pix, NFC)
- **Security**: End-to-end encryption for payment data
- **Analytics**: Predictive inventory alerts

### **3. Lightspeed Restaurant**
- **Feature**: Customer loyalty program (visit tracking)
- **Security**: Employee time clock with biometric verification
- **Reports**: Hourly sales breakdown with labor cost analysis

### **4. Revel Systems**
- **Feature**: Kitchen Display System (KDS) with order routing
- **Security**: Multi-location management with centralized reporting
- **Integration**: Accounting software sync (QuickBooks)

---

## 🚀 Immediate Action Items

### **Week 1: Critical Security**
- [ ] Implement payment verification before table closure
- [ ] Add blacklist functionality for non-paying customers
- [ ] Create automated alerts for long-duration tables
- [ ] Enhance cash transaction tracking with photos

### **Week 2: Data Protection**
- [ ] Add LGPD consent to customer registration
- [ ] Encrypt CPF storage
- [ ] Implement data retention policy (2-year auto-delete)
- [ ] Create customer data export feature

### **Week 3: Order Integrity**
- [ ] Implement order audit trail
- [ ] Lock orders after kitchen preparation starts
- [ ] Add manager approval for high-value cancellations
- [ ] Track modification patterns per user

### **Week 4: Inventory Control**
- [ ] Create product usage tracking system
- [ ] Implement daily stock audit workflow
- [ ] Add waste/spoilage logging
- [ ] Generate discrepancy alerts

---

## 🔧 Recommended Integrations

### **Payment Gateways (Brazil)**
1. **Mercado Pago** - Most popular, supports Pix
2. **PagSeguro** - Split payments, recurring billing
3. **Stripe** - International cards, best security

### **Accounting Software**
1. **ContaAzul** - Brazilian SMB favorite
2. **Omie** - ERP integration
3. **Bling** - E-commerce + POS sync

### **Communication Tools**
1. **Twilio** - SMS alerts for managers
2. **SendGrid** - Transactional emails (receipts, reports)
3. **WhatsApp Business API** - Customer notifications

### **Security & Compliance**
1. **Auth0** - OAuth/SSO for staff login
2. **Cloudflare** - DDoS protection, CDN
3. **AWS S3** - Encrypted file storage (receipts, photos)

---

## 📱 Additional Feature Recommendations

### **For Customer App**
1. **Digital Receipt** - PDF/email after payment
2. **Loyalty Points** - Earn points per visit/spend
3. **Table Call** - Request waiter via app
4. **Allergen Warnings** - Filter menu by dietary restrictions
5. **Order History** - View past orders for quick reorder

### **For Waiter App** (Future Development)
1. **Order Taking** - Digital menu, send directly to kitchen
2. **Table Status** - Real-time occupancy map
3. **Tips Tracking** - Individual tip distribution
4. **Shift Reports** - Sales summary at end of shift
5. **Customer Notes** - Allergies, preferences, complaints

### **For Kitchen Display System** (Future Development)
1. **Order Routing** - Route items to correct stations (grill, fryer, etc.)
2. **Preparation Timers** - Alert if order taking too long
3. **Inventory Deduction** - Auto-update stock when order completed
4. **Recipe Display** - Show ingredients/instructions per dish
5. **Quality Control** - Mark orders for manager review

### **For Manager Dashboard**
1. **Live Revenue Tracking** - Real-time sales vs target
2. **Staff Performance** - Sales, speed, customer ratings
3. **Predictive Analytics** - AI-powered demand forecasting
4. **Multi-location** - Manage multiple restaurant branches
5. **Reservation System** - Table booking integration

---

## 💰 Revenue Protection Strategies

### **Loss Prevention Checklist**

1. **Dine-and-Dash** (Est. Loss: 2-5% revenue)
   - ✅ CPF verification
   - ✅ Customer history tracking
   - ⚠️ Need: Payment hold before closure
   - ⚠️ Need: Automated alerts for long tables
   - ⚠️ Need: Blacklist system

2. **Employee Theft** (Est. Loss: 3-7% revenue)
   - ✅ Role-based access control
   - ⚠️ Need: Void transaction tracking
   - ⚠️ Need: Inventory discrepancy alerts
   - ⚠️ Need: Security camera integration

3. **Order Errors** (Est. Loss: 1-3% revenue)
   - ✅ Digital order submission
   - ⚠️ Need: Kitchen confirmation system
   - ⚠️ Need: Order audit trail
   - ⚠️ Need: Customer feedback loop

4. **Cash Handling** (Est. Loss: 2-4% revenue)
   - ✅ Cash register tracking
   - ✅ Transaction logging
   - ⚠️ Need: Dual verification
   - ⚠️ Need: Daily reconciliation with manager sign-off

---

## 📞 Emergency Protocols

### **System Downtime**
1. **Fallback**: Tablet with offline order mode
2. **Backup**: Paper order forms with carbon copy
3. **Recovery**: Cloud-based data backup (hourly)

### **Payment Gateway Failure**
1. **Primary**: Mercado Pago (Pix)
2. **Secondary**: PagSeguro (card)
3. **Tertiary**: Cash only (manual reconciliation)

### **Customer Dispute**
1. **Evidence**: Order timestamp, items, photos
2. **Contact**: Manager reviews with customer
3. **Resolution**: Partial refund, future discount, or full refund
4. **Log**: Document all disputes for pattern analysis

---

## ✅ Compliance Checklist

### **Brazil-Specific Requirements**

- [ ] **LGPD** - Customer data consent & protection
- [ ] **NF-e** - Electronic fiscal invoice generation
- [ ] **SAT/TEF** - Fiscal printer integration (if required)
- [ ] **Anvisa** - Food safety certifications on file
- [ ] **Labor Laws** - Employee time tracking, overtime calculation
- [ ] **Fire Safety** - Occupancy limits enforced in system
- [ ] **Accessibility** - WCAG AA compliance for digital menus

---

## 📈 Success Metrics

### **KPIs to Track**

1. **Revenue Protection**
   - Dine-and-dash incidents per month: **Target: 0**
   - Cash discrepancies: **Target: <1%**
   - Product waste: **Target: <5%**

2. **Operational Efficiency**
   - Average table turnover time: **Target: <90 min**
   - Order accuracy: **Target: >98%**
   - Kitchen preparation time: **Target: <15 min**

3. **Customer Satisfaction**
   - Return customer rate: **Target: >40%**
   - Average order value: **Track growth**
   - Customer complaint rate: **Target: <2%**

4. **Staff Performance**
   - Orders per hour per waiter: **Benchmark: 8-12**
   - Average tip percentage: **Target: 10-15%**
   - Error rate per employee: **Target: <3%**

---

## 🎯 Conclusion

**Your system already has a strong foundation:**
- ✅ CPF-based security
- ✅ Customer history tracking
- ✅ Role-based access
- ✅ Cash register management

**Critical additions needed:**
1. Payment verification before table closure (HIGHEST PRIORITY)
2. Automated alerts for risky behavior
3. Order audit trail for accountability
4. Inventory discrepancy tracking

**Estimated Implementation Time:**
- Critical security: **1-2 weeks**
- Full enterprise features: **4-6 weeks**
- Advanced analytics: **2-3 months**

**ROI:**
- Prevent 5-15% revenue loss from fraud/errors
- Reduce labor costs by 10-20% with automation
- Increase customer retention by 15-25%

---

*Document Version: 1.0*
*Last Updated: 2025-10-03*
*Prepared for: Marambaia PDV System*
