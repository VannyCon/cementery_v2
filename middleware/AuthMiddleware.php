<?php
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../connection/connection.php';

class AuthController {
    private $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    /**
     * Handle registration request
     */
    public function register() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON input'
            ]);
            return;
        }

        // Clean input data
        $userData = config::cleanArray($input);

        // Register user
        $result = $this->authService->register($userData);
        
        if ($result['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }

        echo json_encode($result);
    }

    /**
     * Handle login request
     */
    public function login() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON input'
            ]);
            return;
        }

        // Clean input data
        $input = config::cleanArray($input);
        
        $emailOrUsername = $input['email_or_username'] ?? '';
        $password = $input['password'] ?? '';

        // Login user
        $result = $this->authService->login($emailOrUsername, $password);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(401);
        }

        echo json_encode($result);
    }

    /**
     * Handle token validation request
     */
    public function validateToken() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow GET requests
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Validate token
        $result = $this->authService->getCurrentUser();
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(401);
        }

        echo json_encode($result);
    }

    /**
     * Handle token refresh request
     */
    public function refreshToken() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Refresh token
        $result = $this->authService->refreshToken($this->authService->getCurrentUser()['data']['token'] ?? '');
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(401);
        }

        echo json_encode($result);
    }

    /**
     * Get current user profile
     */
    public function getProfile() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow GET requests
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Get user profile
        $result = $this->authService->getUserProfile();
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(401);
        }

        echo json_encode($result);
    }

    /**
     * Update user profile
     */
    public function updateProfile() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow PUT requests
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON input'
            ]);
            return;
        }

        // Clean input data
        $profileData = config::cleanArray($input);

        // Update profile
        $result = $this->authService->updateProfile($profileData);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(400);
        }

        echo json_encode($result);
    }

    /**
     * Handle logout (client-side token removal)
     */
    public function logout() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        // Since we're using JWT, logout is handled client-side by removing the token
        // But we can log the activity
        $currentUser = $this->authService->getCurrentUser();
        if ($currentUser['success']) {
            $config = new config();
            $config->logActivity('User logged out', $currentUser['data']['user']['id']);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Check authentication status
     */
    public function checkAuth() {
        // Set content type to JSON
        header('Content-Type: application/json');
        
        // Only allow GET requests
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            return;
        }

        $isAuthenticated = $this->authService->isAuthenticated();
        
        if ($isAuthenticated) {
            $user = $this->authService->getCurrentUser();
            echo json_encode([
                'success' => true,
                'authenticated' => true,
                'data' => $user['data']
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'authenticated' => false,
                'message' => 'Not authenticated'
            ]);
        }
    }
}
