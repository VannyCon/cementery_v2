<?php
require_once __DIR__ . '/../services/JWTService.php';

class JWTMiddleware {
    private $jwtService;

    public function __construct() {
        $this->jwtService = new JWTService();
    }

    /**
     * Middleware to require authentication
     * @param callable $callback Function to call if authenticated
     * @param string $requiredRole Optional role requirement
     */
    public function requireAuth($callback, $requiredRole = null) {
        $token = $this->jwtService->getTokenFromHeader();
        
        if ($token === false) {
            $this->sendUnauthorizedResponse('No token provided');
            return;
        }

        $userData = $this->jwtService->getUserFromToken($token);
        
        if ($userData === false) {
            $this->sendUnauthorizedResponse('Invalid or expired token');
            return;
        }

        // Check role if required
        if ($requiredRole && $userData['role'] !== $requiredRole) {
            $this->sendForbiddenResponse('Insufficient permissions');
            return;
        }

        // Add user data to global scope for the callback
        $GLOBALS['current_user'] = $userData;
        
        // Call the protected function
        if (is_callable($callback)) {
            call_user_func($callback);
        }
    }

    /**
     * Middleware to require admin role
     * @param callable $callback Function to call if user is admin
     */
    public function requireAdmin($callback) {
        $this->requireAuth($callback, 'admin');
    }

    /**
     * Middleware to require staff role
     * @param callable $callback Function to call if user is staff
     */
    public function requireStaff($callback) {
        $this->requireAuth($callback, 'staff');
    }

    /**
     * Optional authentication - doesn't fail if no token
     * @param callable $callback Function to call
     */
    public function optionalAuth($callback) {
        $token = $this->jwtService->getTokenFromHeader();
        
        if ($token !== false) {
            $userData = $this->jwtService->getUserFromToken($token);
            if ($userData !== false) {
                $GLOBALS['current_user'] = $userData;
            }
        }
        
        if (is_callable($callback)) {
            call_user_func($callback);
        }
    }

    /**
     * Get current authenticated user
     * @return array|false User data or false if not authenticated
     */
    public function getCurrentUser() {
        return $GLOBALS['current_user'] ?? false;
    }

    /**
     * Check if current user has specific role
     * @param string $role Role to check
     * @return bool True if user has role, false otherwise
     */
    public function hasRole($role) {
        $user = $this->getCurrentUser();
        return $user && $user['role'] === $role;
    }

    /**
     * Check if current user is admin
     * @return bool True if user is admin, false otherwise
     */
    public function isAdmin() {
        return $this->hasRole('admin');
    }

    /**
     * Check if current user is staff
     * @return bool True if user is staff, false otherwise
     */
    public function isStaff() {
        return $this->hasRole('staff');
    }

    /**
     * Send unauthorized response
     * @param string $message Error message
     */
    private function sendUnauthorizedResponse($message) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error' => 'UNAUTHORIZED'
        ]);
        exit;
    }

    /**
     * Send forbidden response
     * @param string $message Error message
     */
    private function sendForbiddenResponse($message) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error' => 'FORBIDDEN'
        ]);
        exit;
    }

    /**
     * Validate token and return user data
     * @return array|false User data or false if invalid
     */
    public function validateToken() {
        $token = $this->jwtService->getTokenFromHeader();
        
        if ($token === false) {
            return false;
        }

        return $this->jwtService->getUserFromToken($token);
    }

    /**
     * Check if request is authenticated
     * @return bool True if authenticated, false otherwise
     */
    public function isAuthenticated() {
        return $this->validateToken() !== false;
    }
}
