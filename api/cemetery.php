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

error_log("=== CEMETERY API SCRIPT STARTED ===");
error_log("Current time: " . date('Y-m-d H:i:s'));
error_log("Request URI: " . $_SERVER['REQUEST_URI']);
error_log("Output buffering level: " . ob_get_level());

$middleware = new JWTMiddleware();
header('Content-Type: application/json');
$cemeteryServices = new CemeteryServices();

// Handle guest-accessible (read-only) operations first
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $action = $_GET['action'] ?? '';
    error_log("GET action received: " . $action);
    
    // Guest-accessible actions (no authentication required)
    if ($action === 'getMapData') {
        $result = $cemeteryServices->getMapData();
        echo json_encode($result);
        exit;
    }
    if ($action === 'getGuestMapData') {
        $result = $cemeteryServices->getGuestMapData();
        echo json_encode($result);
        exit;
    }
    if ($action === 'getHighlightedRecords') {
        $id = $_GET['id'] ?? '';
        $result = $cemeteryServices->getHighlightedRecords($id);
        echo json_encode($result);
        exit;
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

            case 'createRoad':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createRoad($data);
                echo json_encode($result);
                break;
                
            case 'updateRoad':
                $id = $_POST['id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->updateRoad($id, $data);
                echo json_encode($result);
                break;
                
            case 'deleteRoad':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->deleteRoad($id);
                echo json_encode($result);
                break;

            case 'createBurialRecord':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createBurialRecord($data);
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

            case 'createGravePlot':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createGravePlot($data);
                echo json_encode($result);
                break;
                
            case 'updateGravePlot':
                $id = $_POST['id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->updateGravePlot($id, $data);
                echo json_encode($result);
                break;
                
            case 'deleteGravePlot':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->deleteGravePlot($id);
                echo json_encode($result);
                break;

            case 'createLayerAnnotation':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createLayerAnnotation($data);
                echo json_encode($result);
                break;
                
            case 'updateLayerAnnotation':
                $id = $_POST['id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->updateLayerAnnotation($id, $data);
                echo json_encode($result);
                break;
                
            case 'deleteLayerAnnotation':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->deleteLayerAnnotation($id);
                echo json_encode($result);
                break;

            case 'toggleAnnotationVisibility':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->toggleAnnotationVisibility($id);
                echo json_encode($result);
                break;

            case 'updateAnnotationSortOrder':
                $id = $_POST['id'] ?? '';
                $sortOrder = $_POST['sort_order'] ?? 0;
                $result = $cemeteryServices->updateAnnotationSortOrder($id, $sortOrder);
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
                        'createBurialRecord', 'updateBurialRecord', 'deleteBurialRecord',
                        'createGravePlot', 'updateGravePlot', 'deleteGravePlot',
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
            case 'getCemeteries':
                $cemeteries = $cemeteryServices->getCemeteries();
                echo json_encode(['success' => true, 'data' => $cemeteries]);
                break;

            case 'getRoads':
                $roads = $cemeteryServices->getRoads();
                echo json_encode(['success' => true, 'data' => $roads]);
                break;

            case 'getBurialRecords':
                $burialRecords = $cemeteryServices->getBurialRecords();
                echo json_encode(['success' => true, 'data' => $burialRecords]);
                break;

            case 'getGravePlots':
                $gravePlots = $cemeteryServices->getGravePlots();
                echo json_encode(['success' => true, 'data' => $gravePlots]);
                break;

            case 'getLayerAnnotations':
                $layerAnnotations = $cemeteryServices->getLayerAnnotations();
                echo json_encode(['success' => true, 'data' => $layerAnnotations]);
                break;

            case 'getVisibleLayerAnnotations':
                $layerAnnotations = $cemeteryServices->getVisibleLayerAnnotations();
                echo json_encode(['success' => true, 'data' => $layerAnnotations]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        'getCemeteries', 'getRoads', 'getBurialRecords', 
                        'getGravePlots', 'getLayerAnnotations', 'getVisibleLayerAnnotations'
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
