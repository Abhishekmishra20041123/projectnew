mapboxgl.accessToken = mapToken;
         const map = new mapboxgl.Map({
        container: 'map', // container ID
        style:"mapbox://styles/mapbox/streets-v12",
        center: listing.geometry.coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 8 // starting zoom
    });
    const marker1 = new mapboxgl.Marker({color:"red"})
        .setLngLat(listing.geometry.coordinates)
        .setPopup(new mapboxgl.Popup({ closeOnClick: false })
        .setHTML(  `<p><h4>${listing.location}:</h4>exact location after booking!</p>`))
        .addTo(map);