/**
 * Cemetery System Analytics JavaScript
 * Handles all analytics dashboard functionality
 */

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.authManager = new AuthManager();
        this.analyticsAPI = this.authManager.API_CONFIG.baseURL + 'analytics.php';
    }

    /**
     * Initialize analytics dashboard
     */
    async init() {
        try {
            await this.loadAnalyticsData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
            this.showError('Failed to initialize analytics dashboard');
        }
    }

    /**
     * Load all analytics data
     */
    async loadAnalyticsData() {
        this.showLoading(true);
        
        try {

            const response = await axios.get(`${this.analyticsAPI}?action=getDashboardData`, {
                headers: this.authManager.API_CONFIG.getHeaders()
            });
            if (response.data.success) {
                this.renderDashboard(response.data.data);
                this.hideError();
            } else {
                throw new Error(response.data.error || 'Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render the complete dashboard
     */
    renderDashboard(data) {
        this.renderOverviewCards(data.overview || []);
        this.renderMonthlyBurialsChart(data.monthly_burials || []);
        this.renderGraveUtilizationChart(data.grave_utilization || []);
        this.renderAgeGroupsChart(data.age_groups || []);
        this.renderWeeklyTrendsChart(data.weekly_trends || []);
        this.renderPerformanceMetrics(data.system_performance || []);
        this.renderSystemAlerts(data.alerts || []);
        this.renderRecentBurials(data.recent_burials || []);
        this.renderInfrastructureSummary(data.infrastructure || []);
        this.renderUserActivity(data.user_activity || []);
    }

    /**
     * Render overview cards
     */
    renderOverviewCards(overviewData) {
        const container = document.getElementById('overviewCards');
        container.innerHTML = '';

        // Safety check for overviewData
        if (!overviewData || !Array.isArray(overviewData)) {
            console.warn('Overview data is not available or not an array:', overviewData);
            return;
        }

        const cardConfigs = [
            { key: 'Total Graves', icon: 'fas fa-cross', color: 'primary' },
            { key: 'Occupied Graves', icon: 'fas fa-user-injured', color: 'danger' },
            { key: 'Available Graves', icon: 'fas fa-plus-circle', color: 'success' },
            { key: 'Reserved Graves', icon: 'fas fa-clock', color: 'warning' },
            { key: 'Total Burial Records', icon: 'fas fa-book', color: 'info' },
            { key: 'Active Users', icon: 'fas fa-users', color: 'secondary' }
        ];

        cardConfigs.forEach(config => {
            const data = overviewData.find(item => item.metric_name === config.key);
            if (data) {
                const card = this.createOverviewCard(data.metric_name, data.metric_value, config.icon, config.color);
                container.appendChild(card);
            }
        });
    }

    /**
     * Create overview card element with enhanced design
     */
    createOverviewCard(title, value, icon, color) {
        const col = document.createElement('div');
        col.className = 'col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-4';

        // Enhanced color mapping for gradients
        const gradientColors = {
            'primary': 'bg-gradient-primary',
            'danger': 'bg-gradient-danger', 
            'success': 'bg-gradient-success',
            'warning': 'bg-gradient-warning',
            'info': 'bg-gradient-info',
            'secondary': 'bg-gradient-secondary'
        };

        const textColors = {
            'primary': 'text-primary',
            'danger': 'text-danger',
            'success': 'text-success', 
            'warning': 'text-warning',
            'info': 'text-info',
            'secondary': 'text-secondary'
        };

        col.innerHTML = `
            <div class="card border-1 h-100 overflow-hidden position-relative">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                            <div class="text-uppercase text-muted small fw-bold mb-2">${title}</div>
                            <div class="h3 mb-0 fw-bold ${textColors[color]}">${value}</div>
                        </div>
                        <div class="position-relative">
                            <div class="icon-circle ${gradientColors[color]} text-white d-flex align-items-center justify-content-center">
                                <i class="${icon} fa-lg"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0 p-3">
                    <div class="progress" style="height: 4px;">
                        <div class="progress-bar ${gradientColors[color]}" role="progressbar" style="width: 75%"></div>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    /**
     * Render monthly burials chart
     */
    renderMonthlyBurialsChart(data) {
        const ctx = document.getElementById('monthlyBurialsChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.monthlyBurials) {
            this.charts.monthlyBurials.destroy();
        }

        // Safety check for data
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('Monthly burials data is not available or empty:', data);
            return;
        }

        const labels = data.map(item => `${item.month_name} ${item.year}`);
        const burialsData = data.map(item => item.total_burials);
        const avgDelayData = data.map(item => item.avg_days_to_burial || 0);

        this.charts.monthlyBurials = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.reverse(),
                datasets: [{
                    label: 'Total Burials',
                    data: burialsData.reverse(),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y'
                }, {
                    label: 'Avg Burial Delay (days)',
                    data: avgDelayData.reverse(),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Burials'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Average Delay (days)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Monthly Burial Trends and Average Delay'
                    }
                }
            }
        });
    }

    /**
     * Render grave utilization chart
     */
    renderGraveUtilizationChart(data) {
        const ctx = document.getElementById('graveUtilizationChart').getContext('2d');
        
        if (this.charts.graveUtilization) {
            this.charts.graveUtilization.destroy();
        }

        // Safety check for data
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('Grave utilization data is not available or empty:', data);
            return;
        }

        const labels = data.map(item => item.status);
        const counts = data.map(item => item.count);
        const colors = {
            'occupied': '#e74a3b',
            'available': '#1cc88a',
            'reserved': '#f6c23e'
        };

        this.charts.graveUtilization = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: labels.map(label => colors[label] || '#6c757d'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render age groups chart
     */
    renderAgeGroupsChart(data) {
        const ctx = document.getElementById('ageGroupsChart').getContext('2d');
        
        if (this.charts.ageGroups) {
            this.charts.ageGroups.destroy();
        }

        // Safety check for data
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('Age groups data is not available or empty:', data);
            return;
        }

        const labels = data.map(item => item.age_group);
        const counts = data.map(item => item.count);
        const percentages = data.map(item => item.percentage);

        this.charts.ageGroups = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Burials',
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Burials'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Age Groups'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                return `Percentage: ${percentages[index]}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render weekly trends chart
     */
    renderWeeklyTrendsChart(data) {
        const ctx = document.getElementById('weeklyTrendsChart').getContext('2d');
        
        if (this.charts.weeklyTrends) {
            this.charts.weeklyTrends.destroy();
        }

        // Safety check for data
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('Weekly trends data is not available or empty:', data);
            return;
        }

        const labels = data.map(item => {
            const date = new Date(item.week_start);
            return date.toLocaleDateString();
        });
        const burialsData = data.map(item => item.burials_count);

        this.charts.weeklyTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.reverse(),
                datasets: [{
                    label: 'Weekly Burials',
                    data: burialsData.reverse(),
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Burials'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Week Starting'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * Render performance metrics with enhanced design
     */
    renderPerformanceMetrics(data) {
        const container = document.getElementById('performanceMetrics');
        container.innerHTML = '';

        if (!data || !Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="fas fa-chart-bar fa-3x mb-3"></i><p>No performance metrics available</p></div>';
            return;
        }

        data.forEach((metric, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-3';

            const valueClass = this.getValueClass(metric.value_type, metric.metric_value);
            const progressValue = this.calculateProgressValue(metric.metric_value, metric.value_type);
            
            col.innerHTML = `
                <div class="card border-1 h-100">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="flex-grow-1">
                                <h6 class="card-title text-muted small fw-bold text-uppercase mb-1">${metric.metric_name}</h6>
                                <div class="h4 mb-0 fw-bold ${valueClass}">${metric.metric_value} ${this.getValueUnit(metric.value_type)}</div>
                            </div>
                            <div class="icon-circle bg-light text-primary d-flex align-items-center justify-content-center">
                                <i class="fas fa-tachometer-alt fa-sm"></i>
                            </div>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">${metric.metric_category}</small>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-gradient-primary" role="progressbar" style="width: ${progressValue}%"></div>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(col);
        });
    }

    /**
     * Render system alerts
     */
    renderSystemAlerts(data) {
        const container = document.getElementById('systemAlerts');
        
        if (data.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No alerts at this time</p>';
            return;
        }

        container.innerHTML = '';

        data.forEach(alert => {
            const alertClass = this.getAlertClass(alert.alert_level);
            
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show mb-2`;
            
            alertDiv.innerHTML = `
                <strong>${alert.alert_type}:</strong> ${alert.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

            container.appendChild(alertDiv);
        });
    }

    /**
     * Render recent burials table
     */
    renderRecentBurials(data) {
        const tbody = document.querySelector('#recentBurialsTable tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent burials</td></tr>';
            return;
        }

        data.forEach(burial => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${burial.deceased_name}</td>
                <td>${new Date(burial.burial_date).toLocaleDateString()}</td>
                <td>${burial.grave_number}</td>
                <td>${burial.next_of_kin || 'N/A'}</td>
                <td>
                    <span class="badge bg-${burial.days_since_burial <= 7 ? 'success' : burial.days_since_burial <= 14 ? 'warning' : 'secondary'}">
                        ${burial.days_since_burial} days
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Render infrastructure summary with enhanced design
     */
    renderInfrastructureSummary(data) {
        const container = document.getElementById('infrastructureSummary');
        container.innerHTML = '';

        if (!data || !Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-building fa-3x mb-3"></i><p>No infrastructure data available</p></div>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'infrastructure-item mb-4 p-3 border-0 rounded-3 shadow-sm';
            
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <div class="icon-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center">
                                <i class="fas fa-building fa-sm"></i>
                            </div>
                            <h6 class="mb-0 fw-bold">${item.infrastructure_type}</h6>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-plus-circle me-1"></i>Recent additions: ${item.recent_additions}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="h4 mb-0 text-primary fw-bold">${item.count}</span>
                    </div>
                </div>
            `;

            container.appendChild(div);
        });
    }

    /**
     * Render user activity with enhanced design
     */
    renderUserActivity(data) {
        const container = document.getElementById('userActivitySummary');
        container.innerHTML = '';

        if (!data || !Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="fas fa-users fa-3x mb-3"></i><p>No user activity data available</p></div>';
            return;
        }

        data.forEach(activity => {
            const col = document.createElement('div');
            col.className = 'col-lg-6 col-md-12 mb-4';

            col.innerHTML = `
                <div class="card shadow-lg border-0 h-100">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="flex-grow-1">
                                <h6 class="card-title text-success fw-bold text-uppercase mb-1">${activity.role} Users</h6>
                                <div class="h3 mb-0 fw-bold text-dark">${activity.total_users}</div>
                            </div>
                            <div class="icon-circle bg-gradient-success text-white d-flex align-items-center justify-content-center">
                                <i class="fas fa-users fa-lg"></i>
                            </div>
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <div class="text-center p-2 bg-light rounded">
                                    <div class="small text-muted">This Week</div>
                                    <div class="fw-bold text-success">${activity.new_users_7d}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="text-center p-2 bg-light rounded">
                                    <div class="small text-muted">This Month</div>
                                    <div class="fw-bold text-primary">${activity.new_users_30d}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(col);
        });
    }

    /**
     * Utility methods
     */
    getValueClass(type, value) {
        switch (type) {
            case 'percentage':
                return value > 80 ? 'text-danger' : value > 60 ? 'text-warning' : 'text-success';
            case 'days':
                return value > 10 ? 'text-warning' : 'text-success';
            default:
                return 'text-gray-800';
        }
    }

    calculateProgressValue(value, type) {
        const numValue = parseFloat(value) || 0;
        switch (type) {
            case 'percentage':
                return Math.min(numValue, 100);
            case 'days':
                return Math.min((numValue / 30) * 100, 100);
            case 'count':
                return Math.min((numValue / 100) * 100, 100);
            default:
                return Math.min((numValue / 50) * 100, 100);
        }
    }

    getValueUnit(type) {
        switch (type) {
            case 'percentage': return '%';
            case 'days': return 'days';
            case 'count': return '';
            default: return '';
        }
    }

    getAlertClass(level) {
        switch (level) {
            case 'danger': return 'danger';
            case 'warning': return 'warning';
            case 'success': return 'success';
            case 'info': return 'info';
            default: return 'secondary';
        }
    }

    /**
     * Show/hide loading spinner
     */
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorAlert && errorMessage) {
            errorMessage.textContent = message;
            errorAlert.style.display = 'block';
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorAlert = document.getElementById('errorAlert');
        if (errorAlert) {
            errorAlert.style.display = 'none';
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Create a temporary success alert
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        successAlert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        successAlert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(successAlert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successAlert.parentNode) {
                successAlert.remove();
            }
        }, 5000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Chart period change
        window.changeChartPeriod = (months) => {
            this.loadMonthlyBurials(months);
        };

        // Refresh analytics
        window.refreshAnalytics = () => {
            this.loadAnalyticsData();
        };

        // Export data - open modal
        window.exportData = () => {
            try {
                const modalElement = document.getElementById('exportModal');
                if (!modalElement) {
                    console.error('Export modal element not found');
                    return;
                }
                
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    // Check if modal is already initialized
                    let modal = bootstrap.Modal.getInstance(modalElement);
                    if (!modal) {
                        modal = new bootstrap.Modal(modalElement, {
                            backdrop: true,
                            keyboard: true,
                            focus: true
                        });
                    }
                    modal.show();
                }, 100);
            } catch (error) {
                console.error('Error opening export modal:', error);
                alert('Error opening export modal. Please try again.');
            }
        };

        // Perform export
        window.performExport = () => {
            this.performDataExport();
        };
    }

    /**
     * Load monthly burials for specific period
     */
    async loadMonthlyBurials(months) {
        try {
            const response = await axios.get(`${this.analyticsAPI}?action=getMonthlyBurials&months=${months}`, {
                headers: this.authManager.API_CONFIG.getHeaders()
            });

            if (response.data.success) {
                this.renderMonthlyBurialsChart(response.data.data);
            }
        } catch (error) {
            console.error('Error loading monthly burials:', error);
        }
    }

    /**
     * Export data
     */
    async performDataExport() {
        const exportType = document.getElementById('exportType').value;
        const exportFormat = document.getElementById('exportFormat').value;

        try {
            const url = `${this.analyticsAPI}?action=exportData&type=${exportType}&format=${exportFormat}`;
            console.log('Export URL:', url);
            
            const response = await axios.get(url, {
                headers: this.authManager.API_CONFIG.getHeaders()
            });

            console.log('Export response:', response.data);

            if (response.data.success) {
                if (exportFormat === 'csv') {
                    this.downloadCSV(response.data.data, response.data.filename);
                } else {
                    this.downloadJSON(response.data.data, response.data.filename);
                }
                
                // Show success message
                this.showSuccess('Data exported successfully!');
                
                // Close modal
                const modalElement = document.getElementById('exportModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            } else {
                throw new Error(response.data.message || 'Export failed');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            let errorMessage = 'Failed to export data';
            
            if (error.response) {
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
                console.error('Server response:', error.response.data);
            } else if (error.request) {
                errorMessage = 'Network error: Unable to connect to server';
            } else {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Download CSV file
     */
    downloadCSV(data, filename) {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Download JSON file
     */
    downloadJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.csv', '.json');
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Initialize analytics manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const analyticsManager = new AnalyticsManager();
    window.analyticsManager = analyticsManager;
    
    // Initialize the analytics manager (this will call setupEventListeners)
    analyticsManager.init();
});
