# Inspiration-to-Consultation Integration: Complete Testing Guide

## Test Scenario: End-to-End Flow

This guide walks through the complete customer journey from inspiration discovery to appointment booking.

### Prerequisites

- At least one published inspiration in the database
- Admin account for consultation review
- Test customer account (or register during test)
- M-Pesa test reference (any format matching `[A-Z0-9]{6,20}`)

---

## Step 1: Browse Inspiration Gallery

**URL**: `/inspirations`

**Expected**:
1. Inspiration gallery displays with grid of published inspirations
2. Each inspiration card shows: image, title, category
3. Hover reveals "View Details" button

**Test**:
- [ ] Gallery loads
- [ ] All published inspirations visible
- [ ] Inspiration card layout responsive on mobile

---

## Step 2: Open Inspiration Details

**Action**: Click any inspiration card or "View Details" button

**Expected Modal**:
1. Large inspiration image (clickable for full-screen)
2. Title and category badge
3. Description (if available)
4. Estimated size (if set)
5. Suggested placement (if set)
6. Single "Book a Consultation" button
7. Close button

**Test**:
- [ ] Modal opens without errors
- [ ] Image displays clearly
- [ ] All metadata visible
- [ ] "Book a Consultation" button present
- [ ] "Book Appointment" button NOT present (removed)
- [ ] Close button works
- [ ] ESC key closes modal

---

## Step 3: Verify Image Features (Optional)

**Action**: Interact with inspiration image in modal

**Expected**:
1. Hover shows zoom icon
2. Click opens full-screen viewer
3. Download button appears on hover
4. Full-screen viewer has close button (X)
5. ESC key closes full-screen

**Test**:
- [ ] Image zoom works
- [ ] Download button appears
- [ ] Full-screen viewer opens
- [ ] ESC key closes full-screen
- [ ] Can click multiple times without errors

---

## Step 4: Navigate to Consultation

**Action**: Click "Book a Consultation" button in inspiration modal

**Expected Navigation**:
1. Route to `/my-consultation`
2. If not logged in: redirect to `/login`
3. After login: redirect back to `/my-consultation`
4. inspirationId passed via router state

**Test**:
- [ ] Click "Book a Consultation"
- [ ] If logged in: consultation page loads immediately
- [ ] If not logged in: login page shows with "from: /my-consultation"
- [ ] After login: redirected to consultation with inspirationId preserved

---

## Step 5: Verify Inspiration Card in Start Prompt

**Expected Display**:
1. Inspiration card visible before message input
2. Large thumbnail image
3. "🎨 Selected Inspiration" label
4. Inspiration title
5. Category (style)
6. Estimated size (if available)
7. Suggested placement (if available)
8. Helper text: "This inspiration has been attached to your consultation."

**Test**:
- [ ] Inspiration card displays
- [ ] All metadata visible and accurate
- [ ] Image shows correctly
- [ ] Card styled with brand-accent color
- [ ] Text is readable

**Important**: Compare against inspiration modal to verify data matches

---

## Step 6: Send First Message

**Action**: Type and send first message

**Input**:
```
I really like this design but would like to customize it with my own elements.
```

**Expected**:
1. Message sends successfully
2. Consultation created in database
3. Two messages appear in thread:
   - Auto-generated: "🎨 Selected Inspiration: ..." (with all details)
   - Customer message: "I really like this design..."
4. Inspiration card no longer shows (now inside consultation)
5. Status shows "Open"

**Test**:
- [ ] Message sends without error
- [ ] Inspiration reference message auto-inserted first
- [ ] Reference message shows: Title, Style, Description, Size, Placement, Image URL
- [ ] Customer message appears after
- [ ] Message timestamps display correctly

---

## Step 7: Admin Receives Consultation

**URL**: Admin dashboard → Consultations

**Expected**:
1. New consultation appears in list
2. Shows: Customer name, status (Open), last message preview
3. Click to open consultation detail

**Test**:
- [ ] Consultation appears in list
- [ ] Correct customer name
- [ ] Status shows "Open"
- [ ] Latest message preview visible

---

## Step 8: Admin Reviews Inspiration (Critical Step)

**Action**: Click consultation to view detail

**Expected Layout**:
1. **Header**: Customer name, email, phone, status badge
2. **New Inspiration Card** (prominent):
   - Large inspiration image (clickable preview)
   - "🎨 Selected Inspiration" label (brand accent color)
   - Inspiration title
   - Style category
   - Description
   - Suggested size and placement
   - Helper: "Use this as your reference for discussing..."
3. **Message Thread** below:
   - Reference message (🎨 Selected Inspiration: ...)
   - Customer message

**Test**:
- [ ] Inspiration card displays immediately (before scrolling)
- [ ] Inspiration image clickable for preview
- [ ] All metadata visible and accurate
- [ ] Message thread shows reference first
- [ ] Admin doesn't need to search gallery for inspiration

---

## Step 9: Admin Replies (Optional)

**Action**: Admin sends reply message

**Expected**:
1. Reply appears in thread
2. Inspiration context still visible
3. Reply visible to customer

**Test**:
- [ ] Admin reply sends
- [ ] Appears in thread
- [ ] Customer notified (check notifications)

---

## Step 10: Admin Approves & Sets Price

**Action**: Admin clicks "Agree" button, enters price

**Input**: Price = 5000 (KES)

**Expected**:
1. Price field shows current agreed price (if any)
2. Enter new price: 5000
3. Click "Agree"
4. Status changes to "Agreed"
5. Deposit calculated: 5000 * 0.2 = 1000 KES
6. Customer notified

**Test**:
- [ ] Agree button present
- [ ] Price field editable
- [ ] Status changes to "Agreed"
- [ ] Inspiration card still visible
- [ ] Customer receives notification

---

## Step 11: Customer Submits Deposit Reference

**URL**: Customer dashboard → My Consultation

**Expected**:
1. Consultation shows status "Agreed"
2. Price display: 5000 KES
3. Deposit payment instructions visible
4. M-Pesa details:
   - Business No: 625625
   - Account No: 7715761427
   - Amount: 1000 KES
5. Text field for M-Pesa confirmation code

**Action**: Submit M-Pesa reference

**Input**: SLK1234XYZ

**Expected**:
1. Reference submitted
2. Status changes to "Deposit Pending"
3. Reference displays in thread/header
4. Customer sees: "Awaiting confirmation..."

**Test**:
- [ ] Deposit instructions display correctly
- [ ] M-Pesa reference field accepts input
- [ ] Reference formatted to uppercase
- [ ] Status changes to "Deposit Pending"
- [ ] Inspiration card still visible

---

## Step 12: Admin Confirms Deposit

**Action**: Admin reviews deposit, clicks "Confirm Deposit"

**Expected**:
1. Confirmation dialog appears with reference and amount
2. After confirmation:
   - Status changes to "Deposit Paid"
   - "Book Appointment" button appears
   - Customer notified

**Test**:
- [ ] Confirm button present
- [ ] Dialog shows reference and amount
- [ ] Status changes to "Deposit Paid"
- [ ] Inspiration card still visible
- [ ] Customer receives notification

---

## Step 13: Customer Books Appointment

**URL**: Customer dashboard → My Consultation

**Expected Display**:
1. Status: "Deposit Paid" (green)
2. Message: "Deposit confirmed — you can now book your appointment!"
3. "Book Appointment" button visible
4. Inspiration still visible for reference

**Action**: Click "Book Appointment"

**Expected Navigation**:
1. Route to booking form
2. Consultation linked in booking

**Test**:
- [ ] Book button appears after deposit paid
- [ ] Click navigates to booking form
- [ ] Form opens successfully

---

## Step 14: Customer Completes Booking

**URL**: `/book` (booking form)

**Form Fields**:
- Name (pre-filled from consultation)
- Phone (pre-filled from consultation)
- Email (pre-filled from consultation)
- Tattoo idea
- Description
- Placement
- Size
- Preferred date
- Notes
- Booking location (studio/house call)

**Action**: Complete form and submit

**Expected**:
1. Booking created
2. Status: "Confirmed" (since deposit paid)
3. Booking linked to consultation
4. Inspiration accessible via consultation relationship

**Test**:
- [ ] Form pre-fills customer data
- [ ] All fields can be edited
- [ ] Date picker works
- [ ] Submission succeeds
- [ ] Confirmation page shows

---

## Step 15: Admin Verifies Booking Link

**URL**: Admin dashboard → Bookings

**Expected**:
1. New booking appears in list
2. Click to view booking detail

**Action**: View booking detail

**Expected**:
1. Booking information displays
2. **Consultation Link** visible:
   - Consultation ID/link
   - Shows: Customer name, agreed price, inspiration reference
3. **Inspiration Data** accessible:
   - Via consultation link
   - Image, title, style, description, size, placement

**Test**:
- [ ] Booking appears in list
- [ ] Consultation ID present
- [ ] Consultation link accessible
- [ ] Inspiration details visible via consultation
- [ ] Customer journey traceable

---

## Step 16: Verify Complete Traceability

**Test Data Chain**: Booking → Consultation → Inspiration

**Action**: Navigate booking → consultation → inspiration data

**Expected**:
1. Booking shows: consultationId = [ID]
2. Click consultation opens consultation view
3. Consultation shows: inspirationRef with full data
4. Match inspiration original data

**Test**:
- [ ] Booking has consultationId
- [ ] consultationId is valid ObjectId
- [ ] Consultation loads
- [ ] Inspiration data matches original
- [ ] Can click inspiration image to preview

---

## Edge Cases & Error Handling

### Test: Deleted Inspiration

**Setup**: Create consultation with inspiration, then delete inspiration

**Expected**:
1. Existing consultation still shows inspiration snapshot
2. Error if trying to use deleted inspiration ID for new consultation
3. No broken links

**Test**:
- [ ] Old consultation shows inspiration data
- [ ] Can't create new consultation with deleted inspiration ID
- [ ] Error message clear

---

### Test: Invalid Inspiration ID

**Setup**: Manually send API request with fake inspiration ID

**Request**:
```
POST /api/consultations/my/messages
{
  "text": "Hello",
  "inspirationId": "000000000000000000000000"
}
```

**Expected**:
```json
{
  "success": false,
  "message": "The selected inspiration no longer exists."
}
```

**Test**:
- [ ] API rejects invalid ID
- [ ] Error message displayed
- [ ] Consultation not created

---

### Test: Malformed Inspiration ID

**Request**:
```
POST /api/consultations/my/messages
{
  "text": "Hello",
  "inspirationId": "not-a-valid-id"
}
```

**Expected**:
```json
{
  "success": false,
  "message": "Invalid inspiration ID format."
}
```

**Test**:
- [ ] API validates ID format
- [ ] Error returned immediately
- [ ] No database lookup attempted

---

### Test: Portfolio Reference Still Works

**Expected**:
1. Existing "Book This Style" flow from portfolio still works
2. Tattoo reference (not inspiration) still displays
3. Both can coexist in consultation

**Test**:
- [ ] Portfolio booking still works
- [ ] TattooRef displays in consultation
- [ ] TattooRef in admin view
- [ ] No conflicts with inspiration

---

### Test: Mobile Responsiveness

**Device**: Mobile (375px width)

**Test**:
- [ ] Inspiration modal responsive
- [ ] Inspiration card in consultation responsive
- [ ] Admin inspiration card responsive
- [ ] All images load and scale
- [ ] Text readable at mobile size
- [ ] Buttons tappable

---

## Performance Checks

**Test**: Load times

**Expected**:
- Inspiration gallery loads: < 2s
- Consultation page loads: < 1s
- Admin consultation loads: < 1s

**Test**:
- [ ] No unnecessary API calls
- [ ] Images lazy-loaded
- [ ] No console errors

---

## Security Checks

**Test**: Data integrity

**Expected**:
1. Client can't modify inspiration data (frontend attempts ignored)
2. Backend validates all inspiration IDs
3. API responses contain server-validated data
4. No SQL injection vectors

**Test**:
- [ ] Modify inspiration object in browser → server rejects
- [ ] Send fake inspiration data → server uses database values
- [ ] Console shows API request with only inspirationId

---

## Regression Testing

**Test**: Existing features still work

- [ ] Regular consultation (no inspiration) still works
- [ ] Tattoo reference (portfolio) still works
- [ ] Deposit flow unchanged
- [ ] Booking flow unchanged
- [ ] Admin functions unchanged
- [ ] Notifications still sent
- [ ] Email alerts still sent

---

## Summary Checklist

- [ ] Step 1-16 completed
- [ ] All edge cases passed
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Security validated
- [ ] No regressions
- [ ] Data traceable (booking → consultation → inspiration)
- [ ] Ready for production

---

## Bug Report Template

If issues found, report:

```
Title: [Brief description]

Steps to Reproduce:
1. Step 1
2. Step 2
3. Step 3

Expected: [What should happen]

Actual: [What happened]

Environment: [Browser, device, URL]

Screenshot/Video: [If helpful]
```

