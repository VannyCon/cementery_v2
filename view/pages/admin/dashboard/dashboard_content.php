
<!-- Include Dashboard Enhancement Styles -->
<link rel="stylesheet" href="../../../css/dashboard-enhancements.css">
<!-- PDF Export Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<div class="container-fluid px-3 dashboard-container">
    <div class="card">
        <div class="card-header bg-gradient-primary">
            <div class="text-white py-3">
                <div class="container-fluid">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 class="h2 mb-1 fw-bold">
                                <i class="fas fa-chart-line me-3"></i>Analytics Dashboard
                            </h1>
                            <p class="mb-0 opacity-75">Comprehensive overview of cemetery system performance and statistics</p>
                        </div>
                        <div class="d-flex gap-3">
                            <button class="btn btn-light btn-sm shadow-sm" onclick="refreshAnalytics()">
                                <i class="fas fa-sync-alt me-2"></i>Refresh Data
                            </button>
                            <button class="btn btn-success btn-sm shadow-sm" onclick="exportData()">
                                <i class="fas fa-download me-2"></i>Export Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <div class="card-body">
                    <!-- Loading Spinner -->
                    <div id="loadingSpinner" class="text-center py-5" style="display: none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 text-muted">Loading analytics data...</p>
                    </div>

                    <!-- Error Alert -->
                    <div id="errorAlert" class="alert alert-danger" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="errorMessage"></span>
                    </div>

                    <!-- Overview Cards with Enhanced Design -->
                    <div class="row g-4 mb-2" id="overviewCards">
                        <!-- Cards will be populated by JavaScript -->
                    </div>

                    <!-- Main Charts Section -->
                    <div class="row g-4 mb-2">
                        <!-- Monthly Burials Chart - Enhanced -->
                        <div class="col-xl-12">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-info text-white py-3 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-chart-line me-2"></i>
                                        <h6 class="m-0 fw-bold">Monthly Burial Trends</h6>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-calendar-alt me-1"></i>Last 12 months
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="changeChartPeriod(6)"><i class="fas fa-clock me-2"></i>Last 6 months</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="changeChartPeriod(12)"><i class="fas fa-calendar me-2"></i>Last 12 months</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="changeChartPeriod(24)"><i class="fas fa-calendar-check me-2"></i>Last 24 months</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div class="chart-container" style="position: relative; height: 350px;">
                                        <canvas id="monthlyBurialsChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Grave Utilization Chart - Enhanced -->
                        <div class="col-xl-4 col-lg-5" style="display: none;">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-success text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-chart-pie me-2"></i>
                                        <h6 class="m-0 fw-bold">Grave Utilization</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div class="chart-container" style="position: relative; height: 350px;">
                                        <canvas id="graveUtilizationChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Secondary Charts Section -->
                    <div class="row g-4 mb-2">
                        <!-- Age Groups Chart - Enhanced -->
                        <div class="col-xl-6 col-lg-6">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-warning text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-chart-bar me-2"></i>
                                        <h6 class="m-0 fw-bold">Burials by Age Group</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div class="chart-container" style="position: relative; height: 300px;">
                                        <canvas id="ageGroupsChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Weekly Trends Chart - Enhanced -->
                        <div class="col-xl-6 col-lg-6">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-danger text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-chart-area me-2"></i>
                                        <h6 class="m-0 fw-bold">Weekly Burial Trends</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div class="chart-container" style="position: relative; height: 300px;">
                                        <canvas id="weeklyTrendsChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row g-4 mb-2" style="display: none;">
                        <!-- System Performance - Enhanced -->
                        <div class="col-xl-8 col-lg-7">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-secondary text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-tachometer-alt me-2"></i>
                                        <h6 class="m-0 fw-bold">System Performance Metrics</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div class="row g-3" id="performanceMetrics">
                                        <!-- Performance metrics will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- System Alerts - Enhanced -->
                        <div class="col-xl-4 col-lg-5">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-dark text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        <h6 class="m-0 fw-bold">System Alerts</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div id="systemAlerts" class="alert-container">
                                        <!-- Alerts will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Burials and Infrastructure Section -->
                    <div class="row g-4 mb-2">
                        <!-- Recent Burials - Enhanced -->
                        <div class="col-xl-12 col-lg-12">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-primary text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-list-alt me-2"></i>
                                        <h6 class="m-0 fw-bold">Recent Burials (Last 7 days)</h6>
                                    </div>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover mb-0" id="recentBurialsTable">
                                            <thead class="table-light">
                                                <tr>
                                                    <th class="border-1 px-4 py-3"><i class="fas fa-user me-2"></i>Deceased Name</th>
                                                    <th class="border-1 px-4 py-3"><i class="fas fa-calendar me-2"></i>Burial Date</th>
                                                    <th class="border-1 px-4 py-3"><i class="fas fa-map-marker-alt me-2"></i>Grave Number</th>
                                                    <th class="border-1 px-4 py-3"><i class="fas fa-users me-2"></i>Next of Kin</th>
                                                    <th class="border-1 px-4 py-3"><i class="fas fa-clock me-2"></i>Days Since</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <!-- Table rows will be populated by JavaScript -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Infrastructure Summary - Enhanced -->
                        <div class="col-xl-4 col-lg-5" style="display: none;">
                            <div class="card border-1 h-100">
                                <div class="card-header bg-gradient-info text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-building me-2"></i>
                                        <h6 class="m-0 fw-bold">Infrastructure Summary</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div id="infrastructureSummary">
                                        <!-- Infrastructure data will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User Activity Section -->
                    <div class="row g-4 mb-2" style="display: none;">
                        <div class="col-12">
                            <div class="card border-1">
                                <div class="card-header bg-gradient-success text-white py-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-users me-2"></i>
                                        <h6 class="m-0 fw-bold">User Activity Summary</h6>
                                    </div>
                                </div>
                                <div class="card-body p-4">
                                    <div class="row g-4" id="userActivitySummary">
                                        <!-- User activity will be populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal fade" id="exportModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content border-1">
                                <div class="modal-header bg-gradient-primary text-white">
                                    <h5 class="modal-title fw-bold">
                                        <i class="fas fa-download me-2"></i>Export Analytics Data
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body p-5 text-center">
                                    <div class="mb-4">
                                        <i class="fas fa-file-pdf text-danger" style="font-size: 4rem;"></i>
                                    </div>
                                    <h5 class="mb-3 fw-bold">Export Complete Dashboard Report</h5>
                                    <p class="text-muted mb-4">
                                        Download a comprehensive PDF report containing all visible analytics data including:
                                    </p>
                                    <div class="row g-3 mb-4 text-start">
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-start">
                                                <i class="fas fa-chart-line text-primary me-2 mt-1"></i>
                                                <div>
                                                    <strong>Monthly Burial Trends</strong>
                                                    <p class="text-muted small mb-0">Chart showing burial statistics over time</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-start">
                                                <i class="fas fa-chart-bar text-info me-2 mt-1"></i>
                                                <div>
                                                    <strong>Age Group Statistics</strong>
                                                    <p class="text-muted small mb-0">Distribution of burials by age groups</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-start">
                                                <i class="fas fa-chart-area text-success me-2 mt-1"></i>
                                                <div>
                                                    <strong>Weekly Trends</strong>
                                                    <p class="text-muted small mb-0">Weekly burial activity trends</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-start">
                                                <i class="fas fa-table text-warning me-2 mt-1"></i>
                                                <div>
                                                    <strong>Recent Burials</strong>
                                                    <p class="text-muted small mb-0">Recent burial records table</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="alert alert-info mb-4">
                                        <i class="fas fa-info-circle me-2"></i>
                                        <small>The report will include all visible charts and tables. Hidden sections are automatically excluded.</small>
                                    </div>
                                </div>
                                <div class="modal-footer bg-light justify-content-center">
                                    <button type="button" class="btn btn-secondary me-3" data-bs-dismiss="modal">
                                        <i class="fas fa-times me-2"></i>Cancel
                                    </button>
                                    <button type="button" class="btn btn-primary btn-lg px-5" onclick="performExport()">
                                        <i class="fas fa-download me-2"></i>Download PDF Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    </div>
</div>


    