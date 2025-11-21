// Modal Management System for Cemetery Management
class ModalManager {
    constructor(cemeteryManager) {
        this.cemeteryManager = cemeteryManager;
        this.currentModal = null;
        this.currentFeature = null;
        this.pendingCoordinates = null;
        
        this.initializeModalHandlers();
    }

    // Initialize all modal event handlers
    initializeModalHandlers() {
        // Cemetery modal handlers
        this.setupCemeteryModalHandlers();
        
        // Road modal handlers
        this.setupRoadModalHandlers();
        
        // Grave plot modal handlers
        this.setupPlotModalHandlers();
        
        // Annotation modal handlers
        this.setupAnnotationModalHandlers();
        
        // Burial modal handlers
        this.setupBurialModalHandlers();
        
        // Generic modal handlers
        this.setupGenericModalHandlers();
    }

    // Cemetery Modal Management
    showCemeteryModal(latlng = null) {
        this.currentModal = 'cemetery';
        
        if (latlng) {
            // Pre-fill coordinates if provided
            const latInput = document.getElementById('cemeteryLat');
            const lngInput = document.getElementById('cemeteryLng');
            
            if (latInput) latInput.value = latlng.lat;
            if (lngInput) lngInput.value = latlng.lng;
        }
        
        // Reset form
        const form = document.getElementById('cemeteryForm');
        if (form) {
            form.reset();
            // Set default action
            const actionInput = form.querySelector('[name="action"]');
            if (actionInput) actionInput.value = 'createCemetery';
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cemeteryModal'));
        modal.show();
    }

    setupCemeteryModalHandlers() {
        // Cemetery form submission
        const cemeteryForm = document.getElementById('cemeteryForm');
        if (cemeteryForm) {
            cemeteryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCemeterySubmit();
            });
        }

        // Cemetery modal close
        const cemeteryModal = document.getElementById('cemeteryModal');
        if (cemeteryModal) {
            cemeteryModal.addEventListener('hidden.bs.modal', () => {
                this.resetCemeteryModal();
            });
        }
    }

    handleCemeterySubmit() {
        const form = document.getElementById('cemeteryForm');
        const formData = new FormData(form);
        
        // Add coordinates if pending
        if (this.pendingCoordinates) {
            formData.append('latitude', this.pendingCoordinates.lat);
            formData.append('longitude', this.pendingCoordinates.lng);
        }
        
        // Call cemetery manager's save method
        if (this.cemeteryManager && this.cemeteryManager.saveCemetery) {
            this.cemeteryManager.saveCemetery(formData);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('cemeteryModal'));
        if (modal) modal.hide();
    }

    resetCemeteryModal() {
        const form = document.getElementById('cemeteryForm');
        if (form) form.reset();
        this.pendingCoordinates = null;
        this.currentModal = null;
    }

    // Road Modal Management
    showRoadModal(feature = null) {
        this.currentModal = 'road';
        this.currentFeature = feature;
        
        // If feature provided, populate form
        if (feature && feature.geometry) {
            const coordinates = feature.geometry.coordinates;
            
            // Convert coordinates from [lng, lat] to [lat, lng] for database storage
            const convertedCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
            
            // Set coordinates in hidden input
            const roadCoordinatesInput = document.getElementById('roadCoordinates');
            if (roadCoordinatesInput) {
                roadCoordinatesInput.value = JSON.stringify(convertedCoordinates);
            }
            
            // Set geometry type
            const geometryTypeInput = document.getElementById('geometryType');
            if (geometryTypeInput) {
                geometryTypeInput.value = 'polyline';
            }
            
            // If feature has properties, populate them
            if (feature.properties) {
                const nameInput = document.getElementById('roadName');
                const typeInput = document.getElementById('roadType');
                const statusInput = document.getElementById('roadStatus');
                
                if (nameInput && feature.properties.name) nameInput.value = feature.properties.name;
                if (typeInput && feature.properties.type) typeInput.value = feature.properties.type;
                if (statusInput && feature.properties.status) statusInput.value = feature.properties.status;
            }
        } else if (this.cemeteryManager && this.cemeteryManager.pendingRoadCoords) {
            // Use pending coordinates
            const roadCoordinatesInput = document.getElementById('roadCoordinates');
            if (roadCoordinatesInput) {
                roadCoordinatesInput.value = JSON.stringify(this.cemeteryManager.pendingRoadCoords);
            }
        }
        
        // Reset form if no feature
        if (!feature) {
            const form = document.getElementById('roadForm');
            if (form) form.reset();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('roadModal'));
        modal.show();
    }

    setupRoadModalHandlers() {
        // Road form submission
        const roadForm = document.getElementById('roadForm');
        if (roadForm) {
            roadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRoadSubmit();
            });
        }

        // Road modal close
        const roadModal = document.getElementById('roadModal');
        if (roadModal) {
            roadModal.addEventListener('hidden.bs.modal', () => {
                this.resetRoadModal();
            });
        }
    }

    handleRoadSubmit() {
        const form = document.getElementById('roadForm');
        const formData = new FormData(form);
        
        // Call cemetery manager's save method
        if (this.cemeteryManager && this.cemeteryManager.saveRoad) {
            this.cemeteryManager.saveRoad(formData);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('roadModal'));
        if (modal) modal.hide();
    }

    resetRoadModal() {
        const form = document.getElementById('roadForm');
        if (form) form.reset();
        this.currentFeature = null;
        this.currentModal = null;
        
        // Clear pending coordinates
        if (this.cemeteryManager) {
            this.cemeteryManager.pendingRoadCoords = null;
        }
    }

    // Grave Plot Modal Management
    showPlotModal(feature = null) {
        this.currentModal = 'plot';
        this.currentFeature = feature;
        
        // If feature provided, populate form
        if (feature && feature.geometry && feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates;
            
            // Set coordinates in hidden input
            const plotCoordinatesInput = document.getElementById('plotCoordinates');
            if (plotCoordinatesInput) {
                plotCoordinatesInput.value = JSON.stringify(coordinates);
            }
            
            // If feature has properties, populate them
            if (feature.properties) {
                const plotNumberInput = document.getElementById('plotNumber');
                const statusInput = document.getElementById('plotStatus');
                const cemeteryIdInput = document.getElementById('plotCemeteryId');
                
                if (plotNumberInput && feature.properties.plot_number) plotNumberInput.value = feature.properties.plot_number;
                if (statusInput && feature.properties.status) statusInput.value = feature.properties.status;
                if (cemeteryIdInput && feature.properties.cemetery_id) cemeteryIdInput.value = feature.properties.cemetery_id;
            }
        } else if (this.cemeteryManager && this.cemeteryManager.pendingPolygonCoords) {
            // Use pending coordinates
            const plotCoordinatesInput = document.getElementById('plotCoordinates');
            if (plotCoordinatesInput) {
                plotCoordinatesInput.value = JSON.stringify(this.cemeteryManager.pendingPolygonCoords);
            }
        }
        
        // Reset form if no feature
        if (!feature) {
            const form = document.getElementById('plotForm');
            if (form) form.reset();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('plotModal'));
        modal.show();
    }

    setupPlotModalHandlers() {
        // Plot form submission
        const plotForm = document.getElementById('plotForm');
        if (plotForm) {
            plotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePlotSubmit();
            });
        }

        // Plot modal close
        const plotModal = document.getElementById('plotModal');
        if (plotModal) {
            plotModal.addEventListener('hidden.bs.modal', () => {
                this.resetPlotModal();
            });
        }
    }

    handlePlotSubmit() {
        const form = document.getElementById('plotForm');
        const formData = new FormData(form);
        
        // Call cemetery manager's save method
        if (this.cemeteryManager && this.cemeteryManager.saveGravePlot) {
            this.cemeteryManager.saveGravePlot(formData);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('plotModal'));
        if (modal) modal.hide();
    }

    resetPlotModal() {
        const form = document.getElementById('plotForm');
        if (form) form.reset();
        this.currentFeature = null;
        this.currentModal = null;
        
        // Clear pending coordinates
        if (this.cemeteryManager) {
            this.cemeteryManager.pendingPolygonCoords = null;
        }
    }

    // Annotation Modal Management
    showAnnotationModal(feature = null) {
        this.currentModal = 'annotation';
        this.currentFeature = feature;
        
        // If feature provided, populate form
        if (feature && feature.geometry && feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates;
            
            // Convert coordinates from [lng, lat] to [lat, lng] for database storage
            const convertedCoordinates = coordinates[0].map(coord => [coord[1], coord[0]]);
            
            // Set coordinates in hidden input
            const annotationCoordinatesInput = document.getElementById('annotationCoordinates');
            if (annotationCoordinatesInput) {
                annotationCoordinatesInput.value = JSON.stringify(convertedCoordinates);
            }
            
            // Convert to WKT format for geometry field
            const wkt = `POLYGON((${convertedCoordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
            const annotationGeometryInput = document.getElementById('annotationGeometry');
            if (annotationGeometryInput) {
                annotationGeometryInput.value = wkt;
            }
            
            // If feature has properties, populate them
            if (feature.properties) {
                const titleInput = document.getElementById('annotationTitle');
                const descriptionInput = document.getElementById('annotationDescription');
                const typeInput = document.getElementById('annotationType');
                
                if (titleInput && feature.properties.title) titleInput.value = feature.properties.title;
                if (descriptionInput && feature.properties.description) descriptionInput.value = feature.properties.description;
                if (typeInput && feature.properties.type) typeInput.value = feature.properties.type;
            }
        } else if (this.cemeteryManager && this.cemeteryManager.pendingPolygonCoords) {
            // Use pending coordinates
            const annotationCoordinatesInput = document.getElementById('annotationCoordinates');
            if (annotationCoordinatesInput) {
                annotationCoordinatesInput.value = JSON.stringify(this.cemeteryManager.pendingPolygonCoords);
            }
            
            // Convert to WKT format for geometry field
            const wkt = `POLYGON((${this.cemeteryManager.pendingPolygonCoords.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
            const annotationGeometryInput = document.getElementById('annotationGeometry');
            if (annotationGeometryInput) {
                annotationGeometryInput.value = wkt;
            }
        }
        
        // Reset form if no feature
        if (!feature) {
            const form = document.getElementById('annotationForm');
            if (form) form.reset();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('annotationModal'));
        modal.show();
    }

    setupAnnotationModalHandlers() {
        // Annotation form submission
        const annotationForm = document.getElementById('annotationForm');
        if (annotationForm) {
            annotationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAnnotationSubmit();
            });
        }

        // Annotation modal close
        const annotationModal = document.getElementById('annotationModal');
        if (annotationModal) {
            annotationModal.addEventListener('hidden.bs.modal', () => {
                this.resetAnnotationModal();
            });
        }
    }

    handleAnnotationSubmit() {
        const form = document.getElementById('annotationForm');
        const formData = new FormData(form);
        
        // Call cemetery manager's save method
        if (this.cemeteryManager && this.cemeteryManager.saveAnnotation) {
            this.cemeteryManager.saveAnnotation(formData);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('annotationModal'));
        if (modal) modal.hide();
    }

    resetAnnotationModal() {
        const form = document.getElementById('annotationForm');
        if (form) form.reset();
        this.currentFeature = null;
        this.currentModal = null;
        
        // Clear pending coordinates
        if (this.cemeteryManager) {
            this.cemeteryManager.pendingPolygonCoords = null;
        }
    }

    // Burial Modal Management
    setupBurialModalHandlers() {
        // Burial form submission
        const burialForm = document.getElementById('burialForm');
        if (burialForm) {
            burialForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBurialSubmit();
            });
        }

        // Burial modal close
        const burialModal = document.getElementById('burialModal');
        if (burialModal) {
            burialModal.addEventListener('hidden.bs.modal', () => {
                this.resetBurialModal();
            });
        }
    }

    handleBurialSubmit() {
        const form = document.getElementById('burialForm');
        const formData = new FormData(form);
        
        // Call cemetery manager's save method if available
        if (this.cemeteryManager && this.cemeteryManager.saveBurial) {
            this.cemeteryManager.saveBurial(formData);
        } else {
            // Fallback to direct API call
            this.submitBurialData(formData);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('burialModal'));
        if (modal) modal.hide();
    }

    async submitBurialData(formData) {
        try {
            const response = await fetch(this.cemeteryManager.cemeteryAPI, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = response.data;
            
            if (result.success) {
                this.cemeteryManager.showToast('Burial record saved successfully', 'success');
                // Reload data if available
                if (this.cemeteryManager.loadData) {
                    this.cemeteryManager.loadData();
                }
            } else {
                this.cemeteryManager.showToast(result.message || 'Failed to save burial record', 'error');
            }
        } catch (error) {
            console.error('Error saving burial record:', error);
            this.cemeteryManager.showToast('Error saving burial record', 'error');
        }
    }

    resetBurialModal() {
        const form = document.getElementById('burialForm');
        if (form) form.reset();
        this.currentModal = null;
    }

    // Generic Modal Handlers
    setupGenericModalHandlers() {
        // Handle all modal dismiss events
        document.addEventListener('hidden.bs.modal', (e) => {
            const modalId = e.target.id;
            
            // Reset any pending states
            switch (modalId) {
                case 'cemeteryModal':
                    this.resetCemeteryModal();
                    break;
                case 'roadModal':
                    this.resetRoadModal();
                    break;
                case 'plotModal':
                    this.resetPlotModal();
                    break;
                case 'annotationModal':
                    this.resetAnnotationModal();
                    break;
                case 'burialModal':
                    this.resetBurialModal();
                    break;
            }
        });

        // Handle modal show events
        document.addEventListener('show.bs.modal', (e) => {
            const modalId = e.target.id;
            this.currentModal = modalId.replace('Modal', '');
        });
    }

    // Utility Methods
    closeCurrentModal() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
    }

    setPendingCoordinates(latlng) {
        this.pendingCoordinates = latlng;
    }

    clearPendingCoordinates() {
        this.pendingCoordinates = null;
    }

    // Populate select options
    populateCemeterySelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">Select Cemetery</option>';

        // Add cemetery options from cemetery manager's data
        if (this.cemeteryManager && this.cemeteryManager.features.cemeteries) {
            this.cemeteryManager.features.cemeteries.forEach(cemetery => {
                if (cemetery.properties && cemetery.properties.name) {
                    const option = document.createElement('option');
                    option.value = cemetery.properties.id || cemetery.id;
                    option.textContent = cemetery.properties.name;
                    select.appendChild(option);
                }
            });
        }
    }

    // Show confirmation modal
    showConfirmationModal(title, message, onConfirm, onCancel = null) {
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) return;

        // Set modal content
        const modalTitle = confirmModal.querySelector('.modal-title');
        const modalBody = confirmModal.querySelector('.modal-body');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.textContent = message;

        // Set up event handlers
        const confirmBtn = confirmModal.querySelector('.btn-confirm');
        const cancelBtn = confirmModal.querySelector('.btn-cancel');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                onConfirm();
                const modal = bootstrap.Modal.getInstance(confirmModal);
                if (modal) modal.hide();
            };
        }

        if (cancelBtn && onCancel) {
            cancelBtn.onclick = () => {
                onCancel();
                const modal = bootstrap.Modal.getInstance(confirmModal);
                if (modal) modal.hide();
            };
        }

        // Show modal
        const modal = new bootstrap.Modal(confirmModal);
        modal.show();
    }
}

// Global modal functions for backward compatibility
function openCemeteryModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.showCemeteryModal();
    }
}

function openRoadModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.showRoadModal();
    }
}

function openBurialModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.populateCemeterySelect('burialCemeteryId');
        document.getElementById('burialModalLabel').textContent = 'Add Burial Record';
        document.getElementById('burialForm').querySelector('[name="action"]').value = 'createBurialRecord';
        new bootstrap.Modal(document.getElementById('burialModal')).show();
    }
}

function openPlotModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.showPlotModal();
    }
}

function openAnnotationModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.showAnnotationModal();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}

// ES6 module export
if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;
}
