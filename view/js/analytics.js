/**
 * Cemetery System Analytics JavaScript
 * Handles all analytics dashboard functionality
 */

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.baseUrl = '../../api/analytics.php';
        this.authToken = localStorage.getItem('auth_token');
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
            const response = await fetch(`${this.baseUrl}/dashboard`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.renderDashboard(result.data);
                this.hideError();
            } else {
                throw new Error(result.error || 'Failed to load analytics data');
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
        this.renderOverviewCards(data.overview.data);
        this.renderMonthlyBurialsChart(data.monthly_burials.data);
        this.renderGraveUtilizationChart(data.grave_utilization.data);
        this.renderAgeGroupsChart(data.age_groups.data);
        this.renderWeeklyTrendsChart(data.weekly_trends.data);
        this.renderPerformanceMetrics(data.system_performance.data);
        this.renderSystemAlerts(data.alerts.data);
        this.renderRecentBurials(data.recent_burials.data);
        this.renderInfrastructureSummary(data.infrastructure.data);
        this.renderUserActivity(data.user_activity.data);
    }

    /**
     * Render overview cards
     */
    renderOverviewCards(overviewData) {
        const container = document.getElementById('overviewCards');
        container.innerHTML = '';

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
     * Create overview card element
     */
    createOverviewCard(title, value, icon, color) {
        const col = document.createElement('div');
        col.className = 'col-xl-2 col-md-4 col-sm-6 mb-4';

        col.innerHTML = `
            <div class="card border-left-${color} shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                            <div class="text-xs font-weight-bold text-${color} text-uppercase mb-1">${title}</div>
                            <div class="h5 mb-0 font-weight-bold text-gray-800">${value}</div>
                        </div>
                        <div class="col-auto">
                            <i class="${icon} fa-2x text-gray-300"></i>
                        </div>
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
     * Render performance metrics
     */
    renderPerformanceMetrics(data) {
        const container = document.getElementById('performanceMetrics');
        container.innerHTML = '';

        data.forEach(metric => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-3';

            const valueClass = this.getValueClass(metric.value_type, metric.metric_value);
            
            col.innerHTML = `
                <div class="card border-left-info shadow h-100">
                    <div class="card-body">
                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">${metric.metric_name}</div>
                        <div class="h6 mb-0 font-weight-bold text-gray-800">${metric.metric_value} ${this.getValueUnit(metric.value_type)}</div>
                        <div class="text-xs text-muted">${metric.metric_category}</div>
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
     * Render infrastructure summary
     */
    renderInfrastructureSummary(data) {
        const container = document.getElementById('infrastructureSummary');
        container.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-3 p-3 border rounded';
            
            div.innerHTML = `
                <div>
                    <h6 class="mb-1">${item.infrastructure_type}</h6>
                    <small class="text-muted">Recent additions: ${item.recent_additions}</small>
                </div>
                <div class="text-end">
                    <span class="h5 mb-0 text-primary">${item.count}</span>
                </div>
            `;

            container.appendChild(div);
        });
    }

    /**
     * Render user activity
     */
    renderUserActivity(data) {
        const container = document.getElementById('userActivitySummary');
        container.innerHTML = '';

        data.forEach(activity => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-3';

            col.innerHTML = `
                <div class="card border-left-success shadow h-100">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">${activity.role} Users</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${activity.total_users}</div>
                                <div class="text-xs text-muted">
                                    ${activity.new_users_7d} new this week | ${activity.new_users_30d} new this month
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-users fa-2x text-gray-300"></i>
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

        // Export data
        window.exportData = () => {
            const modal = new bootstrap.Modal(document.getElementById('exportModal'));
            modal.show();
        };

        window.performExport = () => {
            this.exportData();
        };
    }

    /**
     * Load monthly burials for specific period
     */
    async loadMonthlyBurials(months) {
        try {
            const response = await fetch(`${this.baseUrl}/monthly-burials?months=${months}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.renderMonthlyBurialsChart(result.data);
            }
        } catch (error) {
            console.error('Error loading monthly burials:', error);
        }
    }

    /**
     * Export data
     */
    async exportData() {
        const exportType = document.getElementById('exportType').value;
        const exportFormat = document.getElementById('exportFormat').value;

        try {
            const response = await fetch(`${this.baseUrl}/export?type=${exportType}&format=${exportFormat}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                if (exportFormat === 'csv') {
                    this.downloadCSV(result.data, result.filename);
                } else {
                    this.downloadJSON(result.data, result.filename);
                }
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
                modal.hide();
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
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
    
    // Load analytics data
    analyticsManager.loadAnalyticsData();
});




