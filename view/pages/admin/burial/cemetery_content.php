<div class="container-fluid px-1 px-md-3">
    <!-- Cemetery Map Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card">
             <div class="card-header">
                    <div class="d-flex flex-row justify-content-between align-items-center gap-2">
                        <h4 class="mb-0">
                        <i class="fas fa-map-marked-alt me-2"></i>
                        <span class="d-none d-sm-inline">Cemetery Management</span>
                        <span class="d-inline d-sm-none">Cemetery Map</span>
                        </h4>

                        <!-- Horizontal button group -->
                        <div class="btn-group d-flex gap-1" role="group">
                            <button type="button" class="btn btn-outline-primary btn-sm" id="btnMyLocation" onclick="cemeteryManager.useMyLocation()">
                                <i class="fas fa-crosshairs"></i>
                                <span class="d-none d-sm-inline ms-1">Show My Location</span>
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" id="btnFollowMe" title="Follow my location">
                                <i class="fas fa-location-arrow"></i>
                                <span class="d-none d-sm-inline ms-1">Follow</span>
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" id="btnReload">
                                <i class="fas fa-sync"></i>
                                <span class="d-none d-sm-inline ms-1">Reload</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body p-0">
                    <div id="map" style="height: calc(100vh - 150px); width: 100%;" class="mobile-map"></div>
                </div>
                <div class="card-footer">
                    <div class="row g-2">
                        <ul class="nav nav-tabs card-header-tabs flex-nowrap" id="managementTabs" role="tablist" style="overflow-x: auto;">
                         
                        <div class="tab-pane fade" id="roads" role="tabpanel">
                            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                                <h5 class="mb-0">Road Network</h5>
                                <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#roadModal" onclick="openRoadModal()">
                                    <i class="fas fa-plus me-1"></i>Add Road
                                </button>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover" id="roadsTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Road Name</th>
                                            <!-- <th class="d-none d-md-table-cell">Cemetery</th> -->
                                            <th class="d-none d-lg-table-cell">Type</th>
                                            <th class="d-none d-sm-table-cell">Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="roadsTableBody">
                                        <!-- Data loaded via JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Burial Records Tab -->
                        <div class="tab-pane fade" id="burials" role="tabpanel">
                            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                                <h5 class="mb-0">Burial Records</h5>
                                <button class="btn btn-dark btn-sm" data-bs-toggle="modal" data-bs-target="#burialModal" onclick="openBurialModal()">
                                    <i class="fas fa-plus me-1"></i>Add Record
                                </button>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover" id="burialsTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th class="d-none d-sm-table-cell">Grave #</th>
                                            <th class="d-none d-md-table-cell">Cemetery</th>
                                            <th class="d-none d-lg-table-cell">Burial Date</th>
                                            <th class="d-none d-xl-table-cell">Next of Kin</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="burialsTableBody">
                                        <!-- Data loaded via JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Grave Plots Tab -->
                        <div class="tab-pane fade" id="plots" role="tabpanel">
                            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                                <h5 class="mb-0">Grave Plots</h5>
                                <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#plotModal" onclick="openPlotModal()">
                                    <i class="fas fa-plus me-1"></i>Add Plot
                                </button>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover" id="plotsTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Grave #</th>
                                            <th class="d-none d-md-table-cell">Cemetery</th>
                                            <th>Status</th>
                                            <th class="d-none d-lg-table-cell">Notes</th>
                                            <th class="d-none d-sm-table-cell">Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="plotsTableBody">
                                        <!-- Data loaded via JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Annotations Tab -->
                        <div class="tab-pane fade" id="annotations" role="tabpanel">
                            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                                <h5 class="mb-0">Layer Annotations</h5>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-info btn-sm" data-bs-toggle="modal" data-bs-target="#annotationModal" onclick="openAnnotationModal()">
                                        <i class="fas fa-plus me-1"></i>Add Note
                                    </button>
                                    <button class="btn btn-secondary btn-sm" onclick="cemeteryManager.refreshAnnotations()">
                                        <i class="fas fa-sync-alt me-1"></i>Refresh
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Layer Controls -->
                            <div class="row mb-3">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header py-2">
                                            <h6 class="mb-0">
                                                <i class="fas fa-layer-group me-2"></i>Layer Controls
                                            </h6>
                                        </div>
                                        <div class="card-body py-2">
                                            <div class="row g-2">
                                                <div class="col-md-6">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" id="showAllAnnotations" checked>
                                                        <label class="form-check-label" for="showAllAnnotations">
                                                            Show All Annotations
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <button class="btn btn-sm btn-outline-primary" onclick="cemeteryManager.toggleAllAnnotations()">
                                                        <i class="fas fa-eye-slash me-1"></i>Toggle All Visibility
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover" id="annotationsTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Label</th>
                                            <th class="d-none d-sm-table-cell">Color</th>
                                            <th class="d-none d-md-table-cell">Order</th>
                                            <th class="d-none d-md-table-cell">Status</th>
                                            <th class="d-none d-lg-table-cell">Notes</th>
                                            <th class="d-none d-sm-table-cell">Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="annotationsTableBody">
                                        <!-- Data loaded via JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
/* Map Height Optimization */
.mobile-map {
    min-height: 400px;
}

/* Mobile Responsive Enhancements for Cemetery Management */
@media (max-width: 768px) {
    .mobile-map {
        height: calc(100vh - 280px) !important;
        min-height: 300px;
    }
    
    .card-header h4 {
        font-size: 1.1rem;
    }
    
    .btn-group-vertical .btn {
        font-size: 0.8rem;
        padding: 0.4rem 0.6rem;
    }
    
    .nav-tabs {
        font-size: 0.85rem;
    }
    
    .nav-tabs .nav-link {
        padding: 0.5rem 0.75rem;
        white-space: nowrap;
    }
    
    .table {
        font-size: 0.85rem;
    }
    
    .table th,
    .table td {
        padding: 0.5rem 0.25rem;
        vertical-align: middle;
    }
    
    .btn-sm {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
    }
    
    .modal-dialog {
        margin: 0.5rem;
    }
    
    .modal-lg {
        max-width: calc(100vw - 1rem);
    }
    
    .form-label {
        font-size: 0.9rem;
        font-weight: 600;
    }
    
    .form-control,
    .form-select {
        font-size: 0.9rem;
    }
}

@media (max-width: 576px) {
    .mobile-map {
        height: calc(100vh - 300px) !important;
        min-height: 250px;
    }
    
    .container-fluid {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    
    .card-header {
        padding: 0.75rem;
    }
    
    .card-body {
        padding: 0.75rem;
    }
    
    .card-footer {
        padding: 0.75rem;
    }
    
    .btn {
        font-size: 0.75rem;
    }
    
    .table th,
    .table td {
        padding: 0.4rem 0.2rem;
        font-size: 0.8rem;
    }
    
    .nav-tabs .nav-link {
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
    }
    
    .flex-fill {
        min-width: 0;
    }
}

/* Enhanced mobile table styling */
@media (max-width: 768px) {
    .table-responsive {
        border: none;
        -webkit-overflow-scrolling: touch;
    }
    
    .table thead th {
        border-bottom: 2px solid #dee2e6;
        font-weight: 600;
        font-size: 0.8rem;
    }
    
    .table tbody tr:hover {
        background-color: rgba(0, 123, 255, 0.075);
    }
    
    .btn-group-sm > .btn,
    .btn-sm {
        --bs-btn-padding-y: 0.25rem;
        --bs-btn-padding-x: 0.5rem;
        --bs-btn-font-size: 0.75rem;
        border-radius: 0.375rem;
    }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
    .btn {
        min-height: 44px;
    }
    
    .nav-link {
        min-height: 44px;
        display: flex;
        align-items: center;
    }
    
    .table tbody tr {
        cursor: pointer;
    }
    
    .form-control,
    .form-select {
        min-height: 44px;
    }
}

/* MapLibre GL responsive adjustments */
.maplibregl-map {
    font-size: 12px;
}

@media (max-width: 768px) {
    .maplibregl-ctrl-zoom {
        font-size: 18px;
    }
    
    .maplibregl-ctrl-zoom button {
        width: 32px;
        height: 32px;
        line-height: 32px;
    }
    
    .maplibregl-popup-content {
        font-size: 12px;
        line-height: 1.4;
    }
    
    .maplibregl-popup-content-wrapper {
        border-radius: 8px;
    }
}

/* Horizontal scroll for tabs on mobile */
@media (max-width: 768px) {
    .nav-tabs {
        border-bottom: 1px solid #dee2e6;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    
    .nav-tabs::-webkit-scrollbar {
        display: none;
    }
    
    .nav-tabs .nav-item {
        flex-shrink: 0;
    }
}

/* User Location Marker Styles */
.user-location-marker {
    background: transparent !important;
    border: none !important;
    z-index: 1000 !important;
}

.user-location-dot {
    width: 20px;
    height: 20px;
    background: linear-gradient(45deg, #4285f4, #34a853);
    border: 3px solid white;
    border-radius: 50%;
    position: relative;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(66, 133, 244, 0.3);
    animation: userLocationBounce 3s ease-in-out infinite;
    transition: all 0.3s ease-out;
}

.user-location-dot:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.user-location-pulse {
    position: absolute;
    top: -10px;
    left: -10px;
    width: 40px;
    height: 40px;
    border: 2px solid #4285f4;
    border-radius: 50%;
    opacity: 0;
    animation: userLocationPulse 2.5s infinite;
}

/* Real-time tracking indicator */
.user-location-dot.tracking {
    background: linear-gradient(45deg, #ff4444, #ff6b6b);
    animation: userLocationTracking 1s ease-in-out infinite alternate;
}

.user-location-dot.tracking::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid #ff4444;
    border-radius: 50%;
    opacity: 0.6;
    animation: trackingRing 1.5s infinite;
}

@keyframes userLocationBounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0) scale(1);
    }
    40% {
        transform: translateY(-3px) scale(1.05);
    }
    60% {
        transform: translateY(-1px) scale(1.02);
    }
}

@keyframes userLocationPulse {
    0% {
        opacity: 1;
        transform: scale(0.5);
    }
    50% {
        opacity: 0.6;
        transform: scale(1.2);
    }
    100% {
        opacity: 0;
        transform: scale(1.8);
    }
}

@keyframes userLocationTracking {
    0% {
        transform: scale(1);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
    }
    100% {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.6);
    }
}

@keyframes trackingRing {
    0% {
        transform: scale(0.8);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.4;
    }
    100% {
        transform: scale(1.6);
        opacity: 0;
    }
}

/* User Location Popup Styles */
.user-location-popup {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 250px;
}

.user-location-popup h6 {
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 600;
}

.user-location-popup p {
    font-size: 0.9rem;
    line-height: 1.4;
}

.user-location-popup .btn {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
}

/* Enhanced location accuracy circle */
.maplibregl-interactive {
    cursor: pointer;
}

/* Mobile location popup adjustments */
@media (max-width: 768px) {
    .user-location-popup {
        min-width: 200px;
    }
    
    .user-location-popup .btn {
        font-size: 0.75rem;
        padding: 0.2rem 0.4rem;
    }
    
    .maplibregl-popup-content-wrapper {
        border-radius: 8px;
    }
    
    .maplibregl-popup-tip {
        background: white;
    }
}
</style>

<!-- Cemetery Modal -->
<div class="modal fade" id="cemeteryModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="cemeteryModalLabel">Add Cemetery</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="cemeteryForm" enctype="multipart/form-data">
                <div class="modal-body">
                    <input type="hidden" id="cemeteryId" name="id">
                    <input type="hidden" name="action" value="createCemetery">
                    <input type="hidden" id="cemeteryLat" name="latitude">
                    <input type="hidden" id="cemeteryLng" name="longitude">
                    
                    <div class="mb-3">
                        <label for="cemeteryName" class="form-label">Cemetery Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="cemeteryName" name="name" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="cemeteryDescription" class="form-label">Description</label>
                        <textarea class="form-control" id="cemeteryDescription" name="description" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="cemeteryPhoto" class="form-label">Cemetery Photo</label>
                        <input type="file" class="form-control" id="cemeteryPhoto" name="photo" accept="image/*">
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Latitude</label>
                                <input type="text" class="form-control" id="cemeteryLatDisplay" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Longitude</label>
                                <input type="text" class="form-control" id="cemeteryLngDisplay" readonly>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-save me-1"></i>Save Cemetery
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Road Modal -->
<div class="modal fade" id="roadModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="roadModalLabel">Add Road</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="roadForm">
                <div class="modal-body">
                    <input type="hidden" id="roadId" name="id">
                    <input type="hidden" name="action" value="createRoad">
                    <input type="hidden" id="roadCoordinates" name="coordinates">
                    <input type="hidden" id="geometryType" name="geometry_type" value="polyline">
                    
                    <div class="mb-3">
                        <label for="roadName" class="form-label">Road Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="roadName" name="road_name" required>
                    </div>
                    <div class="mb-3">
                        <select class="form-select" id="roadType" name="type">
                            <option value="main">Main Road</option>
                            <option value="mini">Mini Road</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i>Save Road
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Burial Record Modal -->
<div class="modal fade" id="burialModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="burialModalLabel">Add Burial Record</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="burialForm">
                <div class="modal-body">
                    <input type="hidden" id="burialId" name="id">
                    <input type="hidden" name="action" value="createBurialRecord">
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="deceasedName" class="form-label">Deceased Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="deceasedName" name="deceased_name" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="graveNumber" class="form-label">Grave Number <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="graveNumber" name="grave_number" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="dateOfBirth" class="form-label">Date of Birth</label>
                                <input type="date" class="form-control" id="dateOfBirth" name="date_of_birth">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="dateOfDeath" class="form-label">Date of Death <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="dateOfDeath" name="date_of_death" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="burialDate" class="form-label">Burial Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="burialDate" name="burial_date" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="burialCemeteryId" class="form-label">Cemetery <span class="text-danger">*</span></label>
                                <select class="form-select" id="burialCemeteryId" name="cemetery_id" required>
                                    <option value="">Select Cemetery</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="nextOfKin" class="form-label">Next of Kin</label>
                                <input type="text" class="form-control" id="nextOfKin" name="next_of_kin">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="contactInfo" class="form-label">Contact Information</label>
                        <input type="text" class="form-control" id="contactInfo" name="contact_info">
                    </div>
                    
                    <div class="mb-3">
                        <label for="burialNotes" class="form-label">Notes</label>
                        <textarea class="form-control" id="burialNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-dark">
                        <i class="fas fa-save me-1"></i>Save Burial Record
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Grave Plot Modal -->
<div class="modal fade" id="plotModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="plotModalLabel">Add Grave Plot</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="plotForm">
                <div class="modal-body">
                    <input type="hidden" id="plotId" name="id">
                    <input type="hidden" name="action" value="createGravePlot">
                    <input type="hidden" id="plotBoundary" name="boundary">
                    
                    <div class="mb-3">
                        <label for="plotGraveNumber" class="form-label">Grave Number <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="plotGraveNumber" name="grave_number" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="plotCemeteryId" class="form-label">Cemetery <span class="text-danger">*</span></label>
                        <select class="form-select" id="plotCemeteryId" name="cemetery_id" required>
                            <option value="">Select Cemetery</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="plotStatus" class="form-label">Status</label>
                        <select class="form-select" id="plotStatus" name="status">
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="plotNotes" class="form-label">Notes</label>
                        <textarea class="form-control" id="plotNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-warning">
                        <i class="fas fa-save me-1"></i>Save Grave Plot
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Annotation Modal -->
<div class="modal fade" id="annotationModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="annotationModalLabel">Add Annotation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="annotationForm">
                <div class="modal-body">
                    <input type="hidden" id="annotationId" name="id">
                    <input type="hidden" name="action" value="createLayerAnnotation">
                    <input type="hidden" id="annotationGeometry" name="geometry">
                    <input type="hidden" id="annotationCoordinates" name="coordinates">
                    
                    <div class="mb-3">
                        <label for="annotationLabel" class="form-label">Label</label>
                        <input type="text" class="form-control" id="annotationLabel" name="label">
                    </div>
                    
                    <div class="mb-3">
                        <label for="annotationColor" class="form-label">Color</label>
                        <input type="color" class="form-control form-control-color" id="annotationColor" name="color" value="#FF0000">
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="annotationSortOrder" class="form-label">Sort Order</label>
                                <input type="number" class="form-control" id="annotationSortOrder" name="sort_order" value="0" min="0">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="annotationVisible" name="is_visible" value="1" checked>
                                    <label class="form-check-label" for="annotationVisible">
                                        Visible
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="annotationActive" name="is_active" value="1" checked>
                                    <label class="form-check-label" for="annotationActive">
                                        Active
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="annotationNotes" class="form-label">Notes</label>
                        <textarea class="form-control" id="annotationNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-info">
                        <i class="fas fa-save me-1"></i>Save Annotation
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this item? This action cannot be undone.</p>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> This will permanently remove the item from the system.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    </div>
</div>
