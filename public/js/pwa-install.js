// PWA Installation Handler
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = document.getElementById('pwa-install-btn');
        this.installContainer = document.getElementById('pwa-install-container');
        
        console.log('PWA Installer initialized');
        console.log('Install button found:', !!this.installButton);
        console.log('Install container found:', !!this.installContainer);
        
        this.init();
    }

    init() {
        console.log('Initializing PWA installer...');
        
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt event fired!');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            // Show the install button
            this.showInstallButton();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is already installed');
            this.hideInstallButton();
        }

        // Add click event to install button
        if (this.installButton) {
            this.installButton.addEventListener('click', () => {
                console.log('Install button clicked');
                this.installPWA();
            });
        }
        
        // Force show button for testing (remove this in production)
        setTimeout(() => {
            if (!this.deferredPrompt) {
                console.log('Forcing install button to show for testing');
                this.showInstallButton();
            }
        }, 3000);
    }

    showInstallButton() {
        if (this.installContainer) {
            this.installContainer.style.display = 'block';
        }
    }

    hideInstallButton() {
        if (this.installContainer) {
            this.installContainer.style.display = 'none';
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    // Check if PWA is installable
    isInstallable() {
        return this.deferredPrompt !== null;
    }

    // Check if PWA is already installed
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }
}

// Initialize PWA installer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PWA...');
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        console.log('Service Worker supported, registering...');
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered successfully: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    } else {
        console.log('Service Worker not supported');
    }

    // Initialize PWA installer
    window.pwaInstaller = new PWAInstaller();
});

// Add to window for global access
window.PWAInstaller = PWAInstaller;

// Test function for debugging
window.testPWA = function() {
    console.log('=== PWA Test Results ===');
    console.log('Service Worker supported:', 'serviceWorker' in navigator);
    console.log('PWA Installer instance:', window.pwaInstaller);
    console.log('Install button found:', !!document.getElementById('pwa-install-btn'));
    console.log('Install container found:', !!document.getElementById('pwa-install-container'));
    console.log('Deferred prompt:', !!window.pwaInstaller?.deferredPrompt);
    console.log('Is installable:', window.pwaInstaller?.isInstallable());
    console.log('Is installed:', window.pwaInstaller?.isInstalled());
    
    // Force show the install button
    if (window.pwaInstaller) {
        window.pwaInstaller.showInstallButton();
        console.log('Install button should now be visible');
    }
};
