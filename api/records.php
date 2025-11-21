<?php
// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

require_once __DIR__ . '/../middleware/JWTMiddleware.php';
require_once('../services/CemeteryServices.php');

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
header('Content-Type: application/json');
$cemeteryServices = new CemeteryServices();

// Handle guest-accessible (read-only) operations first
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $action = $_GET['action'] ?? '';
    error_log("GET action received: " . $action);

    switch ($action) {
        case 'getAllRecords':
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $size = isset($_GET['size']) ? intval($_GET['size']) : 12;
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';
            $grouped = isset($_GET['grouped']) ? filter_var($_GET['grouped'], FILTER_VALIDATE_BOOLEAN) : true;
            
            if ($grouped) {
                $records = $cemeteryServices->getRecordsGroupedByGrave($page, $size, $search);
                $total = $cemeteryServices->countUniqueGraves($search);
            } else {
                $records = $cemeteryServices->getAllRecords($page, $size, $search);
                $total = $cemeteryServices->countAllRecords($search);
            }
            
            $totalPages = $size > 0 ? (int)ceil($total / $size) : 1;
            echo json_encode([
                'success' => true,
                'data' => $records,
                'meta' => [
                    'page' => $page,
                    'size' => $size,
                    'total' => $total,
                    'totalPages' => $totalPages,
                    'search' => $search,
                    'grouped' => $grouped
                ]
            ]);
            exit;
        default:
            // Optionally handle unknown actions
            break;
    }
}

// Require authentication for all other cemetery operations
$middleware->requireAuth(function() {
    error_log("Inside authenticated callback");
    global $cemeteryServices;
    
    // Handle different actions based on HTTP method
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'createCemetery':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createCemetery($data);
                echo json_encode($result);
                break;
                
            case 'updateCemetery':
                $id = $_POST['id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->updateCemetery($id, $data);
                echo json_encode($result);
                break;
                
            case 'deleteCemetery':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->deleteCemetery($id);
                echo json_encode($result);
                break;

            case 'createBurialRecord':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createBurialRecord($data);
                echo json_encode($result);
                break;

            case 'createMultipleBurialRecords':
                // Handle nested array data properly
                $data = $_POST;
                // Clean the main data but preserve nested arrays
                $cleanedData = [];
                foreach ($data as $key => $value) {
                    if (is_array($value)) {
                        // Preserve nested arrays (like deceased_records)
                        $cleanedData[$key] = $value;
                    } else {
                        // Clean scalar values
                        $cleanedData[$key] = filter_var($value, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
                    }
                }
                $result = $cemeteryServices->createMultipleBurialRecords($cleanedData);
                echo json_encode($result);
                break;

            case 'updateBurialRecord':
                $id = $_POST['id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->updateBurialRecord($id, $data);
                echo json_encode($result);
                break;

            case 'deleteBurialRecord':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->deleteBurialRecord($id);
                echo json_encode($result);
                break;

            case 'addRecordToGrave':
                $graveId = $_POST['grave_id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->addRecordToGrave($graveId, $data);
                echo json_encode($result);
                break;
                
            case 'createGravePlotWithImages':
                // Handle grave plot creation with images
                error_log("createGravePlotWithImages - Raw POST data: " . json_encode($_POST));
                error_log("createGravePlotWithImages - Raw FILES data: " . json_encode($_FILES));
                
                // Clean the main data but preserve nested arrays
                $data = $_POST;
                $cleanedData = [];
                foreach ($data as $key => $value) {
                    if (is_array($value)) {
                        // Preserve nested arrays (like deceased_records)
                        $cleanedData[$key] = $value;
                    } else {
                        // Clean scalar values
                        $cleanedData[$key] = filter_var($value, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
                    }
                }
                
                error_log("createGravePlotWithImages - Cleaned data: " . json_encode($cleanedData));
                
                $result = $cemeteryServices->createGravePlotWithImages($cleanedData, $_FILES);
                echo json_encode($result);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        'createCemetery', 'updateCemetery', 'deleteCemetery',
                        'createRoad', 'updateRoad', 'deleteRoad',
                        'createBurialRecord', 'createMultipleBurialRecords', 'updateBurialRecord', 'deleteBurialRecord',
                        'addRecordToGrave',
                        'createGravePlot', 'createGravePlotWithImages', 'updateGravePlot', 'deleteGravePlot',
                        'createLayerAnnotation', 'updateLayerAnnotation', 'deleteLayerAnnotation',
                        'toggleAnnotationVisibility', 'updateAnnotationSortOrder'
                    ]
                ]);
                break;
        }
    } elseif ($_SERVER["REQUEST_METHOD"] == "GET") {
        $action = $_GET['action'] ?? '';
        error_log("GET action received: " . $action);
        
        switch ($action) {
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        
                    ]
                ]);
                break;
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed',
            'allowed_methods' => ['GET', 'POST']
        ]);
    }
});
?>
