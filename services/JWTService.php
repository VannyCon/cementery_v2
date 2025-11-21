<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTService {
    private $secretKey;
    private $algorithm = 'HS256';
    private $expirationTime = 3600; // 1 hour in seconds

    public function __construct() {
        // You should set this in your environment variables or config
        $this->secretKey = '$CemeterySystem001';
    }

    /**
     * Generate JWT token for user
     * @param array $payload User data to include in token
     * @return string JWT token
     */
    public function generateToken($payload) {
        $issuedAt = time();
        $expirationTime = $issuedAt + $this->expirationTime;

        $tokenPayload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => $payload
        ];

        return JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);
    }

    /**
     * Validate and decode JWT token
     * @param string $token JWT token
     * @return array|false Decoded token data or false if invalid
     */
    public function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            return json_decode(json_encode($decoded), true);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Extract token from Authorization header
     * @return string|false Token or false if not found
     */
    public function getTokenFromHeader() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $authHeader = $headers['Authorization'];
        
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $matches[1];
        }

        return false;
    }

    /**
     * Check if token is valid and not expired
     * @param string $token JWT token
     * @return bool True if valid, false otherwise
     */
    public function isTokenValid($token) {
        $decoded = $this->validateToken($token);
        return $decoded !== false;
    }

    /**
     * Get user data from token
     * @param string $token JWT token
     * @return array|false User data or false if invalid
     */
    public function getUserFromToken($token) {
        $decoded = $this->validateToken($token);
        
        if ($decoded === false) {
            return false;
        }

        return $decoded['data'] ?? false;
    }

    /**
     * Refresh token by generating a new one with same user data
     * @param string $token Current JWT token
     * @return string|false New token or false if current token is invalid
     */
    public function refreshToken($token) {
        $userData = $this->getUserFromToken($token);
        
        if ($userData === false) {
            return false;
        }

        return $this->generateToken($userData);
    }
}
