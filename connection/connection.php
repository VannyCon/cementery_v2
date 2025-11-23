<?php 
ob_start();

// Set expiration date and time (YYYY-MM-DD HH:MM:SS format)
$expireDateTime = strtotime("2025-12-24 12:00:00"); // Change to your desired date & time
$currentDateTime = time();

// If the time has passed, prevent file inclusion
if ($currentDateTime >= $expireDateTime) {
    die("Access to this service is no longer available. Please contact the administrator.");
}



class config {
    public $pdo; // Declare $pdo as a class property

    // Corrected function to return base URL
    public function base_url(){
        require_once('config.php');
        return URL;
    }
    public function getfile(){
        require_once('config.php');
        return FILEPATH;
    }

    public function __construct(){
        
        require_once('config.php'); // Include config.php for DB constants
        $dsn = "mysql:host=".H.";dbname=".DB; // Corrected concatenation
        $username = U;
        $password = P;
        try {
            // Initialize PDO with correct parameters
            $this->pdo = new PDO($dsn, $username, $password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }
    
    static function clean($key, $type) {
        if ($type == "post") {
            // Sanitize input from POST
            $data = filter_input(INPUT_POST, $key, FILTER_SANITIZE_FULL_SPECIAL_CHARS, FILTER_FLAG_NO_ENCODE_QUOTES);
        } 
        else if ($type == "get") {
            // Sanitize input from GET
            $data = filter_input(INPUT_GET, $key, FILTER_SANITIZE_FULL_SPECIAL_CHARS, FILTER_FLAG_NO_ENCODE_QUOTES);
        } 
        else {
            return ""; // Return empty string for invalid type
        }
    
        return $data !== false ? trim($data) : ""; // Ensure it doesn't return false
    }
    
    /**
     * Clean an array of data by sanitizing all values
     * @param array $data - Array of data to clean
     * @return array - Cleaned array
     */
    static function cleanArray($data) {
        $cleaned = [];
        foreach ($data as $key => $value) {
            $cleaned[$key] = filter_var($value, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        }
        return $cleaned;
    }
    
    function logout(){
        // Unset all session variables
        $_SESSION = array();
        // Destroy the session
        session_destroy();
        header("Location: index.php");
        return true;
    }

    /**
     * Begin a database transaction
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Commit the current transaction
     */
    public function commit() {
        return $this->pdo->commit();
    }
    
    /**
     * Rollback the current transaction
     */
    public function rollback() {
        return $this->pdo->rollback();
    }
    
    /**
     * Log activity for audit trail
     * @param int $user_id - ID of the user performing the action (optional)
     * @param string $action - Description of the action performed
     * @param int $related_id - ID of related record (optional)
     * @param string $related_type - Type of related record (optional)
     */
    public function logActivity($action, $user_id = null, $related_id = null, $related_type = null) {
        try {
            // Use session user_id if not provided
            if ($user_id === null && isset($_SESSION['user_id'])) {
                $user_id = $_SESSION['user_id'];
            }
            
            // Build the action description
            $action_description = $action;
            if ($related_id && $related_type) {
                $action_description = "{$related_type} ID {$related_id}: {$action}";
            }
            
            $query = "INSERT INTO `activity_logs` (user_id, action, created_at) VALUES (?, ?, NOW())";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$user_id, $action_description]);
            
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            // Log error but don't fail the main operation
            error_log("Activity log error: " . $e->getMessage());
            return false;
        }
    }
}

