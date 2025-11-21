<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex flex-row justify-content-between align-items-center gap-2">
                    <h4 class="mb-0">
                        <i class="fas fa-map-marked-alt me-2"></i>
                        <span class="d-none d-sm-inline">Records Management</span>
                        <span class="d-inline d-sm-none">Records Map</span>
                    </h4>
                    <div class="btn-group d-flex gap-1" role="group">
                        <!-- <button type="button" class="btn btn-success btn-sm" id="btnAddCemetery">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            <span class="d-none d-sm-inline">Add Cemetery</span>
                            <span class="d-inline d-sm-none">Cemetery</span>
                        </button> -->
                        <!-- <button type="button" class="btn btn-primary btn-sm" id="btnAddRoad">
                            <i class="fas fa-road me-1"></i>
                            <span class="d-none d-sm-inline">Add Road</span>
                            <span class="d-inline d-sm-none">Road</span>
                        </button>
                        <button type="button" class="btn btn-info btn-sm" id="btnAddAnnotation">
                            <i class="fas fa-sticky-note me-1"></i>
                            <span class="d-none d-sm-inline">Add Annotation</span>
                            <span class="d-inline d-sm-none">Note</span>
                        </button> -->
                        <button type="button" class="btn btn-outline-success btn-sm" id="btnAddGravePlot">
                            <i class="fas fa-map-marker"></i>
                            <span class="d-none d-sm-inline ms-1">Add Grave Location</span>
                        </button>
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
                <div class="card-body p-0">
                    <div id="map" style="height: calc(100vh - 145px); width: 100%;" class="mobile-map"></div>
                </div>
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
                    <!-- <input type="hidden" name="action" value="createBurialRecord"> -->
                    <input type="hidden" id="gravePlotGeometry" name="boundary">
                    <input type="hidden" id="gravePlotCoordinates" name="location">
                    <input type="hidden" class="form-control" id="graveLocation" name="location" readonly>
                    <input type="hidden" class="form-control" id="graveStatus" name="status" value="occupied" readonly>
                    <div class="mb-3">
                        <label for="graveImages" class="form-label">Images</label>
                        <div class="input-group">
                            <input type="file" class="form-control" id="graveImages" name="images[]" accept="image/*" multiple>
                            <button type="button" class="btn btn-outline-primary" id="captureImageBtn" title="Take Photo">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div class="form-text">You can select multiple images from your device or take photos directly. They will be stored in a folder named after the grave number.</div>
                        <div id="imagePreview" class="mt-2"></div>
                        <style>
                            #imagePreview .img-thumbnail {
                                border: 2px solid #dee2e6;
                                transition: border-color 0.15s ease-in-out;
                                margin: 2px;
                                position: relative;
                            }
                            #imagePreview .img-thumbnail:hover {
                                border-color: #0d6efd;
                            }
                            #imagePreview .remove-image {
                                position: absolute;
                                top: -5px;
                                right: -5px;
                                background: #dc3545;
                                color: white;
                                border: none;
                                border-radius: 50%;
                                width: 20px;
                                height: 20px;
                                font-size: 12px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            #imagePreview .remove-image:hover {
                                background: #c82333;
                            }
                            
                            /* Prevent parent modal from becoming transparent when camera modal opens */
                            #graveModal.fade:not(.show) {
                                opacity: 1 !important;
                            }
                            
                            /* Ensure camera modal appears above grave modal */
                            #cameraModal {
                                z-index: 10001 !important;
                            }
                            
                            #cameraModal .modal-backdrop {
                                z-index: 10000 !important;
                            }
                        </style>
                    </div>
                    
                    <!-- Camera Modal -->
                    <div class="modal fade" id="cameraModal" tabindex="-1" style="z-index: 10001;" data-bs-backdrop="static" data-bs-keyboard="false">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Take Photo</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body text-center">
                                    <div id="cameraContainer" style="position: relative;">
                                        <video id="cameraVideo" autoplay muted style="width: 100%; max-width: 500px; border-radius: 8px;"></video>
                                        <canvas id="cameraCanvas" style="display: none;"></canvas>
                                    </div>
                                    <div id="capturedImageContainer" style="display: none;">
                                        <img id="capturedImage" style="max-width: 100%; max-height: 400px; border-radius: 8px;">
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-primary" id="captureBtn" style="display: none;">
                                        <i class="fas fa-camera me-1"></i>Capture Photo
                                    </button>
                                    <button type="button" class="btn btn-success" id="retakeBtn" style="display: none;">
                                        <i class="fas fa-redo me-1"></i>Retake
                                    </button>
                                    <button type="button" class="btn btn-success" id="addPhotoBtn" style="display: none;" data-bs-dismiss="modal">
                                        <i class="fas fa-plus me-1"></i>Add Photo
                                    </button>
                                </div>
                            </div>
                        </div>
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