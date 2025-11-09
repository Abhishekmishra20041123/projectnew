# HomyStay 



## 🛠️ Technical Implementation

### Files Added
- `public/manifest.json` - PWA configuration
- `public/sw.js` - Service Worker for offline functionality
- `public/js/pwa-install.js` - Installation handler
- `public/css/pwa.css` - PWA styling
- Updated `views/layouts/boilerplate.ejs` - PWA meta tags
- Updated `views/includes/navbar.ejs` - Install button

### Key Features
- **Service Worker**: Caches resources for offline use
- **Web App Manifest**: Defines app properties and icons
- **Install Prompt**: Automatic detection and user-friendly installation
- **Responsive Design**: Works on all device sizes

## 🔧 Configuration

### Environment Variables
Make sure your `.env` file contains:
```
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```



## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Create a `.env` file with your Cloudinary credentials

3. **Start the Server**:
   ```bash
   node app.js
   ```

4. **Access the App**:
   Open `http://localhost:8080` in your browser

5. **Test PWA Features**:
   - Look for the "Install App" button in the navbar
   - Try installing the app
   - Test offline functionality

## 📱 PWA Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Application tab
3. Check Manifest and Service Worker sections
4. Test offline functionality

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run PWA audit
4. Check for any issues

## 🌐 Browser Support

- **Chrome**: 67+ (Full support)
- **Edge**: 79+ (Full support)
- **Firefox**: 58+ (Full support)
- **Safari**: 11.1+ (Partial support)
- **Mobile Browsers**: Full support on modern versions

## 🔮 Future Enhancements

- [ ] Push notifications for new listings
- [ ] Background sync for offline actions
- [ ] Advanced caching strategies
- [ ] App updates notifications
- [ ] Deep linking support

## 📞 Support

For PWA-related issues or questions, check:
1. Browser console for errors
2. Service Worker registration status
3. Manifest file validity
4. HTTPS requirement (PWA features require secure connection)

---

**Note**: PWA features work best on HTTPS. For local development, use `localhost` as it's considered secure.
