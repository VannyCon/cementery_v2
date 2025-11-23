<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title">Record Management</h3>
                    <div>
                        <a class="btn btn-primary" href="../burial/index.php">
                            <i class="bx bx-plus"></i> Add Record
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center mb-3 gap-2">
                        <div class="input-group" style="max-width: 360px;">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" id="recordSearch" class="form-control" placeholder="Search records...">
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <label for="recordPageSize" class="form-label mb-0 small text-muted">Page size</label>
                            <select id="recordPageSize" class="form-select form-select-sm" style="width: auto;">
                                <option value="10">10</option>
                                <option value="12" selected>12</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped" id="recordTable">
                            <thead>
                                <tr>
                                    <th>Grave Number</th>
                                    <th>Deceased Records</th>
                                    <th>Total Burials</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Records will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-2">
                        <div id="recordCount" class="small text-muted">Showing 0 of 0 records</div>
                        <nav aria-label="Records pagination">
                            <ul id="recordPagination" class="pagination mb-0"></ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add/Edit Category Modal -->
<div class="modal fade" id="recordModal" tabindex="-1" aria-labelledby="recordModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl"> <!-- Changed to modal-xl for wider modal -->
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="recordModalLabel">Add Record</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="recordForm">
                <div class="modal-body">
                    <input type="hidden" id="recordId" name="id">
                    <input type="hidden" id="graveId" name="grave_id_fk">
                    

                    <!-- Deceased Records Section -->
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="fas fa-users me-2"></i>Deceased Records</h6>
                            <button type="button" class="btn btn-sm btn-success" id="addDeceasedBtn">
                                <i class="fas fa-plus me-1"></i>Add Deceased
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="deceasedRecordsContainer">
                                <!-- Deceased records will be added here dynamically -->
                                <div class="deceased-record border rounded p-3 mb-3" data-record-index="0">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="mb-0">Deceased Person #1</h6>
                                        <button type="button" class="btn btn-sm btn-danger remove-deceased" style="display: none;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div class="row g-3">
                                        <div class="col-md-8">
                                            <label class="form-label">Deceased Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control deceased-name" name="deceased_records[0][deceased_name]" required>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Date of Birth</label>
                                            <input type="date" class="form-control date-of-birth" name="deceased_records[0][date_of_birth]">
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Date of Death <span class="text-danger">*</span></label>
                                            <input type="date" class="form-control date-of-death" name="deceased_records[0][date_of_death]" required>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Burial Date</label>
                                            <input type="date" class="form-control burial-date" name="deceased_records[0][burial_date]">
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Layer Number</label>
                                            <input type="number" class="form-control grave-layer-number" name="deceased_records[0][grave_layer_number]" min="1" value="1">
                                            <div class="form-text">Layer 1, 2, 3, etc.</div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Next of Kin</label>
                                            <input type="text" class="form-control next-of-kin" name="deceased_records[0][next_of_kin]">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Contact Info</label>
                                            <input type="text" class="form-control contact-info" name="deceased_records[0][contact_info]">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Notes</label>
                                            <textarea class="form-control notes" name="deceased_records[0][notes]" rows="2"></textarea>
                                        </div>
                                        <div class="col-12">
                                            <label class="form-label">Grave Photos <span class="text-muted small">(Max 3 photos)</span></label>
                                            <div class="input-group">
                                                <input type="file" class="form-control grave-photo-input" 
                                                       name="deceased_records[0][grave_photo][]" 
                                                       accept="image/*" 
                                                       multiple 
                                                       data-record-index="0"
                                                       data-max-files="3">
                                                <button type="button" class="btn btn-outline-primary capture-grave-photo-btn" 
                                                        data-record-index="0" 
                                                        title="Take Photo">
                                                    <i class="fas fa-camera"></i>
                                                </button>
                                            </div>
                                            <div class="form-text">You can select up to 3 images or take photos directly.</div>
                                            <div class="grave-photo-preview mt-2" data-record-index="0"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="recordSubmitBtn">Save Records</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="deleteModalLabel">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this record?</p>
                <p class="text-danger"><strong>Note:</strong> This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" onclick="confirmDelete()">Delete</button>
            </div>
        </div>
    </div>
</div>



<!-- Map Modal -->
<div class="modal fade" id="MapModal" tabindex="1" style="z-index: 2000;" aria-labelledby="MapModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="MapModalLabel">Grave Plot Map</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="card-body p-0">
                <div id="map" style="height: calc(100vh - 250px); width: 100%;" class="mobile-map"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <!-- <button type="button" class="btn btn-danger" onclick="confirmMap()">Done</button> -->
                <a href="map_content.php" id="viewMapRecord" class="btn btn-info">View Record</a>
            </div>
        </div>
    </div>
</div>

<!-- View Record Modal -->
<div class="modal fade" id="viewModal" tabindex="-1" aria-labelledby="viewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewModalLabel">Record Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="small text-muted">Grave Number</div>
                        <div id="viewGraveNumber" class="fw-semibold"></div>
                    </div>
                    <div class="col-md-8">
                        <div class="small text-muted">Deceased Name</div>
                        <div id="viewDeceasedName" class="fw-semibold"></div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Date of Birth</div>
                        <div id="viewDateOfBirth"></div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Date of Death</div>
                        <div id="viewDateOfDeath"></div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Burial Date</div>
                        <div id="viewBurialDate"></div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Next of Kin</div>
                        <div id="viewNextOfKin"></div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Contact Info</div>
                        <div id="viewContactInfo"></div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Cemetery</div>
                        <!-- <a href="" id="viewCemetery" class="btn btn-md btn-info fw-semibold">Grave Plot</a> -->
                        <button class="btn btn-sm btn-info" onclick="mapRecord()" title="Map">
                            <i class="fas fa-map"></i>
                        </button>
                    </div>
                    <div class="col-12">
                        <div class="small text-muted">Notes</div>
                        <div id="viewNotes" class="border rounded p-2 bg-light"></div>
                    </div>
                    <div class="col-12" id="viewGravePhotosContainer" style="display: none;">
                        <div class="small text-muted mb-2">Grave Photos</div>
                        <div class="row g-2" id="viewGravePhotosGallery">
                            <!-- Grave photos will be displayed here -->
                        </div>
                    </div>
                   
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- Loading/Progress Modal -->
<div class="modal fade" id="uploadProgressModal" tabindex="-1" style="z-index: 10002;" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-body text-center py-4">
                <div class="mb-3">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <h5 id="uploadProgressTitle">Saving Records...</h5>
                <p class="text-muted mb-3" id="uploadProgressMessage">Please wait while we save your records and upload images.</p>
                <div class="progress mb-3" style="height: 25px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" 
                         id="uploadProgressBar" 
                         style="width: 0%"
                         aria-valuenow="0" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        <span id="uploadProgressText">0%</span>
                    </div>
                </div>
                <div class="small text-muted" id="uploadProgressDetails">
                    <div id="uploadFileCount"></div>
                    <div id="uploadSpeed"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Camera Modal for Grave Photos -->
<div class="modal fade" id="cameraModal" tabindex="-1" style="z-index: 10001;" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Take Grave Photo</h5>
                <button type="button" class="btn-close" id="closeCameraModalBtn"></button>
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
                <button type="button" class="btn btn-secondary" id="cancelCameraBtn">Cancel</button>
                <button type="button" class="btn btn-primary" id="captureBtn" style="display: none;">
                    <i class="fas fa-camera me-1"></i>Capture Photo
                </button>
                <button type="button" class="btn btn-success" id="retakeBtn" style="display: none;">
                    <i class="fas fa-redo me-1"></i>Retake
                </button>
                <button type="button" class="btn btn-success" id="addPhotoBtn" style="display: none;">
                    <i class="fas fa-plus me-1"></i>Add Photo
                </button>
            </div>
        </div>
    </div>
</div>