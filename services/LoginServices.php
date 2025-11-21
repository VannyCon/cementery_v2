<?php
require_once("../connection/connection.php");
class LoginServices {
    private $pdo;

    public function __construct() {
        $config = new config();
        $this->pdo = $config->pdo;
    }

    /**
     * Create a new user
     * @param array $userData User data (username, email, password, role)
     * @return int|false User ID on success, false on failure
     */
    public function createUser($userData) {
        try {
            // Hash the password
            $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

            $query = "INSERT INTO tbl_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $userData['username'],
                $userData['email'],
                $hashedPassword,
                $userData['role'] ?? 'staff'
            ]);

            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("User creation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Find user by email
     * @param string $email User email
     * @return array|false User data or false if not found
     */
    public function findByEmail($email) {
        try {
            $query = "SELECT * FROM tbl_users WHERE email = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$email]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("User find by email error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Find user by username
     * @param string $username Username
     * @return array|false User data or false if not found
     */
    public function findByUsername($username) {
        try {
            $query = "SELECT * FROM tbl_users WHERE username = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$username]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("User find by username error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Find user by ID
     * @param int $id User ID
     * @return array|false User data or false if not found
     */
    public function findById($id) {
        try {
            $query = "SELECT * FROM tbl_users WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("User find by ID error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verify user password
     * @param string $password Plain text password
     * @param string $hashedPassword Hashed password from database
     * @return bool True if password matches, false otherwise
     */
    public function verifyPassword($password, $hashedPassword) {
        return password_verify($password, $hashedPassword);
    }

    /**
     * Update user password
     * @param int $userId User ID
     * @param string $newPassword New password
     * @return bool True on success, false on failure
     */
    public function updatePassword($userId, $newPassword) {
        try {
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $query = "UPDATE tbl_users SET password_hash = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$hashedPassword, $userId]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Password update error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update user profile
     * @param int $userId User ID
     * @param array $profileData Profile data to update
     * @return bool True on success, false on failure
     */
    public function updateProfile($userId, $profileData) {
        try {
            $this->pdo->beginTransaction();

            // Update user table
            $userFields = ['username', 'email'];
            $userUpdates = [];
            $userValues = [];

            foreach ($userFields as $field) {
                if (isset($profileData[$field])) {
                    $userUpdates[] = "$field = ?";
                    $userValues[] = $profileData[$field];
                }
            }

            if (!empty($userUpdates)) {
                $userValues[] = $userId;
                $query = "UPDATE tbl_users SET " . implode(', ', $userUpdates) . " WHERE id = ?";
                $stmt = $this->pdo->prepare($query);
                $stmt->execute($userValues);
            }

            // Update or insert user profile
            $profileFields = ['full_name', 'phone', 'address', 'city', 'country', 'postal_code'];
            $profileUpdates = [];
            $profileValues = [];

            foreach ($profileFields as $field) {
                if (isset($profileData[$field])) {
                    $profileUpdates[] = "$field = ?";
                    $profileValues[] = $profileData[$field];
                }
            }

            if (!empty($profileUpdates)) {
                // Check if profile exists
                $checkQuery = "SELECT user_id FROM user_profiles WHERE user_id = ?";
                $checkStmt = $this->pdo->prepare($checkQuery);
                $checkStmt->execute([$userId]);
                
                if ($checkStmt->fetch()) {
                    // Update existing profile
                    $profileValues[] = $userId;
                    $query = "UPDATE user_profiles SET " . implode(', ', $profileUpdates) . " WHERE user_id = ?";
                } else {
                    // Insert new profile
                    $profileValues[] = $userId;
                    $query = "INSERT INTO user_profiles (user_id, " . implode(', ', $profileFields) . ") VALUES (?, " . str_repeat('?, ', count($profileFields) - 1) . "?)";
                }
                
                $stmt = $this->pdo->prepare($query);
                $stmt->execute($profileValues);
            }

            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollback();
            error_log("Profile update error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user profile with user data
     * @param int $userId User ID
     * @return array|false Complete user profile or false if not found
     */
    public function getUserProfile($userId) {
        try {
            $query = "SELECT u.*, up.full_name, up.phone, up.address, up.city, up.country, up.postal_code 
                     FROM tbl_users u 
                     LEFT JOIN user_profiles up ON u.id = up.user_id 
                     WHERE u.id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$userId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get user profile error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if email exists
     * @param string $email Email to check
     * @param int $excludeUserId User ID to exclude from check (for updates)
     * @return bool True if email exists, false otherwise
     */
    public function emailExists($email, $excludeUserId = null) {
        try {
            $query = "SELECT id FROM tbl_users WHERE email = ?";
            $params = [$email];
            
            if ($excludeUserId) {
                $query .= " AND id != ?";
                $params[] = $excludeUserId;
            }
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            error_log("Email exists check error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if username exists
     * @param string $username Username to check
     * @param int $excludeUserId User ID to exclude from check (for updates)
     * @return bool True if username exists, false otherwise
     */
    public function usernameExists($username, $excludeUserId = null) {
        try {
            $query = "SELECT id FROM tbl_users WHERE username = ?";
            $params = [$username];
            
            if ($excludeUserId) {
                $query .= " AND id != ?";
                $params[] = $excludeUserId;
            }
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            error_log("Username exists check error: " . $e->getMessage());
            return false;
        }
    }
}
