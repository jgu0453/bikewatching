import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

mapboxgl.accessToken = 'pk.eyJ1Ijoiamd1MDQ1MyIsImEiOiJjbTdteTlwMDAwa3g1MmxvZzBnZXhtNXpqIn0.sRi55mUQZUJ49c5ze8QLmg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // This must match the id in your HTML
    style: 'mapbox://styles/mapbox/streets-v11', // Use Mapbox Streets style
    center: [-71.0589, 42.3601], // Boston coordinates
    zoom: 12
});

// Fetch and display bike lanes and stations
map.on('load', async () => {
    // Adding bike lanes as previously done
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
    let stations;
    
    try {
        const jsonData = await d3.json(jsonurl);
        console.log('Loaded JSON Data:', jsonData);
        stations = jsonData.data.stations;
    } catch (error) {
        console.error('Error loading JSON:', error);
    }

    // Create SVG container for the station markers
    const container = map.getCanvasContainer();
    const svg = d3.select(container).select('svg')
        .style('position', 'absolute')
        .style('z-index', 1)
        .style('width', '100%')
        .style('height', '100%')
        .style('pointer-events', 'none'); // Allow interaction with map below

    // Helper function to convert lat/lon to map pixel coordinates
    function getCoords(station) {
        const point = new mapboxgl.LngLat(station.Long, station.Lat); // Convert lon/lat to Mapbox LngLat
        const { x, y } = map.project(point); // Project to pixel coordinates
        return { cx: x, cy: y }; // Return as object for use in SVG attributes
    }

    // Append circles for each station
    const circles = svg.selectAll('circle')
        .data(stations)
        .enter()
        .append('circle')
        .attr('r', 5) // Radius of the circle
        .attr('fill', 'steelblue') // Circle fill color
        .attr('stroke', 'white') // Circle border color
        .attr('stroke-width', 1) // Circle border thickness
        .attr('opacity', 0.8); // Circle opacity

    // Function to update circle positions on map movements
    function updatePositions() {
        circles
            .attr('cx', d => getCoords(d).cx) // Set the x-position using projected coordinates
            .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
    }

    // Initial position update when map loads
    updatePositions();

    // Reposition markers on map interactions
    map.on('move', updatePositions);     // Update during map movement
    map.on('zoom', updatePositions);     // Update during zooming
    map.on('resize', updatePositions);   // Update on window resize
    map.on('moveend', updatePositions);  // Final adjustment after movement ends
});
