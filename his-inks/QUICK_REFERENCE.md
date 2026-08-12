# Quick Reference: Inspiration-to-Consultation Integration

## For Developers

### Key API Endpoint
```
POST /api/consultations/my/messages
Content-Type: application/json

{
  "text": "Customer message",
  "inspirationId": "507f1f77bcf86cd799439011"
}
```

### Modified Files

**Backend**:
```
server/src/modules/consultations/consultation.controller.js
server/src/modules/consultations/consultation.service.js
server/src/modules/bookings/booking.model.js
server/src/modules/bookings/booking.service.js
```

**Frontend**:
```
apps/web/src/pages/InspirationGallery.jsx
apps/web/src/pages/MyConsultation.jsx
apps/web/src/pages/admin/ConsultationsManagement.jsx
```

### Key Change: inspirationId Only

❌ **Before**: Pass full inspiration object
```javascript
navigate('/my-consultation', {
  state: {
    inspirationRef: {
      _id: inspiration._id,
      title: inspiration.title,
      image: inspiration.image,
      // ... all fields
    }
  }
});
```

✅ **After**: Pass only ID
```javascript
navigate('/my-consultation', {
  state: {
    inspirationId: inspiration._id
  }
});
```

### Backend Validation

✅ Validates inspirationId format (ObjectId)
✅ Looks up in Inspiration database
✅ Fetches verified data from database
✅ Stores only verified fields
✅ Returns 404 if not found
✅ Returns 422 if invalid format

---

## For QA/Testers

### Test Flow (16 Steps)

1. Open `/inspirations`
2. Click inspiration → Open detail modal
3. Click "Book a Consultation"
4. Verify inspiration card displays in form
5. Send message → Consultation created
6. Open admin dashboard
7. Verify inspiration card displayed
8. Approve & set price
9. Customer submits deposit
10. Admin confirms deposit
11. Customer books appointment
12. Verify booking linked to consultation
13. Check traceability (Booking → Consultation → Inspiration)
14. Test on mobile (responsive)
15. Test error cases (deleted inspiration)
16. Verify existing portfolio flow still works

### Key Verification Points

| Item | Expected | Location |
|------|----------|----------|
| Inspiration modal | Shows details + "Book a Consultation" CTA | InspirationGallery |
| Consultation form | Inspiration card auto-displayed | MyConsultation start prompt |
| Admin view | Inspiration card prominent | ConsultationsManagement detail |
| Booking link | Consultation linked to booking | GET /api/bookings/:id |
| Traceability | Can trace Booking → Inspiration | Admin bookings view |

See **INSPIRATION_TESTING_GUIDE.md** for complete procedures.

---

## For Devops/Deployment

### Deployment Checklist

```
☐ Deploy backend files (4 files)
☐ Deploy frontend files (3 files)
☐ Restart application
☐ Check logs for errors
☐ Test: Create consultation with inspiration
☐ Verify: Admin sees inspiration card
☐ Confirm: Booking link works
☐ Monitor: First hour for issues
```

### Rollback Plan

```
☐ Revert modified files to previous versions
☐ Restart application
☐ Verify system operational
Note: No data cleanup needed (fields remain)
```

### Build Commands

```bash
# Web app
cd apps/web && npm run build

# Backend syntax check
cd server && node -c src/modules/consultations/consultation.controller.js
```

---

## For Product/Business

### Customer Journey

```
Inspiration Gallery
     ↓
"Book a Consultation" (Only CTA)
     ↓
Consultation Form (Inspiration shown)
     ↓
Send Message (with inspirationId)
     ↓
Artist Reviews (sees inspiration)
     ↓
Approve & Price
     ↓
Deposit Payment
     ↓
Booking Created
     ↓
Appointment Scheduled
     ↓
[Inspiration reference preserved]
```

### Data Security

✅ **Backend validates all inspiration IDs**
- Never trusts client data
- Fetches from database only
- Verified data stored

### No Breaking Changes

✅ Existing consultation flow unchanged
✅ Existing booking flow unchanged
✅ Portfolio reference (tattooRef) still works
✅ Fully backward compatible

---

## Support

### Common Questions

**Q: What if customer deletes inspiration after selection?**
A: Consultation stores snapshot of inspiration data at time of selection. Consultation not affected.

**Q: Can a booking have inspiration from portfolio instead?**
A: Yes, tattooRef works same way. Both can coexist on consultation.

**Q: Does this affect M-Pesa deposit flow?**
A: No, deposit flow completely unchanged.

**Q: Can admin search inspiration from booking?**
A: Yes, admin can click consultation link to see inspiration.

### Documentation Links

- **Technical Details**: INSPIRATION_CONSULTATION_INTEGRATION.md
- **Testing Guide**: INSPIRATION_TESTING_GUIDE.md
- **Architecture**: ARCHITECTURE_DIAGRAMS.md
- **Changes**: CHANGES_SUMMARY.txt
- **Checklist**: IMPLEMENTATION_CHECKLIST.md

---

## Status

✅ **PRODUCTION READY**
- Code complete
- Build verified
- Documentation complete
- Testing ready
- Security approved

🟢 Approved for deployment
