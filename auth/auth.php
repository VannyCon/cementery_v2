<?php
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Enable CORS for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$authController = new AuthController();

// Get the action from URL parameter
$action = $_GET['action'] ?? '';

// Route the request based on action
switch ($action) {
    case 'register':
        $authController->register();
        break;
        
    case 'login':
        $authController->login();
        break;
        
    case 'validate':
        $authController->validateToken();
        break;
        
    case 'refresh':
        $authController->refreshToken();
        break;
        
    case 'profile':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $authController->getProfile();
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
            $authController->updateProfile();
        } else {
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
        }
        break;
        
    case 'logout':
        $authController->logout();
        break;
        
    case 'check':
        $authController->checkAuth();
        break;
        
    default:
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found',
            'available_endpoints' => [
                'register' => 'POST - Register new user',
                'login' => 'POST - Login user',
                'validate' => 'GET - Validate token',
                'refresh' => 'POST - Refresh token',
                'profile' => 'GET/PUT - Get/Update user profile',
                'logout' => 'POST - Logout user',
                'check' => 'GET - Check authentication status'
            ]
        ]);
        break;
}
