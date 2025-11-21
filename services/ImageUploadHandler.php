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
