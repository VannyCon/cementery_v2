<?php
// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

require_once __DIR__ . '/../middleware/JWTMiddleware.php';
require_once('../services/AnalyticsService.php');

// Enable CORS for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_log("=== ANALYTICS API SCRIPT STARTED ===");
error_log("Current time: " . date('Y-m-d H:i:s'));
error_log("Request URI: " . $_SERVER['REQUEST_URI']);
error_log("Output buffering level: " . ob_get_level());

$middleware = new JWTMiddleware();
header('Content-Type: application/json');
$analyticsService = new AnalyticsService();

// Handle guest-accessible (read-only) operations first
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $action = $_GET['action'] ?? '';
    error_log("GET action received: " . $action);
    
    // Guest-accessible actions (no authentication required) - None for analytics
    // All analytics require authentication
}

// Require authentication for all analytics operations
$middleware->requireAuth(function() {
    error_log("Inside authenticated analytics callback");
    global $analyticsService;
    
    // Handle different actions based on HTTP method
    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $action = $_GET['action'] ?? '';
        error_log("GET action received: " . $action);
        
        switch ($action) {
            case 'getDashboardData':
                $result = $analyticsService->getDashboardData();
                echo json_encode($result);
                break;
                
            case 'getOverview':
                $overview = $analyticsService->getCemeteryOverview();
                echo json_encode(['success' => true, 'data' => $overview]);
                break;
                
            case 'getMonthlyBurials':
                $months = isset($_GET['months']) ? (int)$_GET['months'] : 12;
                $monthlyBurials = $analyticsService->getMonthlyBurials($months);
                echo json_encode(['success' => true, 'data' => $monthlyBurials]);
                break;
                
            case 'getAgeGroups':
                $ageGroups = $analyticsService->getBurialsByAgeGroup();
                echo json_encode(['success' => true, 'data' => $ageGroups]);
                break;
                
            case 'getRecentBurials':
                $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
                $recentBurials = $analyticsService->getRecentBurials($days);
                echo json_encode(['success' => true, 'data' => $recentBurials]);
                break;
                
            case 'getGraveUtilization':
                $graveUtilization = $analyticsService->getGraveUtilization();
                echo json_encode(['success' => true, 'data' => $graveUtilization]);
                break;
                
            case 'getGravesByPeriod':
                $gravesByPeriod = $analyticsService->getGravesByPeriod();
                echo json_encode(['success' => true, 'data' => $gravesByPeriod]);
                break;
                
            case 'getUserActivity':
                $userActivity = $analyticsService->getUserActivity();
                echo json_encode(['success' => true, 'data' => $userActivity]);
                break;
                
            case 'getInfrastructure':
                $infrastructure = $analyticsService->getInfrastructureSummary();
                echo json_encode(['success' => true, 'data' => $infrastructure]);
                break;
                
            case 'getWeeklyTrends':
                $weeks = isset($_GET['weeks']) ? (int)$_GET['weeks'] : 12;
                $weeklyTrends = $analyticsService->getWeeklyBurialTrends($weeks);
                echo json_encode(['success' => true, 'data' => $weeklyTrends]);
                break;
                
            case 'getPerformance':
                $performance = $analyticsService->getSystemPerformance();
                echo json_encode(['success' => true, 'data' => $performance]);
                break;
                
            case 'getAlerts':
                $alerts = $analyticsService->getSystemAlerts();
                echo json_encode(['success' => true, 'data' => $alerts]);
                break;
                
            case 'getCustomAnalytics':
                $startDate = $_GET['start_date'] ?? date('Y-m-01');
                $endDate = $_GET['end_date'] ?? date('Y-m-d');
                $type = $_GET['type'] ?? 'burial';
                
                $customAnalytics = $analyticsService->getCustomAnalytics($startDate, $endDate, $type);
                echo json_encode(['success' => true, 'data' => $customAnalytics]);
                break;
                
            case 'exportData':
                $exportType = $_GET['type'] ?? 'burial_records';
                $format = $_GET['format'] ?? 'csv';
                
                $result = $analyticsService->exportAnalyticsData($exportType, $format);
                echo json_encode($result);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        'getDashboardData', 'getOverview', 'getMonthlyBurials', 'getAgeGroups',
                        'getRecentBurials', 'getGraveUtilization', 'getGravesByPeriod',
                        'getUserActivity', 'getInfrastructure', 'getWeeklyTrends',
                        'getPerformance', 'getAlerts', 'getCustomAnalytics', 'exportData'
                    ]
                ]);
                break;
        }
    } elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'getCustomAnalytics':
                $startDate = $_POST['start_date'] ?? date('Y-m-01');
                $endDate = $_POST['end_date'] ?? date('Y-m-d');
                $type = $_POST['type'] ?? 'burial';
                
                $customAnalytics = $analyticsService->getCustomAnalytics($startDate, $endDate, $type);
                echo json_encode(['success' => true, 'data' => $customAnalytics]);
                break;
                
            case 'exportData':
                $exportType = $_POST['type'] ?? 'burial_records';
                $format = $_POST['format'] ?? 'csv';
                
                $result = $analyticsService->exportAnalyticsData($exportType, $format);
                echo json_encode($result);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        'getCustomAnalytics', 'exportData'
                    ]
                ]);
                break;
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed',
            'allowed_methods' => ['GET', 'POST']
        ]);
    }
});
?>
