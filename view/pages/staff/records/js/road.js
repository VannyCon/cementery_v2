// Road Management System for Cemetery Management
class RoadManager {
    constructor(cemeteryManager) {
        this.cemeteryManager = cemeteryManager;
        this.map = cemeteryManager.map;
        this.cemeteryAPI = cemeteryManager.cemeteryAPI;
        this.authManager = cemeteryManager.authManager;
        
        this.initializeRoadHandlers();
    }

    // Initialize road-specific event handlers
    initializeRoadHandlers() {
        // Road drawing button
        const btnAddRoad = document.getElementById('btnAddRoad');
        if (btnAddRoad) {
            btnAddRoad.addEventListener('click', () => {
                console.log('Add Road button clicked');
                this.cemeteryManager.currentDrawingMode = 'road';
                this.cemeteryManager.startDrawMode('line_string');
            });
        }
    }

    // Render roads on the map
    renderRoads(roads) {
        // Check if map is loaded before proceeding
        // if (!this.map) {
        //     console.warn('Map not initialized for rendering roads');
        //     return;
        // }

        // if (!this.map.isStyleLoaded()) {
        //     console.warn('Map style not ready for rendering roads, retrying in 100ms...');
        //     setTimeout(() => {
        //         this.renderRoads(roads);
        //     }, 100);
        //     return;
        // }

        const features = roads.map(road => {
            try {
                const coords = JSON.parse(road.coordinates || '[]');
                const linePoints = this.cemeteryManager.normalizeCoordinates(coords, 'polyline');

                if (linePoints.length >= 2) {
                    // Convert [lat, lng] to [lng, lat] for MapLibre GL
                    const coordinates = linePoints.map(point => [point[1], point[0]]);
                    
                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        },
                        properties: {
                            id: road.id,
                            road_name: road.road_name,
                            cemetery_name: road.cemetery_name || 'None',
                            type: 'road',
                            road_type: road.type || 'main'
                        }
                    };
                }
            } catch (e) {
                console.warn('Invalid road coordinates:', road.id);
            }
            return null;
        }).filter(Boolean);

        this.cemeteryManager.features.roads = features;

        // Clear existing layers and source first
        this.clearRoadLayers();

        // Add source and layer for roads
        if (features.length > 0) {
            this.map.addSource('roads', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // this.map.addLayer({
            //     id: 'roads',
            //     type: 'line',
            //     source: 'roads',
            //     paint: {
            //         'line-color': '#ffffff',
            //         'line-width': [
            //             'match',
            //             ['get', 'road_type'],
            //             'mini', 10,
            //             'main', 15,
            //             20
            //         ],
            //         'line-opacity': 1
            //     }
            // });
            this.map.addLayer({
                id: 'roads-border',
                type: 'line',
                source: 'roads',
                paint: {
                    'line-color': '#808080', // gray border
                    'line-width': [
                        'match',
                        ['get', 'road_type'],
                        'mini', 7,  // thicker for border
                        'main', 19,
                        24
                    ],
                    'line-opacity': 0.5
                }
            });

            // 2. Inner (white) road layer
            this.map.addLayer({
                id: 'roads',
                type: 'line',
                source: 'roads',
                paint: {
                    'line-color': '#ffffff', // white
                    'line-width': [
                        'match',
                        ['get', 'road_type'],
                        'mini', 5,
                        'main', 15,
                        20
                    ],
                    'line-opacity': 1
                }
            });
            // Add event listeners based on current tab
            this.updateRoadInteractivity();
        }
        
        // Ensure proper layer ordering
        this.ensureLayerOrder();
    }

    // Handle road creation from drawing
    handleRoadCreate(feature) {
        console.log('Creating road:', feature);
        // Show road modal for details
        if (this.cemeteryManager.modalManager) {
            this.cemeteryManager.modalManager.showRoadModal(feature);
        } else {
            console.warn('ModalManager not initialized yet');
        }
    }

    // Handle road updates
    handleRoadUpdate(feature) {
        console.log('Updating road:', feature);
        // Update road in database
        this.updateRoad(feature);
    }

    // Handle road deletion
    handleRoadDelete(feature) {
        console.log('Deleting road:', feature);
        // Delete road from database
        this.deleteRoad(feature.properties.id);
    }

    // Save road to database
    async saveRoad(formData) {
        try {
            // If we have geometry from Mapbox GL Draw, use it and remove the old coordinates
            if (this.cemeteryManager.currentRoadGeometry) {
                // Remove the old coordinates field to avoid constraint violation
                formData.delete('coordinates');
                // Set the WKT geometry
                formData.set('geometry', this.cemeteryManager.currentRoadGeometry);
                
                console.log('Sending road with WKT geometry:', this.cemeteryManager.currentRoadGeometry);
            } else if (this.cemeteryManager.pendingRoadCoords) {
                // Fallback to JSON coordinates if no WKT geometry
                formData.set('coordinates', JSON.stringify(this.cemeteryManager.pendingRoadCoords));
                console.log('Sending road with JSON coordinates:', this.cemeteryManager.pendingRoadCoords);
            }

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });

            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Road saved successfully');
                
                // Clear pending data
                this.cemeteryManager.currentRoadGeometry = null;
                this.cemeteryManager.pendingRoadCoords = null;
                
                // Reload data to show the new road
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to save road');
            }
        } catch (error) {
            console.error('Error saving road:', error);
            CustomToast.show('danger','Error saving road');
        }
    }

    // Update existing road
    async updateRoad(feature) {
        try {
            const formData = new FormData();
            formData.append('action', 'updateRoad');
            formData.append('id', feature.properties.id);
            formData.append('road_name', feature.properties.road_name || '');
            formData.append('coordinates', JSON.stringify(feature.geometry.coordinates));

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });
            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Road updated successfully');
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to update road');
            }
        } catch (error) {
            console.error('Error updating road:', error);
            CustomToast.show('danger','Error updating road');
        }
    }

    // Delete road
    async deleteRoad(roadId) {
        try {
            const formData = new FormData();
            formData.append('action', 'deleteRoad');
            formData.append('id', roadId);

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            }); 

            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Road deleted successfully');
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to delete road');
            }
        } catch (error) {
            console.error('Error deleting road:', error);
            CustomToast.show('danger','Error deleting road');
        }
    }

    // Edit road (open modal with existing data)
    editRoad(roadId) {
        // Find the road in the features
        const roadFeature = this.cemeteryManager.features.roads.find(road => road.properties.id == roadId);
        
        if (roadFeature) {
            // Open modal with existing road data
            if (this.cemeteryManager.modalManager) {
                this.cemeteryManager.modalManager.showRoadModal(roadFeature);
            }
        } else {
            CustomToast.show('danger','Road not found');
        }
    }

    // Build graph from roads for routing
    buildGraphFromRoads(roads) {
        this.cemeteryManager.graphNodes = [];
        this.cemeteryManager.graphAdj = new Map();
        this.cemeteryManager.nodeKeyToId = new Map();

        const segments = [];

        roads.forEach(road => {
            const raw = JSON.parse(road.coordinates || '[]');
            const pts = this.cemeteryManager.normalizeCoordinates(raw, 'polyline');
            for (let i = 0; i < pts.length - 1; i++) {
                const [aLat, aLng] = pts[i];
                const [bLat, bLng] = pts[i + 1];
                const aId = this.cemeteryManager.addNode(aLat, aLng);
                const bId = this.cemeteryManager.addNode(bLat, bLng);
                const w = this.cemeteryManager.haversineMeters(aLat, aLng, bLat, bLng);
                this.cemeteryManager.addEdge(aId, bId, w);
                segments.push([aId, bId]);
            }
        });
        
        // Endpoint and mid-segment snapping logic
        this.cemeteryManager.performNodeSnapping(segments);
    }

    // Update road interactivity based on current tab
    updateRoadInteractivity() {
        // Always ensure event listeners are present, but they check tab state internally
        if (this.map.getLayer('roads') && !this.roadEventListenersAdded) {
            this.addRoadEventListeners();
            this.roadEventListenersAdded = true;
        }
    }

    // Add road event listeners
    addRoadEventListeners() {
        if (!this.map.getLayer('roads')) return;

        // Change cursor on hover only if in roads tab
        this.map.on('mouseenter', 'roads', () => {
            if (window.tabs === 'roads') {
                this.map.getCanvas().style.cursor = 'pointer';
            }
        });

        this.map.on('mouseleave', 'roads', () => {
            if (window.tabs === 'roads') {
                this.map.getCanvas().style.cursor = '';
            }
        });
    }

    // Remove road event listeners
    removeRoadEventListeners() {
        try {
            this.map.off('click', 'roads');
            this.map.off('mouseenter', 'roads');
            this.map.off('mouseleave', 'roads');
        } catch (e) {
            // Event listeners might not exist, ignore errors
        }
    }

    // Clear road layers from map
    clearRoadLayers() {
        // Remove event listeners first
        this.removeRoadEventListeners();
        this.roadEventListenersAdded = false;

        // Remove layer
        if (this.map.getLayer('roads')) {
            this.map.removeLayer('roads');
        }
        
        // Remove source
        if (this.map.getSource('roads')) {
            this.map.removeSource('roads');
        }
    }

    // Toggle road visibility
    toggleRoadVisibility(visible) {
        if (this.map.getLayer('roads')) {
            this.map.setLayoutProperty('roads', 'visibility', visible ? 'visible' : 'none');
        }
    }

    // Update road styling
    updateRoadStyling(style) {
        if (this.map.getLayer('roads')) {
            if (style.color) {
                this.map.setPaintProperty('roads', 'line-color', style.color);
            }
            if (style.width) {
                this.map.setPaintProperty('roads', 'line-width', style.width);
            }
            if (style.opacity) {
                this.map.setPaintProperty('roads', 'line-opacity', style.opacity);
            }
        }
    }

    // Get road statistics
    getRoadStatistics() {
        const roads = this.cemeteryManager.features.roads || [];
        const totalLength = roads.reduce((total, road) => {
            if (road.geometry && road.geometry.coordinates) {
                const coords = road.geometry.coordinates;
                let length = 0;
                for (let i = 0; i < coords.length - 1; i++) {
                    const [lng1, lat1] = coords[i];
                    const [lng2, lat2] = coords[i + 1];
                    length += this.cemeteryManager.haversineMeters(lat1, lng1, lat2, lng2);
                }
                return total + length;
            }
            return total;
        }, 0);

        return {
            totalRoads: roads.length,
            totalLength: Math.round(totalLength),
            averageLength: roads.length > 0 ? Math.round(totalLength / roads.length) : 0
        };
    }

    // Export roads data
    exportRoads(format = 'geojson') {
        const roads = this.cemeteryManager.features.roads || [];
        
        if (format === 'geojson') {
            return {
                type: 'FeatureCollection',
                features: roads
            };
        } else if (format === 'csv') {
            const csvData = roads.map(road => ({
                id: road.properties.id,
                name: road.properties.road_name,
                cemetery: road.properties.cemetery_name,
                coordinates: JSON.stringify(road.geometry.coordinates)
            }));
            
            return csvData;
        }
        
        return roads;
    }

    // Ensure roads are below annotations
    ensureLayerOrder() {
        // Move road layer below annotations if both exist
        if (this.map.getLayer('annotations-fill') && this.map.getLayer('roads')) {
            try {
                // Move roads below annotations
                this.map.moveLayer('roads', 'annotations-fill');
            } catch (e) {
                console.warn('Could not reorder road layers:', e);
            }
        }
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoadManager;
}

// Global export
if (typeof window !== 'undefined') {
    window.RoadManager = RoadManager;
}
