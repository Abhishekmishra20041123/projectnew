# HomyStay Website - Complete List of Webpages

## 🏠 **Public Pages (No Authentication Required)**

### Home & Listings

1. **`/listings`** - Browse all listings (Home page)

   - View: `views/listings/index.ejs`
   - Features: Filter by category, search, view all available listings

2. **`/listings/search?q=query`** - Search listings

   - View: `views/listings/index.ejs`
   - Features: Search by country, location, or hotel name

3. **`/listings/:id`** - View individual listing details

   - View: `views/listings/show.ejs`
   - Features: Full listing details, images, reviews, booking calendar

4. **`/testmap`** - Test map functionality
   - View: `views/testmap.ejs`
   - Features: Map testing page

---

## 🔐 **Authentication Pages**

### User Registration & Login

5. **`/signup`** - User registration

   - View: `views/users/signup.ejs`
   - Features: Create new account

6. **`/login`** - User login

   - View: `views/users/login.ejs`
   - Features: Sign in to existing account

7. **`/logout`** - User logout
   - Method: GET/POST
   - Features: Sign out from account

---

## 📝 **Listing Management (Host Only - Requires Login)**

### Create & Edit Listings

8. **`/listings/new`** - Create new listing

   - View: `views/listings/new.ejs`
   - Features: Add new property listing with images

9. **`/listings/:id/edit`** - Edit existing listing

   - View: `views/listings/edit.ejs`
   - Features: Update listing details, images

10. **`/listings/:id`** (DELETE) - Delete listing

    - Method: DELETE
    - Features: Remove listing permanently

11. **`/listings/:id/images/:imageIndex`** (DELETE) - Delete additional image
    - Method: DELETE
    - Features: Remove specific image from listing

---

## 📅 **Booking Pages (Requires Login)**

### Guest Booking Pages

12. **`/bookings`** - Redirects to `/bookings/my-bookings`

    - Features: Default booking page redirect

13. **`/bookings/my-bookings`** - View user's bookings (Guest)

    - View: `views/bookings/my-bookings.ejs`
    - Features: List all bookings made by the user

14. **`/bookings/listings/:id/book`** - Book a listing

    - View: `views/bookings/book.ejs`
    - Features: Booking form with date selection, guest count

15. **`/bookings/:id/payment`** - Payment page

    - View: `views/bookings/payment.ejs`
    - Features: Complete payment for booking (Card, UPI, PayPal, Bank Transfer)

16. **`/bookings/:id/confirmation`** - Booking confirmation

    - View: `views/bookings/confirmation.ejs`
    - Features: Display booking confirmation details

17. **`/bookings/:id/cancel`** (POST) - Cancel booking
    - Method: POST
    - Features: Cancel booking with refund policy

### Host Booking Pages

18. **`/bookings/host-bookings`** - View host's bookings

    - View: `views/bookings/host-bookings.ejs`
    - Features: List all bookings for host's listings

19. **`/bookings/:id/respond`** - Respond to booking request (Host)

    - View: `views/bookings/response.ejs`
    - Features: Accept or decline booking requests

20. **`/bookings/:id/respond`** (POST) - Process booking response
    - Method: POST
    - Features: Confirm or decline booking with refund handling

### Booking Debug/Test Pages

21. **`/bookings/debug`** - Debug booking system

    - Features: Test booking functionality (Development only)

22. **`/bookings/test-cancel`** - Test cancellation
    - View: `views/bookings/test-cancel.ejs`
    - Features: Test booking cancellation functionality

---

## 💳 **Payment Pages (Requires Login)**

### Payment Processing

23. **`/payments/booking/:bookingId`** - Payment form

    - View: `views/payments/form.ejs`
    - Features: Alternative payment form

24. **`/payments/:id/status`** - Payment status

    - Features: Check payment status

25. **`/payments/process`** (POST) - Process payment
    - Method: POST
    - Features: Handle payment processing

### PayPal Integration

26. **`/bookings/:bookingId/paypal/success`** - PayPal success callback

    - Features: Handle successful PayPal payment

27. **`/bookings/:bookingId/paypal/cancel`** - PayPal cancel callback

    - Features: Handle cancelled PayPal payment

28. **`/bookings/webhook`** (POST) - PayPal webhook handler
    - Method: POST
    - Features: Handle PayPal webhook events

---

## 👤 **Profile Pages (Requires Login)**

### User Profile

29. **`/profile/:id`** - View user profile

    - View: `views/users/profile.ejs`
    - Features: Display user profile, listings, reviews

30. **`/profile/:id/edit`** - Edit user profile

    - View: `views/users/edit_profile.ejs`
    - Features: Update profile information, upload profile picture

31. **`/profile/:id`** (PUT) - Update profile
    - Method: PUT
    - Features: Save profile changes

### Dashboard Pages

32. **`/profile/dashboard/guest`** - Guest dashboard

    - View: `views/dashboard/guest.ejs`
    - Features: Guest statistics, bookings overview

33. **`/profile/dashboard/host`** - Host dashboard
    - View: `views/dashboard/host.ejs`
    - Features: Host statistics, listing management, bookings overview

---

## ❤️ **Wishlist Pages (Requires Login)**

### Wishlist Management

34. **`/wishlist`** - View wishlist

    - View: `views/wishlist/index.ejs`
    - Features: Display saved listings

35. **`/wishlist/add/:listingId`** (POST) - Add to wishlist

    - Method: POST
    - Features: Save listing to wishlist

36. **`/wishlist/remove/:listingId`** (DELETE) - Remove from wishlist

    - Method: DELETE
    - Features: Remove listing from wishlist

37. **`/wishlist/check/:listingId`** - Check wishlist status

    - Features: Check if listing is in wishlist (AJAX)

38. **`/wishlist/toggle`** (POST) - Toggle wishlist status
    - Method: POST
    - Features: Add/remove from wishlist (AJAX)

---

## ⭐ **Review Pages (Requires Login)**

### Review Management

39. **`/listings/:id/reviews`** (POST) - Create review

    - Method: POST
    - Features: Add review to listing

40. **`/listings/:id/reviews/:reviewid`** (PUT) - Update review

    - Method: PUT
    - Features: Edit existing review

41. **`/listings/:id/reviews/:reviewid`** (DELETE) - Delete review

    - Method: DELETE
    - Features: Remove review

42. **`/listings/:id/reviews/:reviewid/helpful`** (POST) - Toggle helpful
    - Method: POST
    - Features: Mark review as helpful/unhelpful

---

## 🚫 **Error Pages**

43. **`/error`** - Error page

    - View: `views/error.ejs`
    - Features: Display error messages

44. **404 Page** - Page not found
    - Features: Custom 404 error handling

---

## 📊 **Page Summary by Category**

### Public Pages: 4

- Home/Listings, Search, Listing Details, Test Map

### Authentication: 3

- Signup, Login, Logout

### Listing Management: 4

- Create, Edit, Delete, Delete Image

### Booking Pages: 11

- Guest bookings, Host bookings, Booking form, Payment, Confirmation, Response, Cancel, Debug/Test

### Payment Pages: 6

- Payment form, Status, Process, PayPal callbacks, Webhook

### Profile Pages: 5

- View profile, Edit profile, Guest dashboard, Host dashboard

### Wishlist Pages: 5

- View, Add, Remove, Check, Toggle

### Review Pages: 4

- Create, Update, Delete, Toggle helpful

### Error Pages: 2

- Error page, 404 page

---

## 🔗 **Total Webpages: 44+**

### Key Features:

- ✅ User authentication (Sign up, Login, Logout)
- ✅ Listing management (CRUD operations)
- ✅ Booking system (Guest & Host views)
- ✅ Payment processing (Multiple methods)
- ✅ Profile management
- ✅ Wishlist functionality
- ✅ Review system
- ✅ Search functionality
- ✅ Category filtering
- ✅ Dashboard for guests and hosts

---

## 📝 **Notes:**

- Most pages require user authentication (`isloggedin` middleware)
- Some operations require ownership verification (`isOwner` middleware)
- Review operations require author verification (`isAuthor` middleware)
- Payment pages integrate with PayPal and other payment methods
- Booking system includes cancellation policies and refund handling
- All pages use EJS templating engine
- Responsive design with mobile support
