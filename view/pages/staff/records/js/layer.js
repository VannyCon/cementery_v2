// Layer/Annotation Management System for Cemetery Management
class LayerManager {
    constructor(cemeteryManager) {
        this.cemeteryManager = cemeteryManager;
        this.map = cemeteryManager.map;
        this.cemeteryAPI = cemeteryManager.cemeteryAPI;
        this.authManager = cemeteryManager.authManager;

        this.initializeLayerHandlers();
    }

    // Initialize layer-specific event handlers
    initializeLayerHandlers() {
        // Annotation drawing button
        const btnAddAnnotation = document.getElementById('btnAddAnnotation');
        if (btnAddAnnotation) {
            btnAddAnnotation.addEventListener('click', () => {
                console.log('Add Annotation button clicked');
                this.cemeteryManager.currentDrawingMode = 'annotation';
                this.cemeteryManager.startDrawMode('polygon');
            });
        }
    }

    // Render annotations on the map
    renderAnnotations(annotations) {
        // Check if map is loaded before proceeding
        if (!this.map) {
            console.warn('Map not initialized for rendering annotations');
            return;
        }

        if (!this.map.isStyleLoaded()) {
            console.warn('Map style not ready for rendering annotations, retrying in 100ms...');
            // Retry after a short delay
            setTimeout(() => {
                this.renderAnnotations(annotations);
            }, 100);
            return;
        }

        const features = annotations.map(annotation => {
            if (!annotation.geometry) {
                console.warn('Annotation missing geometry:', annotation);
                return null;
            }
            
            try {
                // Parse WKT geometry to coordinates
                const coordinates = this.cemeteryManager.parseWKTPolygon(annotation.geometry);
                if (!coordinates || coordinates.length === 0) {
                    console.warn('Failed to parse annotation geometry:', annotation.geometry);
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
                        id: annotation.id,
                        label: annotation.label || 'Annotation',
                        cemetery_name: annotation.cemetery_name || 'Unknown',
                        notes: annotation.notes || '',
                        color: annotation.color || '#FF0000',
                        type: 'annotation'
                    }
                };
            } catch (error) {
                console.error('Error processing annotation:', annotation.id, error);
                return null;
            }
        }).filter(Boolean);

        this.cemeteryManager.features.annotations = features;

        // Clear existing layers and source first
        this.clearAnnotationLayers();

        // Add source and layer for annotations
        if (features.length > 0) {
            this.map.addSource('annotations', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // Add fill layer (above roads if they exist)
            const layerOptions = {
                id: 'annotations-fill',
                type: 'fill',
                source: 'annotations',
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
                id: 'annotations-stroke',
                type: 'line',
                source: 'annotations',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            }, 'annotations-fill');

            // Add event listeners based on current tab
            this.updateAnnotationInteractivity();
        }
        
        // Ensure proper layer ordering
        this.ensureLayerOrder();
    }
    // Handle annotation creation from drawing
    handleAnnotationCreate(feature) {
        console.log('Creating annotation:', feature);
        // Calculate area if turf is available
        if (window.turf) {
            const area = window.turf.area(feature);
            console.log('Annotation area:', area, 'square meters');
        }
        
        // Store pending polygon coordinates for the modal
        if (feature.geometry && feature.geometry.type === 'Polygon') {
            // Convert from [lng, lat] to [lat, lng] for database storage
            this.cemeteryManager.pendingPolygonCoords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        }

        window.confirmActions.save(async () => {
            await this.saveAnnotation(feature);
        });
    }

    // Handle annotation updates
    handleAnnotationUpdate(feature) {
        console.log('Updating annotation:', feature);
        // Update area calculation
        if (window.turf) {
            const area = window.turf.area(feature);
            console.log('Updated annotation area:', area, 'square meters');
        }
        // Update annotation in database
        this.updateAnnotation(feature);
    }

    // Handle annotation deletion
    handleAnnotationDelete(feature) {
        console.log('Deleting annotation:', feature);
        // Delete annotation from database
        this.deleteAnnotation(feature.properties.id);
    }

    // Save annotation to database
    async saveAnnotation(formData) {
        try {
            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });
            const result = await response.json();
            
            if (result.success) {
                CustomToast.show('success','Annotation saved successfully');
                
                // Clear pending data
                this.cemeteryManager.pendingPolygonCoords = null;
                
                // Reload data to show the new annotation
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to save annotation');
            }
        } catch (error) {
            console.error('Error saving annotation:', error);
            CustomToast.show('danger','Error saving annotation');
        }
    }

    // Update existing annotation
    async updateAnnotation(feature) {
        try {
            const formData = new FormData();
            formData.append('action', 'updateLayerAnnotation');
            formData.append('id', feature.properties.id);
            formData.append('label', feature.properties.label || '');
            formData.append('notes', feature.properties.notes || '');
            formData.append('color', feature.properties.color || '#FF0000');

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });

            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Annotation updated successfully');
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to update annotation');
            }
        } catch (error) {
            console.error('Error updating annotation:', error);
            CustomToast.show('danger','Error updating annotation');
        }
    }

    // Delete annotation
    async deleteAnnotation(annotationId) {
        try {
            const formData = new FormData();
            formData.append('action', 'deleteLayerAnnotation');
            formData.append('id', annotationId);

            const response = await axios.post(this.cemeteryAPI, formData, {
                headers: this.authManager.API_CONFIG.getFormHeaders()
            });

            const result = response.data;
            
            if (result.success) {
                CustomToast.show('success','Annotation deleted successfully');
                this.cemeteryManager.loadData();
            } else {
                CustomToast.show('danger',result.message || 'Failed to delete annotation');
            }
        } catch (error) {
            console.error('Error deleting annotation:', error);
            CustomToast.show('danger','Error deleting annotation');
        }
    }

    // Edit annotation (open modal with existing data)
    editAnnotation(annotationId) {
        // Find the annotation in the features
        const annotationFeature = this.cemeteryManager.features.annotations.find(annotation => annotation.properties.id == annotationId);
        
        if (annotationFeature) {
            // Open modal with existing annotation data
            if (this.cemeteryManager.modalManager) {
                this.cemeteryManager.modalManager.showAnnotationModal(annotationFeature);
            }
        } else {
            CustomToast.show('danger','Annotation not found');
        }
    }

    // Toggle all annotations visibility
    toggleAllAnnotations() {
        const annotations = this.cemeteryManager.features.annotations || [];
        if (annotations.length === 0) {
            CustomToast.show('info','No annotations to toggle');
            return;
        }

        const isVisible = this.map.getLayoutProperty('annotations-fill', 'visibility') === 'visible';
        const newVisibility = isVisible ? 'none' : 'visible';
        
        this.map.setLayoutProperty('annotations-fill', 'visibility', newVisibility);
        this.map.setLayoutProperty('annotations-stroke', 'visibility', newVisibility);
        
        CustomToast.show('info',`Annotations ${isVisible ? 'hidden' : 'shown'}`);
    }

    // Update annotation interactivity based on current tab
    updateAnnotationInteractivity() {
        // Always ensure event listeners are present, but they check tab state internally
        if (this.map.getLayer('annotations-fill') && !this.annotationEventListenersAdded) {
            this.addAnnotationEventListeners();
            this.annotationEventListenersAdded = true;
        }
    }

    // Add annotation event listeners
    addAnnotationEventListeners() {
        if (!this.map.getLayer('annotations-fill')) return;
        
        // Change cursor on hover only if in annotations tab
        this.map.on('mouseenter', 'annotations-fill', () => {
            if (window.tabs === 'annotations') {
                this.map.getCanvas().style.cursor = 'pointer';
            }
        });

        this.map.on('mouseleave', 'annotations-fill', () => {
            if (window.tabs === 'annotations') {
                this.map.getCanvas().style.cursor = '';
            }
        });
    }

    // Remove annotation event listeners
    removeAnnotationEventListeners() {
        try {
            this.map.off('click', 'annotations-fill');
            this.map.off('mouseenter', 'annotations-fill');
            this.map.off('mouseleave', 'annotations-fill');
        } catch (e) {
            // Event listeners might not exist, ignore errors
        }
    }

    // Clear annotation layers from map
    clearAnnotationLayers() {
        // Remove event listeners first
        this.removeAnnotationEventListeners();
        this.annotationEventListenersAdded = false;

        // Remove layers
        if (this.map.getLayer('annotations-fill')) {
            this.map.removeLayer('annotations-fill');
        }
        if (this.map.getLayer('annotations-stroke')) {
            this.map.removeLayer('annotations-stroke');
        }
        
        // Remove source
        if (this.map.getSource('annotations')) {
            this.map.removeSource('annotations');
        }
    }

    // Update annotation styling
    updateAnnotationStyling(style) {
        if (this.map.getLayer('annotations-fill')) {
            if (style.fillColor) {
                this.map.setPaintProperty('annotations-fill', 'fill-color', style.fillColor);
            }
            if (style.fillOpacity) {
                this.map.setPaintProperty('annotations-fill', 'fill-opacity', style.fillOpacity);
            }
        }
        
        if (this.map.getLayer('annotations-stroke')) {
            if (style.strokeColor) {
                this.map.setPaintProperty('annotations-stroke', 'line-color', style.strokeColor);
            }
            if (style.strokeWidth) {
                this.map.setPaintProperty('annotations-stroke', 'line-width', style.strokeWidth);
            }
            if (style.strokeOpacity) {
                this.map.setPaintProperty('annotations-stroke', 'line-opacity', style.strokeOpacity);
            }
        }
    }

    // Get annotation statistics
    getAnnotationStatistics() {
        const annotations = this.cemeteryManager.features.annotations || [];
        const totalArea = annotations.reduce((total, annotation) => {
            if (annotation.geometry && annotation.geometry.coordinates) {
                try {
                    const area = window.turf ? window.turf.area(annotation) : 0;
                    return total + area;
                } catch (e) {
                    return total;
                }
            }
            return total;
        }, 0);

        return {
            totalAnnotations: annotations.length,
            totalArea: Math.round(totalArea),
            averageArea: annotations.length > 0 ? Math.round(totalArea / annotations.length) : 0
        };
    }

    // Export annotations data
    exportAnnotations(format = 'geojson') {
        const annotations = this.cemeteryManager.features.annotations || [];
        
        if (format === 'geojson') {
            return {
                type: 'FeatureCollection',
                features: annotations
            };
        } else if (format === 'csv') {
            const csvData = annotations.map(annotation => ({
                id: annotation.properties.id,
                label: annotation.properties.label,
                cemetery: annotation.properties.cemetery_name,
                notes: annotation.properties.notes,
                color: annotation.properties.color
            }));
            
            return csvData;
        }
        
        return annotations;
    }

    // Show area calculation for selected annotation
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

    // Ensure annotations are above roads
    ensureLayerOrder() {
        // Move annotation layers above roads if both exist
        if (this.map.getLayer('roads') && this.map.getLayer('annotations-fill')) {
            try {
                // Move annotations-fill above roads
                this.map.moveLayer('annotations-fill', 'roads');
                // Move annotations-stroke above annotations-fill
                this.map.moveLayer('annotations-stroke', 'annotations-fill');
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