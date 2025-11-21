<?php
// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

require_once __DIR__ . '/../middleware/JWTMiddleware.php';
require_once('../services/StaffServices.php');

// Enable CORS for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$middleware = new JWTMiddleware();
header('Content-Type: application/json');
$staffServices = new StaffServices();

// Require admin authentication for staff operations
$middleware->requireAdmin(function() {
    global $staffServices;

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'getAllStaff':
                $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
                $size = isset($_GET['size']) ? intval($_GET['size']) : 20;
                $search = isset($_GET['search']) ? trim($_GET['search']) : '';
                $rows = $staffServices->getStaffUsers($page, $size, $search);
                $total = $staffServices->countStaffUsers($search);
                $totalPages = $size > 0 ? (int)ceil($total / $size) : 1;
                echo json_encode([
                    'success' => true,
                    'data' => $rows,
                    'meta' => [
                        'page' => $page,
                        'size' => $size,
                        'total' => $total,
                        'totalPages' => $totalPages,
                        'search' => $search,
                    ],
                ]);
                break;
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid action',
                    'available_actions' => ['getAllStaff']
                ]);
                break;
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed',
            'allowed_methods' => ['GET']
        ]);
    }
});
?>
