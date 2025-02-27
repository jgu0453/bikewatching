import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

// Replace with your actual Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiamd1MDQ1MyIsImEiOiJjbTdteTlwMDAwa3g1MmxvZzBnZXhtNXpqIn0.sRi55mUQZUJ49c5ze8QLmg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',  // This must match the id in your HTML
    style: 'mapbox://styles/mapbox/streets-v11',  // Use Mapbox Streets style
    center: [-71.0589, 42.3601],  // Boston coordinates
    zoom: 12
});

// Set up the station flow quantize scale
const stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);

// Load Bike Lanes
map.on('load', () => {
    map.addSource('bike-lanes', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
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
            // Remove previous markers before adding new ones
            const markers = document.querySelectorAll('.traffic-marker');
            markers.forEach(marker => marker.remove());

            data.data.stations.forEach(station => {
                let totalTraffic = station.bikes + station.docks; // Simulated total traffic
                let departures = station.bikes; // Assume bikes are departures
                let departureRatio = departures / totalTraffic;
                
                // Use stationFlow to determine the color
                let departureColor = stationFlow(departureRatio);
                let color = `color-mix(in oklch, steelblue ${100 * departureColor}%, darkorange)`;

                // Create a new marker with updated color and traffic data
                const marker = new mapboxgl.Marker({ element: createTrafficMarker(color) })
                    .setLngLat([station.lon, station.lat])
                    .setPopup(new mapboxgl.Popup().setText(`Traffic at ${hour}:00 → ${totalTraffic} (Departures: ${departures})`))
                    .addTo(map);
            });
        });
}

// Create a custom traffic marker with dynamic color
function createTrafficMarker(color) {
    const el = document.createElement('div');
    el.className = 'traffic-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    return el;
}

// Time Slider Event Listener
document.getElementById('timeSlider').addEventListener('input', function () {
    const hour = this.value;
    document.getElementById('timeDisplay').textContent = hour;
    updateTraffic(hour);
});
