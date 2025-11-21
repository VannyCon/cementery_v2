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
                            <i class="fas fa-location-arrow"></i>
                            <span class="d-none d-sm-inline ms-1">Show My Location</span>
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
                        <input type="file" class="form-control" id="graveImages" name="images[]" accept="image/*" multiple>
                        <div class="form-text">You can select multiple images. They will be stored in a folder named after the grave number.</div>
                        <div id="imagePreview" class="mt-2"></div>
                        <style>
                            #imagePreview .img-thumbnail {
                                border: 2px solid #dee2e6;
                                transition: border-color 0.15s ease-in-out;
                            }
                            #imagePreview .img-thumbnail:hover {
                                border-color: #0d6efd;
                            }
                        </style>
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