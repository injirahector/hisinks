# Tattoo Inspiration Gallery - Testing Guide

## Overview
This guide walks you through testing all aspects of the Tattoo Inspiration Gallery feature, including admin management, public gallery, search/filtering, and booking integration.

---

## Pre-Testing Setup

### 1. Environment Variables
Add to `.env` in `apps/web/`:
```
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 2. Cloudinary Configuration
1. Go to your Cloudinary dashboard
2. Create an unsigned upload preset named `hisinks_inspiration`
3. Configure allowed resource types: images
4. Optional: Set folder to `hisinks/inspirations`

### 3. Test Admin Account
Ensure you have an admin account created with:
- Email: admin@example.com
- Password: (your test password)
- Role: admin

---

## Test Scenarios

### SECTION 1: Admin Management (Create, Edit, Delete)

#### Test 1.1: Create New Inspiration
**Steps:**
1. Log in as admin
2. Navigate to `/admin/inspirations` (or "Inspiration Gallery" in admin menu)
3. Click "+ Add Inspiration" button
4. Fill form:
   - Upload an image via drag-and-drop or click
   - Title: "Minimalist Geometric Tattoo"
   - Category: "Geometric"
   - Description: "A simple geometric design with clean lines"
   - Estimated Size: "Small"
   - Suggested Placement: "Arm"
5. Click "Save" button

**Expected Result:**
- ✅ Image uploads to Cloudinary
- ✅ Form data saved to database
- ✅ Card appears in admin gallery with "Draft" badge
- ✅ Success message displayed
- ✅ Modal closes

**Failure Scenarios to Test:**
- Missing required fields (should show validation errors)
- Upload fails (show error message)
- Network error (appropriate error handling)

---

#### Test 1.2: Publish Inspiration
**Steps:**
1. In admin inspirations gallery, find the draft card just created
2. Click "Publish" button

**Expected Result:**
- ✅ Card updates to "Published" badge (green)
- ✅ Backend status changed to `published: true`
- ✅ API call succeeds

---

#### Test 1.3: Edit Inspiration
**Steps:**
1. Find a published inspiration card
2. Click "Edit" button
3. Update:
   - Title: "Minimalist Geometric Tattoo v2"
   - Description: "Updated description"
4. Click "Save"

**Expected Result:**
- ✅ Form loads with existing data
- ✅ Changes saved to database
- ✅ Card updates in list
- ✅ Success message

---

#### Test 1.4: Delete Inspiration
**Steps:**
1. Find an inspiration card
2. Click "Delete" button
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ After confirming, card removed from list
- ✅ Database entry deleted
- ✅ Success message

---

#### Test 1.5: Filter by Published Status
**Steps:**
1. Create at least 2 inspirations (1 draft, 1 published)
2. Click "draft" tab

**Expected Result:**
- ✅ Only draft inspirations shown
- ✅ Click "published" shows only published
- ✅ Click "all" shows both

---

#### Test 1.6: Filter by Category
**Steps:**
1. Have inspirations in different categories
2. Select category dropdown
3. Choose "Fine Line"

**Expected Result:**
- ✅ List filters to only show Fine Line inspirations
- ✅ Total count updates
- ✅ Category filter works with search

---

#### Test 1.7: Search Inspirations (Admin)
**Steps:**
1. Have multiple inspirations
2. Type "geometric" in search box
3. Wait for debounce (400ms)

**Expected Result:**
- ✅ Results filtered by title/description/keywords
- ✅ Loading state shows while searching
- ✅ Results update correctly

---

### SECTION 2: Public Gallery

#### Test 2.1: View Published Inspirations Only
**Steps:**
1. Log out (or open in incognito)
2. Navigate to `/inspiration` or click "Inspiration" in navbar
3. Observe gallery

**Expected Result:**
- ✅ Only published inspirations display
- ✅ Draft inspirations are hidden
- ✅ Grid layout shows (1 col mobile, 2 tablet, 3 desktop)
- ✅ Loading skeletons appear while loading
- ✅ Images lazy-load

---

#### Test 2.2: Responsive Layout
**Steps:**
1. Open inspiration gallery page
2. Resize browser:
   - Mobile (< 640px): Should show 1 column
   - Tablet (640px - 1024px): Should show 2 columns
   - Desktop (> 1024px): Should show 3 columns

**Expected Result:**
- ✅ Grid adjusts properly at breakpoints
- ✅ Cards remain proportional
- ✅ Text readable at all sizes

---

#### Test 2.3: Image Lazy Loading
**Steps:**
1. Open inspiration gallery with many images
2. Scroll down slowly
3. Observe image loading

**Expected Result:**
- ✅ Images load as they become visible
- ✅ Placeholder shows before image loads
- ✅ Performance is good (no jank)

---

#### Test 2.4: Click Card to View Details
**Steps:**
1. Click any inspiration card

**Expected Result:**
- ✅ Modal opens with full image
- ✅ Title, category, size, placement displayed
- ✅ Description shown
- ✅ "Book Consultation" and "Book Appointment" buttons visible
- ✅ Can press Escape to close modal
- ✅ Can click outside modal to close

---

#### Test 2.5: Detail Modal Navigation
**Steps:**
1. Open detail modal
2. Click "Book Consultation" button

**Expected Result:**
- ✅ Navigates to `/my-consultation`
- ✅ Modal closes
- ✅ Inspiration reference is available (optional: verify in consultation)

**Steps (Alternative):**
1. Open detail modal
2. Click "Book Appointment" button

**Expected Result:**
- ✅ Navigates to `/book`
- ✅ Modal closes

---

### SECTION 3: Search & Filtering (Public)

#### Test 3.1: Search by Title
**Steps:**
1. Go to inspiration gallery
2. Type "moon" in search box
3. Wait for debounce

**Expected Result:**
- ✅ Shows only inspirations with "moon" in title
- ✅ Case-insensitive matching
- ✅ Empty state if no matches

---

#### Test 3.2: Search by Category
**Steps:**
1. Go to inspiration gallery
2. Click category buttons
3. Click "Fine Line"

**Expected Result:**
- ✅ Shows only Fine Line inspirations
- ✅ Button highlights as active
- ✅ Click "All" to reset

---

#### Test 3.3: Combined Search & Filter
**Steps:**
1. Go to inspiration gallery
2. Select category "Geometric"
3. Type "circle" in search

**Expected Result:**
- ✅ Shows only geometric inspirations with "circle" in text
- ✅ Filters work together correctly

---

#### Test 3.4: Search Clears Results
**Steps:**
1. Perform search for "xyz" (no matches)
2. Observe empty state
3. Clear search box

**Expected Result:**
- ✅ Empty state message shows
- ✅ Clearing search returns all inspirations
- ✅ Page resets to page 1

---

### SECTION 4: Pagination

#### Test 4.1: Pagination Controls (Public)
**Steps:**
1. Go to inspiration gallery
2. Add 15+ inspirations
3. Observe pagination

**Expected Result:**
- ✅ "Next" button visible when more pages exist
- ✅ "Prev" button disabled on first page
- ✅ Page indicator shows "Page X of Y"
- ✅ Clicking Next loads next 12 items
- ✅ Clicking Prev goes back

---

#### Test 4.2: Pagination (Admin)
**Steps:**
1. Go to admin inspirations
2. Have 25+ inspirations
3. Click through pages

**Expected Result:**
- ✅ Admin shows 12 per page
- ✅ Pagination works correctly
- ✅ Total count accurate
- ✅ Filtering/search resets page to 1

---

### SECTION 5: Navigation Integration

#### Test 5.1: Navbar Link
**Steps:**
1. Log in as customer
2. Look at navbar

**Expected Result:**
- ✅ "Inspiration" link visible between Portfolio and About
- ✅ Link navigates to `/inspiration`
- ✅ Active state highlighting works

---

#### Test 5.2: Admin Menu Link
**Steps:**
1. Log in as admin
2. Go to admin dashboard
3. Look at admin sidebar

**Expected Result:**
- ✅ "Inspiration" link visible in menu
- ✅ Icon displays correctly
- ✅ Link navigates to `/admin/inspirations`
- ✅ Active state highlights

---

#### Test 5.3: Homepage Integration
**Steps:**
1. Go to homepage (`/`)
2. Scroll to "Need Inspiration?" section

**Expected Result:**
- ✅ Section displays between Portfolio and Final CTA
- ✅ "Explore Inspiration" button navigates to `/inspiration`
- ✅ "Book a Consultation" button navigates to `/my-consultation`
- ✅ Mobile layout looks good

---

### SECTION 6: Data Validation

#### Test 6.1: Required Fields
**Steps:**
1. Admin page - try to create without title

**Expected Result:**
- ✅ Form shows "Title is required" error
- ✅ Submit button disabled until filled

---

#### Test 6.2: Max Length Validation
**Steps:**
1. Try to create with title > 150 chars

**Expected Result:**
- ✅ Error: "Title cannot exceed 150 characters"
- ✅ Form prevents submission

---

#### Test 6.3: Category Validation
**Steps:**
1. Try invalid category

**Expected Result:**
- ✅ Form validation rejects invalid category
- ✅ Error message displayed

---

### SECTION 7: Cloudinary Integration

#### Test 7.1: Image Upload
**Steps:**
1. Admin page - click image upload area
2. Select a JPG/PNG file from computer
3. Watch upload progress

**Expected Result:**
- ✅ Drag-and-drop area accepts files
- ✅ "Uploading..." message shows
- ✅ Image preview appears after upload
- ✅ Cloudinary public_id captured
- ✅ Form data includes image URL and publicId

---

#### Test 7.2: Drag & Drop
**Steps:**
1. Admin page - drag image file into upload area

**Expected Result:**
- ✅ Visual feedback (border highlight)
- ✅ File uploads on drop
- ✅ Same result as click upload

---

#### Test 7.3: Image Preview
**Steps:**
1. Upload image
2. Observe preview

**Expected Result:**
- ✅ Small thumbnail shows uploaded image
- ✅ Can click to change image
- ✅ New upload replaces old preview

---

### SECTION 8: Performance & Accessibility

#### Test 8.1: Page Load Performance
**Steps:**
1. Open inspiration gallery
2. Check Network tab in DevTools
3. Note load time

**Expected Result:**
- ✅ Initial load < 2 seconds
- ✅ Images lazy load on scroll
- ✅ No jank/stuttering

---

#### Test 8.2: Keyboard Navigation
**Steps:**
1. Open detail modal
2. Press Tab to navigate buttons
3. Press Enter to activate
4. Press Escape to close

**Expected Result:**
- ✅ All buttons keyboard accessible
- ✅ Focus visible and clear
- ✅ Escape closes modal

---

#### Test 8.3: Image Alt Text
**Steps:**
1. Open DevTools inspector
2. Inspect an image in gallery

**Expected Result:**
- ✅ Image has alt text
- ✅ Alt text is descriptive (inspiration title)

---

#### Test 8.4: Mobile Accessibility
**Steps:**
1. Open on actual mobile device
2. Try to:
   - Scroll gallery
   - Click cards
   - Use buttons
   - Close modal

**Expected Result:**
- ✅ All features work on mobile
- ✅ Touch targets adequate (44px+)
- ✅ Text readable without zoom
- ✅ No horizontal scroll needed

---

### SECTION 9: Error Handling

#### Test 9.1: Network Error (Admin Create)
**Steps:**
1. Open DevTools
2. Go to Network tab
3. Throttle connection to "Offline"
4. Try to create inspiration

**Expected Result:**
- ✅ Appropriate error message
- ✅ Form doesn't clear (user can retry)
- ✅ No crash

---

#### Test 9.2: Image Upload Failure
**Steps:**
1. Use invalid upload preset in Cloudinary config
2. Try to upload image

**Expected Result:**
- ✅ Error message: "Failed to upload image"
- ✅ Form can retry

---

#### Test 9.3: Deleted During Edit
**Steps:**
1. Open inspiration for edit
2. Delete it via another browser tab/device
3. Try to save

**Expected Result:**
- ✅ Appropriate error message
- ✅ User informed of situation

---

### SECTION 10: Data Persistence

#### Test 10.1: Publish Status Persists
**Steps:**
1. Create and publish inspiration
2. Refresh page
3. Close and reopen admin

**Expected Result:**
- ✅ Published status retained
- ✅ Shows as published badge

---

#### Test 10.2: Edits Persist
**Steps:**
1. Edit an inspiration title
2. Refresh page

**Expected Result:**
- ✅ New title still displays
- ✅ Change saved to database

---

#### Test 10.3: Multiple Tabs
**Steps:**
1. Have admin page open in 2 tabs
2. Create in tab 1
3. Check tab 2 (refresh if needed)

**Expected Result:**
- ✅ New inspiration visible in tab 2
- ✅ Data synced across tabs

---

## Browser Compatibility Testing

Test on:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Mobile Device Testing

Test on:
- ✅ iPhone 12/13
- ✅ Android (Samsung S21+)
- ✅ Tablet (iPad)

---

## Automated Test Checklist

- [ ] All 10+ API endpoints respond correctly
- [ ] Database indexes working (text search)
- [ ] Pagination math correct
- [ ] Authentication/authorization enforced
- [ ] Input validation working
- [ ] Cloudinary integration functional

---

## Production Readiness Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] No memory leaks
- [ ] Images optimized in Cloudinary
- [ ] Environment variables set
- [ ] Admin can create inspirations
- [ ] Public can view inspirations
- [ ] Navbar links working
- [ ] Homepage section displays
- [ ] Admin menu item visible
- [ ] Mobile fully responsive
- [ ] Booking buttons navigate correctly
- [ ] Search/filters work
- [ ] Pagination works
- [ ] Database seeded with test data
- [ ] Cloudinary configured

---

## Test Data Seeds

To populate test data quickly:

```javascript
// 3-4 inspirations in each category
// Mix of published and draft
// Various sizes and placements
// Should test pagination (15+ total)
```

---

## Known Issues / Limitations

(Update as you discover them)

- [ ] None currently

---

## Sign-Off

Testing completed by: ________________

Date: ________________

Status: ✅ PASSED / ❌ NEEDS WORK

Notes:
```
[Add any notes here]
```

