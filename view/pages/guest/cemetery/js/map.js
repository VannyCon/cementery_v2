// Cemetery Management System with Enhanced MapLibre GL Integration
class CemeteryManager {
    constructor() {
        this.cemeteryAPI = '../../../../api/cemetery.php';
        // Initialize drawing system
        this.draw = null;
        this.currentDrawingMode = null;
        // Initialize modal manager (will be set after DOM loads)
        this.modalManager = null;
        // Initialize layer manager (will be set after DOM loads)
        this.layerManager = null;
        // Initialize location tracker (will be set after DOM loads)
        this.locationTracker = null;
        
        this.initializeMap();
        this.initializeModalManager();
        this.initializeRoadManager();
        this.initializeLayerManager();
        this.initializeLocationTracker();


        // this.loadData();
        // Don't load data immediately - wait for map to be ready
    }

    initializeMap() {
        // Get initial orientation and set appropriate pitch
        const initialPitch = this.getPitchForOrientation();
        
        // Define a high-resolution satellite basemap (Esri World Imagery)
        const satelliteStyle = {
            version: 8,
            sources: {
                'esri-imagery': {
                    type: 'raster',
                    tiles: [
                        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    ],
                    tileSize: 256,
                    attribution: 'Source: Esri, Maxar, Earthstar Geographics'
                }
            },
            layers: [
                {
                    id: 'esri-imagery',
                    type: 'raster',
                    source: 'esri-imagery',
                    minzoom: 0,
                    maxzoom: 19
                }
            ]
        };

        // Initialize MapLibre GL map
        this.map = new maplibregl.Map({
            container: 'map',
            style: satelliteStyle,
            // pitch: initialPitch,
            // center: [123.3372456, 10.950055], // [lng, lat] for MapLibre GL
            center: [123.421264, 10.887593],
            zoom: 19,
            minZoom: 0,
            maxZoom: 19,  // 👈 allow zooming up to level 24
            canvasContextAttributes: {antialias: true}
        });

        // Setup orientation change listener
        this.setupOrientationListener();

        // Wait for map to load before adding controls and setting up interactions
        this.map.on('load', () => {
            // Load data after map is ready
            this.loadData();
            
            // Check for URL parameters to locate a specific grave
 
            // Setup navigation control event listeners
            this.setupNavigationControls();
            
            // Wire Follow button to toggle follow mode on the LocationTracker
            const followBtn = document.getElementById('btnFollowMe');
            if (followBtn) {
                followBtn.addEventListener('click', async () => {
                    if (!this.locationTracker) return;
                    const enabled = await this.locationTracker.toggleFollowMode();
                    if (enabled) {
                        followBtn.classList.remove('btn-outline-primary');
                        followBtn.classList.add('btn-primary');
                        followBtn.innerHTML = '<i class="fas fa-crosshairs"></i><span class="d-none d-sm-inline ms-1">Following</span>';
                        if (typeof CustomToast !== 'undefined') {
                            CustomToast.show('success', 'Map will follow and rotate with your movement');
                        }
                    } else {
                        followBtn.classList.remove('btn-primary');
                        followBtn.classList.add('btn-outline-primary');
                        followBtn.innerHTML = '<i class="fas fa-location-arrow"></i><span class="d-none d-sm-inline ms-1">Follow</span>';
                        if (typeof CustomToast !== 'undefined') {
                            CustomToast.show('success', 'Follow stopped');
                        }
                    }
                });
            }
            
        });

        // Initialize feature collections for different data types
        this.features = {
            annotations: [],
            graves: [],
            routes: []
        };

        // Drawing state (now handled by Mapbox GL Draw)
        // this.drawingMode, this.currentDrawing, this.drawingSource removed

        // Routing state
        this.routingMode = null;
        this.startMarker = null;
        this.endMarker = null;
        this.startNodeId = null;
        this.endNodeId = null;

        // Graph structures for routing
        this.graphNodes = [];
        this.graphAdj = new Map();
        this.nodeKeyToId = new Map();

        // Snapping tolerance
        this.SNAP_TOLERANCE_METERS = 4;

        // Initialize tab state
        window.tabs = window.tabs || 'annotations'; // Default to annotations tab

        // Event handlers
        this.setupMapEventHandlers();

        // Grave plot creation state
        this.gravePlotCreation = {
            active: false,
            awaitingLocation: false,
            selectedLocation: null, // {lat, lng}
            marker: null,
            drawFeatureId: null
        };
    }

    setupMapEventHandlers() {
        // Handle map clicks for drawing and routing
        this.map.on('click', (e) => {
            const lngLat = e.lngLat;
            const latlng = { lat: lngLat.lat, lng: lngLat.lng };
            
            // Drawing is now handled by Mapbox GL Draw
            
            // If user location is active, automatically use it as start and clicked point as destination
            if (this.isUserLocationActive && this.graphNodes.length > 0) {
                const snapped = this.findNearestGraphNode(latlng);
                if (!snapped) {
                    this.setRouteInfo('No nearby road point found for destination.');
                    if (typeof CustomToast !== 'undefined') {
                        CustomToast.show('warning','Click closer to a road for routing');
                    }
                    return;
                }
                
                // Set destination and automatically calculate route
                this.setEndPoint(snapped);
                this.findRoute();
                
                if (typeof CustomToast !== 'undefined') {
                    CustomToast.show('success','Route calculated from your location!');
                }
                return;
            }
            
            // Original routing mode handling
            if (!this.routingMode) return;
            if (!this.graphNodes.length) {
                this.setRouteInfo('No roads to route on. Add roads first.');
                return;
            }
            
            const snapped = this.findNearestGraphNode(latlng);
            if (!snapped) {
                this.setRouteInfo('No nearby road point found.');
                return;
            }
            
            if (this.routingMode === 'start') {
                this.setStartPoint(snapped);
            } else if (this.routingMode === 'end') {
                this.setEndPoint(snapped);
            }
            
            this.routingMode = null;
        });
    }

    setupNavigationControls() {
        // Start Location Tracking button
        const startLocationBtn = document.getElementById('startLocationTracking');
        if (startLocationBtn) {
            startLocationBtn.addEventListener('click', async () => {
                try {
                    if (this.locationTracker && !this.locationTracker.isLocationTrackingActive()) {
                        await this.locationTracker.startLocationTracking();
                        startLocationBtn.innerHTML = '<i class="fas fa-stop"></i><span class="d-none d-sm-inline">Stop</span>';
                        startLocationBtn.classList.remove('btn-primary');
                        startLocationBtn.classList.add('btn-danger');
                        
                        // Enable navigation button
                        const navBtn = document.getElementById('startNavigation');
                        if (navBtn) navBtn.disabled = false;
                    } else if (this.locationTracker && this.locationTracker.isLocationTrackingActive()) {
                        this.locationTracker.stopLocationTracking();
                        startLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i><span class="d-none d-sm-inline">My Location</span>';
                        startLocationBtn.classList.remove('btn-danger');
                        startLocationBtn.classList.add('btn-primary');
                        
                        // Disable navigation button
                        const navBtn = document.getElementById('startNavigation');
                        if (navBtn) navBtn.disabled = true;
                    }
                } catch (error) {
                    console.error('Location tracking error:', error);
                    if (typeof CustomToast !== 'undefined') {
                        CustomToast.show('error', 'Failed to start location tracking');
                    }
                }
            });
        }

        // Start Navigation button
        const startNavBtn = document.getElementById('startNavigation');
        if (startNavBtn) {
            startNavBtn.addEventListener('click', () => {
                // Check if there's a grave plot to navigate to
                const gravePlotData = sessionStorage.getItem('gravePlotLocation');
                if (gravePlotData) {
                    try {
                        const data = JSON.parse(gravePlotData);
                        if (this.locationTracker && data.lat && data.lng) {
                            this.locationTracker.startNavigationToGrave(data.lat, data.lng, data);
                        }
                    } catch (error) {
                        console.error('Navigation error:', error);
                        if (typeof CustomToast !== 'undefined') {
                            CustomToast.show('error', 'Failed to start navigation');
                        }
                    }
                } else {
                    if (typeof CustomToast !== 'undefined') {
                        CustomToast.show('warning', 'No grave plot selected. Please search for a grave first.');
                    }
                }
            });
        }

        // Center on Grave button
        const centerBtn = document.getElementById('centerOnGrave');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                this.centerOnGraveLocation();
            });
            
            // Enable/disable based on grave location availability
            const gravePlotData = sessionStorage.getItem('gravePlotLocation');
            if (gravePlotData) {
                centerBtn.disabled = false;
            }
        }
    }


    // initializeUI() {
    //     document.getElementById('btnReload').addEventListener('click', () => {
    //         this.loadData();
    //     });
    // }


    showAreaCalculation(feature) {
        if (this.layerManager) {
            this.layerManager.showAreaCalculation(feature);
        }
    }

    hideAreaCalculation() {
        if (this.layerManager) {
            this.layerManager.hideAreaCalculation();
        }
    }

    startDrawMode(mode) {
        if (!this.draw) {
            console.error('Mapbox GL Draw not initialized');
            return;
        }

        console.log('Starting draw mode:', mode);
        
        // Change the draw mode
        this.draw.changeMode(mode);
        
        // Show instructions based on mode
        if (mode === 'line_string') {
            this.showToast('Click to start drawing a road. Double-click to finish.', 'info');
        } else if (mode === 'polygon') {
            this.showToast('Click to start drawing a polygon. Double-click to finish.', 'info');
        }
    }

    // Begin the two-step flow for grave plot creation
    beginGravePlotCreation() {
        if (!this.map) return;
        this.currentDrawingMode = 'grave_plot';
        this.gravePlotCreation.active = true;
        this.gravePlotCreation.awaitingLocation = true;

        // Clean previous state
        if (this.gravePlotCreation.marker) {
            this.gravePlotCreation.marker.remove();
            this.gravePlotCreation.marker = null;
        }
        this.gravePlotCreation.selectedLocation = null;

        const onMapClick = (e) => {
            if (!this.gravePlotCreation.awaitingLocation) return;
            this.map.off('click', onMapClick);
            const { lng, lat } = e.lngLat;
            this.gravePlotCreation.selectedLocation = { lat, lng };
            this.gravePlotCreation.awaitingLocation = false;

            const el = document.createElement('div');
            el.style.width = '16px';
            el.style.height = '16px';
            el.style.borderRadius = '50%';
            el.style.background = '#0d6efd';
            el.style.border = '2px solid #fff';
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
            this.gravePlotCreation.marker = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .addTo(this.map);

            this.startDrawMode('polygon');
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('info','Now draw the grave boundary and double-click to finish');
            }
        };

        this.map.on('click', onMapClick);
        if (typeof CustomToast !== 'undefined') {
            CustomToast.show('info','Click on the map to set the grave location');
        }
    }

    // After polygon is drawn, populate modal and open it
    finalizeGravePlotPolygon(feature) {
        try {
            const ringLngLat = (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0]) || [];
            const ringLatLng = ringLngLat.map(c => [c[1], c[0]]);
            if (ringLatLng.length >= 3) {
                const first = ringLatLng[0];
                const last = ringLatLng[ringLatLng.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    ringLatLng.push([first[0], first[1]]);
                }
            }

            const wkt = this.coordsToWKT(ringLatLng, 'POLYGON');
            const boundaryInput = document.getElementById('gravePlotGeometry');
            const coordsInput = document.getElementById('gravePlotCoordinates');
            const locationInput = document.getElementById('graveLocation');
            if (boundaryInput) boundaryInput.value = wkt;

            // Choose location: use selectedLocation if inside polygon; otherwise centroid
            let locationLatLng = this.gravePlotCreation.selectedLocation
                ? [this.gravePlotCreation.selectedLocation.lat, this.gravePlotCreation.selectedLocation.lng]
                : null;

            const isInside = (pt, polygon) => {
                if (!pt || !Array.isArray(polygon) || polygon.length < 3) return false;
                const x = pt[1]; // lng
                const y = pt[0]; // lat
                let inside = false;
                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    const xi = polygon[i][1], yi = polygon[i][0];
                    const xj = polygon[j][1], yj = polygon[j][0];
                    const intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            };

            const centroid = (polygon) => {
                let area = 0, cx = 0, cy = 0;
                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    const xi = polygon[i][1], yi = polygon[i][0];
                    const xj = polygon[j][1], yj = polygon[j][0];
                    const a = xi * yj - xj * yi;
                    area += a;
                    cx += (xi + xj) * a;
                    cy += (yi + yj) * a;
                }
                area *= 0.5;
                if (Math.abs(area) < 1e-12) {
                    // fallback to average
                    let sumLat = 0, sumLng = 0;
                    for (const p of polygon) { sumLat += p[0]; sumLng += p[1]; }
                    return [sumLat / polygon.length, sumLng / polygon.length];
                }
                cx = cx / (6 * area);
                cy = cy / (6 * area);
                // return [lat, lng]
                return [cy, cx];
            };

            if (!locationLatLng || !isInside(locationLatLng, ringLatLng)) {
                locationLatLng = centroid(ringLatLng);
            }

            // Set hidden and visible location as WKT POINT(lng lat)
            const pointWkt = `POINT(${locationLatLng[1]} ${locationLatLng[0]})`;
            if (coordsInput) coordsInput.value = pointWkt;
            if (locationInput) locationInput.value = pointWkt;

            const modalEl = document.getElementById('graveModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                // Disable dark backdrop to avoid black surround and ensure map remains visible
                const modalInstance = new bootstrap.Modal(modalEl, { backdrop: false });
                modalInstance.show();
                // Resize map after modal closes to prevent WebGL black canvas artifacts
                modalEl.addEventListener('hidden.bs.modal', () => {
                    if (this.map && typeof this.map.resize === 'function') {
                        this.map.resize();
                    }
                }, { once: true });
            }

            if (this.draw && typeof this.draw.changeMode === 'function') {
                try { this.draw.changeMode('simple_select'); } catch (e) {}
            }

            this.gravePlotCreation.drawFeatureId = feature.id || null;
        } catch (err) {
            console.error('Failed to finalize grave plot polygon:', err);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('danger','Failed to process polygon');
            }
        }
    }

    // Reset and cleanup
    resetGravePlotCreation() {
        this.currentDrawingMode = null;
        if (this.gravePlotCreation.marker) {
            this.gravePlotCreation.marker.remove();
            this.gravePlotCreation.marker = null;
        }
        if (this.draw && this.gravePlotCreation.drawFeatureId) {
            try { this.draw.delete(this.gravePlotCreation.drawFeatureId); } catch (e) {}
        }
        this.gravePlotCreation = {
            active: false,
            awaitingLocation: false,
            selectedLocation: null,
            marker: null,
            drawFeatureId: null
        };
    }

    initializeModalManager() {
        // Initialize modal manager when ModalManager class is available
        if (typeof ModalManager !== 'undefined') {
            this.modalManager = new ModalManager(this);
            console.log('ModalManager initialized successfully');
        } else {
            // Retry after a short delay if ModalManager is not yet loaded
            setTimeout(() => {
                this.initializeModalManager();
            }, 100);
        }
    }

    initializeRoadManager() {
        // Initialize road manager when RoadManager class is available
        if (typeof RoadManager !== 'undefined') {
            this.roadManager = new RoadManager(this);
            console.log('RoadManager initialized successfully');
        } else {
            // Retry after a short delay if RoadManager is not yet loaded
            setTimeout(() => {
                this.initializeRoadManager();
            }, 100);
        }
    }

    initializeLayerManager() {
        // Initialize layer manager when LayerManager class is available
        if (typeof LayerManager !== 'undefined') {
            this.layerManager = new LayerManager(this);
            console.log('LayerManager initialized successfully');
        } else {
            // Retry after a short delay if LayerManager is not yet loaded
            setTimeout(() => {
                this.initializeLayerManager();
            }, 100);
        }
    }

    initializeLocationTracker() {
        // Initialize location tracker when LocationTracker class is available
        if (typeof LocationTracker !== 'undefined') {
            this.locationTracker = new LocationTracker(this);
            console.log('LocationTracker initialized successfully');
        } else {
            // Retry after a short delay if LocationTracker is not yet loaded
            setTimeout(() => {
                this.initializeLocationTracker();
            }, 100);
        }
    }

    // Data Management
    async loadData() {
        console.log('Loading cemetery data...');
        // Prevent multiple simultaneous calls
        if (this.isLoadingData) {
            console.log('Data loading already in progress, skipping...');
            return;
        }
        
        this.isLoadingData = true;
        
        try {
            const response = await axios.get(`../../../../api/cemetery.php?action=getGuestMapData`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                console.log('Data:', response.data);
                this.clearLayers();
                const data = response.data.data;

                // Store cemetery data for later use in dropdowns
                this.cemeteries = data.cemeteries || [];
                this.getBurialDetails();
                
                // Render grave plots first (bottom layer)
                if (data.grave_plots && data.grave_plots.length > 0) {
                    this.renderGravePlots(data.grave_plots);
                }
                
                // Render roads
                if (this.roadManager) {
                    this.roadManager.renderRoads(data.roads || []);
                }
                
                // Render layer annotations last (top layer)
                this.annotations = data.layer_annotations || [];
                if (this.layerManager) {
                    this.layerManager.renderAnnotations(this.annotations);
                }
     

                // Store annotations data for editing

                
                // this.updateTables(data);
                
                // Fit bounds if any data exists
                setTimeout(() => {
                    this.fitMapToData();
                }, 100); // Small delay to ensure all layers are rendered
            } else {
                CustomToast.show("danger","Failed to load cemetery data");
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            if (error.response && error.response.status === 401) {
                CustomToast.show("danger","Authentication Error", "Please login again");
                // Redirect to login page
                window.location.href = '../../auth/login.php';
            } else {
                CustomToast.show('danger','Failed to load cemetery data');
            }
        } finally {
            this.isLoadingData = false;
        }
    }

    // Render grave plots on the map
    renderGravePlots(gravePlots) {
        console.log('Rendering grave plots:', gravePlots.length);
        
        if (!this.map || !this.map.isStyleLoaded()) {
            console.warn('Map not ready for rendering grave plots, retrying in 100ms...');
            setTimeout(() => {
                this.renderGravePlots(gravePlots);
            }, 100);
            return;
        }

        const features = gravePlots.map(grave => {
            if (!grave.boundary) {
                console.warn('Grave missing boundary data:', grave);
                return null;
            }
            
            try {
                // Parse WKT polygon to coordinates
                const coordinates = this.parseWKTPolygon(grave.boundary);
                if (!coordinates || coordinates.length === 0) {
                    console.warn('Failed to parse grave boundary:', grave.boundary);
                    return null;
                }
                
                // Convert [lat, lng] to [lng, lat] for MapLibre GL
                const convertedCoords = coordinates.map(coord => [coord[1], coord[0]]);
                
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [convertedCoords]
                    },
                    properties: {
                        id: grave.id,
                        status: grave.status || 'available',
                        image_path: grave.image_path || null,
                        created_at: grave.created_at,
                        type: 'grave_plot'
                    }
                };
            } catch (error) {
                console.error('Error processing grave plot:', grave.id, error);
                return null;
            }
        }).filter(Boolean);

        this.features.graves = features;

        // Clear existing grave layers first
        this.clearGraveLayers();

        // Add source and layers for grave plots
        if (features.length > 0) {
            this.map.addSource('grave-plots', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // Add fill layer for grave plots
            this.map.addLayer({
                id: 'grave-plots-fill',
                type: 'fill',
                source: 'grave-plots',
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['get', 'status'], 'occupied'], '#ffc773', // Brown for occupied
                        ['==', ['get', 'status'], 'reserved'], '#FFD700', // Gold for reserved
                        '#90EE90' // Light green for available
                    ],
                    'fill-opacity': 0.6
                }
            });

            // Add stroke layer for grave plots
            this.map.addLayer({
                id: 'grave-plots-stroke',
                type: 'line',
                source: 'grave-plots',
                paint: {
                    'line-color': [
                        'case',
                        ['==', ['get', 'status'], 'occupied'], '#654321', // Darker brown for occupied
                        ['==', ['get', 'status'], 'reserved'], '#B8860B', // Dark gold for reserved
                        '#228B22' // Forest green for available
                    ],
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            }, 'grave-plots-fill');

            // Add click event listeners for grave plots
            this.addGravePlotEventListeners();
        }
        
        console.log('Grave plots rendered successfully');
    }

    // Clear grave plot layers
    clearGraveLayers() {
        // Remove layers
        if (this.map.getLayer('grave-plots-fill')) {
            this.map.removeLayer('grave-plots-fill');
        }
        if (this.map.getLayer('grave-plots-stroke')) {
            this.map.removeLayer('grave-plots-stroke');
        }
        
        // Remove source
        if (this.map.getSource('grave-plots')) {
            this.map.removeSource('grave-plots');
        }
    }

    // Add event listeners for grave plots
    addGravePlotEventListeners() {
        if (!this.map.getLayer('grave-plots-fill')) return;
        
        // Change cursor on hover
        this.map.on('mouseenter', 'grave-plots-fill', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'grave-plots-fill', () => {
            this.map.getCanvas().style.cursor = '';
        });

        // Handle click events
        this.map.on('click', 'grave-plots-fill', (e) => {
            const features = this.map.queryRenderedFeatures(e.point, {
                layers: ['grave-plots-fill']
            });
            
            if (features.length > 0) {
                const feature = features[0];
                // this.showGravePlotPopup(e.lngLat, feature.properties);
            }
        });
    }

    // Show popup for grave plot
    // showGravePlotPopup(lngLat, properties) {
    //     const status = properties.status;
    //     const statusColor = status === 'occupied' ? '#8B4513' : 
    //                        status === 'reserved' ? '#FFD700' : '#90EE90';
        
    //     const popupContent = `
    //         <div class="grave-popup">
    //             <h6 class="mb-2">Grave Plot #${properties.id}</h6>
    //             <div class="d-flex align-items-center mb-2">
    //                 <span class="badge me-2" style="background-color: ${statusColor}; color: ${status === 'reserved' ? 'black' : 'white'}">
    //                     ${status.charAt(0).toUpperCase() + status.slice(1)}
    //                 </span>
    //             </div>
    //             ${properties.image_path ? `
    //                 <div class="mt-2">
    //                     <small class="text-muted">Images available</small>
    //                 </div>
    //             ` : ''}
    //         </div>
    //     `;

    //     new maplibregl.Popup()
    //         .setLngLat(lngLat)
    //         .setHTML(popupContent)
    //         .addTo(this.map);
    // }

    clearLayers() {
        // Remove all custom layers and sources
        const layersToRemove = [
            'cemeteries',
            'grave-plots-polygon', 
            'grave-plots-polygon-stroke', 
            'grave-plots-point',
            'roads-top',
            'roads-border',
            'roads',
            'annotations-fill',
            'annotations-stroke',
            'annotations',
            'routes'
        ];
        layersToRemove.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });
        
        // Remove sources (these have different IDs than layers)
        const sourcesToRemove = ['cemeteries', 'roads', 'graves', 'grave-plots', 'annotations', 'routes'];
        sourcesToRemove.forEach(sourceId => {
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        });
        
        // Clear feature collections
        this.features = {
            graves: [],
            annotations: [],
            routes: []
        };
    }

    fitMapToData() {
        // Check if map is loaded before proceeding
        if (!this.map || !this.map.isStyleLoaded()) {
            console.warn('Map not ready for fitting bounds');
            return;
        }

        // Calculate bounds from all features
        let minLng = Infinity, minLat = Infinity;
        let maxLng = -Infinity, maxLat = -Infinity;
        let hasData = false;
        
        Object.values(this.features).forEach(featureCollection => {
            if (featureCollection.length > 0) {
                featureCollection.forEach(feature => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        const coords = this.getFeatureBounds(feature);
                        if (coords) {
                            hasData = true;
                            
                            if (Array.isArray(coords[0])) {
                                // Handle bounds array [min, max]
                                const [min, max] = coords;
                                minLng = Math.min(minLng, min[0]);
                                minLat = Math.min(minLat, min[1]);
                                maxLng = Math.max(maxLng, max[0]);
                                maxLat = Math.max(maxLat, max[1]);
                            } else {
                                // Handle single coordinate [lng, lat]
                                minLng = Math.min(minLng, coords[0]);
                                minLat = Math.min(minLat, coords[1]);
                                maxLng = Math.max(maxLng, coords[0]);
                                maxLat = Math.max(maxLat, coords[1]);
                            }
                        }
                    }
                });
            }
        });
        
        if (hasData && isFinite(minLng) && isFinite(minLat) && isFinite(maxLng) && isFinite(maxLat)) {
            // Create bounds in MapLibre GL format: [[minLng, minLat], [maxLng, maxLat]]
            const bounds = [[minLng, minLat], [maxLng, maxLat]];
            this.map.fitBounds(bounds, { padding: 50 });
        }
    }

    getFeatureBounds(feature) {
        if (feature.geometry.type === 'Point') {
            return feature.geometry.coordinates; // [lng, lat]
        } else if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates;
            if (coords.length === 0) return null;
            
            let minLng = coords[0][0], minLat = coords[0][1];
            let maxLng = coords[0][0], maxLat = coords[0][1];
            
            coords.forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLng = Math.max(maxLng, coord[0]);
                maxLat = Math.max(maxLat, coord[1]);
            });
            
            return [[minLng, minLat], [maxLng, maxLat]];
        } else if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0];
            if (coords.length === 0) return null;
            
            let minLng = coords[0][0], minLat = coords[0][1];
            let maxLng = coords[0][0], maxLat = coords[0][1];
            
            coords.forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLng = Math.max(maxLng, coord[0]);
                maxLat = Math.max(maxLat, coord[1]);
            });
            
            return [[minLng, minLat], [maxLng, maxLat]];
        }
        return null;
    }

    // Helper function to parse WKT POLYGON to Leaflet coordinates
    parseWKTPolygon(wkt) {
        if (!wkt || typeof wkt !== 'string') {
            return null;
        }
        
        try {
            // Remove POLYGON(( and ))
            const coordsString = wkt.replace(/^POLYGON\(\(/, '').replace(/\)\)$/, '');
            
            // Split coordinates and detect format
            const coordinates = coordsString.split(',').map(coordPair => {
                const [first, second] = coordPair.trim().split(/\s+/).map(parseFloat);
                
                // For Philippines coordinates: lat ~10-11, lng ~123-124
                // If first value is > 100, it's likely longitude (lng, lat format)
                // If first value is < 20, it's likely latitude (lat, lng format)
                if (first > 100) {
                    // WKT is in [lng, lat] format, convert to [lat, lng]
                    return [second, first];
                } else {
                    // WKT is already in [lat, lng] format
                    return [first, second];
                }
            });
            
            return coordinates;
        } catch (error) {
            console.error('Error parsing WKT:', error, wkt);
            return null;
        }
    }


    // Routing Functions (from your original system_script.js)

    performNodeSnapping(segments) {
        // Endpoint snapping
        for (let i = 0; i < this.graphNodes.length; i++) {
            for (let j = i + 1; j < this.graphNodes.length; j++) {
                const a = this.graphNodes[i];
                const b = this.graphNodes[j];
                const d = this.haversineMeters(a.lat, a.lng, b.lat, b.lng);
                if (d > 0 && d <= this.SNAP_TOLERANCE_METERS) {
                    this.addEdge(a.id, b.id, d);
                }
            }
        }
        
        // Mid-segment snapping
        for (let pIdx = 0; pIdx < this.graphNodes.length; pIdx++) {
            const p = this.graphNodes[pIdx];
            for (const [aId, bId] of segments) {
                if (p.id === aId || p.id === bId) continue;
                const a = this.graphNodes[aId];
                const b = this.graphNodes[bId];
                const { t, dist, proj } = this.projectPointOntoSegmentMeters(p, a, b);
                if (t > 0 && t < 1 && dist <= this.SNAP_TOLERANCE_METERS) {
                    const jId = this.addNode(proj.lat, proj.lng);
                    const d1 = this.haversineMeters(a.lat, a.lng, proj.lat, proj.lng);
                    const d2 = this.haversineMeters(b.lat, b.lng, proj.lat, proj.lng);
                    const dp = this.haversineMeters(p.lat, p.lng, proj.lat, proj.lng);
                    this.addEdge(aId, jId, d1);
                    this.addEdge(jId, bId, d2);
                    this.addEdge(p.id, jId, dp);
                }
            }
        }
    }

    // Routing helper functions (from original system_script.js)
    nodeKey(lat, lng) {
        const f = 1e5;
        return `${Math.round(lat * f) / f},${Math.round(lng * f) / f}`;
    }

    addNode(lat, lng) {
        const key = this.nodeKey(lat, lng);
        if (this.nodeKeyToId.has(key)) return this.nodeKeyToId.get(key);
        const id = this.graphNodes.length;
        this.graphNodes.push({ id, lat, lng, key });
        this.nodeKeyToId.set(key, id);
        this.graphAdj.set(id, []);
        return id;
    }

    addEdge(aId, bId, w) {
        if (aId === bId) return;
        if (!this.hasEdge(aId, bId)) this.graphAdj.get(aId).push({ to: bId, w });
        if (!this.hasEdge(bId, aId)) this.graphAdj.get(bId).push({ to: aId, w });
    }

    hasEdge(aId, bId) {
        const list = this.graphAdj.get(aId) || [];
        return list.some(e => e.to === bId);
    }

    findNearestGraphNode(latlng) {
        let best = null;
        let bestD = Infinity;
        for (const n of this.graphNodes) {
            const d = this.haversineMeters(latlng.lat, latlng.lng, n.lat, n.lng);
            if (d < bestD) { bestD = d; best = n; }
        }
        return best;
    }

    setStartPoint(node) {
        this.startNodeId = node.id;
        if (this.startMarker) this.startMarker.remove();
        
        // Create custom start marker element
        const startMarkerEl = document.createElement('div');
        startMarkerEl.style.width = '20px';
        startMarkerEl.style.height = '20px';
        startMarkerEl.style.backgroundColor = '#28a745';
        startMarkerEl.style.borderRadius = '50%';
        startMarkerEl.style.border = '2px solid white';
        startMarkerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        this.startMarker = new maplibregl.Marker({
            element: startMarkerEl
        })
        .setLngLat([node.lng, node.lat])
        .addTo(this.map);
        
        this.setRouteInfo(`Start set to (${node.lat.toFixed(5)}, ${node.lng.toFixed(5)})`);
    }

    setEndPoint(node) {
        this.endNodeId = node.id;
        if (this.endMarker) this.endMarker.remove();
        
        // Create custom end marker element
        const endMarkerEl = document.createElement('div');
        endMarkerEl.style.width = '20px';
        endMarkerEl.style.height = '20px';
        endMarkerEl.style.backgroundColor = '#ffc107';
        endMarkerEl.style.borderRadius = '50%';
        endMarkerEl.style.border = '2px solid white';
        endMarkerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        this.endMarker = new maplibregl.Marker({
            element: endMarkerEl
        })
        .setLngLat([node.lng, node.lat])
        .addTo(this.map);
        
        this.setRouteInfo(`End set to (${node.lat.toFixed(5)}, ${node.lng.toFixed(5)})`);
    }

    findRoute() {
        if (this.startNodeId == null || this.endNodeId == null) {
            this.setRouteInfo('Set Start and End first');
            return;
        }
        const res = this.dijkstra(this.startNodeId, this.endNodeId);
        this.renderRoute(res.pathCoords, res.distanceMeters);
        
        // Store for AR navigation
        if (res.pathCoords && res.pathCoords.length >= 2) {
            try {
                localStorage.setItem('cl_route_coords', JSON.stringify(res.pathCoords));
                localStorage.setItem('cl_route_distance_m', String(res.distanceMeters || 0));
            } catch (e) {}
            const arBtn = document.getElementById('btnARNavigate');
            if (arBtn) arBtn.disabled = false;
        }
    }

    dijkstra(sourceId, targetId) {
        const N = this.graphNodes.length;
        const dist = new Array(N).fill(Infinity);
        const prev = new Array(N).fill(-1);
        dist[sourceId] = 0;
        
        const used = new Array(N).fill(false);
        for (let iter = 0; iter < N; iter++) {
            let u = -1;
            let best = Infinity;
            for (let i = 0; i < N; i++) {
                if (!used[i] && dist[i] < best) { 
                    best = dist[i]; 
                    u = i; 
                }
            }
            if (u === -1) break;
            used[u] = true;
            if (u === targetId) break;
            
            const neighbors = this.graphAdj.get(u) || [];
            for (const { to, w } of neighbors) {
                const nd = dist[u] + w;
                if (nd < dist[to]) { 
                    dist[to] = nd; 
                    prev[to] = u; 
                }
            }
        }
        
        // Reconstruct path
        const pathIds = [];
        let cur = targetId;
        if (prev[cur] !== -1 || cur === sourceId) {
            while (cur !== -1) { 
                pathIds.push(cur); 
                cur = prev[cur]; 
            }
            pathIds.reverse();
        }
        const pathCoords = pathIds.map(id => [this.graphNodes[id].lat, this.graphNodes[id].lng]);
        return { pathIds, pathCoords, distanceMeters: dist[targetId] };
    }



    renderRoute(coords, distanceMeters) {
        // Clear existing route
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        
        // Clear existing markers
        if (this.startMarker) this.startMarker.remove();
        if (this.endMarker) this.endMarker.remove();
        
        if (!coords || coords.length < 2) {
            this.setRouteInfo('No route found');
            return;
        }
        
        
        // Add route source and layer
        this.map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoords
                },
                properties: {}
            }
        });
        
        this.map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            paint: {
                'line-color': '#dc3545',
                'line-width': 5,
                'line-opacity': 0.9
            }
        });
        
        // Add start and end markers
        if (this.startNodeId !== null && this.graphNodes[this.startNodeId]) {
            const startNode = this.graphNodes[this.startNodeId];
            this.startMarker = new maplibregl.Marker({
                color: '#28a745'
            })
            .setLngLat([startNode.lng, startNode.lat])
            .addTo(this.map);
        }
        
        if (this.endNodeId !== null && this.graphNodes[this.endNodeId]) {
            const endNode = this.graphNodes[this.endNodeId];
            this.endMarker = new maplibregl.Marker({
                color: '#ffc107'
            })
            .setLngLat([endNode.lng, endNode.lat])
            .addTo(this.map);
        }
        
        this.setRouteInfo(`Route length: ${(distanceMeters/1000).toFixed(2)} km`);
    }

    clearRoute() {
        this.startNodeId = null;
        this.endNodeId = null;
        
        // Remove route layer and source
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        
        // Remove markers
        if (this.startMarker) this.startMarker.remove();
        if (this.endMarker) this.endMarker.remove();
        
        this.setRouteInfo('Route cleared');
        
        try {
            localStorage.removeItem('cl_route_coords');
            localStorage.removeItem('cl_route_distance_m');
        } catch (e) {}
        
        const arBtn = document.getElementById('btnARNavigate');
        if (arBtn) arBtn.disabled = true;
    }

    async useMyLocation() {
        try {
            if (!navigator.geolocation) {
                this.setRouteInfo('Geolocation not supported by this browser');
                CustomToast.show('error','Geolocation not supported');
                return;
            }
            
            // Show loading state
            this.setRouteInfo('Getting your precise location…');
            const btn = document.getElementById('btnUseMyLocation');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Locating...';
            }
            
            // Get high-accuracy location
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 0
                });
            });
            
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            
            // Clear any existing user location marker
            if (this.userLocationMarker) {
                this.userLocationMarker.remove();
            }
            if (this.userAccuracyCircle) {
                this.userAccuracyCircle.remove();
            }
            
            // Create custom user location marker element
            const userLocationEl = document.createElement('div');
            userLocationEl.className = 'user-location-marker';
            userLocationEl.innerHTML = '<div class="user-location-dot"><div class="user-location-pulse"></div></div>';
            userLocationEl.style.width = '20px';
            userLocationEl.style.height = '20px';
            
            // Add user location marker
            this.userLocationMarker = new maplibregl.Marker({
                element: userLocationEl,
                title: `Your Location (±${Math.round(accuracy)}m accuracy)`
            })
            .setLngLat([lng, lat])
            .addTo(this.map);
            
            // Add accuracy circle
            this.userAccuracyCircle = new maplibregl.Marker({
                element: this.createAccuracyCircle(accuracy)
            })
            .setLngLat([lng, lat])
            .addTo(this.map);
            
            // Create popup with location info
            const popupContent = `
                <div class="user-location-popup">
                    <h6><i class="fas fa-location-arrow text-primary"></i> Your Location</h6>
                    <p class="mb-1"><strong>Coordinates:</strong><br>
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                    <p class="mb-1"><strong>Accuracy:</strong> ±${Math.round(accuracy)}m</p>
                    <small class="text-muted">Updated: ${new Date().toLocaleTimeString()}</small>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-success" onclick="cemeteryManager.setLocationAsStart(${lat}, ${lng})">
                            <i class="fas fa-play"></i> Set as Start
                        </button>
                        <button class="btn btn-sm btn-warning ms-1" onclick="cemeteryManager.setLocationAsEnd(${lat}, ${lng})">
                            <i class="fas fa-stop"></i> Set as End
                        </button>
                    </div>
                </div>
            `;
            
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: false
            })
            .setLngLat([lng, lat])
            .setHTML(popupContent)
            .addTo(this.map);
            
            // Zoom to location with appropriate zoom level based on accuracy
            let zoomLevel = 18; // Default high zoom
            if (accuracy > 100) zoomLevel = 16;
            if (accuracy > 500) zoomLevel = 14;
            if (accuracy > 1000) zoomLevel = 12;
            
            this.map.setCenter([lng, lat]);
            this.map.setZoom(zoomLevel);
            
            // Automatically set as start point for routing
            this.userCurrentLocation = { lat, lng };
            this.isUserLocationActive = true;
            
            // If roads exist, automatically set as start point
            if (this.graphNodes.length > 0) {
                const snapped = this.findNearestGraphNode({ lat, lng });
                if (snapped) {
                    this.setStartPoint(snapped);
                    this.setRouteInfo(`Your location set as start point. Click anywhere to set destination and get route.`);
                } else {
                    this.setRouteInfo(`Location found but no nearby roads. Add roads first for routing.`);
                }
            } else {
                this.setRouteInfo(`Location found with ${Math.round(accuracy)}m accuracy. Add roads to enable routing.`);
            }
            
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success',`Your location is now the start point! Click destination to get route.`);
            }
            
            // Open popup after a brief delay
            setTimeout(() => {
                this.userLocationMarker.openPopup();
            }, 1000);
            
            // Start high-frequency real-time location tracking
            this.startRealtimeLocationTracking();
            
        } catch (err) {
            console.error('Geolocation error:', err);
            let errorMessage = 'Failed to get your location';
            
            switch(err.code) {
                case err.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location permissions.';
                    break;
                case err.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. Please try again.';
                    break;
                case err.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
                default:
                    errorMessage = `Location error: ${err.message}`;
            }
            
            this.setRouteInfo(errorMessage);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('error',errorMessage);
            }
        } finally {
            // Reset button state
            const btn = document.getElementById('btnUseMyLocation');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-location-arrow me-1"></i><span class="d-none d-sm-inline">My Location</span><span class="d-inline d-sm-none">GPS</span>';
            }
        }
    }

    createAccuracyCircle(accuracy) {
        const circleEl = document.createElement('div');
        circleEl.style.width = `${accuracy * 2}px`;
        circleEl.style.height = `${accuracy * 2}px`;
        circleEl.style.border = '2px solid #4285f4';
        circleEl.style.borderRadius = '50%';
        circleEl.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
        circleEl.style.position = 'absolute';
        circleEl.style.left = '50%';
        circleEl.style.top = '50%';
        circleEl.style.transform = 'translate(-50%, -50%)';
        circleEl.style.pointerEvents = 'none';
        return circleEl;
    }
    
    // Helper methods for setting location as start/end points
    setLocationAsStart(lat, lng) {
        if (this.graphNodes.length === 0) {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No roads available. Add roads first to use routing.');
            }
            return;
        }
        
        const snapped = this.findNearestGraphNode({ lat, lng });
        if (snapped) {
            this.setStartPoint(snapped);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success','Start point set to nearest road');
            }
        } else {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No nearby road found for routing');
            }
        }
    }
    
    setLocationAsEnd(lat, lng) {
        if (this.graphNodes.length === 0) {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No roads available. Add roads first to use routing.');
            }
            return;
        }
        
        const snapped = this.findNearestGraphNode({ lat, lng });
        if (snapped) {
            this.setEndPoint(snapped);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success','End point set to nearest road');
            }
        } else {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No nearby road found for routing');
            }
        }
    }
    
    // High-frequency real-time location tracking
    startRealtimeLocationTracking() {
        // Stop any existing tracking
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
        }
        
        let lastUpdateTime = 0;
        let locationHistory = [];
        
        // Start high-frequency position watching
        this.locationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                const speed = position.coords.speed || 0;
                
                // Smooth location updates - only update if moved significantly or accuracy improved
                const shouldUpdate = this.shouldUpdateLocation(lat, lng, accuracy, now - lastUpdateTime);
                
                if (shouldUpdate && this.userLocationMarker) {
                    // Smooth animation for marker movement
                    this.animateMarkerToPosition(lat, lng);
                    
                    // Update accuracy circle with smooth transition
                    if (this.userAccuracyCircle) {
                        this.userAccuracyCircle.setLngLat([lng, lat]);
                        // Update accuracy circle size
                        const circleEl = this.userAccuracyCircle.getElement();
                        if (circleEl) {
                            circleEl.style.width = `${accuracy * 2}px`;
                            circleEl.style.height = `${accuracy * 2}px`;
                        }
                    }
                    
                    // Store current location
                    this.userCurrentLocation = { lat, lng, accuracy, speed };
                    
                    // Update start point if user location is active
                    if (this.isUserLocationActive && this.graphNodes.length > 0) {
                        const snapped = this.findNearestGraphNode({ lat, lng });
                        if (snapped && this.startMarker) {
                            // Smoothly update start point
                            this.startMarker.setLngLat([snapped.lng, snapped.lat]);
                            this.startPoint = snapped;
                            
                            // Auto-recalculate route if end point exists
                            if (this.endPoint) {
                                this.findRoute();
                            }
                        }
                    }
                    
                    // Update popup with real-time info
                    this.updateLocationPopup(lat, lng, accuracy, speed);
                    
                    // Keep location history for smoothing
                    locationHistory.push({ lat, lng, accuracy, timestamp: now });
                    if (locationHistory.length > 10) {
                        locationHistory.shift(); // Keep only last 10 positions
                    }
                    
                    lastUpdateTime = now;
                }
            },
            (error) => {
                console.warn('Real-time location tracking error:', error);
                if (error.code === error.TIMEOUT) {
                    // Continue tracking even on timeout
                    console.log('Location timeout, continuing tracking...');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
        
        // Extended tracking time for navigation
        setTimeout(() => {
            if (this.locationWatchId) {
                navigator.geolocation.clearWatch(this.locationWatchId);
                this.locationWatchId = null;
                this.setRouteInfo('Real-time location tracking stopped to save battery');
            }
        }, 1800000); // 30 minutes for navigation
    }
    
    // Determine if location should be updated
    shouldUpdateLocation(lat, lng, accuracy, timeSinceLastUpdate) {
        if (!this.userCurrentLocation) return true;
        
        const distance = this.haversineMeters(
            this.userCurrentLocation.lat, 
            this.userCurrentLocation.lng, 
            lat, 
            lng
        );
        
        // Update conditions tuned for higher responsiveness:
        // 1. Moved more than 1 meter
        // 2. Accuracy improved by more than 3 meters
        // 3. At least 1 second since last update
        return distance > 1 || 
               (accuracy < this.userCurrentLocation.accuracy - 3) || 
               timeSinceLastUpdate > 1000;
    }
    
    // Smooth marker animation
    animateMarkerToPosition(lat, lng) {
        if (!this.userLocationMarker) return;
        
        const currentLngLat = this.userLocationMarker.getLngLat();
        const targetLngLat = [lng, lat];
        
        // Calculate distance for animation duration
        const distance = this.haversineMeters(currentLngLat.lat, currentLngLat.lng, lat, lng);
        const duration = Math.min(Math.max(distance * 6, 50), 300); // snappier 50–300ms
        
        // Animate marker movement
        this.userLocationMarker.setLngLat(targetLngLat);
        
        // Add smooth CSS transition
        const markerElement = this.userLocationMarker.getElement();
        if (markerElement) {
            markerElement.style.transition = `all ${duration}ms ease-out`;
            setTimeout(() => {
                markerElement.style.transition = '';
            }, duration);
        }
    }
    
    
    // Update location popup with real-time data
    updateLocationPopup(lat, lng, accuracy, speed) {
        if (!this.userLocationMarker) return;
        
        const speedKmh = speed ? (speed * 3.6).toFixed(1) : '0.0';
        const popupContent = `
            <div class="user-location-popup">
                <h6><i class="fas fa-location-arrow text-primary"></i> Your Location (Live)</h6>
                <p class="mb-1"><strong>Coordinates:</strong><br>
                ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p class="mb-1"><strong>Accuracy:</strong> ±${Math.round(accuracy)}m</p>
                <p class="mb-1"><strong>Speed:</strong> ${speedKmh} km/h</p>
                <small class="text-muted">Live tracking active • ${new Date().toLocaleTimeString()}</small>
                <div class="mt-2">
                    <button class="btn btn-sm btn-danger" onclick="cemeteryManager.stopRealtimeTracking()">
                        <i class="fas fa-stop"></i> Stop Tracking
                    </button>
                    <button class="btn btn-sm btn-info ms-1" onclick="cemeteryManager.centerOnUserLocation()">
                        <i class="fas fa-crosshairs"></i> Center
                    </button>
                </div>
            </div>
        `;
        
        // Update existing popup or create new one
        const existingPopup = this.userLocationMarker.getPopup();
        if (existingPopup) {
            existingPopup.setHTML(popupContent);
        } else {
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: false
            })
            .setLngLat([lng, lat])
            .setHTML(popupContent);
            
            this.userLocationMarker.setPopup(popup);
        }
    }
    
    // Stop real-time tracking
    stopRealtimeTracking() {
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        this.isUserLocationActive = false;
        this.setRouteInfo('Real-time location tracking stopped');
        if (typeof CustomToast !== 'undefined') {
            CustomToast.show('info','Location tracking stopped');
        }
    }
    
    // Center map on user location
    centerOnUserLocation() {
        if (this.userCurrentLocation && this.userLocationMarker) {
            this.map.setCenter([this.userCurrentLocation.lng, this.userCurrentLocation.lat]);
            this.map.setZoom(18);
        }
    }
    
    // Stop location tracking (legacy method)
    stopLocationTracking() {
        this.stopRealtimeTracking();
    }

    setRouteInfo(text) {
        const routeInfo = document.getElementById('routeInfo');
        if (routeInfo) routeInfo.textContent = text;
    }

    // Utility Functions
    haversineMeters(aLat, aLng, bLat, bLng) {
        const R = 6371000;
        const toRad = (d) => d * Math.PI / 180;
        const dLat = toRad(bLat - aLat);
        const dLng = toRad(bLng - aLng);
        const sa = Math.sin(dLat/2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng/2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(sa));
    }

    projectPointOntoSegmentMeters(p, a, b) {
        const lat0 = a.lat;
        const P = this.latLngToXY(p.lat, p.lng, lat0);
        const A = this.latLngToXY(a.lat, a.lng, lat0);
        const B = this.latLngToXY(b.lat, b.lng, lat0);
        const ABx = B.x - A.x, ABy = B.y - A.y;
        const APx = P.x - A.x, APy = P.y - A.y;
        const ab2 = ABx*ABx + ABy*ABy;
        if (ab2 === 0) return { t: 0, dist: Math.hypot(APx, APy), proj: a };
        let t = (APx*ABx + APy*ABy) / ab2;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        const X = { x: A.x + t*ABx, y: A.y + t*ABy };
        const dist = Math.hypot(P.x - X.x, P.y - X.y);
        const projLL = this.xyToLatLng(X.x, X.y, lat0);
        return { t, dist, proj: { lat: projLL.lat, lng: projLL.lng } };
    }

    latLngToXY(lat, lng, lat0 = lat) {
        const R = 6371000;
        const x = (lng * Math.PI / 180) * R * Math.cos(lat0 * Math.PI / 180);
        const y = (lat * Math.PI / 180) * R;
        return { x, y };
    }

    xyToLatLng(x, y, lat0) {
        const R = 6371000;
        const lat = (y / R) * 180 / Math.PI;
        const lng = (x / (R * Math.cos(lat0 * Math.PI / 180))) * 180 / Math.PI;
        return { lat, lng };
    }

    normalizeCoordinates(input, geometryType) {
        if (!Array.isArray(input)) return geometryType === 'polygon' ? [] : [];
        
        if (geometryType === 'polygon') {
            if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
                return input
                    .map(ring => ring.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean))
                    .filter(ring => ring.length >= 3);
            } else {
                const ring = input.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean);
                return ring.length >= 3 ? [ring] : [];
            }
        } else {
            if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
                const parts = input.map(part => part.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean)).filter(p => p.length >= 2);
                return parts[0] || [];
            } else {
                return input.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean);
            }
        }
    }

    normalizeToLatLngPair(p) {
        if (!p) return null;
        if (Array.isArray(p) && p.length >= 2) {
            const first = Number(p[0]);
            const second = Number(p[1]);
            
            // For Philippines coordinates: lat ~10-11, lng ~123-124
            // If first value is > 100, it's likely longitude (lng, lat format)
            // If first value is < 20, it's likely latitude (lat, lng format)
            if (first > 100) {
                // Likely [lng, lat] format, convert to [lat, lng]
                return this.isValidLatLng(second, first) ? [second, first] : null;
            } else {
                // Assume [lat, lng] format
                return this.isValidLatLng(first, second) ? [first, second] : null;
            }
        }
        if (typeof p === 'object') {
            const lat = Number(p.lat ?? p.latitude);
            const lng = Number(p.lng ?? p.lon ?? p.longitude);
            return this.isValidLatLng(lat, lng) ? [lat, lng] : null;
        }
        return null;
    }

    isValidLatLng(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' && 
               isFinite(lat) && isFinite(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180;
    }

    coordsToWKT(coords, type) {
        if (type === 'POLYGON') {
            // coords should be in [lat, lng] format
            const ring = coords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `POLYGON((${ring}))`;
        } else if (type === 'LINESTRING') {
            // coords should be in [lat, lng] format
            const line = coords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `LINESTRING(${line})`;
        }
        return '';
    }

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"]/g, (s) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;'
        }[s]));
    }

    // Check for grave location data in sessionStorage
    getBurialDetails() {
        try {
            const gravePlotDataStr = sessionStorage.getItem('gravePlotLocation');
            if (!gravePlotDataStr) {
                console.log('No grave plot location data found in sessionStorage');
                return;
            }

            const gravePlotData = JSON.parse(gravePlotDataStr);
            
            // Check if data is not too old (24 hours)
            // const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            // if (Date.now() - gravePlotData.timestamp > maxAge) {
            //     console.log('Grave plot location data is too old, removing from sessionStorage');
            //     sessionStorage.removeItem('gravePlotLocation');
            //     return;
            // }

            const { lat, lng, graveNumber, deceasedName, record, boundary_coords } = gravePlotData;

            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                console.log('Found grave plot location data:', gravePlotData);
                
                // Center map on the grave location
                this.map.setCenter([lng, lat]);
                this.map.setZoom(19); // High zoom level for grave location

                // Render the specific grave plot if boundary data is available
                if (boundary_coords) {
                    this.renderSingleGravePlot(record, boundary_coords);
                }

                // Create a marker for the grave
                this.createGraveLocationMarker(lat, lng, graveNumber, deceasedName);
                
                // Show a popup with grave information
                this.showGraveLocationPopup(lat, lng, graveNumber, deceasedName, record);
                
                // Start navigation to grave if location tracker is available
                if (this.locationTracker) {
                    // Delay to ensure grave plot is rendered first
                    setTimeout(() => {
                        this.locationTracker.startNavigationToGrave(lat, lng, {
                            graveNumber,
                            deceasedName,
                            record,
                            boundary_coords
                        });
                    }, 1000);
                }
                
                // Show a toast notification
                if (typeof showToast !== 'undefined') {
                    showToast(`Located grave ${graveNumber} for ${deceasedName}`, 'success');
                }
                
                // Clear the sessionStorage after use (optional - you can keep it if you want to persist)
                // sessionStorage.removeItem('gravePlotLocation');
            }
        } catch (error) {
            console.error('Error reading grave plot location from sessionStorage:', error);
            // Clear invalid data
            sessionStorage.removeItem('gravePlotLocation');
        }
    }

    // Render a single grave plot from sessionStorage data
    renderSingleGravePlot(record, boundary_coords) {
        if (!this.map || !this.map.isStyleLoaded()) {
            console.warn('Map not ready for rendering single grave plot');
            return;
        }

        const statusColors = {
            'available': '#28a745',
            'occupied': '#dc3545',
            'reserved': '#ffc107'
        };

        try {
            
            // Parse WKT boundary to coordinates
            const coordinates = this.parseWKTPolygon(boundary_coords);
            if (coordinates && coordinates.length > 0) {
                // Convert [lat, lng] to [lng, lat] for MapLibre GL
                const convertedCoords = coordinates.map(coord => [coord[1], coord[0]]);
                
                const feature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [convertedCoords]
                    },
                    properties: {
                        id: record.id,
                        grave_number: record.grave_number,
                        status: record.status || 'occupied',
                        cemetery_name: 'Cemetery',
                        notes: record.notes || '',
                        type: 'grave-plot',
                        color: statusColors[record.status] || '#8426ff'
                    }
                };

                // Remove existing single grave plot source if it exists
                if (this.map.getSource('single-grave-plot')) {
                    this.map.removeSource('single-grave-plot');
                }
                if (this.map.getLayer('single-grave-plot-fill')) {
                    this.map.removeLayer('single-grave-plot-fill');
                }
                if (this.map.getLayer('single-grave-plot-glow')) {
                    this.map.removeLayer('single-grave-plot-glow');
                }
                if (this.map.getLayer('single-grave-plot-stroke')) {
                    this.map.removeLayer('single-grave-plot-stroke');
                }

                // Add the single grave plot
                this.map.addSource('single-grave-plot', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [feature]
                    }
                });

                // Add fill layer
                this.map.addLayer({
                    id: 'single-grave-plot-fill',
                    type: 'fill',
                    source: 'single-grave-plot',
                    paint: {
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.9
                    }
                });

                // Add glow effect layer (wider, more transparent)
                this.map.addLayer({
                    id: 'single-grave-plot-glow',
                    type: 'line',
                    source: 'single-grave-plot',
                    paint: {
                        'line-color': ['get', 'color'],
                        'line-width': 10,
                        'line-opacity': 0.3
                    }
                });

                // Add main stroke layer with enhanced visibility
                this.map.addLayer({
                    id: 'single-grave-plot-stroke',
                    type: 'line',
                    source: 'single-grave-plot',
                    paint: {
                        'line-color': ['get', 'color'],
                        'line-width': 6,
                        'line-opacity': 1
                    }
                });
                // Move grave plot layers to the top using map.moveLayer
                this.ensureGravePlotOnTop();

                console.log('Single grave plot rendered successfully');
            }
        } catch (error) {
            console.error('Error rendering single grave plot:', error);
        }
    }

    // Ensure grave plot layers are on top of all other layers
    ensureGravePlotOnTop() {
        try {
            // Move grave plot fill layer to the very top
            if (this.map.getLayer('single-grave-plot-fill')) {
                this.map.moveLayer('single-grave-plot-fill');
            }

            // Move glow layer above fill
            if (this.map.getLayer('single-grave-plot-glow')) {
                this.map.moveLayer('single-grave-plot-glow');
            }

            // Move main stroke layer to the absolute top
            if (this.map.getLayer('single-grave-plot-stroke')) {
                this.map.moveLayer('single-grave-plot-stroke');
            }

            console.log('Grave plot layers moved to absolute top');
        } catch (error) {
            console.warn('Could not reorder grave plot layers:', error);
        }
    }

    // Create a marker for the grave location
    createGraveLocationMarker(lat, lng, graveNumber, deceasedName) {
        // Remove existing grave location marker if any
        if (this.graveLocationMarker) {
            this.graveLocationMarker.remove();
        }

        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.style.width = '30px';
        markerEl.style.height = '30px';
        markerEl.style.backgroundColor = '#dc3545';
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '3px solid #fff';
        markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.innerHTML = '<i class="fas fa-cross" style="color: white; font-size: 12px;"></i>';

        // Add the marker to the map
        this.graveLocationMarker = new maplibregl.Marker({
            element: markerEl,
            title: `Grave ${graveNumber || 'Location'}`
        })
        .setLngLat([lng, lat])
        .addTo(this.map);
    }

    // Show popup with grave information
    showGraveLocationPopup(lat, lng, graveNumber, deceasedName, record = null) {
        // Build additional information from record if available
        let additionalInfo = '';
        if (record) {
            if (record.date_of_birth) {
                additionalInfo += `<p class="mb-1"><strong>Date of Birth:</strong> ${window.Utils.formatDate(record.date_of_birth)}</p>`;
            }
            if (record.date_of_death) {
                additionalInfo += `<p class="mb-1"><strong>Date of Death:</strong> ${window.Utils.formatDate(record.date_of_death)}</p>`;
            }
            if (record.burial_date) {
                additionalInfo += `<p class="mb-1"><strong>Burial Date:</strong> ${window.Utils.formatDate(record.burial_date)}</p>`;
            }
            if (record.next_of_kin) {
                additionalInfo += `<p class="mb-1"><strong>Next of Kin:</strong> ${record.next_of_kin}</p>`;
            }
        }

        const popupContent = `
            <div class="grave-location-popup" style="min-width: 250px;">
                <h6 style="color: #dc3545; margin-bottom: 10px;">
                    <i class="fas fa-cross"></i> Grave Location
                </h6>
                <p class="mb-1"><strong>Grave Number:</strong> ${graveNumber || 'Unknown'}</p>
                <p class="mb-1"><strong>Deceased:</strong> ${deceasedName || 'Unknown'}</p>
                ${additionalInfo}
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary" onclick="cemeteryManager.centerOnGraveLocation()">
                        <i class="fas fa-crosshairs"></i> Center View
                    </button>
                </div>
            </div>
        `;

        const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: 25,
            className: 'grave-location-popup-container'
        })
        .setLngLat([lng, lat])
        .setHTML(popupContent)
        .addTo(this.map);

        // Open popup after a brief delay
        setTimeout(() => {
            popup.addTo(this.map);
        }, 1000);

        // Auto-close popup after 3 seconds
        setTimeout(() => {
            if (popup.isOpen()) {
                popup.remove();
            }
        }, 4000); // 1 second delay + 3 seconds display = 4 seconds total
    }

    // Center map on grave location
    centerOnGraveLocation() {
        if (this.graveLocationMarker) {
            const lngLat = this.graveLocationMarker.getLngLat();
            this.map.setCenter([lngLat.lng, lngLat.lat]);
            this.map.setZoom(19);
        }
    }

    // Clear grave location marker and sessionStorage
    // clearGraveLocation() {
    //     // Remove marker
    //     if (this.graveLocationMarker) {
    //         this.graveLocationMarker.remove();
    //         this.graveLocationMarker = null;
    //     }

    //     // Remove single grave plot layers
    //     if (this.map.getLayer('single-grave-plot-fill')) {
    //         this.map.removeLayer('single-grave-plot-fill');
    //     }
    //     if (this.map.getLayer('single-grave-plot-stroke')) {
    //         this.map.removeLayer('single-grave-plot-stroke');
    //     }
    //     if (this.map.getSource('single-grave-plot')) {
    //         this.map.removeSource('single-grave-plot');
    //     }

    //     // Clear sessionStorage
    //     sessionStorage.removeItem('gravePlotLocation');

    //     // Reset map to default view
    //     this.map.setCenter([123.3372456, 10.950055]); // Default cemetery center
    //     this.map.setZoom(16); // Default zoom level

    //     console.log('Grave location cleared');
    // }

    /**
     * Get appropriate pitch based on device orientation
     * @returns {number} Pitch value (0-85 degrees)
     */
    getPitchForOrientation() {
        // Check if device is in landscape mode
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Landscape mode - use higher pitch for better 3D view
            return 60;
        } else {
            // Portrait mode - use lower pitch for better top-down view
            return 30;
        }
    }

    /**
     * Setup orientation change listener
     */
    setupOrientationListener() {
        // Listen for orientation change events
        window.addEventListener('orientationchange', () => {
            // Wait a bit for the orientation change to complete
            setTimeout(() => {
                this.adjustPitchForOrientation();
            }, 100);
        });

        // Also listen for resize events (handles some orientation changes)
        window.addEventListener('resize', () => {
            // Debounce resize events
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.adjustPitchForOrientation();
            }, 250);
        });
    }

    /**
     * Adjust map pitch based on current orientation
     */
    adjustPitchForOrientation() {
        if (!this.map) return;

        const newPitch = this.getPitchForOrientation();
        const currentPitch = this.map.getPitch();
        
        // Only adjust if there's a significant difference
        if (Math.abs(currentPitch - newPitch) > 5) {
            // Smooth transition to new pitch
            this.map.easeTo({
                pitch: newPitch,
                duration: 1000, // 1 second transition
                easing: t => t * (2 - t) // ease-out function
            });
            
            console.log(`Orientation changed - adjusting pitch from ${currentPitch}° to ${newPitch}°`);
        }
    }
}

// Global functions for modal management are now handled by ModalManager class

// Initialize the cemetery manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if required libraries are already loaded
    if (typeof maplibregl !== 'undefined') {
        // Libraries already loaded, initialize immediately
        window.cemeteryManager = new CemeteryManager();
        return;
    }
    
    // Load required scripts first
    const scripts = [
        'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js'
    ];
    
    const styles = [
        'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css'
    ];
    
    // Load CSS first
    styles.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    });
    
    let loadedScripts = 0;
    
    function loadNextScript(index) {
        if (index >= scripts.length) {
            // All scripts loaded, wait a bit and initialize
            setTimeout(() => {
                if (typeof maplibregl !== 'undefined') {
                    window.cemeteryManager = new CemeteryManager();
                } else {
                    console.error('Required libraries not loaded properly');
                }
            }, 100);
            return;
        }
        
        const script = document.createElement('script');
        script.src = scripts[index];
        script.onload = () => {
            loadedScripts++;
            console.log(`Loaded script ${index + 1}/${scripts.length}: ${scripts[index]}`);
            loadNextScript(index + 1);
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${scripts[index]}`);
        };
        document.head.appendChild(script);
    }
    
    // Start loading scripts sequentially
    loadNextScript(0);
});
