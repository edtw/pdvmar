# QR Code Printing Guide - Physical Table Setup

## ✅ What Was Improved

### 1. **High-Quality QR Codes** 🎯
- **Resolution:** Increased from 300px to **600px** for crystal-clear printing
- **Error Correction:** Level H (highest) - works even if 30% damaged/dirty
- **Margin:** Increased to 4 units for better scanning reliability
- **Format:** PNG with high quality

### 2. **Professional Print Layout** 📄
The print template now includes:
- ✅ Restaurant name: **"🍴 Marambaia Restaurante"**
- ✅ Large, bold table number: **"Mesa 1"**, **"Mesa 2"**, etc.
- ✅ High-quality QR code (600x600px)
- ✅ Step-by-step scanning instructions (4 steps)
- ✅ WiFi information section
- ✅ Security token (first 8 characters)
- ✅ Branded borders and colors
- ✅ Professional gradient background

### 3. **Enhanced Modal Preview** 👁️
The admin modal now shows:
- Restaurant branding
- Table number prominently displayed
- Preview of what will be printed
- High-quality status indicator
- Security token information

---

## 📱 How It Works

### For Administrators:

1. **Generate QR Code:**
   - Login to admin panel
   - Go to "Mesas" (Tables)
   - Click menu (⋮) on any table
   - Click "QR Code"
   - Click "Gerar QR Code"

2. **Print QR Code:**
   - Click "Imprimir" button
   - A professional print layout will open in a new window
   - The layout includes:
     - Restaurant name
     - Mesa number (Mesa 1, Mesa 2, etc.)
     - Large QR code
     - Instructions for customers
     - WiFi information
   - Click Print or save as PDF

3. **Download QR Code:**
   - Click "Download" to get PNG file
   - File name: `mesa-{number}-qrcode.png`
   - Use this for custom designs or lamination services

---

## 🖨️ Printing Recommendations

### Material Options:

#### Option 1: Laminated Cards (Recommended)
**Best for:** Durability and table display
- Print on heavy cardstock (250-300gsm)
- Laminate with waterproof film
- Size: A5 (148mm x 210mm) or A6 (105mm x 148mm)
- **Pros:** Waterproof, durable, easy to clean
- **Cost:** ~$1-2 per card

#### Option 2: Acrylic Stands
**Best for:** Premium look
- Print on photo paper
- Place in clear acrylic stand/frame
- Size: 10cm x 15cm (standard photo size)
- **Pros:** Professional, reusable frames
- **Cost:** ~$5-10 per stand + $0.50 per print

#### Option 3: Vinyl Stickers
**Best for:** Permanent table mounting
- Print on waterproof vinyl
- Stick directly on table surface
- Size: 15cm x 20cm
- **Pros:** Permanent, won't move/fall
- **Cost:** ~$2-3 per sticker

#### Option 4: Table Tents (Fold Cards)
**Best for:** Visibility
- Print on cardstock
- Fold into standing triangle
- Size: A4 folded
- **Pros:** Visible from both sides
- **Cost:** ~$0.50 per card

---

## 📐 Print Specifications

### Recommended Settings:
```
Paper Size: A5 (148 x 210mm) or A6 (105 x 148mm)
Orientation: Portrait
Quality: High (300 DPI minimum)
Color Mode: Full Color (RGB)
Paper Type: Cardstock (250gsm+) or Photo Paper
Margins: 1cm all sides
```

### For Professional Printing:
```
Format: PDF (save print preview as PDF)
Resolution: 300 DPI
Color Space: CMYK (for offset printing)
Bleed: Add 3mm if cutting
```

---

## 🔧 Setup Instructions

### Step 1: Generate All QR Codes
```bash
# In admin panel:
1. Login as Admin
2. Go to Tables (Mesas)
3. For each table:
   - Click ⋮ menu
   - Click "QR Code"
   - Click "Gerar QR Code"
   - Click "Imprimir"
   - Print or Save as PDF
```

### Step 2: Print QR Codes
```bash
# Print settings:
- Quality: Best/High
- Color: Full Color
- Paper: Heavy cardstock or photo paper
- Size: A5 or custom
- Orientation: Portrait
```

### Step 3: Protect QR Codes
```bash
# Lamination (recommended):
1. Take printed QR codes to lamination service
2. Request thermal lamination (125-250 micron)
3. Ask for rounded corners (optional)

# Or DIY:
1. Buy self-adhesive laminating sheets
2. Apply carefully to avoid bubbles
3. Trim excess edges
```

### Step 4: Place on Tables
```bash
# Placement options:
1. Table Center: Use acrylic stand
2. Table Edge: Use clip holder
3. Table Surface: Stick with adhesive dots
4. Wall Mount: Near table (with table number)

# Best practices:
- Place where customers sit
- Avoid areas that get wet/dirty
- Ensure good lighting for scanning
- Keep at eye level when seated
```

---

## 🎨 Design Features

### Print Template Includes:

1. **Header Section:**
   - Restaurant name with emoji icon
   - Blue border (#2c5282)
   - Professional typography

2. **Table Number:**
   - Large 48px font
   - Orange color (#dd6b20) for visibility
   - White background with shadow
   - Rounded corners

3. **QR Code:**
   - 400px display size (600px actual)
   - White border and shadow
   - Centered in white container
   - High contrast for easy scanning

4. **Instructions:**
   - 4 numbered steps
   - Icons for visual guidance
   - Clear, simple language
   - Color-coded steps

5. **WiFi Info:**
   - Dashed border (orange)
   - Guest network name
   - Space for password note

6. **Footer:**
   - Marketing tagline
   - Security token reference
   - Professional finish

---

## 🔐 Security Features

Each QR code includes:
- ✅ **Unique UUID token** (non-sequential)
- ✅ **Table-specific** URL
- ✅ **Regenerable** if compromised
- ✅ **Token displayed** on print (first 8 chars)
- ✅ **Cannot be guessed** or forged

### To Regenerate QR Code:
```
Reasons to regenerate:
- QR code damaged/unreadable
- Security concern (shared publicly)
- Table number changed

How to regenerate:
1. Go to table QR modal
2. Click "Regenerar" button
3. Old QR code becomes invalid
4. New QR code generated
5. Reprint and replace physical copy
```

---

## 📊 Print Layout Preview

```
┌───────────────────────────────────────┐
│                                       │
│   🍴 MARAMBAIA RESTAURANTE           │
│   ─────────────────────────────      │
│                                       │
│          ┌─────────────┐             │
│          │   MESA 5    │             │
│          └─────────────┘             │
│                                       │
│      ┌─────────────────┐             │
│      │                 │             │
│      │   [QR CODE]     │             │
│      │                 │             │
│      └─────────────────┘             │
│                                       │
│   📱 Como Fazer Seu Pedido:          │
│   ┌─────────────────────────┐       │
│   │ ① Abra a câmera         │       │
│   │ ② Aponte para o QR      │       │
│   │ ③ Toque no link         │       │
│   │ ④ Escolha seus pratos!  │       │
│   └─────────────────────────┘       │
│                                       │
│   ┌─ 📶 WiFi Disponível ───┐        │
│   │ Rede: Marambaia-Guest   │        │
│   │ Senha: Pergunte ao      │        │
│   │        garçom           │        │
│   └─────────────────────────┘        │
│                                       │
│   ✨ Pedidos direto da sua mesa ✨  │
│   Mesa 5 • Token: abc12345           │
└───────────────────────────────────────┘
```

---

## ✅ Quality Checklist

Before placing on tables, verify:

- [ ] QR code scans correctly
- [ ] Links to correct customer app URL
- [ ] Table number is clearly visible
- [ ] Print quality is sharp and clear
- [ ] Lamination has no bubbles
- [ ] Colors are vibrant
- [ ] No smudges or defects
- [ ] Corners are intact
- [ ] Size is appropriate for table
- [ ] Waterproof/resistant material

---

## 🎯 Testing QR Codes

### Scan Test:
```
1. Use multiple phone brands (iPhone, Android)
2. Test in different lighting
3. Test from various angles
4. Test with dirty/wet finger on code
5. Verify correct table loads in app
```

### URL Verification:
```
QR code should open:
http://localhost:3002/table/{UUID}

In production:
https://menu.yourdomain.com/table/{UUID}
```

---

## 💡 Pro Tips

1. **Print Extra Copies**
   - Keep 2-3 spare copies per table
   - QR codes can get damaged/lost

2. **Update When Needed**
   - If table numbers change, regenerate
   - If URL changes, regenerate all
   - If damaged/dirty, replace

3. **Monitor Scanning**
   - Check analytics for scan rates
   - Replace if customers report issues
   - Clean regularly

4. **Branding Consistency**
   - Use same design for all tables
   - Match restaurant color scheme
   - Update template if rebranding

5. **Backup Digital Copies**
   - Save all QR code PDFs
   - Keep list of tokens per table
   - Document print date

---

## 📁 File Locations

```
Generated QR Codes:
- Database: table.qrCodeUrl (base64 data URL)
- Download: mesa-{number}-qrcode.png
- Print: Opens in new window (save as PDF)

Code Files:
- Backend: /server/controllers/qrcodeController.js
- Frontend Modal: /client/src/components/Tables/QRCodeModal.js
- Model: /server/models/Table.js (qrToken, qrCodeUrl)
```

---

## 🔄 Replacement Workflow

When a table needs a new QR code:

1. **In Admin Panel:**
   - Go to table
   - Click "QR Code"
   - Click "Regenerar" (this invalidates old code)
   - Click "Imprimir"
   - Print new code

2. **Physical Replacement:**
   - Remove old QR code from table
   - Place new QR code
   - Test scanning
   - Dispose of old code securely

3. **Verification:**
   - Scan new code
   - Verify table number matches
   - Confirm customer can create order
   - Mark as replaced in notes

---

## 📞 Support

**Common Issues:**

| Issue | Solution |
|-------|----------|
| QR won't scan | Increase brightness, clean QR, reprint |
| Wrong table loads | Regenerate QR code |
| Link doesn't work | Check CUSTOMER_APP_URL in server env |
| Poor print quality | Use higher DPI, better paper |
| QR damaged | Print on waterproof material, laminate |

---

## ✨ Summary

You now have:
- ✅ **600x600px high-quality QR codes**
- ✅ **Professional print template**
- ✅ **Table names displayed** (Mesa 1, Mesa 2, etc.)
- ✅ **Customer instructions included**
- ✅ **WiFi information section**
- ✅ **Security tokens**
- ✅ **Print, download, and regenerate features**
- ✅ **Ready for physical table placement**

**Next Steps:**
1. Generate QR codes for all tables
2. Print on quality paper/cardstock
3. Laminate for durability
4. Place on tables
5. Test scanning
6. Train staff on QR system

**The QR codes are now perfect for physical table deployment! 🎉**
