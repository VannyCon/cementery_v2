<style>

/* Terms and Conditions Modal Styling */
#termsModal .modal-body {
    max-height: 70vh;
}

#termsModal h5 {
    color: #0d6efd;
    font-weight: 600;
}

#termsModal h6 {
    color: #495057;
    font-weight: 600;
    margin-top: 1rem;
}

#termsModal ul {
    padding-left: 1.5rem;
    margin-top: 0.5rem;
}

#termsModal ul li {
    margin-bottom: 0.5rem;
}

#termsModal .alert {
    border-left: 4px solid #ffc107;
}

#termsModal .bg-light {
    background-color: #f8f9fa !important;
}

#termsModal .form-check-input:checked {
    background-color: #0d6efd;
    border-color: #0d6efd;
}

#termsModal .form-check-label {
    cursor: pointer;
    user-select: none;
}
    
/* Responsive Results Section */
.results-card {
    border: none;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.results-card .card-header {
    /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
    /* color: white; */
    border: none;
    padding: 1.5rem;
}

.results-card .card-body {
    padding: 1.5rem;
}

/* Mobile Card View Styles */
.mobile-record-card {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.mobile-record-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.mobile-record-card .card-header {
    background: none;
    border: none;
    padding: 0 0 0.75rem 0;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #e9ecef;
}

.mobile-record-card .grave-number {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    display: inline-block;
}

.mobile-record-card .deceased-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin-top: 0.5rem;
}

.mobile-record-card .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.mobile-record-card .info-item {
    display: flex;
    flex-direction: column;
}

.mobile-record-card .info-label {
    font-size: 0.75rem;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
}

.mobile-record-card .info-value {
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
}

.mobile-record-card .full-width-item {
    grid-column: 1 / -1;
}

.mobile-record-card .notes-section {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e9ecef;
}

.mobile-record-card .notes-content {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.9rem;
    color: #495057;
    line-height: 1.4;
}

.mobile-record-card .card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e9ecef;
}

.mobile-record-card .btn {
    flex: 1;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    border-radius: 8px;
    font-weight: 500;
}

/* Modal Responsive Improvements */
.modal-dialog-scrollable .modal-body {
    max-height: 70vh;
    overflow-y: auto;
}

.info-item {
    margin-bottom: 0.75rem;
}

.info-item:last-child {
    margin-bottom: 0;
}

/* Enhanced Table Responsiveness */
@media (max-width: 991.98px) {
    .table-responsive {
        border: none;
        box-shadow: none;
    }
    
    .table-responsive table {
        margin-bottom: 0;
    }
}

/* Pagination Responsive */
.pagination {
    justify-content: center;
}

.pagination .page-item .page-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    border-radius: 8px;
    margin: 0 2px;
    border: 1px solid #dee2e6;
    color: #495057;
    transition: all 0.3s ease;
}

.pagination .page-item .page-link:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
    transform: translateY(-1px);
}

.pagination .page-item.active .page-link {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;
}

.pagination .page-item.disabled .page-link {
    color: #6c757d;
    background-color: #fff;
    border-color: #dee2e6;
}

/* Mobile-specific pagination */
@media (max-width: 576px) {
    .pagination {
        font-size: 0.8rem;
    }
    
    .pagination .page-item .page-link {
        padding: 0.4rem 0.6rem;
        margin: 0 1px;
    }
    
    .pagination .page-item:not(.active):not(.disabled) .page-link {
        display: none;
    }
    
    .pagination .page-item.active,
    .pagination .page-item:first-child,
    .pagination .page-item:last-child,
    .pagination .page-item.disabled {
        display: block;
    }
    
    .pagination .page-item .page-link span {
        display: none;
    }
}

/* Search Controls Responsive */
@media (max-width: 767.98px) {
    .input-group-text {
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
    }
    
    .form-control {
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
    }
    
    .form-select {
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        font-size: 0.9rem;
    }
}

/* Advanced Search Responsive Improvements */
@media (max-width: 767.98px) {
    .advanced-search-card .card-body .row .col-md-6 {
        margin-bottom: 1rem;
    }
    
    .advanced-search-card .card-body .row .col-md-6:last-child {
        margin-bottom: 0;
    }
}

/* Loading states for mobile cards */
.mobile-record-card.loading {
    opacity: 0.6;
    pointer-events: none;
}

.mobile-record-card.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* Touch improvements */
@media (hover: none) and (pointer: coarse) {
    .mobile-record-card {
        padding: 1.25rem;
    }
    
    .mobile-record-card .btn {
        min-height: 44px;
        padding: 0.75rem 1rem;
    }
    
    .pagination .page-item .page-link {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .mobile-record-card {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .mobile-record-card .card-header {
        border-bottom-color: #4a5568;
    }
    
    .mobile-record-card .deceased-name {
        color: #e2e8f0;
    }
    
    .mobile-record-card .info-value {
        color: #cbd5e0;
    }
    
    .mobile-record-card .info-label {
        color: #a0aec0;
    }
    
    .mobile-record-card .notes-content {
        background: #4a5568;
        color: #e2e8f0;
    }
    
    .mobile-record-card .card-actions {
        border-top-color: #4a5568;
    }
}

/* Print styles */
@media print {
    .mobile-record-card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #000;
        margin-bottom: 1rem;
    }
    
    .mobile-record-card .card-actions {
        display: none;
    }
    
    .pagination {
        display: none;
    }
}
</style>
<div class="container-fluid">
    <!-- Initial Search Interface (Centered) -->
    <div id="initialSearchContainer" class="row justify-content-center align-items-center" style="min-height: 60vh;">
        <div class="col-12 col-sm-10 col-md-8 col-lg-7 col-xl-6">
            <div class="search-hero-card">
                <div class="text-center mb-4">
                    <h2 class="search-title">Find Cemetery Records</h2>
                    <p class="search-subtitle">Search for grave records by grave number or deceased person's name</p>
                </div>
                
                <!-- Main Search Form -->
                <div class="search-form-container">
                    <div class="input-group search-input-group">
                        <input type="text" id="mainSearchInput" class="form-control search-input" 
                               placeholder="Enter grave number or deceased person's name..."
                               autocomplete="off"
                               autocorrect="off"
                               autocapitalize="off"
                               spellcheck="false"
                               aria-label="Search for cemetery records"
                               aria-describedby="searchHelp">
                        <button class="btn search-btn" type="button" id="mainSearchBtn" aria-label="Search cemetery records">
                            <i class="fas fa-search me-2"></i><span class="search-btn-text">Search</span>
                        </button>
                    </div>
                    
                    <!-- Search Guide -->
                    <div class="search-guide" id="searchHelp">
                        <div class="guide-item">
                            <i class="fas fa-cross text-primary"></i>
                            <span>Enter grave number (e.g., A-001, B-123)</span>
                        </div>
                        <div class="guide-item">
                            <i class="fas fa-user text-success"></i>
                            <span>Enter deceased person's full name</span>
                        </div>
                    </div>
                    
                    <!-- Advanced Search Button -->
                    <div class="text-center mt-4">
                        <button class="btn btn-outline-info" type="button" id="advancedSearchToggle">
                            <i class="fas fa-cog me-2"></i>Advanced Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Advanced Search Panel (Hidden Initially) -->
    <div id="advancedSearchPanel" class="row justify-content-center" style="display: none;">
        <div class="col-12 col-sm-11 col-md-10 col-lg-9 col-xl-8">
            <div class="card advanced-search-card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-search-plus me-2"></i>Advanced Search Options
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" class="form-control" id="searchDateOfBirth">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Date of Death</label>
                            <input type="date" class="form-control" id="searchDateOfDeath">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Burial Date</label>
                            <input type="date" class="form-control" id="searchBurialDate">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Next of Kin</label>
                            <input type="text" class="form-control" id="searchNextOfKin" placeholder="Enter next of kin name">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Contact Info</label>
                            <input type="text" class="form-control" id="searchContactInfo" placeholder="Enter contact information">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Notes</label>
                            <input type="text" class="form-control" id="searchNotes" placeholder="Search in notes">
                        </div>
                    </div>
                    <div class="text-center mt-4">
                        <button class="btn btn-primary me-2" id="advancedSearchBtn">
                            <i class="fas fa-search me-2"></i>Search
                        </button>
                        <button class="btn btn-secondary" id="clearAdvancedSearch">
                            <i class="fas fa-times me-2"></i>Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Results Section (Hidden Initially) -->
    <div id="resultsSection" class="row" style="display: none;">
        <div class="col-12">
            <div class="card results-card">
                <div class="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h3 class="card-title mb-0">
                        <i class="fas fa-list me-2"></i><span class="d-none d-sm-inline">Search Results</span><span class="d-sm-none">Results</span>
                    </h3>
                    <button class="btn btn-outline-info btn-sm" id="newSearchBtn">
                        <i class="fas fa-plus me-1"></i><span class="d-none d-sm-inline">New Search</span><span class="d-sm-none">New</span>
                    </button>
                </div>
                <div class="card-body">
                    <!-- Search Bar (Responsive) -->
                    <div class="row g-2 mb-3">
                        <div class="col-12">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                <input type="text" id="recordSearch" class="form-control" placeholder="Search records...">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Mobile Card View -->
                    <div id="mobileCardView" class="d-block d-lg-none">
                        <!-- Mobile cards will be populated here -->
                    </div>
                    
                    <!-- Desktop Table View -->
                    <div class="d-none d-lg-block">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped table-hover" id="recordTable">
                                <thead class="table-dark">
                                    <tr>
                                        <th class="text-nowrap">Grave Number</th>
                                        <th class="text-nowrap">Deceased Name</th>
                                        <th class="text-nowrap">Date of Birth</th>
                                        <th class="text-nowrap">Date of Death</th>
                                        <th class="text-nowrap">Burial Date</th>
                                        <th class="text-nowrap">Next of Kin</th>
                                        <th class="text-nowrap">Contact Info</th>
                                        <th class="text-nowrap">Notes</th>
                                        <th class="text-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Records will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Pagination (Responsive) -->
                    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 gap-2">
                        <div id="recordCount" class="small text-muted text-center text-sm-start">Showing 0 of 0 records</div>
                        <div class="d-flex align-items-center gap-2">
                            <nav aria-label="Records pagination">
                                <ul id="categoryPagination" class="pagination pagination-sm mb-0 flex-wrap"></ul>
                            </nav>
                            <div class="d-flex align-items-center gap-2">
                                <label for="recordPageSize" class="form-label mb-0 small text-muted">Page size:</label>
                                <select id="recordPageSize" class="form-select form-select-sm" style="width: auto; min-width: 80px;">
                                    <option value="10">10</option>
                                    <option value="12" selected>12</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Terms and Conditions Modal -->
<div class="modal fade" id="termsModal" tabindex="-1" aria-labelledby="termsModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title text-white" id="termsModalLabel">
                    <i class="fas fa-shield-alt me-2"></i>Terms and Conditions & Privacy Policy
                </h5>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Welcome!</strong> Please read and accept our Terms and Conditions and Privacy Policy before using this system.
                </div>

                <h5 class="mt-4 mb-3"><i class="fas fa-file-contract me-2"></i>Terms and Conditions</h5>
                <div class="border rounded p-3 bg-light mb-4">
                    <p><strong>Effective Date:</strong> <?php echo date('F d, Y'); ?></p>
                    
                    <h6 class="mt-3">1. Acceptance of Terms</h6>
                    <p>By accessing and using the Cemetery Locator System, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use this system.</p>
                    
                    <h6 class="mt-3">2. Use of Service</h6>
                    <p>This system is provided for the purpose of locating and viewing cemetery records. You agree to use this service only for lawful purposes and in a manner that does not infringe the rights of others.</p>
                    
                    <h6 class="mt-3">3. Information Accuracy</h6>
                    <p>While we strive to maintain accurate and up-to-date information, we do not warrant the completeness, accuracy, or reliability of any information provided through this system.</p>
                    
                    <h6 class="mt-3">4. User Responsibilities</h6>
                    <p>Users are responsible for maintaining the confidentiality of any search queries and results. Users must not:</p>
                    <ul>
                        <li>Attempt to gain unauthorized access to any portion of the system</li>
                        <li>Use the system for any fraudulent or unlawful purpose</li>
                        <li>Interfere with or disrupt the integrity or performance of the system</li>
                        <li>Scrape, mine, or harvest data from the system without authorization</li>
                    </ul>
                </div>

                <h5 class="mt-4 mb-3"><i class="fas fa-user-shield me-2"></i>Privacy Policy</h5>
                <div class="border rounded p-3 bg-light mb-4">
                    <h6 class="mt-3">Data Privacy Compliance</h6>
                    <p>This system complies with the <strong>Republic Act No. 10173</strong>, also known as the <strong>Data Privacy Act of 2012</strong> of the Philippines, and its implementing rules and regulations.</p>
                    
                    <h6 class="mt-3">Information We Collect</h6>
                    <p>When you use our Cemetery Locator System, we may collect the following information:</p>
                    <ul>
                        <li><strong>Search Queries:</strong> Information you enter when searching for cemetery records (grave numbers, names, dates)</li>
                        <li><strong>Usage Data:</strong> Information about how you use the system (pages visited, time spent, features accessed)</li>
                        <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies for system functionality</li>
                        <li><strong>Session Data:</strong> Temporary data stored during your browsing session</li>
                    </ul>
                    
                    <h6 class="mt-3">How We Use Your Information</h6>
                    <p>We use the collected information for the following purposes:</p>
                    <ul>
                        <li>To provide and maintain the cemetery locator service</li>
                        <li>To improve user experience and system functionality</li>
                        <li>To analyze usage patterns and generate analytics</li>
                        <li>To ensure security and prevent unauthorized access</li>
                        <li>To comply with legal obligations and regulatory requirements</li>
                    </ul>
                    
                    <h6 class="mt-3">Data Protection and Security</h6>
                    <p>We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
                    
                    <h6 class="mt-3">Your Rights Under RA 10173</h6>
                    <p>As a data subject under the Data Privacy Act of 2012, you have the following rights:</p>
                    <ul>
                        <li><strong>Right to be Informed:</strong> You have the right to be informed whether your personal data is being processed</li>
                        <li><strong>Right to Access:</strong> You have the right to access your personal data and learn how it is being processed</li>
                        <li><strong>Right to Object:</strong> You have the right to object to the processing of your personal data</li>
                        <li><strong>Right to Erasure:</strong> You have the right to request the deletion of your personal data</li>
                        <li><strong>Right to Data Portability:</strong> You have the right to obtain a copy of your data in an electronic format</li>
                        <li><strong>Right to Rectification:</strong> You have the right to correct inaccurate or incomplete personal data</li>
                    </ul>
                    
                    <h6 class="mt-3">Data Retention</h6>
                    <p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.</p>
                    
                    <h6 class="mt-3">Third-Party Disclosure</h6>
                    <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law or as necessary to provide the service.</p>
                    
                    <h6 class="mt-3">Cookies</h6>
                    <p>This system uses cookies to enhance user experience and maintain session data. You can choose to disable cookies through your browser settings, but this may affect system functionality.</p>
                    
                    <h6 class="mt-3">Contact Information</h6>
                    <p>If you have any questions, concerns, or wish to exercise your rights under RA 10173, please contact the system administrator or data protection officer.</p>
                </div>

                <h6 class="mt-4 mb-3">Legal Framework</h6>
                <div class="border rounded p-3 bg-light">
                    <p><strong>Republic Act No. 10173 - Data Privacy Act of 2012</strong></p>
                    <p class="small text-muted">An Act Protecting Individual Personal Information in Information and Communications Systems in the Government and the Private Sector, Creating for this Purpose a National Privacy Commission, and for Other Purposes.</p>
                    <p class="small">This law aims to protect the fundamental human right to privacy while ensuring the free flow of information for innovation, growth, and national development.</p>
                </div>

                <div class="form-check mt-4 p-3 bg-light border rounded d-flex align-items-center" style="gap: 0.75rem;">
                    <input class="form-check-input m-0" type="checkbox" id="acceptTermsCheckbox" style="position: relative;">
                    <label class="form-check-label fw-semibold mb-0" for="acceptTermsCheckbox">
                        I have read and agree to the Terms and Conditions and Privacy Policy
                    </label>
                </div>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="acceptTermsBtn" disabled>
                    <i class="fas fa-check me-2"></i>Accept and Continue
                </button>
            </div>
        </div>
    </div>
</div>

<!-- View Record Modal -->
<div class="modal fade" id="viewModal" tabindex="-1" aria-labelledby="viewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewModalLabel">Record Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Mobile-friendly card layout -->
                <div class="d-block d-md-none">
                    <div class="card border-0">
                        <div class="card-body p-0">
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="info-item">
                                        <div class="small text-muted mb-1">Grave Number</div>
                                        <div id="viewGraveNumberMobile" class="fw-semibold text-primary"></div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="info-item">
                                        <div class="small text-muted mb-1">Burial Date</div>
                                        <div id="viewBurialDateMobile" class="fw-semibold"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="info-item mb-3">
                                <div class="small text-muted mb-1">Deceased Name</div>
                                <div id="viewDeceasedNameMobile" class="fw-semibold h5 text-dark"></div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="info-item">
                                        <div class="small text-muted mb-1">Date of Birth</div>
                                        <div id="viewDateOfBirthMobile" class="fw-semibold"></div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="info-item">
                                        <div class="small text-muted mb-1">Date of Death</div>
                                        <div id="viewDateOfDeathMobile" class="fw-semibold"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-12">
                                    <div class="info-item">
                                        <div class="small text-muted mb-1">Next of Kin</div>
                                        <div id="viewNextOfKinMobile" class="fw-semibold"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-12">
                                    <div class="info-item">
                                        <div class="small text-muted mb-1">Contact Info</div>
                                        <div id="viewContactInfoMobile" class="fw-semibold"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="info-item mb-3">
                                <div class="small text-muted mb-1">Notes</div>
                                <div id="viewNotesMobile" class="border rounded p-2 bg-light"></div>
                            </div>
                            <!-- Grave Photos - Mobile -->
                            <div id="viewImagesMobile" class="info-item" style="display: none;">
                                <div class="small text-muted mb-2">Grave Photos</div>
                                <div id="viewImagesGalleryMobile" class="row g-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Desktop layout -->
                <div class="d-none d-md-block">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="small text-muted">Grave Number</div>
                                <div id="viewGraveNumber" class="fw-semibold text-primary"></div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="info-item">
                                <div class="small text-muted">Deceased Name</div>
                                <div id="viewDeceasedName" class="fw-semibold h5"></div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="small text-muted">Date of Birth</div>
                                <div id="viewDateOfBirth"></div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="small text-muted">Date of Death</div>
                                <div id="viewDateOfDeath"></div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="small text-muted">Burial Date</div>
                                <div id="viewBurialDate"></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-item">
                                <div class="small text-muted">Next of Kin</div>
                                <div id="viewNextOfKin"></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-item">
                                <div class="small text-muted">Contact Info</div>
                                <div id="viewContactInfo"></div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="info-item">
                                <div class="small text-muted">Notes</div>
                                <div id="viewNotes" class="border rounded p-3 bg-light"></div>
                            </div>
                        </div>
                        <!-- Grave Photos - Desktop -->
                        <div class="col-12">
                            <div id="viewImages" class="info-item" style="display: none;">
                                <div class="small text-muted mb-2">Grave Photos</div>
                                <div id="viewImagesGallery" class="row g-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer d-flex flex-column flex-sm-row gap-2">
                <button type="button" class="btn btn-secondary flex-fill flex-sm-grow-0" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>Close
                </button>
                <button class="btn btn-info flex-fill flex-sm-grow-0" id="locateBtn" onclick="mapRecord()" title="Locate on map">
                    <i class="fas fa-map-marker-alt me-1"></i>Locate on Map
                </button>
            </div>
        </div>
    </div>
</div>