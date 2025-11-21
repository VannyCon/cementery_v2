<?php
require_once('../connection/connection.php');

class AnalyticsService extends config {
    
    /**
     * Get cemetery overview statistics
     */
    public function getCemeteryOverview() {
        try {
            $query = "SELECT * FROM vw_cemetery_overview ORDER BY metric_type, metric_name";
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
            $query = "SELECT * FROM vw_monthly_burials LIMIT ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$months]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get monthly burials error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get burial records by age group
     */
    public function getBurialsByAgeGroup() {
        try {
            $query = "SELECT * FROM vw_burials_by_age_group";
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
            $query = "SELECT * FROM vw_recent_burials LIMIT 20";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get recent burials error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get grave utilization statistics
     */
    public function getGraveUtilization() {
        try {
            $query = "SELECT * FROM vw_grave_utilization";
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
            $query = "SELECT * FROM vw_graves_by_period";
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
            $query = "SELECT * FROM vw_user_activity";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get user activity error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get infrastructure summary
     */
    public function getInfrastructureSummary() {
        try {
            $query = "SELECT * FROM vw_infrastructure_summary";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get infrastructure summary error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get weekly burial trends
     */
    public function getWeeklyBurialTrends($weeks = 12) {
        try {
            $query = "SELECT * FROM vw_weekly_burial_trends LIMIT ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$weeks]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get weekly burial trends error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get system performance metrics
     */
    public function getSystemPerformance() {
        try {
            $query = "SELECT * FROM vw_system_performance";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get system performance error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get system alerts
     */
    public function getSystemAlerts() {
        try {
            $query = "SELECT * FROM vw_system_alerts";
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
                'age_groups' => $this->getBurialsByAgeGroup(),
                'grave_utilization' => $this->getGraveUtilization(),
                'recent_burials' => $this->getRecentBurials(7),
                'weekly_trends' => $this->getWeeklyBurialTrends(8),
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
     * Get custom analytics with date range
     */
    public function getCustomAnalytics($startDate, $endDate, $type = 'burial') {
        try {
            switch ($type) {
                case 'burial':
                    $query = "SELECT 
                                DATE(burial_date) as date,
                                COUNT(*) as count,
                                AVG(DATEDIFF(burial_date, date_of_death)) as avg_delay
                              FROM tbl_burial_records 
                              WHERE burial_date BETWEEN ? AND ?
                              GROUP BY DATE(burial_date)
                              ORDER BY date DESC";
                    break;
                case 'grave':
                    $query = "SELECT 
                                DATE(created_at) as date,
                                COUNT(*) as count,
                                COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied
                              FROM tbl_grave_plots 
                              WHERE created_at BETWEEN ? AND ?
                              GROUP BY DATE(created_at)
                              ORDER BY date DESC";
                    break;
                default:
                    throw new Exception("Invalid analytics type");
            }

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$startDate, $endDate]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
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
                    $query = "SELECT * FROM tbl_burial_records ORDER BY burial_date DESC";
                    $filename = 'burial_records_' . date('Y-m-d') . '.csv';
                    break;
                case 'grave_utilization':
                    $query = "SELECT * FROM vw_grave_utilization";
                    $filename = 'grave_utilization_' . date('Y-m-d') . '.csv';
                    break;
                case 'monthly_statistics':
                    $query = "SELECT * FROM vw_monthly_burials";
                    $filename = 'monthly_statistics_' . date('Y-m-d') . '.csv';
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
        }
    }
}
?>
