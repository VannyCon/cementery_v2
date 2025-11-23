<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../connection/config.php';

use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

class ImageUploadHandler {
    private $cloudinary;
    private $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    private $maxFileSize = 5 * 1024 * 1024; // 5MB per file
    private $maxFiles = 10; // Maximum 10 images per grave
    
    public function __construct() {
        // Configure Cloudinary
        // Configuration::instance([
        //     'cloud' => [
        //         'cloud_name' => 'dwg8ccdzh',
        //         'api_key' => '983429476869458',
        //         'api_secret' => 'r5WsniAZ3NP_WWzbVsyZpU9CEFk'
        //     ],
        //     'url' => [
        //         'secure' => true
        //     ]
        // ]);

        $config = Configuration::instance();
        $config->cloud->cloudName = 'dwg8ccdzh';
        $config->cloud->apiKey = '983429476869458';
        $config->cloud->apiSecret = 'r5WsniAZ3NP_WWzbVsyZpU9CEFk';
        $config->url->secure = true;
        
        $this->cloudinary = new Cloudinary($config);
    }
    
    /**
     * Handle multiple image uploads for a grave plot
     * @param array $files $_FILES array
     * @param string $graveNumber The grave number to create folder for
     * @return array Result with success status and uploaded file paths or error message
     */
    public function handleMultipleUploads($files, $graveNumber) {
        try {
            // Validate grave number
            if (empty($graveNumber)) {
                return [
                    'success' => false,
                    'message' => 'Grave number is required'
                ];
            }
            
            $uploadedFiles = [];
            $errors = [];
            
            // Handle multiple files
            if (isset($files['images']) && is_array($files['images']['name'])) {
                $fileCount = count($files['images']['name']);
                
                // Check file count limit
                if ($fileCount > $this->maxFiles) {
                    return [
                        'success' => false,
                        'message' => "Maximum {$this->maxFiles} images allowed"
                    ];
                }
                
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($files['images']['error'][$i] === UPLOAD_ERR_OK) {
                        $result = $this->uploadSingleFile([
                            'name' => $files['images']['name'][$i],
                            'type' => $files['images']['type'][$i],
                            'tmp_name' => $files['images']['tmp_name'][$i],
                            'error' => $files['images']['error'][$i],
                            'size' => $files['images']['size'][$i]
                        ], $graveNumber, $i + 1);
                        
                        if ($result['success']) {
                            $uploadedFiles[] = $result['data'];
                        } else {
                            $errors[] = $result['message'];
                        }
                    } else if ($files['images']['error'][$i] !== UPLOAD_ERR_NO_FILE) {
                        $errors[] = "File " . ($i + 1) . ": " . $this->getUploadErrorMessage($files['images']['error'][$i]);
                    }
                }
            }
            
            if (empty($uploadedFiles) && !empty($errors)) {
                return [
                    'success' => false,
                    'message' => 'No files uploaded: ' . implode(', ', $errors)
                ];
            }
            
            if (!empty($errors)) {
                error_log('Image upload warnings: ' . implode(', ', $errors));
            }
            
            return [
                'success' => true,
                'files' => $uploadedFiles,
                'message' => count($uploadedFiles) . ' image(s) uploaded successfully'
            ];
            
        } catch (Exception $e) {
            error_log('Image upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Handle multiple image uploads for deceased records
     * @param array $photoFiles Array of file arrays (from extractDeceasedRecordFiles)
     * @param string $graveNumber The grave number
     * @param int $deceasedIndex The deceased record index
     * @return array Result with success status and uploaded file URLs or error message
     */
    public function handleDeceasedRecordUploads($photoFiles, $graveNumber, $deceasedIndex) {
        error_log("=== handleDeceasedRecordUploads START ===");
        error_log("Parameters - graveNumber: {$graveNumber}, deceasedIndex: {$deceasedIndex}");
        error_log("photoFiles count: " . (is_array($photoFiles) ? count($photoFiles) : 'NOT_ARRAY'));
        error_log("photoFiles type: " . gettype($photoFiles));
        
        try {
            if (empty($photoFiles)) {
                error_log("handleDeceasedRecordUploads: No files to upload");
                return [
                    'success' => true,
                    'files' => [],
                    'message' => 'No files to upload'
                ];
            }
            
            $uploadedFiles = [];
            $errors = [];
            $fileCount = count($photoFiles);
            error_log("Processing {$fileCount} photo file(s)");
            
            foreach ($photoFiles as $photoIndex => $photoFile) {
                error_log("--- Processing photo file index: {$photoIndex} ---");
                error_log("File data: " . json_encode([
                    'name' => $photoFile['name'] ?? 'NOT_SET',
                    'type' => $photoFile['type'] ?? 'NOT_SET',
                    'size' => $photoFile['size'] ?? 'NOT_SET',
                    'error' => $photoFile['error'] ?? 'NOT_SET',
                    'tmp_name' => isset($photoFile['tmp_name']) ? 'SET' : 'NOT_SET'
                ]));
                
                if ($photoFile['error'] === UPLOAD_ERR_OK) {
                    error_log("File upload error is OK, proceeding with upload");
                    $result = $this->uploadDeceasedRecordFile($photoFile, $graveNumber, $deceasedIndex, $photoIndex + 1);
                    
                    error_log("Upload result for photo {$photoIndex}: " . json_encode([
                        'success' => $result['success'] ?? false,
                        'message' => $result['message'] ?? 'NO_MESSAGE'
                    ]));
                    
                    if ($result['success']) {
                        error_log("Upload successful for photo {$photoIndex}");
                        $uploadedFiles[] = $result['data'];
                    } else {
                        $errorMsg = "Photo " . ($photoIndex + 1) . ": " . $result['message'];
                        error_log("Upload failed for photo {$photoIndex}: {$errorMsg}");
                        $errors[] = $errorMsg;
                    }
                } else if ($photoFile['error'] !== UPLOAD_ERR_NO_FILE) {
                    $errorMsg = "Photo " . ($photoIndex + 1) . ": " . $this->getUploadErrorMessage($photoFile['error']);
                    error_log("File upload error for photo {$photoIndex}: {$errorMsg} (error code: {$photoFile['error']})");
                    $errors[] = $errorMsg;
                } else {
                    error_log("Photo {$photoIndex}: No file uploaded (UPLOAD_ERR_NO_FILE)");
                }
            }
            
            error_log("Upload summary - Success: " . count($uploadedFiles) . ", Errors: " . count($errors));
            
            if (empty($uploadedFiles) && !empty($errors)) {
                $errorMessage = 'No files uploaded: ' . implode(', ', $errors);
                error_log("handleDeceasedRecordUploads FAILED: {$errorMessage}");
                return [
                    'success' => false,
                    'message' => $errorMessage
                ];
            }
            
            if (!empty($errors)) {
                error_log('Deceased record image upload warnings: ' . implode(', ', $errors));
            }
            
            $successMessage = count($uploadedFiles) . ' image(s) uploaded successfully';
            error_log("handleDeceasedRecordUploads SUCCESS: {$successMessage}");
            error_log("=== handleDeceasedRecordUploads END ===");
            
            return [
                'success' => true,
                'files' => $uploadedFiles,
                'message' => $successMessage
            ];
            
        } catch (Exception $e) {
            error_log('handleDeceasedRecordUploads EXCEPTION: ' . $e->getMessage());
            error_log('Exception trace: ' . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Upload a single file for a deceased record to Cloudinary
     */
    private function uploadDeceasedRecordFile($file, $graveNumber, $deceasedIndex, $photoIndex) {
        error_log("--- uploadDeceasedRecordFile START ---");
        error_log("Parameters - graveNumber: {$graveNumber}, deceasedIndex: {$deceasedIndex}, photoIndex: {$photoIndex}");
        error_log("File info - name: " . ($file['name'] ?? 'NOT_SET') . ", size: " . ($file['size'] ?? 'NOT_SET') . ", type: " . ($file['type'] ?? 'NOT_SET'));
        error_log("File tmp_name exists: " . (isset($file['tmp_name']) && file_exists($file['tmp_name']) ? 'YES' : 'NO'));
        if (isset($file['tmp_name'])) {
            error_log("File tmp_name: {$file['tmp_name']}");
            error_log("File tmp_name readable: " . (is_readable($file['tmp_name']) ? 'YES' : 'NO'));
        }
        
        try {
            // Validate file
            error_log("Starting file validation...");
            $validation = $this->validateFile($file);
            error_log("Validation result: " . json_encode($validation));
            
            if (!$validation['valid']) {
                error_log("File validation FAILED: " . $validation['message']);
                return [
                    'success' => false,
                    'message' => $validation['message']
                ];
            }
            error_log("File validation PASSED");
            
            // Use folder structure: cemetery_v2/grave/{graveNumber}/deceased_{index}/photo_{photoIndex}
            // public_id already includes full path, so don't specify folder separately to avoid duplication
            // Use folder parameter to ensure proper folder structure in Cloudinary
            $folderPath = "cemetery_v2/grave/{$graveNumber}/deceased_{$deceasedIndex}";
            $filename = "photo_{$photoIndex}";
            // For Cloudinary, we'll use folder + filename separately to avoid issues
            $publicId = $filename;
            error_log("Cloudinary upload parameters:");
            error_log("  - folder: {$folderPath}");
            error_log("  - publicId (filename): {$publicId}");
            error_log("  - tmp_name: " . ($file['tmp_name'] ?? 'NOT_SET'));
            
            // Check if Cloudinary is initialized
            if (!$this->cloudinary) {
                error_log("ERROR: Cloudinary object is not initialized!");
                return [
                    'success' => false,
                    'message' => 'Cloudinary not initialized'
                ];
            }
            error_log("Cloudinary object is initialized");
            
            // Upload to Cloudinary
            // Use folder parameter with filename-only public_id to ensure proper folder structure
            error_log("Attempting Cloudinary upload...");
            $uploadResult = $this->cloudinary->uploadApi()->upload(
                $file['tmp_name'],
                [
                    'folder' => $folderPath, // Specify folder to ensure proper folder structure
                    'public_id' => $publicId, // Just the filename, folder is set separately
                    'use_filename' => false, // Don't use original filename
                    'overwrite' => false, // Don't overwrite existing files
                    'resource_type' => 'image',
                    'transformation' => [
                        'quality' => 'auto',
                        'fetch_format' => 'auto'
                    ]
                ]
            );
            
            error_log("Cloudinary upload SUCCESS");
            error_log("Upload result: " . json_encode([
                'public_id' => $uploadResult['public_id'] ?? 'NOT_SET',
                'secure_url' => $uploadResult['secure_url'] ?? 'NOT_SET',
                'url' => $uploadResult['url'] ?? 'NOT_SET',
                'bytes' => $uploadResult['bytes'] ?? 'NOT_SET',
                'format' => $uploadResult['format'] ?? 'NOT_SET'
            ]));
            
            $result = [
                'success' => true,
                'data' => [
                    'public_id' => $uploadResult['public_id'],
                    'secure_url' => $uploadResult['secure_url'],
                    'url' => $uploadResult['url'],
                    'filename' => "photo_{$photoIndex}",
                    'size' => $uploadResult['bytes'],
                    'format' => $uploadResult['format']
                ]
            ];
            
            error_log("uploadDeceasedRecordFile SUCCESS");
            error_log("--- uploadDeceasedRecordFile END ---");
            return $result;
            
        } catch (Exception $e) {
            error_log("uploadDeceasedRecordFile EXCEPTION: " . $e->getMessage());
            error_log("Exception class: " . get_class($e));
            error_log("Exception trace: " . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Upload error: ' . $e->getMessage()
            ];
        } catch (Error $e) {
            error_log("uploadDeceasedRecordFile FATAL ERROR: " . $e->getMessage());
            error_log("Error class: " . get_class($e));
            error_log("Error trace: " . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Fatal error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Upload a single file to Cloudinary
     */
    private function uploadSingleFile($file, $graveNumber, $index) {
        try {
            // Validate file
            $validation = $this->validateFile($file);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => $validation['message']
                ];
            }
            
            // Generate unique public ID for Cloudinary
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $publicId = "cemetery/grave/{$graveNumber}/{$index}";
            
            // Upload to Cloudinary
            $uploadResult = $this->cloudinary->uploadApi()->upload(
                $file['tmp_name'],
                [
                    'public_id' => $publicId,
                    'folder' => 'cemetery/grave/' . $graveNumber,
                    'resource_type' => 'image',
                    'transformation' => [
                        'quality' => 'auto',
                        'fetch_format' => 'auto'
                    ]
                ]
            );
            
            return [
                'success' => true,
                'data' => [
                    'public_id' => $uploadResult['public_id'],
                    'secure_url' => $uploadResult['secure_url'],
                    'url' => $uploadResult['url'],
                    'filename' => $index . '.' . strtolower($extension),
                    'size' => $uploadResult['bytes'],
                    'format' => $uploadResult['format']
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Upload error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate uploaded file
     */
    private function validateFile($file) {
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            return [
                'valid' => false,
                'message' => 'File size exceeds ' . ($this->maxFileSize / 1024 / 1024) . 'MB limit'
            ];
        }
        
        // Check file type
        if (!in_array($file['type'], $this->allowedTypes)) {
            return [
                'valid' => false,
                'message' => 'Invalid file type. Allowed: ' . implode(', ', $this->allowedTypes)
            ];
        }
        
        // Check if file is actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return [
                'valid' => false,
                'message' => 'File is not a valid image'
            ];
        }
        
        return ['valid' => true];
    }
    
    
    /**
     * Get upload error message
     */
    private function getUploadErrorMessage($errorCode) {
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'File too large';
            case UPLOAD_ERR_PARTIAL:
                return 'File upload was interrupted';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'No temporary directory';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Cannot write to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'Upload blocked by extension';
            default:
                return 'Unknown upload error';
        }
    }
    
    /**
     * Delete grave folder and all images from Cloudinary
     */
    public function deleteGraveImages($graveNumber) {
        try {
            $folderPath = 'cemetery/grave/' . $graveNumber;
            
            // Get all resources in the folder
            $resources = $this->cloudinary->adminApi()->assets([
                'type' => 'upload',
                'prefix' => $folderPath,
                'max_results' => 500
            ]);
            
            if (!empty($resources['resources'])) {
                $publicIds = array_map(function($resource) {
                    return $resource['public_id'];
                }, $resources['resources']);
                
                // Delete all images in the folder
                $deleteResult = $this->cloudinary->adminApi()->deleteAssets($publicIds);
                return $deleteResult['deleted'] ?? [];
            }
            
            return [];
        } catch (Exception $e) {
            error_log('Error deleting grave images: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get image paths for a grave from Cloudinary
     */
    public function getGraveImages($graveNumber) {
        try {
            $folderPath = 'cemetery/grave/' . $graveNumber;
            
            // Get all resources in the folder
            $resources = $this->cloudinary->adminApi()->assets([
                'type' => 'upload',
                'prefix' => $folderPath,
                'max_results' => 500
            ]);
            
            $images = [];
            if (!empty($resources['resources'])) {
                foreach ($resources['resources'] as $resource) {
                    $images[] = [
                        'public_id' => $resource['public_id'],
                        'secure_url' => $resource['secure_url'],
                        'url' => $resource['url'],
                        'filename' => basename($resource['public_id']),
                        'size' => $resource['bytes'],
                        'format' => $resource['format'],
                        'created_at' => $resource['created_at']
                    ];
                }
                
                // Sort images by filename (1.jpg, 2.png, etc.)
                usort($images, function($a, $b) {
                    return strcmp($a['filename'], $b['filename']);
                });
            }
            
            return $images;
            
        } catch (Exception $e) {
            error_log('Error getting grave images: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Delete a single image by public ID
     */
    public function deleteSingleImage($publicId) {
        try {
            $result = $this->cloudinary->adminApi()->deleteAssets([$publicId]);
            return $result['deleted'][$publicId] === 'deleted';
        } catch (Exception $e) {
            error_log('Error deleting image: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get image URL with transformations
     */
    public function getImageUrl($publicId, $transformations = []) {
        try {
            return $this->cloudinary->image($publicId)->toUrl();
        } catch (Exception $e) {
            error_log('Error generating image URL: ' . $e->getMessage());
            return null;
        }
    }
}
