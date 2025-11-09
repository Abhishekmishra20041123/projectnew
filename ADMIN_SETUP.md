# Admin System Setup Guide

## Overview
The admin system allows authorized users to manage identity verifications for users on the platform.

## Features
- **Admin Dashboard**: View pending and verified identity verifications
- **Identity Verification Review**: Review user identity documents
- **Approve/Reject Verification**: Approve or reject user identity verifications
- **Secure Document Viewing**: Only admins and document owners can view identity documents

## Setting Up an Admin User

### Method 1: Using the make-admin.js Script

1. Open your terminal/command prompt
2. Navigate to the project directory
3. Run the following command:
   ```bash
   node make-admin.js <username>
   ```

   Example:
   ```bash
   node make-admin.js admin
   ```

### Method 2: Manual Database Update

You can also manually update a user's `isAdmin` field in MongoDB:

```javascript
// Connect to MongoDB
use wanderlust

// Update user to admin
db.users.updateOne(
  { username: "admin" },
  { $set: { isAdmin: true } }
)
```

## Admin Routes

All admin routes are protected and require:
1. User to be logged in
2. User to have `isAdmin: true` in their user document

### Available Routes:

- **GET `/admin/dashboard`** - Admin dashboard with pending verifications
- **GET `/admin/verification/:userId`** - View user verification details
- **POST `/admin/verification/:userId/approve`** - Approve identity verification
- **POST `/admin/verification/:userId/reject`** - Reject identity verification
- **GET `/admin/document/:userId`** - Securely view identity document (admin or owner only)

## Admin Dashboard Features

### Statistics
- Total Users
- Pending Verifications
- Verified Users
- Total Hosts

### Pending Verifications
- List of users who have uploaded identity documents but are not yet verified
- Quick actions: Review, Approve, Reject
- User information and submission date

### Verified Users
- List of users with verified identities
- View verification details
- Recent verifications shown

## Identity Verification Process

1. **User Uploads Document**: User uploads identity document in their profile
2. **Document Appears in Admin Dashboard**: Document appears in "Pending Verifications"
3. **Admin Reviews**: Admin reviews the document and user information
4. **Admin Decision**: 
   - **Approve**: Sets `profile.verified.identity = true`
   - **Reject**: Removes document and resets verification status

## Security Features

### Document Access Control
- Identity documents can only be viewed by:
  - The document owner (the user who uploaded it)
  - Administrators
- Document URLs are accessed through `/admin/document/:userId` route which verifies permissions

### Admin Protection
- All admin routes are protected by `isAdmin` middleware
- Non-admin users attempting to access admin routes are redirected with an error message

## Usage Instructions

### For Administrators:

1. **Access Admin Dashboard**:
   - Log in as an admin user
   - Click on your profile dropdown
   - Select "Admin Dashboard"

2. **Review Pending Verifications**:
   - View the list of pending verifications
   - Click "Review" to see detailed user information and document
   - Review the identity document (PDF or image)

3. **Approve Verification**:
   - Click "Approve" button on the verification card or review page
   - Confirm the action
   - User's identity will be marked as verified

4. **Reject Verification**:
   - Click "Reject" button
   - Optionally provide a rejection reason
   - Confirm the action
   - User's document will be removed and they can upload again

### For Users:

1. **Upload Identity Document**:
   - Go to Edit Profile
   - Scroll to "Identity Verification" section
   - Upload a government-issued ID (Driver's License, Passport, or National ID)
   - Supported formats: JPG, PNG, PDF (max 5MB)

2. **Check Verification Status**:
   - Go to your profile
   - Check the "Verification" section
   - Status will show: "Not verified", "Under Review", or "Verified"

3. **View Your Document**:
   - Only you and admins can view your uploaded document
   - Click "View Document" button in your profile or edit profile page

## Troubleshooting

### User Cannot Access Admin Dashboard
- Verify user has `isAdmin: true` in database
- Check if user is logged in
- Verify middleware is working correctly

### Document Not Viewing
- Check Cloudinary configuration
- Verify document URL is accessible
- Check file permissions in Cloudinary

### Verification Not Updating
- Check database connection
- Verify user ID is correct
- Check for errors in server logs

## Notes

- Identity verification is manual and requires admin review
- Rejected verifications remove the document, allowing users to upload a new one
- Approved verifications set `profile.verified.identity = true`
- Document viewing is secured and only accessible to authorized users

## Future Enhancements

Potential improvements:
- Automated verification using third-party services
- Email notifications for verification status changes
- Bulk verification actions
- Verification history and audit logs
- Document expiration tracking
- Multiple document types support



