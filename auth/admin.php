<?php
require_once __DIR__ . '/../middleware/JWTMiddleware.php';

// Enable CORS for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$middleware = new JWTMiddleware();

// Example of admin-only protected route
$middleware->requireAdmin(function() {
    header('Content-Type: application/json');
    
    $user = $GLOBALS['current_user'];
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin access granted',
        'data' => [
            'admin_user' => $user,
            'admin_actions' => [
                'manage_products' => true,
                'manage_users' => true,
                'view_analytics' => true,
                'manage_orders' => true
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
});
?>

