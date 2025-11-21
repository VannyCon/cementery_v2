// Layer/Annotation Management System for Cemetery Management
class GraveManager {
    constructor(cemeteryManager) {
        this.cemeteryManager = cemeteryManager;
        this.map = cemeteryManager.map;
        this.cemeteryAPI = cemeteryManager.cemeteryAPI;
        this.authManager = cemeteryManager.authManager;

        this.initializeGraveHandlers();
    }

    // Initialize layer-specific event handlers
    initializeGraveHandlers() {
        // Annotation drawing button
        const btnAddGrave = document.getElementById('btnAddGrave');
        if (btnAddGrave) {
            btnAddGrave.addEventListener('click', () => {
                console.log('Add Grave button clicked');
                this.cemeteryManager.currentDrawingMode = 'grave';
                this.cemeteryManager.startDrawMode('polygon');
            });
        }
    }

    // Render annotations on the map
    renderGraves(graves) {
        // Check if map is loaded before proceeding
        if (!this.map) {
            console.warn('Map not initialized for rendering graves');
            return;
        }

        if (!this.map.isStyleLoaded()) {
            console.warn('Map style not ready for rendering graves, retrying in 100ms...');
            // Retry after a short delay
            setTimeout(() => {
                this.renderGraves(graves);
            }, 100);
            return;
        }

        const features = graves.map(grave => {
            if (!grave.geometry) {
                console.warn('Grave missing geometry:', grave);
                return null;
            }
            
            try {
                // Parse WKT geometry to coordinates
                const coordinates = this.cemeteryManager.parseWKTPolygon(grave.geometry);
                if (!coordinates || coordinates.length === 0) {
                    console.warn('Failed to parse grave geometry:', grave.geometry);
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
                        label: grave.label || 'Grave',
                        cemetery_name: grave.cemetery_name || 'Unknown',
                        notes: grave.notes || '',
                        color: grave.color || '#FF0000',
                        type: 'grave'
                    }
                };
            } catch (error) {
                console.error('Error processing grave:', grave.id, error);
                return null;
            }
        }).filter(Boolean);

        this.cemeteryManager.features.graves = features;

        // Clear existing layers and source first
        this.clearGraveLayers();

        // Add source and layer for graves
        if (features.length > 0) {
            this.map.addSource('graves', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // Add fill layer (above roads if they exist)
            const layerOptions = {
                id: 'graves-fill',
                type: 'fill',
                source: 'graves',
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.5
                }
            };
            
            // Try to insert above roads layer, fallback to top if roads don't exist
            if (this.map.getLayer('roads')) {
                this.map.addLayer(layerOptions, 'roads');
            } else {
                this.map.addLayer(layerOptions);
            }

            // Add stroke layer (above fill layer)
            this.map.addLayer({
                id: 'graves-stroke',
                type: 'line',
                source: 'graves',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            }, 'graves-fill');

            // Add event listeners based on current tab
            this.updateGraveInteractivity();
        }
        
        // Ensure proper layer ordering
        this.ensureGraveOrder();
    }
    // Handle grave creation from drawing
    handleGraveCreate(feature) {
        console.log('Creating grave:', feature);
        // Calculate area if turf is available
        if (window.turf) {
            const area = window.turf.area(feature);
            console.log('Grave area:', area, 'square meters');
        }
        
        // Store pending polygon coordinates for the modal
        if (feature.geometry && feature.geometry.type === 'Polygon') {
            // Convert from [lng, lat] to [lat, lng] for database storage
            this.cemeteryManager.pendingPolygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        }
        
        // Show grave modal for details
        if (this.cemeteryManager.modalManager) {
            this.cemeteryManager.modalManager.showGraveModal(feature);
        } else {
            console.warn('ModalManager not initialized yet');
        }
    }

    // Handle grave updates
    handleGraveUpdate(feature) {
        console.log('Updating grave:', feature);
        // Update area calculation
        if (window.turf) {
            const area = window.turf.area(feature);
            console.log('Updated grave area:', area, 'square meters');
        }
        // Update grave in database
        this.updateGrave(feature);
    }

    // Handle grave deletion
    handleGraveDelete(feature) {
        console.log('Deleting grave:', feature);
        // Delete grave from database
        this.deleteGrave(feature.properties.id);
    }

    // Save grave to database
    async saveGrave(formData) {
        try {
            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });
            const result = await response.json();
            
            if (result.success) {
                CustomToast.show('success','Grave saved successfully');
                
                // Clear pending data
                this.cemeteryManager.pendingPolygonCoords = null;
                
                // Reload data to show the new grave
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to save grave');
            }
        } catch (error) {
            console.error('Error saving grave:', error);
            CustomToast.show('danger','Error saving grave');
        }
    }

    // Update existing grave
    async updateGrave(feature) {
        try {
            const formData = new FormData();
            formData.append('action', 'updateLayerGrave');
            formData.append('id', feature.properties.id);
            formData.append('label', feature.properties.label || '');
            formData.append('notes', feature.properties.notes || '');
            formData.append('color', feature.properties.color || '#FF0000');

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });

            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Grave updated successfully');
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to update grave');
            }
        } catch (error) {
            console.error('Error updating grave:', error);
            CustomToast.show('danger','Error updating grave');
        }
    }

    // Delete grave
    async deleteGrave(graveId) {
        try {
            const formData = new FormData();
            formData.append('action', 'deleteLayerGrave');
            formData.append('id', graveId);

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });

            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Grave deleted successfully');
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to delete grave');
            }
        } catch (error) {
            console.error('Error deleting grave:', error);
            CustomToast.show('danger','Error deleting grave');
        }
    }

    // Edit grave (open modal with existing data)
    editGrave(graveId) {
        // Find the grave in the features
        const graveFeature = this.cemeteryManager.features.graves.find(grave => grave.properties.id == graveId);
        
        if (graveFeature) {
            // Open modal with existing grave data
            if (this.cemeteryManager.modalManager) {
                this.cemeteryManager.modalManager.showGraveModal(graveFeature);
            }
        } else {
            CustomToast.show('danger','Grave not found');
        }
    }

    // Toggle all graves visibility
    toggleAllGraves() {
        const graves = this.cemeteryManager.features.graves || [];
        if (graves.length === 0) {
            CustomToast.show('info','No graves to toggle');
            return;
        }

        const isVisible = this.map.getLayoutProperty('graves-fill', 'visibility') === 'visible';
        const newVisibility = isVisible ? 'none' : 'visible';
        
        this.map.setLayoutProperty('graves-fill', 'visibility', newVisibility);
        this.map.setLayoutProperty('graves-stroke', 'visibility', newVisibility);
        
        CustomToast.show('info',`Graves ${isVisible ? 'hidden' : 'shown'}`);
    }

    // Update grave interactivity based on current tab
    updateGraveInteractivity() {
        // Always ensure event listeners are present, but they check tab state internally
        if (this.map.getLayer('graves-fill') && !this.graveEventListenersAdded) {
            this.addGraveEventListeners();
            this.graveEventListenersAdded = true;
        }
    }

    // Add grave event listeners
    addGraveEventListeners() {
        if (!this.map.getLayer('graves-fill')) return;
        
        // Change cursor on hover only if in graves tab
        this.map.on('mouseenter', 'graves-fill', () => {
            if (window.tabs === 'graves') {
                this.map.getCanvas().style.cursor = 'pointer';
            }
        });

        this.map.on('mouseleave', 'graves-fill', () => {
            if (window.tabs === 'graves') {
                this.map.getCanvas().style.cursor = '';
            }
        });
    }

    // Remove grave event listeners
    removeGraveEventListeners() {
        try {
            this.map.off('click', 'graves-fill');
            this.map.off('mouseenter', 'graves-fill');
            this.map.off('mouseleave', 'graves-fill');
        } catch (e) {
            // Event listeners might not exist, ignore errors
        }
    }

    // Clear grave layers from map
    clearGraveLayers() {
        // Remove event listeners first
        this.removeGraveEventListeners();
        this.graveEventListenersAdded = false;

        // Remove layers
        if (this.map.getLayer('graves-fill')) {
            this.map.removeLayer('graves-fill');
        }
        if (this.map.getLayer('graves-stroke')) {
            this.map.removeLayer('graves-stroke');
        }
        
        // Remove source
        if (this.map.getSource('graves')) {
            this.map.removeSource('graves');
        }
    }

    // Update grave styling
    updateGraveStyling(style) {
        if (this.map.getLayer('graves-fill')) {
            if (style.fillColor) {
                this.map.setPaintProperty('graves-fill', 'fill-color', style.fillColor);
            }
            if (style.fillOpacity) {
                this.map.setPaintProperty('graves-fill', 'fill-opacity', style.fillOpacity);
            }
        }
        
        if (this.map.getLayer('graves-stroke')) {
            if (style.strokeColor) {
                this.map.setPaintProperty('graves-stroke', 'line-color', style.strokeColor);
            }
            if (style.strokeWidth) {
                this.map.setPaintProperty('graves-stroke', 'line-width', style.strokeWidth);
            }
            if (style.strokeOpacity) {
                this.map.setPaintProperty('graves-stroke', 'line-opacity', style.strokeOpacity);
            }
        }
    }

    // Get grave statistics
    getGraveStatistics() {
        const graves = this.cemeteryManager.features.graves || [];
        const totalArea = graves.reduce((total, grave) => {
            if (grave.geometry && grave.geometry.coordinates) {
                try {
                    const area = window.turf ? window.turf.area(grave) : 0;
                    return total + area;
                } catch (e) {
                    return total;
                }
            }
            return total;
        }, 0);

        return {
            totalGraves: graves.length,
            totalArea: Math.round(totalArea),
            averageArea: graves.length > 0 ? Math.round(totalArea / graves.length) : 0
        };
    }

    // Export graves data
    exportGraves(format = 'geojson') {
        const graves = this.cemeteryManager.features.graves || [];
        
        if (format === 'geojson') {
            return {
                type: 'FeatureCollection',
                features: graves
            };
        } else if (format === 'csv') {
            const csvData = graves.map(grave => ({
                id: grave.properties.id,
                label: grave.properties.label,
                cemetery: grave.properties.cemetery_name,
                notes: grave.properties.notes,
                color: grave.properties.color
            }));
            
            return csvData;
        }
        
        return graves;
    }

    // Show area calculation for selected grave
    showAreaCalculation(feature) {
        if (!window.turf) return;
        
        const area = window.turf.area(feature);
        const roundedArea = Math.round(area * 100) / 100;
        
        // Create or update area display
        let areaDisplay = document.getElementById('area-display');
        if (!areaDisplay) {
            areaDisplay = document.createElement('div');
            areaDisplay.id = 'area-display';
            areaDisplay.className = 'area-display';
            areaDisplay.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(areaDisplay);
        }
        
        areaDisplay.textContent = `Area: ${roundedArea} m²`;
    }

    // Hide area calculation
    hideAreaCalculation() {
        const areaDisplay = document.getElementById('area-display');
        if (areaDisplay) {
            areaDisplay.remove();
        }
    }

    // Ensure graves are above roads
    ensureGraveOrder() {
        // Move grave layers above roads if both exist
        if (this.map.getLayer('roads') && this.map.getLayer('graves-fill')) {
            try {
                // Move graves-fill above roads
                this.map.moveLayer('graves-fill', 'roads');
                // Move graves-stroke above graves-fill
                this.map.moveLayer('graves-stroke', 'graves-fill');
            } catch (e) {
                console.warn('Could not reorder layers:', e);
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
    module.exports = LayerManager;
}

// Global export
if (typeof window !== 'undefined') {
    window.LayerManager = LayerManager;
}