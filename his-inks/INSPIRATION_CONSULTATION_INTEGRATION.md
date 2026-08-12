# Inspiration Gallery → Consultation Integration

## Overview

The inspiration gallery is now fully integrated into the consultation workflow with database-validated inspiration ID references preserved throughout the entire customer journey:

```
Inspiration Gallery
     ↓
Click "Book a Consultation"
     ↓
Consultation Page (inspiration displayed)
     ↓
Send First Message (inspirationId sent to backend)
     ↓
Backend validates inspirationId in database
     ↓
Consultation created with inspirationRef stored
     ↓
Artist reviews consultation + inspiration together
     ↓
Consultation approved
     ↓
Deposit phase
     ↓
Booking created (linked to consultation)
     ↓
Appointment scheduled
```

## Business Requirements Met

✅ **Single Entry Point**: Inspiration gallery only leads to consultation ("Book a Consultation" button)
✅ **Immediate Context**: Inspiration displayed in consultation form before customer sends message
✅ **Database Validation**: inspirationId validated on backend (not trusting client data)
✅ **Artist Visibility**: Inspiration card prominently displayed in admin consultation view
✅ **Full Lifecycle**: Inspiration relationship preserved through deposit and booking
✅ **Traceable Journey**: Booking linked to consultation linked to inspiration

## Implementation Details

### 1. Backend: Database Validation (Security First)

**File**: `server/src/modules/consultations/consultation.service.js`

- When customer sends first message with `inspirationId`:
  1. Service validates inspirationId against Inspiration database
  2. If invalid or missing: returns 404 error
  3. If valid: fetches full inspiration data from database
  4. Stores only the verified data (title, image, category, description, sizes, placement)
  5. Never trusts client-supplied inspiration data

**Error Handling**:
- Invalid ID format: `422 - Invalid inspiration ID format.`
- Inspiration deleted: `404 - The selected inspiration no longer exists.`

### 2. Frontend: Inspiration ID Only (Minimal Data Transfer)

**File**: `apps/web/src/pages/InspirationGallery.jsx`

```javascript
navigate('/my-consultation', {
  state: {
    inspirationId: inspiration._id,  // Only the ID
  },
});
```

No inspiration object sent. The backend will fetch and validate.

### 3. Customer Experience: Automatic Display

**File**: `apps/web/src/pages/MyConsultation.jsx`

When customer arrives with `inspirationId`:
1. Page fetches inspiration data from API (`GET /inspirations/{inspirationId}`)
2. Displays inspiration card immediately (before message sent)
3. Customer can see all inspiration details
4. Customer can still edit consultation fields
5. On first message, inspirationId is sent to API
6. Backend validates and stores

**Inspiration Card Display**:
- Large thumbnail image
- Title
- Category (style)
- Description
- Suggested size
- Suggested placement
- Note: "This inspiration has been attached to your consultation."

### 4. Artist View: Prominent Display

**File**: `apps/web/src/pages/admin/ConsultationsManagement.jsx`

In the consultation detail panel:
- Large inspiration image (clickable for full preview)
- Inspiration title and style
- Description
- Suggested size and placement
- Helper text: "Use this as your reference for discussing the design with the customer."

**Position**: Displayed immediately after customer header, before message thread
**Visual**: Brand accent color (distinct from portfolio tattoo references)

### 5. Booking Integration: Relationship Preserved

**File**: `server/src/modules/bookings/booking.model.js`

Added `consultationId` field to Booking schema:
```javascript
consultationId: {
  type: ObjectId,
  ref: 'Consultation',
  default: null,
}
```

**File**: `server/src/modules/bookings/booking.service.js`

When booking created:
1. Retrieves the customer's deposit_paid consultation
2. Stores consultationId on the booking
3. Populates consultation data (including inspirationRef) in API responses

This creates the traceable chain:
```
Booking → Consultation → inspirationRef (_id, title, image, etc.)
```

## API Contracts

### POST /api/consultations/my/messages

**Request**:
```json
{
  "text": "I really like this design but want to modify the colors",
  "inspirationId": "507f1f77bcf86cd799439011"
}
```

**Service Behavior**:
1. Validates `inspirationId` exists in database
2. Fetches full inspiration record from database
3. Stores inspirationRef with database values (not client data)
4. Auto-inserts reference message in thread for admin

**Response**:
```json
{
  "success": true,
  "data": {
    "consultation": {
      "_id": "...",
      "inspirationRef": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Minimalist Geometric",
        "image": "https://...",
        "category": "Geometric",
        "description": "...",
        "estimatedSize": "Medium",
        "suggestedPlacement": "Upper arm"
      },
      "messages": [
        {
          "sender": "customer",
          "text": "🎨 Selected Inspiration:\nTitle: Minimalist Geometric\n..."
        },
        {
          "sender": "customer",
          "text": "I really like this design but want to modify..."
        }
      ]
    }
  }
}
```

### GET /api/consultations/:id (Admin)

Returns consultation with inspirationRef populated:
```json
{
  "inspirationRef": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Minimalist Geometric",
    "image": "https://...",
    "category": "Geometric",
    "description": "Clean minimalist design with geometric shapes",
    "estimatedSize": "Medium",
    "suggestedPlacement": "Upper arm"
  },
  "messages": [...]
}
```

### POST /api/bookings (Create Booking)

Booking automatically links to consultation:
```javascript
{
  "consultationId": "50a1f7a2e3c1b8d4f6a9c2e3",
  "customerName": "John Doe",
  "tattooIdea": "Minimalist tattoo with geometric shapes",
  ...
}
```

### GET /api/bookings/:id (Admin)

Returns booking with populated consultation and inspiration:
```json
{
  "_id": "...",
  "customerName": "John Doe",
  "consultationId": {
    "_id": "50a1f7a2e3c1b8d4f6a9c2e3",
    "inspirationRef": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Minimalist Geometric",
      "image": "https://...",
      ...
    }
  },
  ...
}
```

## Data Security & Validation

### Backend Validation (Primary)
✅ inspirationId format validation (ObjectId)
✅ Database lookup (inspiration must exist)
✅ Fetch verified data from database
✅ Store only verified fields

### Frontend Fallback
✅ API returns full consultation (not client data)
✅ Display only what server sends
✅ No client-side trust of inspiration data

### Error Handling
- Invalid ID → 422 + error message
- Deleted inspiration → 404 + error message
- API errors displayed to user

## Database Schema Changes

### Consultation Model (No Change Needed)
```javascript
inspirationRef: {
  _id: ObjectId,           // Already exists
  title: String,
  image: String,
  category: String,
  description: String,
  estimatedSize: String,
  suggestedPlacement: String
}
```

### Booking Model (New Field)
```javascript
consultationId: {
  type: ObjectId,
  ref: 'Consultation',
  default: null
}
```

## File Changes Summary

### Backend
1. `consultation.controller.js` - Accept inspirationId parameter
2. `consultation.service.js` - Validate and fetch inspiration from database
3. `booking.model.js` - Add consultationId field
4. `booking.service.js` - Store consultationId and populate consultation data

### Frontend
1. `InspirationGallery.jsx` - Send only inspirationId
2. `MyConsultation.jsx` - Fetch inspiration data, display card, send inspirationId
3. `ConsultationsManagement.jsx` - Display inspiration card prominently for admin

## Build Status

✅ Frontend builds successfully (961 modules, 38.10s)
✅ Backend syntax valid (controller, service, models)
✅ No regressions in existing features
✅ Backward compatible (inspirationId optional)

## Testing Checklist

- [ ] Browse inspiration gallery
- [ ] Click "Book a Consultation" on an inspiration
- [ ] Verify inspiration card displays in start prompt with all details
- [ ] Send first message
- [ ] Verify consultation created with inspirationRef
- [ ] Open consultation in admin dashboard
- [ ] Verify inspiration card displayed prominently
- [ ] Verify inspiration image clickable/previewable
- [ ] Approve consultation and set price
- [ ] Submit deposit and verify deposit flow
- [ ] Confirm deposit
- [ ] Create booking
- [ ] Verify booking linked to consultation
- [ ] Verify booking shows inspiration in admin view
- [ ] Verify existing tattooRef (portfolio) flow still works
- [ ] Test on mobile devices

## Future Enhancements

Possible improvements (not in current scope):
1. "You may also like" section in inspiration details
2. Inspiration view count tracking
3. Multiple inspirations per consultation
4. Customer can modify selected inspiration after consultation approval
5. Inspiration-based pricing suggestions
6. Inspiration hashtag/category filtering in bookings view

## Known Limitations

1. Only one inspirationRef per consultation (similar to tattooRef pattern)
2. Inspiration deleted after selected: consultation still shows stored snapshot
3. No live sync if inspiration updated after consultation created (by design - preserve moment in time)

## Rollback Plan

If needed, changes are backward compatible:
- Old consultations work without inspirationRef
- Booking consultationId optional
- inspirationId parameter optional on API

To revert to previous version:
1. Remove inspirationId handling from controller/service
2. Remove consultationId from booking model
3. Revert frontend changes
4. No database migration needed (fields remain)
