import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

mapboxgl.accessToken = 'pk.eyJ1Ijoiamd1MDQ1MyIsImEiOiJjbTdteTlwMDAwa3g1MmxvZzBnZXhtNXpqIn0.sRi55mUQZUJ49c5ze8QLmg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // Matches the id in index.html
    style: 'mapbox://styles/mapbox/streets-v11', // Map style
    center: [-71.0589, 42.3601], // Boston coordinates
    zoom: 12
});

// Fetch and display bike lanes and stations
map.on('load', async () => {
    // Adding bike lanes
    map.addSource('boston-bike-lanes', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
    });

    map.addLayer({
        id: 'boston-bike-lanes-layer',
        type: 'line',
        source: 'boston-bike-lanes',
        paint: {
            'line-color': '#00FF00',
            'line-width': 3
        }
    });

    // Load Bluebikes stations data
    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    let stations = [];

    try {
        const jsonData = await d3.json(jsonurl);
        console.log('Loaded JSON Data:', jsonData);
        stations = jsonData.data.stations;
    } catch (error) {
        console.error('Error loading JSON:', error);
    }

    // Create SVG overlay for stations
    const container = map.getCanvasContainer();
    const svg = d3.select(container)
        .append('svg')
        .style('position', 'absolute')
        .style('z-index', 1)
        .style('width', '100%')
        .style('height', '100%')
        .style('pointer-events', 'none'); // Allows interaction with the map

    // Helper function to project coordinates onto the map
    function getCoords(station) {
        const point = new mapboxgl.LngLat(station.lon, station.lat);
        const { x, y } = map.project(point);
        return { cx: x, cy: y };
    }

    // Function to filter stations by selected hour
    function filterStationsByHour(hour) {
        return stations.filter(station => station.capacity > hour); // Example filter logic
    }

    // Function to update displayed stations
    function updateStations(hour) {
        const filteredStations = filterStationsByHour(hour);

        // Bind data to circles
        const circles = svg.selectAll('circle')
            .data(filteredStations, d => d.station_id);

        // Enter (Create new circles)
        circles.enter()
            .append('circle')
            .attr('r', 5)
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .merge(circles) // Merge with existing elements
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);

        // Exit (Remove old circles)
        circles.exit().remove();
    }

    // Update stations initially
    updateStations(12);

    // Update on map movements
    function updatePositions() {
        svg.selectAll('circle')
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('resize', updatePositions);
    map.on('moveend', updatePositions);

    // Handle time slider input
    const timeSlider = document.getElementById('timeSlider');
    const timeDisplay = document.getElementById('timeDisplay');

    timeSlider.addEventListener('input', (event) => {
        const selectedHour = event.target.value;
        timeDisplay.textContent = selectedHour;
        updateStations(selectedHour);
    });
});
