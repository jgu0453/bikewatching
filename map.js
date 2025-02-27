// Replace with your actual Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiamd1MDQ1MyIsImEiOiJjbTdteTlwMDAwa3g1MmxvZzBnZXhtNXpqIn0.sRi55mUQZUJ49c5ze8QLmg';

const map = new mapboxgl.Map({
    container: 'map',  // This must match the id in your HTML
    style: 'mapbox://styles/mapbox/streets-v11',  // Use Mapbox Streets style
    center: [-71.0589, 42.3601],  // Boston coordinates
    zoom: 12
});

// Load Bike Lanes
map.on('load', () => {
    map.addSource('bike-lanes', {
        type: 'geojson',
        data: 'https://data.boston.gov/dataset/51fa15c4-3b99-4c23-b4b4-6326fc4b2c72/resource/86b86b52-3519-4a82-9993-5ac9e1b4f562/download/bike-network.geojson' // Example URL for bike lanes
    });

    map.addLayer({
        id: 'bike-lanes-layer',
        type: 'line',
        source: 'bike-lanes',
        paint: {
            'line-color': '#00FF00',
            'line-width': 3
        }
    });
});

// Load Bike Stations
fetch('https://gbfs.bluebikes.com/gbfs/en/station_information.json')
    .then(response => response.json())
    .then(data => {
        data.data.stations.forEach(station => {
            new mapboxgl.Marker()
                .setLngLat([station.lon, station.lat])
                .setPopup(new mapboxgl.Popup().setText(station.name))
                .addTo(map);
        });
    });

// Function to Update Traffic Data
function updateTraffic(hour) {
    fetch('https://gbfs.bluebikes.com/gbfs/en/station_status.json')
        .then(response => response.json())
        .then(data => {
            data.data.stations.forEach(station => {
                let traffic = Math.floor(Math.random() * 20); // Simulated traffic data
                let color = traffic > 10 ? 'red' : 'blue';
                new mapboxgl.Marker({ color: color })
                    .setLngLat([station.lon, station.lat])
                    .setPopup(new mapboxgl.Popup().setText(`Traffic at ${hour}:00 → ${traffic}`))
                    .addTo(map);
            });
        });
}

// Time Slider Event Listener
document.getElementById('timeSlider').addEventListener('input', function () {
    document.getElementById('timeDisplay').textContent = this.value;
    updateTraffic(this.value);
});
