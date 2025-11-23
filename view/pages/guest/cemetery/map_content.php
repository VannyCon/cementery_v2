<style>
.grave-location-popup-container .maplibregl-popup-content {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.grave-location-popup h6 {
    border-bottom: 2px solid #dc3545;
    padding-bottom: 5px;
    margin-bottom: 10px;
}

.user-location-marker {
    position: relative;
    width: 20px;
    height: 20px;
}

.user-location-dot {
    width: 100%;
    height: 100%;
    background: #4285f4;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.user-location-pulse {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid #4285f4;
    border-radius: 50%;
    animation: pulse 2s infinite;
}
.map-size{
    height: calc(100vh - 190px); 
    width: 100%;
}
@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(1.4);
        opacity: 0;
    }
}
</style>

<div class="container-fluid mt-4 pt-3">
    <div class="row">
        <div class="col-12">
            <p class="card-title">Cemetery Map</p>
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <a href="index.html" class="btn btn-sm btn-primary">
                        <i class="fas fa-arrow-left"></i> Back
                    </a>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="btnReload" onclick="window.location.reload();">
                            <i class="fas fa-sync"></i>
                            <span class="d-none d-sm-inline ms-1">Reload</span>
                        </button>
                        <button type="button" class="btn btn-outline-primary btn-sm" id="btnFollowMe" title="Follow my location">
                            <i class="fas fa-location-arrow"></i>
                            <span class="d-none d-sm-inline ms-1">Follow</span>
                        </button>
                    </div>
                    
                    <!-- <button class="btn btn-sm btn-success" onclick="cacheCemeteryData()" title="Cache data for offline use">
                        <i class="fas fa-download"></i> Cache Data
                    </button> -->
                </div>
                <div class="card-body p-0">
                    <div id="map" class="mobile-map map-size"></div>
                </div>
                <div id="navigation-panel" class="navigation-panel nav-size" style="display: none;"></div>
            </div>
        </div>
    </div>
</div>

<!-- Grave Plot Modal -->
<div class="modal fade" id="graveModal" tabindex="-1" style="z-index: 10000;">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="graveModalLabel">Add Grave Plot</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="gravePlotForm">
                <div class="modal-body">
                    <input type="hidden" id="gravePlotId" name="id">
                    <input type="hidden" name="action" value="createBurialRecord">
                    <input type="hidden" id="gravePlotGeometry" name="boundary">
                    <input type="hidden" id="gravePlotCoordinates" name="location">
                    <input type="hidden" class="form-control" id="graveLocation" name="location" readonly>
                    <input type="hidden" class="form-control" id="graveStatus" name="status" value="occupied" readonly>
                    <div class="mb-3">
                        <label for="graveNumber" class="form-label">Grave Number</label>
                        <input type="text" class="form-control" id="graveNumber" name="grave_number">
                    </div>
                    <div class="mb-3">
                        <label for="graveImage" class="form-label">Image</label>
                        <input type="file" class="form-control" id="graveImage" name="image_path" accept="image/*">
                    </div>
                    <!-- <div class="mb-3">
                        <label for="graveStatus" class="form-label">Status</label>
                        <select class="form-select" id="graveStatus" name="status">
                            <option value="">Select Status</option>
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                        </select>
                    </div> -->
                    <div class="mb-3">
                        <label for="graveNotes" class="form-label">Notes</label>
                        <textarea class="form-control" id="graveNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-save me-1"></i>Save Grave Plot
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="arrivalModal" tabindex="-1" aria-labelledby="arrivalModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0 text-white arrival-modal-header">
                <div class="d-flex align-items-center">
                    <i class='bx bx-map-pin' style="font-size: 2rem; margin-right: 8px;"></i>
                    <h5 class="modal-title fw-bold mb-0" id="arrivalModalLabel">You Have Arrived!</h5>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="text-center mb-4">
                    <div class="arrival-icon mb-3">
                        <i class='bx bx-check-circle text-success' style="font-size: 4rem;"></i>
                    </div>
                    <h4 class="text-primary mb-2" id="arrivalDeceasedName">Loading...</h4>
                    <p class="text-muted mb-0" id="arrivalGraveNumber">Grave Number: Loading...</p>
                </div>
                
                <!-- Image Gallery -->
                <div id="arrivalImageGallery" class="arrival-image-gallery">
                    <!-- Images will be dynamically loaded here -->
                </div>
                
                <!-- Additional Information -->
                <div id="arrivalAdditionalInfo" class="mt-4">
                    <!-- Additional grave information will be displayed here -->
                </div>
            </div>
            <div class="modal-footer border-0 p-4">
                <div class="d-flex gap-2 w-100 justify-content-center">
                    <button type="button" class="btn btn-primary d-flex align-items-center" data-bs-dismiss="modal">
                        <i class='bx bx-check mt-1 me-1' style="vertical-align: middle; font-size: 1.2em;"></i>
                        <span>Continue</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
/* Arrival Modal Styles */
.arrival-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.5rem 0.5rem 0 0 !important;
}

.arrival-icon {
    animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.arrival-image-gallery img {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.arrival-image-gallery img:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
}

#arrivalModal .modal-content {
    border-radius: 1rem;
    overflow: hidden;
}

#arrivalModal .list-group-item {
    border-left: 4px solid #667eea;
    transition: all 0.3s ease;
}

#arrivalModal .list-group-item:hover {
    background-color: #f8f9fa;
    border-left-color: #764ba2;
    transform: translateX(5px);
}

#arrivalModal .card {
    transition: all 0.3s ease;
}

#arrivalModal .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>