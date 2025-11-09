# Quick Start Guide - Identity Verification System

## Step 1: Make a User Admin

Run this command in your terminal:
```bash
node make-admin.js <your-username>
```

Example:
```bash
node make-admin.js admin
```

## Step 2: Test User Document Upload

1. Log in as a regular user
2. Go to Edit Profile (`/profile/<user-id>/edit`)
3. Scroll to "Identity Verification" section
4. Upload an identity document (JPG, PNG, or PDF)
5. Save the profile
6. Check your profile - status should show "Under Review"

## Step 3: Admin Verification

1. Log in as admin user
2. Click on your profile dropdown
3. Select "Admin Dashboard"
4. You should see the pending verification in the dashboard
5. Click "Review" to see the document
6. Click "Approve" to verify the identity
7. User's status will change to "Verified"

## Step 4: Verify Security

1. Try accessing `/admin/dashboard` as non-admin - should be blocked
2. Try viewing someone else's document - should be blocked
3. Verify that only document owner and admin can view documents

## Common Commands

### Make User Admin
```bash
node make-admin.js <username>
```

### Check if User is Admin (MongoDB)
```javascript
db.users.findOne({ username: "admin" }, { isAdmin: 1, username: 1 })
```

### Manually Set Admin (MongoDB)
```javascript
db.users.updateOne(
  { username: "admin" },
  { $set: { isAdmin: true } }
)
```

## Routes Reference

### Admin Routes (Admin Only)
- `/admin/dashboard` - Admin dashboard
- `/admin/verification/:userId` - View verification
- `/admin/verification/:userId/approve` - Approve (POST)
- `/admin/verification/:userId/reject` - Reject (POST)
- `/admin/document/:userId` - View document

### User Routes
- `/profile/:id/edit` - Edit profile (upload document here)
- `/profile/:id` - View profile (see verification status)
- `/profile/:id/document` - View own document

## File Locations

- Admin Dashboard: `views/admin/dashboard.ejs`
- Verification Review: `views/admin/verification.ejs`
- Edit Profile: `views/users/edit_profile.ejs`
- User Profile: `views/users/profile.ejs`
- Admin Controller: `controllers/admin.js`
- Profile Controller: `controllers/profile.js`
- Admin Routes: `routes/admin.js`
- Profile Routes: `routes/profile.js`

## Troubleshooting

### "You don't have permission" error
- Check if user has `isAdmin: true` in database
- Verify user is logged in
- Check middleware is working

### Document not uploading
- Check file size (max 5MB)
- Check file type (JPG, PNG, PDF only)
- Check Cloudinary configuration
- Check server logs for errors

### Document not appearing in admin dashboard
- Verify document was uploaded successfully
- Check if `profile.identityDocument` exists in user document
- Check if `profile.verified.identity` is false
- Refresh admin dashboard

## Next Steps

1. Test the complete flow: Upload → Review → Approve
2. Test security: Try accessing admin routes as non-admin
3. Test document viewing: Verify only owner/admin can view
4. Test rejection: Reject a verification and verify document is removed

## Support

For detailed information, see:
- `ADMIN_SETUP.md` - Complete admin setup guide
- `IDENTITY_VERIFICATION_IMPLEMENTATION.md` - Full implementation details



