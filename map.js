import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

mapboxgl.accessToken = 'pk.eyJ1Ijoiamd1MDQ1MyIsImEiOiJjbTdteTlwMDAwa3g1MmxvZzBnZXhtNXpqIn0.sRi55mUQZUJ49c5ze8QLmg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // This must match the id in your HTML
    style: 'mapbox://styles/mapbox/streets-v11', // Use Mapbox Streets style
    center: [-71.0589, 42.3601], // Boston coordinates
    zoom: 12
});

// Load bike lanes data
map.on('load', () => {
    // Add Boston bike lanes
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

    // Add Cambridge bike lanes
    map.addSource('cambridge-bike-lanes', {
        type: 'geojson',
        data: 'https://data.cambridgema.gov/api/geospatial/ghcn-3j3q?method=export&format=GeoJSON'
    });

    map.addLayer({
        id: 'cambridge-bike-lanes-layer',
        type: 'line',
        source: 'cambridge-bike-lanes',
        paint: {
            'line-color': '#00FF00',
            'line-width': 3
        }
    });

    // Fetch and display bike stations
    fetch('https://gbfs.bluebikes.com/gbfs/en/station_information.json')
        .then(response => response.json())
        .then(stationData => {
            // Fetch station status data
            fetch('https://gbfs.bluebikes.com/gbfs/en/station_status.json')
                .then(response => response.json())
                .then(statusData => {
                    const stations = stationData.data.stations;
                    const statuses = statusData.data.stations;

                    // Create a mapping of station_id to status
                    const statusMap = new Map();
                    statuses.forEach(status => {
                        statusMap.set(status.station_id, status);
                    });

                    // Create an SVG overlay for D3
                    const container = map.getCanvasContainer();
                    const svg = d3.select(container).append('svg');

                    // Function to project latitude and longitude to pixel coordinates
                    function project([lng, lat]) {
                        return map.project(new mapboxgl.LngLat(lng, lat));
                    }

                    // Function to update station markers
                    function updateMarkers(hour) {
                        // Filter stations based on the selected hour
                        const filteredStations = stations.filter(station => {
                            const status = statusMap.get(station.station_id);
                            if (!status) return false;

                            // Simulate traffic data based on the selected hour
                            // Replace this with actual traffic data if available
                            const traffic = (status.num_bikes_available + status.num_docks_available) * Math.random();
                            return traffic > hour * 10; // Example filter condition
                        });

                        // Bind data to circles
                        const circles = svg.selectAll('circle')
                            .data(filteredStations, d => d.station_id);

                        // Remove old circles
                        circles.exit().remove();

                        // Update existing circles
                        circles
                            .attr('cx', d => project([d.lon, d.lat]).x)
                            .attr('cy', d => project([d.lon, d.lat]).y)
                            .attr('r', d => {
                                const status = statusMap.get(d.station_id);
                                const traffic = status ? status.num_bikes_available + status.num_docks_available : 0;
                                return Math.sqrt(traffic); // Radius proportional to traffic
                            })
                            .attr('fill', d => {
                                const status = statusMap.get(d.station_id);
                                if (!status) return '#ccc';
                                const ratio = status.num_bikes_available / (status.num_bikes_available + status.num_docks_available);
                                return d3.interpolateRdYlGn(ratio); // Color based on availability ratio
                            });

                        // Add new circles
                        circles.enter().append('circle')
                            .attr('cx', d => project([d.lon, d.lat]).x)
                            .attr('cy', d => project([d.lon, d.lat]).y)
                            .attr('r', d => {
                                const status = statusMap.get(d.station_id);
                                const traffic = status ? status.num_bikes_available + status.num_docks_available : 0;
                                return Math.sqrt(traffic); // Radius proportional to traffic
                            })
                            .attr('fill', d => {
                                const status = statusMap.get(d.station_id);
                                if (!status) return '#ccc';
                                const ratio = status.num_bikes_available / (status.num_bikes_available + status.num_docks_available);
                                return d3.interpolateRdYlGn(ratio); // Color based on availability ratio
                            })
                            .attr('stroke', '#fff')
                            .attr('stroke-width', 1)
                            .on('mouseover', function (event, d) {
                                const status = statusMap.get(d.station_id);
                                const traffic = status ? status.num_bikes_available + status.num_docks_available : 0;
                                const content = `
                                    <strong>${d.name}</strong><br/>
                                    Bikes Available: ${status ? status.num_bikes_available : 'N/A'}<br/>
                                    Docks Available: ${status ? status.num_docks_available : 'N/A'}<br/>
                                    Total Capacity: ${traffic}
                                `;
                                d3.select('#tooltip')
                                    .html(content)
                                    .style('left', `${event.pageX + 5}px`)
                                    .style('top', `${event.pageY - 28}px`)
                                    .transition()
                                    .duration(200)
                                    .style('opacity', .9);
                            })
                            .on('mouseout', function () {
                                d3.select('#tooltip')
                                    .transition()
                                    .duration(500)
                                    .style('opacity', 0);
                            });
                    }
 
