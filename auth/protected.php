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

// Example of protected route that requires authentication
$middleware->requireAuth(function() {
    header('Content-Type: application/json');
    
    $user = $GLOBALS['current_user'];
    
    echo json_encode([
        'success' => true,
        'message' => 'Access granted to protected resource',
        'data' => [
            'user' => $user,
            'timestamp' => date('Y-m-d H:i:s'),
            'server_info' => [
                'method' => $_SERVER['REQUEST_METHOD'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ]
        ]
    ]);
});
?>

