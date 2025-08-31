// Simple Mapbox initialization
console.log('Map script loaded');

// Function to initialize the map
function initializeMap() {
    console.log('Initializing map function called');
    console.log('=== DEBUG: map.js initialization ===');
    console.log('mapToken typeof:', typeof mapToken);
    console.log('mapToken value:', mapToken);
    console.log('listing typeof:', typeof listing);
    console.log('listing value:', listing);
    
    // Check if required variables exist
    if (typeof mapToken === 'undefined') {
        console.error('mapToken is not defined');
        // Try to show an error message in the map container if it exists
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="alert alert-warning">Map token not available</div>';
        }
        return;
    }
    
    if (typeof listing === 'undefined') {
        console.error('listing is not defined');
        // Try to show an error message in the map container if it exists
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="alert alert-info">Listing data not available</div>';
        }
        return;
    }
    
    if (!mapToken || mapToken.trim() === '') {
        console.error('mapToken is empty');
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="alert alert-warning">Map token is not configured</div>';
        }
        return;
    }
    
    if (!listing || !listing.geometry || !listing.geometry.coordinates) {
        console.error('Listing geometry data is not available');
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="alert alert-info">Location data not available</div>';
        }
        return;
    }
    
    try {
        // Validate coordinates
        const coordinates = listing.geometry.coordinates;
        console.log('Coordinates:', coordinates);
        
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new Error('Invalid coordinates format');
        }
        
        const [lng, lat] = coordinates;
        if (lat < -90 || lat > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (lng < -180 || lng > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }
        
        // Initialize map
        console.log('Initializing map with token and coordinates');
        mapboxgl.accessToken = mapToken;
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: coordinates,
            zoom: 8
        });
        
        // Add marker
        const marker = new mapboxgl.Marker({color: 'red'})
            .setLngLat(coordinates)
            .setPopup(new mapboxgl.Popup({ closeOnClick: false })
            .setHTML(`<p><strong>${listing.title || 'Listing'}:</strong><br>Exact location after booking!</p>`))
            .addTo(map);
            
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `<div class="alert alert-danger">Error loading map: ${error.message}</div>`;
        }
    }
}

// Wait for DOM to be ready before initializing the map
if (document.readyState === 'loading') {
    // DOM is still loading, wait for it to complete
    document.addEventListener('DOMContentLoaded', initializeMap);
} else {
    // DOM is already ready, initialize immediately
    initializeMap();
}