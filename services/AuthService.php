<?php
require_once __DIR__ . '/JWTService.php';
require_once __DIR__ . '/LoginServices.php';

class AuthService {
    private $jwtService;
    private $userModel;

    public function __construct() {
        $this->jwtService = new JWTService();
        $this->userModel = new LoginServices();
    }

    /**
     * Register a new user
     * @param array $userData User registration data
     * @return array Response array with success status and data/message
     */
    public function register($userData) {
        // Validate required fields
        $requiredFields = ['username', 'email', 'password'];
        foreach ($requiredFields as $field) {
            if (empty($userData[$field])) {
                return [
                    'success' => false,
                    'message' => ucfirst($field) . ' is required'
                ];
            }
        }

        // Validate email format
        if (!filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'Invalid email format'
            ];
        }

        // Validate password strength
        if (strlen($userData['password']) < 6) {
            return [
                'success' => false,
                'message' => 'Password must be at least 6 characters long'
            ];
        }

        // Check if email already exists
        if ($this->userModel->emailExists($userData['email'])) {
            return [
                'success' => false,
                'message' => 'Email already exists'
            ];
        }

        // Check if username already exists
        if ($this->userModel->usernameExists($userData['username'])) {
            return [
                'success' => false,
                'message' => 'Username already exists'
            ];
        }

        // Create user
        $userId = $this->userModel->createUser($userData);
        
        if ($userId === false) {
            return [
                'success' => false,
                'message' => 'Failed to create user account'
            ];
        }

        // Get created user data
        $user = $this->userModel->findById($userId);
        
        if ($user === false) {
            return [
                'success' => false,
                'message' => 'User created but failed to retrieve user data'
            ];
        }

        // Generate JWT token
        $tokenPayload = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $token = $this->jwtService->generateToken($tokenPayload);

        return [
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'created_at' => $user['created_at']
                ],
                'token' => $token
            ]
        ];
    }

    /**
     * Login user
     * @param string $emailOrUsername Email or username
     * @param string $password Password
     * @return array Response array with success status and data/message
     */
    public function login($emailOrUsername, $password) {
        if (empty($emailOrUsername) || empty($password)) {
            return [
                'success' => false,
                'message' => 'Email/username and password are required'
            ];
        }

        // Find user by email or username
        $user = $this->userModel->findByEmail($emailOrUsername);
        if (!$user) {
            $user = $this->userModel->findByUsername($emailOrUsername);
        }

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Invalid credentials'
            ];
        }

        // Verify password
        if (!$this->userModel->verifyPassword($password, $user['password_hash'])) {
            return [
                'success' => false,
                'message' => 'Invalid credentials'
            ];
        }

        // Generate JWT token
        $tokenPayload = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $token = $this->jwtService->generateToken($tokenPayload);

        return [
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'created_at' => $user['created_at']
                ],
                'token' => $token
            ]
        ];
    }

    /**
     * Validate JWT token and get user data
     * @param string $token JWT token
     * @return array Response array with success status and user data/message
     */
    public function validateToken($token) {
        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Token is required'
            ];
        }

        $userData = $this->jwtService->getUserFromToken($token);
        
        if ($userData === false) {
            return [
                'success' => false,
                'message' => 'Invalid or expired token'
            ];
        }

        // Get fresh user data from database
        $user = $this->userModel->findById($userData['id']);
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        return [
            'success' => true,
            'message' => 'Token is valid',
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'created_at' => $user['created_at']
                ]
            ]
        ];
    }

    /**
     * Refresh JWT token
     * @param string $token Current JWT token
     * @return array Response array with success status and new token/message
     */
    public function refreshToken($token) {
        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Token is required'
            ];
        }

        $newToken = $this->jwtService->refreshToken($token);
        
        if ($newToken === false) {
            return [
                'success' => false,
                'message' => 'Invalid or expired token'
            ];
        }

        return [
            'success' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'token' => $newToken
            ]
        ];
    }

    /**
     * Get current user from token
     * @return array Response array with success status and user data/message
     */
    public function getCurrentUser() {
        $token = $this->jwtService->getTokenFromHeader();
        
        if ($token === false) {
            return [
                'success' => false,
                'message' => 'No token provided'
            ];
        }

        return $this->validateToken($token);
    }

    /**
     * Check if user is authenticated
     * @return bool True if authenticated, false otherwise
     */
    public function isAuthenticated() {
        $token = $this->jwtService->getTokenFromHeader();
        
        if ($token === false) {
            return false;
        }

        return $this->jwtService->isTokenValid($token);
    }

    /**
     * Check if user has specific role
     * @param string $role Role to check
     * @return bool True if user has role, false otherwise
     */
    public function hasRole($role) {
        $currentUser = $this->getCurrentUser();
        
        if (!$currentUser['success']) {
            return false;
        }

        return $currentUser['data']['user']['role'] === $role;
    }

    /**
     * Check if user is admin
     * @return bool True if user is admin, false otherwise
     */
    public function isAdmin() {
        return $this->hasRole('admin');
    }

    /**
     * Get user profile
     * @param int $userId User ID (optional, defaults to current user)
     * @return array Response array with success status and profile data/message
     */
    public function getUserProfile($userId = null) {
        if ($userId === null) {
            $currentUser = $this->getCurrentUser();
            if (!$currentUser['success']) {
                return $currentUser;
            }
            $userId = $currentUser['data']['user']['id'];
        }

        $profile = $this->userModel->getUserProfile($userId);
        
        if ($profile === false) {
            return [
                'success' => false,
                'message' => 'Profile not found'
            ];
        }

        // Remove sensitive data
        unset($profile['password_hash']);

        return [
            'success' => true,
            'message' => 'Profile retrieved successfully',
            'data' => [
                'profile' => $profile
            ]
        ];
    }

    /**
     * Update user profile
     * @param array $profileData Profile data to update
     * @param int $userId User ID (optional, defaults to current user)
     * @return array Response array with success status and message
     */
    public function updateProfile($profileData, $userId = null) {
        if ($userId === null) {
            $currentUser = $this->getCurrentUser();
            if (!$currentUser['success']) {
                return $currentUser;
            }
            $userId = $currentUser['data']['user']['id'];
        }

        // Validate email if provided
        if (isset($profileData['email'])) {
            if (!filter_var($profileData['email'], FILTER_VALIDATE_EMAIL)) {
                return [
                    'success' => false,
                    'message' => 'Invalid email format'
                ];
            }

            if ($this->userModel->emailExists($profileData['email'], $userId)) {
                return [
                    'success' => false,
                    'message' => 'Email already exists'
                ];
            }
        }

        // Validate username if provided
        if (isset($profileData['username'])) {
            if ($this->userModel->usernameExists($profileData['username'], $userId)) {
                return [
                    'success' => false,
                    'message' => 'Username already exists'
                ];
            }
        }

        $success = $this->userModel->updateProfile($userId, $profileData);
        
        if (!$success) {
            return [
                'success' => false,
                'message' => 'Failed to update profile'
            ];
        }

        return [
            'success' => true,
            'message' => 'Profile updated successfully'
        ];
    }
}
