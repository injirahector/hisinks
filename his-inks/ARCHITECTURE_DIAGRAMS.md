# Architecture Diagrams: Inspiration-to-Consultation Integration

## 1. Customer Journey Flow

```
┌─────────────────────┐
│  Inspiration Gallery│
│   (Browse ideas)    │
└────────────┬────────┘
             │ Select inspiration
             │ Click "Book Consultation"
             ↓
┌──────────────────────────────┐
│   Inspiration Details Modal  │
│  - Image (clickable)         │
│  - Title & Category          │
│  - Description               │
│  - Suggested Size/Placement  │
│  - [Book a Consultation] CTA │
└────────────┬─────────────────┘
             │ inspirationId passed
             ↓
┌──────────────────────────────┐
│  Consultation Form           │
│  - Inspiration Card SHOWN    │
│  - Conversation Area         │
│  - Type your message         │
│  - [Send] button             │
└────────────┬─────────────────┘
             │ First message + inspirationId
             ↓
        [BACKEND]
        Backend validates
        inspirationId in DB
        Fetches verified data
             ↓
┌──────────────────────────────┐
│  Consultation Created        │
│  inspirationRef stored       │
│  Reference msg auto-added    │
└────────────┬─────────────────┘
             │ Consultation created
             ↓
┌────────────────────────────┐
│ Artist/Admin Dashboard     │
│ ✓ Consultation displayed   │
│ ✓ Inspiration Card shown   │
│ ✓ Can review design        │
│ ✓ Can reply to customer    │
└────────────┬───────────────┘
             │ Review & Approve
             ↓
┌──────────────────────────────┐
│  Set Price & Agree           │
│  status → "Agreed"           │
│  Inspiration still visible   │
└────────────┬─────────────────┘
             │ Price agreed
             ↓
┌──────────────────────────────┐
│  Deposit Payment             │
│  - M-Pesa instructions       │
│  - Inspiration reference     │
│  - Motivation to proceed     │
└────────────┬─────────────────┘
             │ Customer pays deposit
             │ Submits reference
             ↓
┌────────────────────────────┐
│  Admin Confirms Deposit    │
│  status → "Deposit Paid"   │
│  Inspiration remains linked│
└────────────┬───────────────┘
             │ Deposit verified
             ↓
┌──────────────────────────────┐
│  Booking Form                │
│  - Pre-filled from consult   │
│  - Inspiration reference     │
│  - Select date/time          │
│  - [Book Appointment] CTA    │
└────────────┬─────────────────┘
             │ Booking details submitted
             ↓
┌────────────────────────────┐
│  Booking Confirmed         │
│  ✓ status → "Confirmed"    │
│ ✓ Linked to Consultation   │
│ ✓ Inspiration preserved    │
└────────────┬───────────────┘
             │
             ↓
    Tattoo Session Scheduled
    (Inspiration available
     for artist reference)
```

---

## 2. Data Model Relationships

```
┌──────────────────────────────────────────────┐
│           INSPIRATION                        │
├──────────────────────────────────────────────┤
│ _id: ObjectId                                │
│ title: String                                │
│ image: String (Cloudinary URL)               │
│ category: String (Geometric, Minimalist...)  │
│ description: String                          │
│ estimatedSize: String                        │
│ suggestedPlacement: String                   │
│ published: Boolean                           │
│ createdAt: Date                              │
│ updatedAt: Date                              │
└────────────────────┬─────────────────────────┘
                     │
                     │ inspirationId
                     │ (referenced on first message)
                     ↓
┌──────────────────────────────────────────────┐
│           CONSULTATION                       │
├──────────────────────────────────────────────┤
│ _id: ObjectId                                │
│ userId: ObjectId (ref: User)                 │
│ customerName: String                         │
│ phone: String                                │
│ email: String                                │
│ messages: [{sender, text, timestamps}]       │
│                                              │
│ ► inspirationRef: {                          │
│     _id: ObjectId                            │
│     title: String                            │
│     image: String                            │
│     category: String                         │
│     description: String                      │
│     estimatedSize: String                    │
│     suggestedPlacement: String               │
│   }                                          │
│                                              │
│ status: String (open/agreed/...booked)       │
│ agreedPrice: Number                          │
│ depositAmount: Number                        │
│ depositRef: String                           │
│ bookingId: ObjectId (ref: Booking)           │
│ createdAt: Date                              │
└────────────────────┬─────────────────────────┘
                     │
                     │ bookingId
                     │ (set when booking created)
                     ↓
┌──────────────────────────────────────────────┐
│           BOOKING                            │
├──────────────────────────────────────────────┤
│ _id: ObjectId                                │
│ customerName: String                         │
│ phone: String                                │
│ email: String                                │
│ tattooIdea: String                           │
│ description: String                          │
│ placement: String                            │
│ size: String                                 │
│ preferredDate: Date                          │
│                                              │
│ ► consultationId: ObjectId (ref: Consultation)
│   (NEW FIELD - preserves relationship)       │
│                                              │
│ status: String                               │
│ userId: ObjectId                             │
│ createdAt: Date                              │
└──────────────────────────────────────────────┘
```

---

## 3. Data Flow: From Inspiration to Booking

```
STEP 1: Customer clicks "Book a Consultation"
        ↓
        Navigate with inspirationId (only)
        ↓
        URL: /my-consultation
        State: { inspirationId: "507f..." }

STEP 2: Frontend fetches inspiration data
        ↓
        GET /api/inspirations/507f...
        ↓
        Response: { inspiration: { _id, title, image, ... } }
        ↓
        Display inspiration card

STEP 3: Customer sends first message
        ↓
        POST /api/consultations/my/messages
        Body: {
          text: "Your message here",
          inspirationId: "507f..."
        }

STEP 4: Backend validation
        ↓
        ├─ Validate inspirationId format
        ├─ Query: Inspiration.findById("507f...")
        ├─ If not found → 404 error
        └─ If found → fetch verified data

STEP 5: Create consultation
        ↓
        Consultation.create({
          userId: req.user._id,
          messages: [
            { 
              sender: 'customer',
              text: '🎨 Selected Inspiration:\nTitle: ...\n...'
            },
            {
              sender: 'customer',
              text: 'Your message here'
            }
          ],
          inspirationRef: {
            _id: "507f...",
            title: verified_title,
            image: verified_image,
            ...
          },
          status: 'open'
        })

STEP 6: Consultation shown to artist
        ↓
        GET /api/consultations/{id}
        ↓
        Admin console displays:
        ├─ Customer info
        ├─ ► Inspiration card (prominent)
        ├─ Message thread
        └─ Action buttons

STEP 7: Artist approves, customer deposits
        ↓
        PATCH /api/consultations/{id}/agree
        POST /api/consultations/{id}/deposit/confirm

STEP 8: Customer creates booking
        ↓
        POST /api/bookings
        Body: { tattooIdea, description, ... }

STEP 9: Booking links to consultation
        ↓
        Booking.create({
          consultationId: consultation._id,
          ...
        })
        ↓
        linkBooking() called:
        Consultation.findOneAndUpdate({
          status: 'deposit_paid',
          bookingId: null
        }, {
          status: 'booked',
          bookingId: booking._id
        })

STEP 10: Full traceability established
         ↓
         Booking
           └─ consultationId → Consultation
               └─ inspirationRef → Inspiration data
                   └─ _id, title, image, category, etc.
```

---

## 4. Security: Data Validation Flow

```
                          ┌─────────────────┐
                          │  FRONTEND SENDS │
                          │  inspirationId  │
                          │   (only ID)     │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ↓                             │
            ┌──────────────┐           Trust: ✅ Only ID
            │  Backend RX  │           Do NOT trust other fields
            └──────┬───────┘
                   │
        ┌──────────┴──────────┐
        │ VALIDATION LAYER    │
        │ 1. Format check     │
        │    ObjectId valid?  │
        └──────┬──────────────┘
               │
        ┌──────┴──────┐
        │  Not valid? │
        └──────┬──────┘ → 422 Error
               │         "Invalid format"
               │
        ┌──────┴──────────────────────┐
        │ DATABASE LOOKUP LAYER       │
        │ Find inspiration by _id     │
        └──────┬─────────────────────┘
               │
        ┌──────┴──────┐
        │  Not found? │
        └──────┬──────┘ → 404 Error
               │         "Doesn't exist"
               │
        ┌──────┴──────────────────┐
        │ FETCH VERIFIED DATA    │
        │ From database:         │
        │ - title               │
        │ - image               │
        │ - category            │
        │ - description         │
        │ - estimatedSize       │
        │ - suggestedPlacement  │
        └──────┬─────────────────┘
               │
        ┌──────┴──────────────────┐
        │ STORE IN CONSULTATION  │
        │ NEVER store client data│
        │ ONLY store DB data     │
        └──────┬─────────────────┘
               │
        ┌──────┴──────────────┐
        │ RETURN TO FRONTEND  │
        │ Full consultations  │
        │ with inspirationRef │
        └─────────────────────┘
```

---

## 5. Admin View: What Artist Sees

```
┌────────────────────────────────────────────────────────────┐
│                 CONSULTATION DETAIL (ADMIN)                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ John Doe                          [OPEN]          │    │
│  │ john@email.com · +254712345678                    │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │  🎨 SELECTED INSPIRATION              ◄─ PROMINENT │    │
│  ├───────────────────────────────────────────────────┤    │
│  │  ┌─────────────────────────┐                      │    │
│  │  │                         │  Minimalist Geometric│    │
│  │  │   [Inspiration Image]   │  Style: Geometric   │    │
│  │  │   (clickable preview)   │                      │    │
│  │  │                         │  "Clean minimalist  │    │
│  │  └─────────────────────────┘   design with       │    │
│  │                                geometric shapes" │    │
│  │  Suggested Size: Medium                          │    │
│  │  Suggested Placement: Upper arm                  │    │
│  │                                                  │    │
│  │  💡 Use this as your reference for discussing   │    │
│  │     the design with the customer.                │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  MESSAGE THREAD                                           │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Customer (09:15)                                  │    │
│  │ ┌─────────────────────────────────────────────┐  │    │
│  │ │ 🎨 Selected Inspiration:                   │  │    │
│  │ │ Title: Minimalist Geometric                 │  │    │
│  │ │ Style: Geometric                            │  │    │
│  │ │ Description: Clean minimalist design...     │  │    │
│  │ │ Suggested Size: Medium                      │  │    │
│  │ │ Suggested Placement: Upper arm              │  │    │
│  │ │ Image: https://res.cloudinary.com/...       │  │    │
│  │ └─────────────────────────────────────────────┘  │    │
│  │                                                  │    │
│  │ Customer (09:16)                                  │    │
│  │ ┌─────────────────────────────────────────────┐  │    │
│  │ │ I really like this design but I'd like to   │  │    │
│  │ │ modify the colors to match my personality.  │  │    │
│  │ └─────────────────────────────────────────────┘  │    │
│  │                                                  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ [Reply...]          [Agree] [Close]               │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 6. API Response Structure

```
REQUEST:
POST /api/consultations/my/messages
{
  "text": "I want to customize this design",
  "inspirationId": "507f1f77bcf86cd799439011"
}

RESPONSE (SUCCESS):
{
  "success": true,
  "data": {
    "consultation": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439013",
      "customerName": "John Doe",
      "phone": "+254712345678",
      "email": "john@example.com",
      
      ► "inspirationRef": {
          "_id": "507f1f77bcf86cd799439011",
          "title": "Minimalist Geometric",
          "image": "https://res.cloudinary.com/.../image/...",
          "category": "Geometric",
          "description": "Clean minimalist design with geometric shapes",
          "estimatedSize": "Medium",
          "suggestedPlacement": "Upper arm"
        },
      
      "messages": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "sender": "customer",
          "text": "🎨 Selected Inspiration:\nTitle: Minimalist Geometric\n..."
          "createdAt": "2026-08-12T10:15:30.000Z"
        },
        {
          "_id": "507f1f77bcf86cd799439015",
          "sender": "customer",
          "text": "I want to customize this design",
          "createdAt": "2026-08-12T10:16:00.000Z"
        }
      ],
      
      "status": "open",
      "consultationNumber": 1,
      "createdAt": "2026-08-12T10:15:30.000Z",
      "updatedAt": "2026-08-12T10:16:00.000Z"
    }
  }
}

RESPONSE (ERROR - Invalid ID):
{
  "success": false,
  "message": "Invalid inspiration ID format."
}

RESPONSE (ERROR - Not Found):
{
  "success": false,
  "message": "The selected inspiration no longer exists."
}
```

---

## 7. Deployment Verification

```
BEFORE DEPLOYMENT
├─ [ ] Code committed
├─ [ ] Tests passing
├─ [ ] Build successful
└─ [ ] Documentation complete

DEPLOYMENT STEPS
├─ [ ] Deploy backend files
│       ├─ consultation.controller.js
│       ├─ consultation.service.js
│       ├─ booking.model.js
│       └─ booking.service.js
├─ [ ] Deploy frontend files
│       ├─ InspirationGallery.jsx
│       ├─ MyConsultation.jsx
│       └─ ConsultationsManagement.jsx
└─ [ ] Restart application

POST-DEPLOYMENT VERIFICATION
├─ [ ] No console errors
├─ [ ] Inspiration gallery loads
├─ [ ] Can create consultation with inspiration
├─ [ ] Admin sees inspiration card
├─ [ ] Deposit flow works
├─ [ ] Booking flow works
├─ [ ] Traceability confirmed (Booking → Consultation → Inspiration)
└─ [ ] Mobile responsive

ROLLBACK (if needed)
├─ [ ] Revert backend files
├─ [ ] Revert frontend files
├─ [ ] Restart application
└─ [ ] Verify system operational
    (Note: No data cleanup needed - fields remain)
```

---

**For detailed technical specifications, see: INSPIRATION_CONSULTATION_INTEGRATION.md**

**For step-by-step testing procedures, see: INSPIRATION_TESTING_GUIDE.md**
