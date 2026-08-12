# Tattoo Inspiration Gallery - Quick Start Guide

## 3 Steps to Get Started

### Step 1: Configure Cloudinary (5 minutes)

1. Go to https://cloudinary.com and sign up (if not already done)
2. Go to Dashboard → Upload → Presets
3. Create a new **unsigned** preset:
   - **Name:** `hisinks_inspiration`
   - **Folder:** `hisinks/inspirations` (optional)
   - **Resource Type:** Image
   - Save

4. Copy your **Cloud Name** from dashboard
5. Add to `apps/web/.env`:
   ```
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```
6. Restart dev server

### Step 2: Test Admin Flow (5 minutes)

1. Log in as admin
2. Go to `/admin/inspirations` or click "Inspiration Gallery" in admin menu
3. Click "+ Add Inspiration"
4. **Upload an image:**
   - Drag-drop or click upload area
   - Wait for "Image uploaded" message
5. **Fill in form:**
   - Title: "Beautiful Geometric Tattoo"
   - Category: "Geometric"
   - Description: "A simple geometric design"
   - Size: "Small"
   - Placement: "Arm"
6. Click "Save"
7. Click "Publish" to make it public

### Step 3: View Public Gallery (2 minutes)

1. Navigate to `/inspiration` or click "Inspiration" in navbar
2. See your inspiration displayed
3. Click the card to see detail view
4. Test "Book Consultation" button

---

## What's Available Now

### Admin Features
- ✅ Create inspirations with image upload
- ✅ Edit existing inspirations
- ✅ Delete inspirations
- ✅ Publish/unpublish toggle
- ✅ Filter by published status
- ✅ Search by title
- ✅ Category selector
- ✅ Pagination

### Public Features
- ✅ View published inspirations
- ✅ Responsive grid layout
- ✅ Category filter
- ✅ Search functionality
- ✅ Detail modal
- ✅ Book Consultation button
- ✅ Book Appointment button
- ✅ Lazy-loaded images

### Navigation
- ✅ Navbar link: "Inspiration" (between Portfolio & About)
- ✅ Admin menu: "Inspiration Gallery"
- ✅ Homepage: "Need Inspiration?" section with CTAs

---

## File Locations

**Backend:**
- `server/src/modules/inspiration/` - All backend files

**Frontend:**
- `apps/web/src/pages/InspirationGallery.jsx` - Public gallery
- `apps/web/src/pages/admin/InspirationsManagement.jsx` - Admin management

**Routes:**
- `apps/web/src/routes/AppRoutes.jsx` - Route configuration

**Navigation:**
- `apps/web/src/components/Navbar.jsx` - Navbar link
- `apps/web/src/pages/admin/AdminLayout.jsx` - Admin menu
- `apps/web/src/pages/Home.jsx` - Homepage section

---

## API Endpoints

**Public:**
```
GET /api/inspirations?page=1&limit=12&category=Geometric&search=moon
GET /api/inspirations/:id
GET /api/inspirations/categories
```

**Admin:**
```
POST   /api/inspirations/admin
GET    /api/inspirations/admin?page=1&published=true
GET    /api/inspirations/admin/:id
PATCH  /api/inspirations/admin/:id
DELETE /api/inspirations/admin/:id
PATCH  /api/inspirations/admin/:id/publish
```

---

## Common Tasks

### Add 5 Inspirations Quickly

1. Go to admin inspirations
2. For each inspiration:
   - Click "+ Add Inspiration"
   - Upload image
   - Fill title, category, description
   - Save
   - Click "Publish"

**Time:** ~2 minutes per inspiration

### Test Search

1. Go to public gallery
2. Type "geometric" in search box
3. Should filter results by title/description

### Test Filters

1. Go to public gallery
2. Click category buttons to filter
3. "All" shows all inspirations
4. Each category shows only that type

### Check Mobile Layout

1. Resize browser to mobile width
2. Should show 1 column
3. Tablet: 2 columns
4. Desktop: 3 columns

---

## Troubleshooting

**Upload failing?**
- ✅ Check cloud name is correct in .env
- ✅ Verify preset name is `hisinks_inspiration`
- ✅ Check preset is set to "unsigned"

**Inspirations not showing?**
- ✅ Make sure they're published
- ✅ Refresh page (clear cache if needed)
- ✅ Check database

**Navigation link missing?**
- ✅ Check Navbar.jsx was updated
- ✅ Restart dev server
- ✅ Clear browser cache

**Image not displaying?**
- ✅ Check image uploaded to Cloudinary
- ✅ Verify publicId stored in database
- ✅ Check image URL is valid

---

## Next Steps

1. **Populate with content:** Add 10-15 inspirations
2. **Test thoroughly:** Use testing guide (INSPIRATION_GALLERY_TESTING_GUIDE.md)
3. **Deploy:** Push to production when ready
4. **Monitor:** Check analytics (view count)

---

## Need Help?

Refer to:
- `INSPIRATION_GALLERY_IMPLEMENTATION.md` - Full documentation
- `INSPIRATION_GALLERY_TESTING_GUIDE.md` - Comprehensive testing
- Backend files in `server/src/modules/inspiration/`
- Frontend pages in `apps/web/src/pages/`

---

**You're all set! 🎨✨**

Start creating and publishing inspirations now.

