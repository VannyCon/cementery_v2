<?php
require_once('../connection/connection.php');

class AnalyticsService extends config {
    
    /**
     * Get cemetery overview statistics
     */
    public function getCemeteryOverview() {
        try {
            $query = "
                SELECT 
                    'Total Burials' as metric_name,
                    'burial' as metric_type,
                    COUNT(*) as metric_value
                FROM tbl_burial_records
                UNION ALL
                SELECT 
                    'Total Grave Plots' as metric_name,
                    'grave' as metric_type,
                    COUNT(*) as metric_value
                FROM tbl_grave_plots
                UNION ALL
                SELECT 
                    'Total Users' as metric_name,
                    'user' as metric_type,
                    COUNT(*) as metric_value
                FROM tbl_users
                UNION ALL
                SELECT 
                    'Burials This Month' as metric_name,
                    'burial' as metric_type,
                    COUNT(*) as metric_value
                FROM tbl_burial_records
                WHERE MONTH(burial_date) = MONTH(CURRENT_DATE())
                    AND YEAR(burial_date) = YEAR(CURRENT_DATE())
                UNION ALL
                SELECT 
                    'Burials This Year' as metric_name,
                    'burial' as metric_type,
                    COUNT(*) as metric_value
                FROM tbl_burial_records
                WHERE YEAR(burial_date) = YEAR(CURRENT_DATE())
                ORDER BY metric_type, metric_name
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get cemetery overview error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get monthly burial statistics
     */
    public function getMonthlyBurials($months = 12) {
        try {
            $query = "
                SELECT 
                    month,
                    total_burials
                FROM view_monthly_burials
                ORDER BY month DESC
                LIMIT ?
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(1, (int)$months, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get monthly burials error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get burial records by age group
     * Calculates age from date_of_birth and date_of_death
     */
    public function getBurialsByAgeGroup() {
        try {
            $query = "
                SELECT 
                    CASE 
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) < 1 THEN 'Infant (<1)'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) BETWEEN 1 AND 12 THEN 'Child (1-12)'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) BETWEEN 13 AND 17 THEN 'Teen (13-17)'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) BETWEEN 18 AND 40 THEN 'Young Adult (18-40)'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) BETWEEN 41 AND 60 THEN 'Middle Age (41-60)'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) BETWEEN 61 AND 80 THEN 'Senior (61-80)'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death) > 80 THEN 'Elderly (>80)'
                        ELSE 'Unknown'
                    END as age_group,
                    COUNT(*) as count,
                    AVG(TIMESTAMPDIFF(YEAR, date_of_birth, date_of_death)) as avg_age
                FROM tbl_burial_records
                WHERE date_of_birth IS NOT NULL AND date_of_death IS NOT NULL
                GROUP BY age_group
                ORDER BY 
                    CASE age_group
                        WHEN 'Infant (<1)' THEN 1
                        WHEN 'Child (1-12)' THEN 2
                        WHEN 'Teen (13-17)' THEN 3
                        WHEN 'Young Adult (18-40)' THEN 4
                        WHEN 'Middle Age (41-60)' THEN 5
                        WHEN 'Senior (61-80)' THEN 6
                        WHEN 'Elderly (>80)' THEN 7
                        ELSE 8
                    END
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get burials by age group error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get recent burials
     */
    public function getRecentBurials($days = 30) {
        try {
            $query = "
                SELECT 
                    id,
                    deceased_name,
                    date_of_birth,
                    date_of_death,
                    burial_date,
                    grave_number,
                    grave_layer_number,
                    next_of_kin,
                    contact_info,
                    created_at
                FROM tbl_burial_records
                WHERE burial_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
                ORDER BY burial_date DESC, created_at DESC
                LIMIT 20
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(1, (int)$days, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get recent burials error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get grave utilization statistics using view_grave_occupancy
     */
    public function getGraveUtilization() {
        try {
            $query = "
                SELECT 
                    grave_number,
                    total_deceased,
                    max_layer_used,
                    CASE 
                        WHEN max_layer_used >= 3 THEN 'Fully Occupied'
                        WHEN max_layer_used = 2 THEN 'Partially Occupied'
                        WHEN max_layer_used = 1 THEN 'Single Layer'
                        ELSE 'Available'
                    END as utilization_status
                FROM view_grave_occupancy
                ORDER BY total_deceased DESC, grave_number
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get grave utilization error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get graves by creation period
     */
    public function getGravesByPeriod() {
        try {
            $query = "
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as period,
                    COUNT(*) as grave_count
                FROM tbl_grave_plots
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY period DESC
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get graves by period error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user activity summary
     */
    public function getUserActivity() {
        try {
            $query = "
                SELECT 
                    role,
                    COUNT(*) as user_count,
                    MIN(created_at) as first_user_date,
                    MAX(created_at) as latest_user_date
                FROM tbl_users
                GROUP BY role
                ORDER BY role
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get user activity error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get daily burial statistics using view_daily_burials
     */
    public function getDailyBurials($days = 30) {
        try {
            $query = "
                SELECT 
                    burial_date,
                    total_burials
                FROM view_daily_burials
                WHERE burial_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
                ORDER BY burial_date DESC
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(1, (int)$days, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get daily burials error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get burials with location data using view_burial_with_location
     */
    public function getBurialsWithLocation($limit = 100) {
        try {
            $query = "
                SELECT 
                    id,
                    deceased_name,
                    date_of_birth,
                    date_of_death,
                    burial_date,
                    grave_number,
                    grave_layer_number,
                    ST_X(location) as longitude,
                    ST_Y(location) as latitude,
                    created_at
                FROM view_burial_with_location
                WHERE location IS NOT NULL
                ORDER BY burial_date DESC, created_at DESC
                LIMIT ?
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(1, (int)$limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get burials with location error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get weekly burial trends
     */
    public function getWeeklyBurialTrends($weeks = 12) {
        try {
            $query = "
                SELECT 
                    YEARWEEK(burial_date) as week_year,
                    DATE_FORMAT(MIN(burial_date), '%Y-%m-%d') as week_start,
                    COUNT(*) as total_burials
                FROM tbl_burial_records
                WHERE burial_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? WEEK)
                GROUP BY YEARWEEK(burial_date)
                ORDER BY week_year DESC
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(1, (int)$weeks, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get weekly burial trends error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get infrastructure summary (grave plots statistics)
     */
    public function getInfrastructureSummary() {
        try {
            $query = "
                SELECT 
                    COUNT(DISTINCT gp.id) as total_plots,
                    COUNT(DISTINCT br.grave_id_fk) as occupied_plots,
                    COUNT(DISTINCT gp.id) - COUNT(DISTINCT br.grave_id_fk) as available_plots,
                    COUNT(br.id) as total_burials,
                    MAX(br.grave_layer_number) as max_layers_used
                FROM tbl_grave_plots gp
                LEFT JOIN tbl_burial_records br ON gp.id = br.grave_id_fk
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get infrastructure summary error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get system performance metrics
     */
    public function getSystemPerformance() {
        try {
            $query = "
                SELECT 
                    'Total Records' as metric,
                    COUNT(*) as value,
                    'records' as unit
                FROM tbl_burial_records
                UNION ALL
                SELECT 
                    'Database Size (Approx)' as metric,
                    COUNT(*) as value,
                    'records' as unit
                FROM tbl_burial_records
                UNION ALL
                SELECT 
                    'Active Grave Plots' as metric,
                    COUNT(*) as value,
                    'plots' as unit
                FROM tbl_grave_plots
                UNION ALL
                SELECT 
                    'Registered Users' as metric,
                    COUNT(*) as value,
                    'users' as unit
                FROM tbl_users
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get system performance error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get system alerts (e.g., graves at capacity, upcoming anniversaries)
     */
    public function getSystemAlerts() {
        try {
            $query = "
                SELECT 
                    'Graves at Capacity' as alert_type,
                    grave_number as alert_item,
                    CONCAT('Grave ', grave_number, ' has reached capacity (', max_layer_used, ' layers)') as alert_message,
                    'warning' as alert_level
                FROM view_grave_occupancy
                WHERE max_layer_used >= 3
                UNION ALL
                SELECT 
                    'Recent Burial' as alert_type,
                    grave_number as alert_item,
                    CONCAT('Recent burial: ', deceased_name, ' on ', DATE_FORMAT(burial_date, '%Y-%m-%d')) as alert_message,
                    'info' as alert_level
                FROM tbl_burial_records
                WHERE burial_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
                ORDER BY alert_type, alert_item
                LIMIT 20
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get system alerts error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get comprehensive dashboard data
     */
    public function getDashboardData() {
        try {
            $dashboardData = [
                'overview' => $this->getCemeteryOverview(),
                'monthly_burials' => $this->getMonthlyBurials(6),
                'daily_burials' => $this->getDailyBurials(30),
                'age_groups' => $this->getBurialsByAgeGroup(),
                'grave_utilization' => $this->getGraveUtilization(),
                'grave_occupancy' => $this->getGraveOccupancy(),
                'recent_burials' => $this->getRecentBurials(7),
                'weekly_trends' => $this->getWeeklyBurialTrends(8),
                'infrastructure' => $this->getInfrastructureSummary(),
                'user_activity' => $this->getUserActivity(),
                'system_performance' => $this->getSystemPerformance(),
                'alerts' => $this->getSystemAlerts()
            ];

            return [
                'success' => true,
                'data' => $dashboardData
            ];
        } catch (Exception $e) {
            error_log("Get dashboard data error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to load dashboard data: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get grave occupancy using view_grave_occupancy
     */
    public function getGraveOccupancy() {
        try {
            $query = "
                SELECT 
                    grave_number,
                    total_deceased,
                    max_layer_used
                FROM view_grave_occupancy
                ORDER BY grave_number
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get grave occupancy error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get custom analytics with date range
     */
    public function getCustomAnalytics($startDate, $endDate, $type = 'burial') {
        try {
            switch ($type) {
                case 'burial':
                    $query = "
                        SELECT 
                            DATE(burial_date) as date,
                            COUNT(*) as count,
                            AVG(DATEDIFF(burial_date, date_of_death)) as avg_delay
                        FROM tbl_burial_records 
                        WHERE burial_date BETWEEN ? AND ?
                        GROUP BY DATE(burial_date)
                        ORDER BY date DESC
                    ";
                    break;
                case 'grave':
                    $query = "
                        SELECT 
                            DATE(created_at) as date,
                            COUNT(*) as count
                        FROM tbl_grave_plots 
                        WHERE created_at BETWEEN ? AND ?
                        GROUP BY DATE(created_at)
                        ORDER BY date DESC
                    ";
                    break;
                case 'monthly':
                    $query = "
                        SELECT 
                            DATE_FORMAT(burial_date, '%Y-%m') as month,
                            COUNT(*) as count
                        FROM tbl_burial_records
                        WHERE burial_date BETWEEN ? AND ?
                        GROUP BY DATE_FORMAT(burial_date, '%Y-%m')
                        ORDER BY month DESC
                    ";
                    break;
                default:
                    throw new Exception("Invalid analytics type. Use 'burial', 'grave', or 'monthly'");
            }

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$startDate, $endDate]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get custom analytics error: " . $e->getMessage());
            return [];
        } catch (Exception $e) {
            error_log("Get custom analytics error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Export analytics data to CSV format
     */
    public function exportAnalyticsData($type, $format = 'csv') {
        try {
            $filename = '';
            
            switch ($type) {
                case 'burial_records':
                    $query = "
                        SELECT 
                            id,
                            deceased_name,
                            date_of_birth,
                            date_of_death,
                            burial_date,
                            grave_number,
                            grave_layer_number,
                            next_of_kin,
                            contact_info,
                            created_at
                        FROM tbl_burial_records 
                        ORDER BY burial_date DESC
                    ";
                    $filename = 'burial_records_' . date('Y-m-d') . '.csv';
                    break;
                case 'grave_utilization':
                    $query = "
                        SELECT 
                            grave_number,
                            total_deceased,
                            max_layer_used
                        FROM view_grave_occupancy
                        ORDER BY grave_number
                    ";
                    $filename = 'grave_utilization_' . date('Y-m-d') . '.csv';
                    break;
                case 'monthly_statistics':
                    $query = "
                        SELECT 
                            month,
                            total_burials
                        FROM view_monthly_burials
                        ORDER BY month DESC
                    ";
                    $filename = 'monthly_statistics_' . date('Y-m-d') . '.csv';
                    break;
                case 'daily_burials':
                    $query = "
                        SELECT 
                            burial_date,
                            total_burials
                        FROM view_daily_burials
                        ORDER BY burial_date DESC
                    ";
                    $filename = 'daily_burials_' . date('Y-m-d') . '.csv';
                    break;
                default:
                    throw new Exception("Invalid export type");
            }

            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($format === 'csv') {
                return [
                    'success' => true,
                    'data' => $data,
                    'filename' => $filename,
                    'format' => 'csv'
                ];
            }
            
            return [
                'success' => true,
                'data' => $data
            ];
        } catch (PDOException $e) {
            error_log("Export analytics data error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to export data: ' . $e->getMessage()
            ];
        } catch (Exception $e) {
            error_log("Export analytics data error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to export data: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get statistics summary for quick overview
     */
    public function getStatisticsSummary() {
        try {
            $query = "
                SELECT 
                    (SELECT COUNT(*) FROM tbl_burial_records) as total_burials,
                    (SELECT COUNT(*) FROM tbl_grave_plots) as total_plots,
                    (SELECT COUNT(*) FROM tbl_users) as total_users,
                    (SELECT COUNT(*) FROM tbl_burial_records WHERE YEAR(burial_date) = YEAR(CURRENT_DATE())) as burials_this_year,
                    (SELECT COUNT(*) FROM tbl_burial_records WHERE MONTH(burial_date) = MONTH(CURRENT_DATE()) AND YEAR(burial_date) = YEAR(CURRENT_DATE())) as burials_this_month,
                    (SELECT COUNT(DISTINCT grave_id_fk) FROM tbl_burial_records) as occupied_plots,
                    (SELECT MAX(grave_layer_number) FROM tbl_burial_records) as max_layers_used
            ";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get statistics summary error: " . $e->getMessage());
            return [];
        }
    }
}
?>
