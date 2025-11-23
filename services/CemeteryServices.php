<?php
require_once('../connection/connection.php');

class CemeteryServices extends config {
    // ============ CEMETERY MANAGEMENT ============
    
    /**
     * Get all cemeteries
     */
    public function getCemeteries() {
        try {
            $query = "SELECT * FROM tbl_place_cemeteries ORDER BY created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get cemeteries error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new cemetery
     */
    public function createCemetery($data) {
        try {
            $query = "INSERT INTO tbl_place_cemeteries (name, description, latitude, longitude, photo_path) 
                     VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['latitude'],
                $data['longitude'],
                $data['photo_path'] ?? null
            ]);

            return [
                'success' => true,
                'message' => 'Cemetery created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create cemetery error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create cemetery: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update cemetery
     */
    public function updateCemetery($id, $data) {
        try {
            $query = "UPDATE tbl_place_cemeteries 
                     SET name = ?, description = ?, latitude = ?, longitude = ?, photo_path = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['latitude'],
                $data['longitude'],
                $data['photo_path'] ?? null,
                $id
            ]);

            return [
                'success' => true,
                'message' => 'Cemetery updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update cemetery error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update cemetery: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete cemetery
     */
    public function deleteCemetery($id) {
        try {
            $query = "DELETE FROM tbl_place_cemeteries WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Cemetery deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete cemetery error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete cemetery: ' . $e->getMessage()
            ];
        }
    }

    // ============ ROADS MANAGEMENT ============

    /**
     * Get all roads
     */
    public function getRoads() {
        try {
            $query = "SELECT r.*
                     FROM tbl_roads r 
                     ORDER BY r.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get roads error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new road
     */
    public function createRoad($data) {
        try {
            $query = "INSERT INTO tbl_roads (road_name, coordinates, geometry_type, type) 
                     VALUES (?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['road_name'],
                $data['coordinates'],
                $data['geometry_type'] ?? 'polyline',
                $data['type'] ?? 'main'
            ]);

            return [
                'success' => true,
                'message' => 'Road created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create road error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create road: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update road
     */
    public function updateRoad($id, $data) {
        try {
            $query = "UPDATE tbl_roads 
                     SET road_name = ?, coordinates = ?, geometry_type = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['road_name'],
                $data['coordinates'],
                $data['geometry_type'] ?? 'polyline',
                $id
            ]);

            return [
                'success' => true,
                'message' => 'Road updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update road error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update road: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete road
     */
    public function deleteRoad($id) {
        try {
            $query = "DELETE FROM tbl_roads WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Road deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete road error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete road: ' . $e->getMessage()
            ];
        }
    }

    // ============ BURIAL RECORDS MANAGEMENT ============


    public function getAllRecords($page = 1, $size = 12, $search = '', $featured = null) {
        try {
            $page = max(1, (int)$page);
            $size = max(1, min(100, (int)$size));
            $offset = ($page - 1) * $size;

            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(br.deceased_name LIKE :search OR br.grave_number LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

			$query = "SELECT br.*, 
                             ST_AsText(gp.location) as location_coords
                      FROM tbl_burial_records br 
                      LEFT JOIN tbl_grave_plots gp ON br.grave_id_fk = gp.id 
                      $whereSql 
                      ORDER BY br.grave_number ASC, br.grave_layer_number ASC, br.deceased_name ASC 
                      LIMIT :limit OFFSET :offset";
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $k => $v) { $stmt->bindValue($k, is_int($v) ? $v : $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
            $stmt->bindValue(':limit', (int)$size, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    /**
     * Get records grouped by grave number
     */
    public function getRecordsGroupedByGrave($page = 1, $size = 12, $search = '') {
        try {
            $page = max(1, (int)$page);
            $size = max(1, min(100, (int)$size));
            $offset = ($page - 1) * $size;

            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(br.deceased_name LIKE :search OR br.grave_number LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

            // First get unique grave numbers with their record counts
            $countQuery = "SELECT br.grave_number, COUNT(*) as record_count
                          FROM tbl_burial_records br 
                          $whereSql 
                          GROUP BY br.grave_number
                          ORDER BY br.grave_number ASC
                          LIMIT :limit OFFSET :offset";
            $countStmt = $this->pdo->prepare($countQuery);
            foreach ($params as $k => $v) { $countStmt->bindValue($k, is_int($v) ? $v : $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
            $countStmt->bindValue(':limit', (int)$size, PDO::PARAM_INT);
            $countStmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $countStmt->execute();
            $graveNumbers = $countStmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($graveNumbers)) {
                return [];
            }

            // Get all records for these grave numbers
            $graveNumbersList = array_column($graveNumbers, 'grave_number');
            $placeholders = str_repeat('?,', count($graveNumbersList) - 1) . '?';
            
            $recordsQuery = "SELECT br.*, 
                                   ST_AsText(gp.location) as location_coords
                            FROM tbl_burial_records br 
                            LEFT JOIN tbl_grave_plots gp ON br.grave_id_fk = gp.id 
                            WHERE br.grave_number IN ($placeholders)
                            ORDER BY br.grave_number ASC, br.grave_layer_number ASC, br.deceased_name ASC";
            $recordsStmt = $this->pdo->prepare($recordsQuery);
            $recordsStmt->execute($graveNumbersList);
            $allRecords = $recordsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Group records by grave number
            $groupedRecords = [];
            foreach ($allRecords as $record) {
                $graveNumber = $record['grave_number'];
                if (!isset($groupedRecords[$graveNumber])) {
                    $groupedRecords[$graveNumber] = [];
                }
                $groupedRecords[$graveNumber][] = $record;
            }

            return $groupedRecords;
        } catch (PDOException $e) {
            error_log("Get records grouped by grave error: " . $e->getMessage());
            return [];
        }
    }

    public function countAllRecords($search = '', $featured = null) {
        try {
            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(deceased_name LIKE :search OR grave_number LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

            $query = "SELECT COUNT(*) as total FROM tbl_burial_records $whereSql";
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $k => $v) { $stmt->bindValue($k, is_int($v) ? $v : $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($row['total'] ?? 0);
        } catch (PDOException $e) {
            return 0;
        }
    }

    /**
     * Count unique graves
     */
    public function countUniqueGraves($search = '') {
        try {
            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(deceased_name LIKE :search OR grave_number LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

            $query = "SELECT COUNT(DISTINCT grave_number) as total FROM tbl_burial_records $whereSql";
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $k => $v) { $stmt->bindValue($k, is_int($v) ? $v : $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($row['total'] ?? 0);
        } catch (PDOException $e) {
            return 0;
        }
    }


    /**
     * Get all burial records
     */
    public function getBurialRecords() {
        try {
            $query = "SELECT br.*
                     FROM tbl_burial_records br 
                     ORDER BY br.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get burial records error: " . $e->getMessage());
            return [];
        }
    }

    public function getHighlightedRecords($id) {
        try {
            $query = "SELECT br.*
                     FROM tbl_burial_records br 
                     LEFT JOIN tbl_grave_plots gp ON br.grave_id_fk = gp.id
                     WHERE gp.id = ?
                     ORDER BY br.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC); 
        } catch (PDOException $e) {
            error_log("Get highlighted records error: " . $e->getMessage());
            return [];
        }
    }
    /**
     * Create a new burial record
     */
    public function createBurialRecord($data) {
        try {
            $this->beginTransaction();

            $result = $this->createGravePlot($data);
            if (!$result['success']) {
				$this->rollback(); // important: rollback before returning
				return [
					'success' => false,
					'message' => 'Failed to create burial record: ' . ($result['message'] ?? 'Unable to create grave plot')
				];
			}

            $query = "INSERT INTO tbl_burial_records 
                     (deceased_name, date_of_birth, date_of_death, burial_date, grave_number, 
                      grave_id_fk, next_of_kin, contact_info, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['deceased_name'],
                $data['date_of_birth'] ?? null,
                $data['date_of_death'],
                $data['burial_date'],
                $data['grave_number'],
                $result['id'],
                $data['next_of_kin'] ?? null,
                $data['contact_info'] ?? null,
                $data['notes'] ?? null
            ]);
            $this->commit();
            return [
                'success' => true,
                'message' => 'Burial record created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            $this->rollback();
            error_log("Create burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create burial record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create multiple burial records for the same grave plot
     */
    public function createMultipleBurialRecords($data) {
        try {
            $this->beginTransaction();

            // Check if grave plot already exists
            $graveId = null;
            if (isset($data['grave_id_fk']) && !empty($data['grave_id_fk'])) {
                // Use existing grave plot
                $graveId = $data['grave_id_fk'];
            } else {
                // Create new grave plot (without grave_number and notes)
                $graveData = [
                    'status' => 'occupied',
                    'location' => $data['location'] ?? null
                ];
                $result = $this->createGravePlot($graveData);
                if (!$result['success']) {
                    $this->rollback();
                    return [
                        'success' => false,
                        'message' => 'Failed to create grave plot: ' . ($result['message'] ?? 'Unable to create grave plot')
                    ];
                }
                $graveId = $result['id'];
            }

            // Create burial records for each deceased person
            $createdRecords = [];
            $deceasedRecords = $data['deceased_records'] ?? [];
            
            if (empty($deceasedRecords)) {
                $this->rollback();
                return [
                    'success' => false,
                    'message' => 'No deceased records provided'
                ];
            }

            // Generate a grave number for this grave plot
            $graveNumber = $this->generateGraveNumber();
            
            foreach ($deceasedRecords as $index => $record) {
                $query = "INSERT INTO tbl_burial_records 
                         (deceased_name, date_of_birth, date_of_death, burial_date, grave_number, 
                          grave_id_fk, grave_layer_number, next_of_kin, contact_info, notes) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $this->pdo->prepare($query);
                $stmt->execute([
                    $record['deceased_name'],
                    $record['date_of_birth'] ?? null,
                    $record['date_of_death'],
                    $record['burial_date'],
                    $graveNumber,
                    $graveId,
                    $record['grave_layer_number'] ?? ($index + 1), // Default to layer 1, 2, 3, etc.
                    $record['next_of_kin'] ?? null,
                    $record['contact_info'] ?? null,
                    $record['notes'] ?? null
                ]);
                $createdRecords[] = $this->pdo->lastInsertId();
            }

            $this->commit();
            return [
                'success' => true,
                'message' => 'Multiple burial records created successfully',
                'grave_id' => $graveId,
                'record_ids' => $createdRecords,
                'count' => count($createdRecords)
            ];
        } catch (PDOException $e) {
            $this->rollback();
            error_log("Create multiple burial records error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create burial records: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Add a single burial record to an existing grave plot
     */
    public function addRecordToGrave($graveId, $data, $files = null) {
        try {
            $this->beginTransaction();
            
            // Verify grave plot exists
            $checkQuery = "SELECT id FROM tbl_grave_plots WHERE id = ?";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([$graveId]);
            $grave = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$grave) {
                $this->rollback();
                return [
                    'success' => false,
                    'message' => 'Grave plot not found'
                ];
            }

            // Get the grave_number from an existing burial record with the same grave_id_fk
            $graveNumberQuery = "SELECT grave_number FROM tbl_burial_records WHERE grave_id_fk = ? LIMIT 1";
            $graveNumberStmt = $this->pdo->prepare($graveNumberQuery);
            $graveNumberStmt->execute([$graveId]);
            $graveNumberResult = $graveNumberStmt->fetch(PDO::FETCH_ASSOC);
            $graveNumber = $graveNumberResult['grave_number'] ?? null;

            // If no existing grave_number found, generate a new one
            if (!$graveNumber) {
                $graveNumber = $data['grave_number'] ?? $this->generateGraveNumber();
            }

            // Get the next layer number for this grave
            $layerQuery = "SELECT COALESCE(MAX(grave_layer_number), 0) + 1 as next_layer 
                          FROM tbl_burial_records 
                          WHERE grave_id_fk = ?";
            $layerStmt = $this->pdo->prepare($layerQuery);
            $layerStmt->execute([$graveId]);
            $layerResult = $layerStmt->fetch(PDO::FETCH_ASSOC);
            $nextLayer = $layerResult['next_layer'] ?? 1;

            // Insert record first to get the ID for folder naming
            $query = "INSERT INTO tbl_burial_records 
                     (deceased_name, date_of_birth, date_of_death, burial_date, grave_number, 
                      grave_id_fk, grave_layer_number, next_of_kin, contact_info, notes, grave_image) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['deceased_name'],
                $data['date_of_birth'] ?? null,
                $data['date_of_death'],
                $data['burial_date'],
                $graveNumber,
                $graveId,
                $data['grave_layer_number'] ?? $nextLayer,
                $data['next_of_kin'] ?? null,
                $data['contact_info'] ?? null,
                $data['notes'] ?? null,
                null // Will be updated after image upload
            ]);
            
            $recordId = $this->pdo->lastInsertId();
            
            // Initialize ImageUploadHandler for image uploads
            $imageHandler = null;
            $graveImage = null;
            
            if ($files) {
                require_once __DIR__ . '/ImageUploadHandler.php';
                $imageHandler = new ImageUploadHandler();
                
                // Debug: Log file structure
                error_log("addRecordToGrave - Files structure: " . json_encode(array_keys($files)));
                if (isset($files['deceased_records'])) {
                    error_log("addRecordToGrave - deceased_records keys: " . json_encode(array_keys($files['deceased_records'])));
                    if (isset($files['deceased_records']['name'])) {
                        error_log("addRecordToGrave - deceased_records['name'] keys: " . json_encode(array_keys($files['deceased_records']['name'])));
                        if (isset($files['deceased_records']['name'][0])) {
                            error_log("addRecordToGrave - deceased_records['name'][0] keys: " . json_encode(array_keys($files['deceased_records']['name'][0])));
                        }
                    }
                }
                
                // Handle image uploads for this deceased record (index 0)
                // Check multiple possible file structures
                $photoFiles = [];
                
                // Try the nested structure first: deceased_records[0][grave_photo][]
                if (isset($files['deceased_records']['name'][0]['grave_photo'])) {
                    error_log("addRecordToGrave - Found files in nested structure: deceased_records[0][grave_photo]");
                    $photoFiles = $this->extractDeceasedRecordFiles($files, 0);
                }
                // Alternative check: direct access
                elseif (isset($files['deceased_records']['tmp_name'][0]['grave_photo'])) {
                    error_log("addRecordToGrave - Found files via tmp_name check");
                    // Handle single file in nested structure
                    if (isset($files['deceased_records']['name'][0]['grave_photo']) && is_array($files['deceased_records']['name'][0]['grave_photo'])) {
                        $photoFiles = $this->extractDeceasedRecordFiles($files, 0);
                    } else {
                        // Single file
                        error_log("addRecordToGrave - Processing as single file");
                        $photoFiles[] = [
                            'name' => $files['deceased_records']['name'][0]['grave_photo'] ?? '',
                            'type' => $files['deceased_records']['type'][0]['grave_photo'] ?? '',
                            'tmp_name' => $files['deceased_records']['tmp_name'][0]['grave_photo'],
                            'error' => $files['deceased_records']['error'][0]['grave_photo'] ?? 0,
                            'size' => $files['deceased_records']['size'][0]['grave_photo'] ?? 0
                        ];
                    }
                } else {
                    error_log("addRecordToGrave - No files found in expected structure");
                }
                
                error_log("addRecordToGrave - Photo files extracted: " . count($photoFiles));
                
                if (!empty($photoFiles) && $imageHandler) {
                    // Use record ID for unique folder naming: data_{recordId}
                    error_log("addRecordToGrave - Uploading files with folder: data_{$recordId}");
                    $uploadResult = $imageHandler->handleDeceasedRecordUploads($photoFiles, $graveNumber, "data_{$recordId}");
                    
                    if ($uploadResult['success'] && !empty($uploadResult['files'])) {
                        // Extract URLs from upload result
                        $imageUrls = array_map(function($file) {
                            return $file['secure_url'];
                        }, $uploadResult['files']);
                        $graveImage = implode(',', $imageUrls);
                        
                        error_log("addRecordToGrave - Image URLs: {$graveImage}");
                        
                        // Update record with image URLs
                        $updateQuery = "UPDATE tbl_burial_records SET grave_image = ? WHERE id = ?";
                        $updateStmt = $this->pdo->prepare($updateQuery);
                        $updateStmt->execute([$graveImage, $recordId]);
                    } else if (!$uploadResult['success']) {
                        error_log("Image upload failed for addRecordToGrave: " . ($uploadResult['message'] ?? 'Unknown error'));
                        // Continue with record creation even if image upload fails
                    }
                } else {
                    if (empty($photoFiles)) {
                        error_log("addRecordToGrave - No photo files extracted");
                    }
                    if (!$imageHandler) {
                        error_log("addRecordToGrave - Image handler not initialized");
                    }
                }
            } else {
                error_log("addRecordToGrave - No files provided");
            }

            $this->commit();

            return [
                'success' => true,
                'message' => 'Burial record added to grave successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            $this->rollback();
            error_log("Add record to grave error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to add record to grave: ' . $e->getMessage()
            ];
        } catch (Exception $e) {
            $this->rollback();
            error_log("Add record to grave error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to add record to grave: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update burial record
     */
    public function updateBurialRecord($id, $data) {
        try {
            $query = "UPDATE tbl_burial_records 
                     SET deceased_name = ?, date_of_birth = ?, date_of_death = ?, burial_date = ?, grave_id_fk = ?, next_of_kin = ?, contact_info = ?, notes = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['deceased_name'],
                $data['date_of_birth'] ?? null,
                $data['date_of_death'],
                $data['burial_date'],
                $data['grave_id_fk'],
                $data['next_of_kin'] ?? null,
                $data['contact_info'] ?? null,
                $data['notes'] ?? null,
                $id
            ]);

            return [
                'success' => true,
                'message' => 'Burial record updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update burial record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete burial record
     */
    public function deleteBurialRecord($id) {
        try {
            // Start transaction so both deletions are atomic
            $this->pdo->beginTransaction();

            // Fetch grave_id_fk first
            $selectQuery = "SELECT grave_id_fk FROM tbl_burial_records WHERE id = ?";
            $selectStmt = $this->pdo->prepare($selectQuery);
            $selectStmt->execute([$id]);
            $record = $selectStmt->fetch(PDO::FETCH_ASSOC);
            $graveId = $record['grave_id_fk'] ?? null;

            // Delete the burial record
            $deleteBurialQuery = "DELETE FROM tbl_burial_records WHERE id = ?";
            $deleteBurialStmt = $this->pdo->prepare($deleteBurialQuery);
            $deleteBurialStmt->execute([$id]);

            // Check if there are any other burial records with the same grave_id_fk
            // Only delete the grave plot if there are no more records using it
            if (!empty($graveId)) {
                $checkRemainingQuery = "SELECT COUNT(*) as count FROM tbl_burial_records WHERE grave_id_fk = ?";
                $checkRemainingStmt = $this->pdo->prepare($checkRemainingQuery);
                $checkRemainingStmt->execute([$graveId]);
                $remainingResult = $checkRemainingStmt->fetch(PDO::FETCH_ASSOC);
                $remainingCount = $remainingResult['count'] ?? 0;

                // Only delete the grave plot if no other burial records are using it
                if ($remainingCount == 0) {
                    $deleteGraveQuery = "DELETE FROM tbl_grave_plots WHERE id = ?";
                    $deleteGraveStmt = $this->pdo->prepare($deleteGraveQuery);
                    $deleteGraveStmt->execute([$graveId]);
                }
            }

            $this->pdo->commit();

            return [
                'success' => true,
                'message' => 'Burial record deleted successfully'
            ];
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Delete burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete burial record: ' . $e->getMessage()
            ];
        }
    }

    // ============ GRAVE PLOTS MANAGEMENT ============

    /**
     * Get all grave plots
     */
    public function getGravePlots() {
        try {
            $query = "SELECT gp.id, 
                             ST_AsText(gp.location) as location,
                             gp.created_at
                      FROM tbl_grave_plots gp
                      ORDER BY gp.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            return array_map(function($row) {
                return array_map(function($value) {
                    if (is_string($value)) {
                        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                    return $value;
                }, $row);
            }, $results);
        } catch (PDOException $e) {
            error_log("Get grave plots error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Generate a new grave number in format G-XXXXX
     */
    public function generateGraveNumber() {
        try {
            $query = "SELECT COALESCE(MAX(CAST(SUBSTRING(grave_number, 3) AS UNSIGNED)), 0) + 1 as next_number 
                     FROM tbl_burial_records 
                     WHERE grave_number REGEXP '^G-[0-9]+$'";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $nextNumber = $result['next_number'] ?? 1;
            return 'G-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        } catch (PDOException $e) {
            error_log("Generate grave number error: " . $e->getMessage());
            // Fallback to timestamp-based number
            return 'G-' . str_pad(time() % 100000, 5, '0', STR_PAD_LEFT);
        }
    }

    /**
     * Create a new grave plot
     */
    public function createGravePlot($data) {
        try {
            $location = isset($data['location']) && $data['location'] ? $data['location'] : null;
    
            // If location is provided, validate it
            if ($location) {
                $testQuery = "SELECT ST_GeomFromText(?) as test_geom";
                $testStmt = $this->pdo->prepare($testQuery);
                $testStmt->execute([$location]);
                if ($testStmt->fetch(PDO::FETCH_ASSOC)['test_geom'] === null) {
                    return ['success' => false, 'message' => 'Invalid location format.'];
                }
            }
    
            // Updated query without grave_number, notes, image_path, and status
            $query = "INSERT INTO tbl_grave_plots
                      (location)
                      VALUES (ST_GeomFromText(?))";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $location
            ]);
    
            return [
                'success' => true,
                'message' => 'Grave plot created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create grave plot error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create grave plot: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create grave plot with multiple images and burial records
     * Images are now stored per deceased record in tbl_burial_records.grave_image
     */
    public function createGravePlotWithImages($data, $files = null) {
        try {
            $this->beginTransaction();
            
            // Check if grave plot already exists (grave_id_fk provided)
            $graveId = null;
            $graveNumber = null;
            
            if (isset($data['grave_id_fk']) && !empty($data['grave_id_fk'])) {
                // Use existing grave plot
                $graveId = $data['grave_id_fk'];
                
                // Verify grave plot exists
                $checkQuery = "SELECT id FROM tbl_grave_plots WHERE id = ?";
                $checkStmt = $this->pdo->prepare($checkQuery);
                $checkStmt->execute([$graveId]);
                $grave = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$grave) {
                    $this->rollback();
                    return [
                        'success' => false,
                        'message' => 'Grave plot not found'
                    ];
                }
                
                // Get the grave_number from an existing burial record with the same grave_id_fk
                $graveNumberQuery = "SELECT grave_number FROM tbl_burial_records WHERE grave_id_fk = ? LIMIT 1";
                $graveNumberStmt = $this->pdo->prepare($graveNumberQuery);
                $graveNumberStmt->execute([$graveId]);
                $graveNumberResult = $graveNumberStmt->fetch(PDO::FETCH_ASSOC);
                $graveNumber = $graveNumberResult['grave_number'] ?? null;
                
                // If no existing grave_number found, use the one from data or generate a new one
                if (!$graveNumber) {
                    $graveNumber = $data['grave_number'] ?? $this->generateGraveNumber();
                }
            } else {
                // Create new grave plot
                $location = isset($data['location']) && $data['location'] ? $data['location'] : null;
        
                // If location is provided, validate it
                if ($location) {
                    $testQuery = "SELECT ST_GeomFromText(?) as test_geom";
                    $testStmt = $this->pdo->prepare($testQuery);
                    $testStmt->execute([$location]);
                    if ($testStmt->fetch(PDO::FETCH_ASSOC)['test_geom'] === null) {
                        $this->rollback();
                        return ['success' => false, 'message' => 'Invalid location format.'];
                    }
                }
        
                $query = "INSERT INTO tbl_grave_plots
                          (location)
                          VALUES (ST_GeomFromText(?))";
                $stmt = $this->pdo->prepare($query);
                $stmt->execute([
                    $location
                ]);
                
                $graveId = $this->pdo->lastInsertId();
                
                // Generate grave number for new grave plot
                $graveNumber = $this->generateGraveNumber();
            }
            
            // Initialize ImageUploadHandler for image uploads
            $imageHandler = null;
            if ($files) {
                require_once __DIR__ . '/ImageUploadHandler.php';
                $imageHandler = new ImageUploadHandler();
            }
            
            // Create burial records if deceased records are provided
            $createdRecords = [];
            $deceasedRecords = $data['deceased_records'] ?? [];
            
            if (!empty($deceasedRecords)) {
                error_log("=== Processing deceased records ===");
                error_log("Total deceased records: " . count($deceasedRecords));
                error_log("Files provided: " . ($files ? 'YES' : 'NO'));
                error_log("ImageHandler initialized: " . ($imageHandler ? 'YES' : 'NO'));
                
                foreach ($deceasedRecords as $index => $record) {
                    error_log("--- Processing deceased record index: {$index} ---");
                    error_log("Record data: " . json_encode([
                        'deceased_name' => $record['deceased_name'] ?? 'NOT_SET',
                        'date_of_death' => $record['date_of_death'] ?? 'NOT_SET'
                    ]));
                    
                    // Handle image uploads for this deceased record
                    $graveImage = null;
                    
                    $hasFiles = $files && isset($files['deceased_records']['name'][$index]['grave_photo']);
                    error_log("Checking for files - hasFiles: " . ($hasFiles ? 'YES' : 'NO'));
                    if ($hasFiles) {
                        error_log("Files structure exists for deceased record {$index}");
                        error_log("Files structure: " . json_encode([
                            'has_name' => isset($files['deceased_records']['name'][$index]['grave_photo']),
                            'name_type' => isset($files['deceased_records']['name'][$index]['grave_photo']) ? gettype($files['deceased_records']['name'][$index]['grave_photo']) : 'NOT_SET'
                        ]));
                    }
                    
                    if ($files && isset($files['deceased_records']['name'][$index]['grave_photo']) && $imageHandler) {
                        error_log("Extracting files for deceased record {$index}...");
                        $photoFiles = $this->extractDeceasedRecordFiles($files, $index);
                        error_log("Extracted photoFiles count: " . count($photoFiles));
                        error_log("Extracted photoFiles: " . json_encode(array_map(function($f) {
                            return [
                                'name' => $f['name'] ?? 'NOT_SET',
                                'size' => $f['size'] ?? 'NOT_SET',
                                'error' => $f['error'] ?? 'NOT_SET'
                            ];
                        }, $photoFiles)));
                        
                        if (!empty($photoFiles)) {
                            error_log("Calling handleDeceasedRecordUploads for deceased record {$index} with graveNumber: {$graveNumber}");
                            $uploadResult = $imageHandler->handleDeceasedRecordUploads($photoFiles, $graveNumber, $index);
                            
                            error_log("Upload result for deceased record {$index}: " . json_encode([
                                'success' => $uploadResult['success'] ?? false,
                                'message' => $uploadResult['message'] ?? 'NO_MESSAGE',
                                'files_count' => isset($uploadResult['files']) ? count($uploadResult['files']) : 0
                            ]));
                            
                            if ($uploadResult['success'] && !empty($uploadResult['files'])) {
                                error_log("Upload successful, extracting URLs...");
                                // Extract URLs from upload result
                                $imageUrls = array_map(function($file) {
                                    return $file['secure_url'];
                                }, $uploadResult['files']);
                                $graveImage = implode(',', $imageUrls);
                                error_log("Grave image URLs: {$graveImage}");
                            } else if (!$uploadResult['success']) {
                                error_log("Image upload failed for deceased record {$index}: " . ($uploadResult['message'] ?? 'NO_MESSAGE'));
                                // Continue with record creation even if image upload fails
                            } else {
                                error_log("Upload returned success but no files in result for deceased record {$index}");
                            }
                        } else {
                            error_log("No photoFiles extracted for deceased record {$index}");
                        }
                    } else {
                        if (!$files) {
                            error_log("No files provided for deceased record {$index}");
                        } else if (!isset($files['deceased_records']['name'][$index]['grave_photo'])) {
                            error_log("Files structure missing for deceased record {$index}");
                        } else if (!$imageHandler) {
                            error_log("ImageHandler not initialized for deceased record {$index}");
                        }
                    }
                    
                    // Insert burial record with grave_image
                    $query = "INSERT INTO tbl_burial_records 
                             (deceased_name, date_of_birth, date_of_death, burial_date, grave_number, 
                              grave_id_fk, grave_layer_number, next_of_kin, contact_info, notes, grave_image) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    $stmt = $this->pdo->prepare($query);
                    $stmt->execute([
                        $record['deceased_name'],
                        $record['date_of_birth'] ?? null,
                        $record['date_of_death'],
                        $record['burial_date'] ?? null,
                        $graveNumber,
                        $graveId,
                        $record['grave_layer_number'] ?? ($index + 1),
                        $record['next_of_kin'] ?? null,
                        $record['contact_info'] ?? null,
                        $record['notes'] ?? null,
                        $graveImage
                    ]);
                    $createdRecords[] = $this->pdo->lastInsertId();
                }
            }
            
            $this->commit();
            
            return [
                'success' => true,
                'message' => 'Grave plot and burial records created successfully',
                'id' => $graveId,
                'grave_number' => $graveNumber,
                'created_records' => $createdRecords
            ];
            
        } catch (PDOException $e) {
            $this->rollback();
            error_log("Create grave plot with images error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create grave plot: ' . $e->getMessage()
            ];
        } catch (Exception $e) {
            $this->rollback();
            error_log("Create grave plot with images error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create grave plot: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Extract files for a specific deceased record index from $_FILES array
     * Handles nested array structure: deceased_records[index][grave_photo][]
     */
    private function extractDeceasedRecordFiles($files, $recordIndex) {
        $extractedFiles = [];
        
        if (!isset($files['deceased_records']['name'][$recordIndex]['grave_photo'])) {
            return $extractedFiles;
        }
        
        $photos = $files['deceased_records']['name'][$recordIndex]['grave_photo'];
        error_log("Photos variable type: " . gettype($photos));
        error_log("Photos is_array: " . (is_array($photos) ? 'YES' : 'NO'));
        
        if (is_array($photos)) {
            error_log("Photos count: " . count($photos));
        }
        
        // Handle both single file and multiple files
        if (!is_array($photos)) {
            error_log("Processing as SINGLE file");
            // Single file
            $extractedFiles[] = [
                'name' => $files['deceased_records']['name'][$recordIndex]['grave_photo'],
                'type' => $files['deceased_records']['type'][$recordIndex]['grave_photo'],
                'tmp_name' => $files['deceased_records']['tmp_name'][$recordIndex]['grave_photo'],
                'error' => $files['deceased_records']['error'][$recordIndex]['grave_photo'],
                'size' => $files['deceased_records']['size'][$recordIndex]['grave_photo']
            ];
            error_log("Single file extracted: " . json_encode([
                'name' => $extractedFiles[0]['name'],
                'size' => $extractedFiles[0]['size'],
                'error' => $extractedFiles[0]['error']
            ]));
        } else {
            error_log("Processing as MULTIPLE files");
            // Multiple files
            $count = count($photos);
            error_log("Multiple files count: {$count}");
            for ($i = 0; $i < $count; $i++) {
                error_log("Extracting file {$i} of {$count}");
                $extractedFiles[] = [
                    'name' => $files['deceased_records']['name'][$recordIndex]['grave_photo'][$i],
                    'type' => $files['deceased_records']['type'][$recordIndex]['grave_photo'][$i],
                    'tmp_name' => $files['deceased_records']['tmp_name'][$recordIndex]['grave_photo'][$i],
                    'error' => $files['deceased_records']['error'][$recordIndex]['grave_photo'][$i],
                    'size' => $files['deceased_records']['size'][$recordIndex]['grave_photo'][$i]
                ];
                error_log("File {$i} extracted: " . json_encode([
                    'name' => $extractedFiles[$i]['name'],
                    'size' => $extractedFiles[$i]['size'],
                    'error' => $extractedFiles[$i]['error']
                ]));
            }
        }
        
        error_log("Total extracted files: " . count($extractedFiles));
        error_log("=== extractDeceasedRecordFiles END ===");
        return $extractedFiles;
    }

    /**
     * Update grave plot
     */
    public function updateGravePlot($id, $data) {
        try {
            $location = isset($data['location']) && $data['location'] ? $data['location'] : null;
    
            $query = "UPDATE tbl_grave_plots
                      SET location = ST_GeomFromText(?)
                      WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $location,
                $id
            ]);
    
            return [
                'success' => true,
                'message' => 'Grave plot updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update grave plot error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update grave plot: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete grave plot
     */
    public function deleteGravePlot($id) {
        try {
            $query = "DELETE FROM tbl_grave_plots WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Grave plot deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete grave plot error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete grave plot: ' . $e->getMessage()
            ];
        }
    }

    // ============ LAYER ANNOTATIONS MANAGEMENT ============

    /**
     * Get all layer annotations
     */
    public function getLayerAnnotations() {
        try {
            // Convert binary geometry to WKT format for JavaScript consumption
            $query = "SELECT la.id, ST_AsText(la.geometry) as geometry, 
                            la.label, la.color, la.notes, la.is_visible, 
                            la.is_active, la.sort_order, la.created_at, la.updated_at
                     FROM tbl_layer_annotations la 
                     ORDER BY la.sort_order ASC, la.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Sanitize UTF-8 for each result
            return array_map(function($row) {
                return array_map(function($value) {
                    if (is_string($value)) {
                        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                    return $value;
                }, $row);
            }, $results);
        } catch (PDOException $e) {
            error_log("Get layer annotations error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Ensure polygon is properly closed (first and last coordinates must be identical)
     */
    private function ensurePolygonClosed($wkt) {
        if (strpos($wkt, 'POLYGON') === false) {
            return $wkt; // Not a polygon, return as-is
        }
        
        // Extract coordinates from POLYGON((coords))
        preg_match('/POLYGON\(\(([^)]+)\)\)/', $wkt, $matches);
        if (!isset($matches[1])) {
            return $wkt; // Invalid format, return as-is
        }
        
        $coordsString = trim($matches[1]);
        $coords = explode(',', $coordsString);
        
        if (count($coords) < 3) {
            return $wkt; // Not enough coordinates for a polygon
        }
        
        $firstCoord = trim($coords[0]);
        $lastCoord = trim($coords[count($coords) - 1]);
        
        // If first and last coordinates are different, close the polygon
        if ($firstCoord !== $lastCoord) {
            $coordsString .= ', ' . $firstCoord;
        }
        
        return 'POLYGON((' . $coordsString . '))';
    }

    /**
     * Create a new layer annotation
     */
    public function createLayerAnnotation($data) {
        try {
            error_log("Creating layer annotation with geometry: " . $data['geometry']);
            
            // Ensure polygon is properly closed
            $geometry = $this->ensurePolygonClosed($data['geometry']);
            error_log("Processed geometry: " . $geometry);
            
            // Test if the geometry is valid before inserting
            $testQuery = "SELECT ST_GeomFromText(?) as test_geom";
            $testStmt = $this->pdo->prepare($testQuery);
            $testStmt->execute([$geometry]);
            $testResult = $testStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($testResult['test_geom'] === null) {
                error_log("Invalid geometry format: " . $geometry);
                return [
                    'success' => false,
                    'message' => 'Invalid geometry format. Polygon must be properly closed.'
                ];
            }
            
            $query = "INSERT INTO tbl_layer_annotations 
                     (geometry, label, color, notes, is_visible, is_active, sort_order) 
                     VALUES (ST_GeomFromText(?), ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $geometry,
                $data['label'] ?? null,
                $data['color'] ?? '#FF0000',
                $data['notes'] ?? null,
                $data['is_visible'] ?? 1,
                $data['is_active'] ?? 1,
                $data['sort_order'] ?? 0
            ]);

            return [
                'success' => true,
                'message' => 'Layer annotation created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create layer annotation error: " . $e->getMessage());
            error_log("Geometry data: " . ($data['geometry'] ?? 'null'));
            return [
                'success' => false,
                'message' => 'Failed to create layer annotation: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update layer annotation
     */
    public function updateLayerAnnotation($id, $data) {
        try {
            // If geometry is null or empty, do not update the geometry column
            if (!isset($data['geometry']) || is_null($data['geometry']) || trim($data['geometry']) === '') {
                $query = "UPDATE tbl_layer_annotations 
                         SET label = ?, color = ?, notes = ?, 
                             is_visible = ?, is_active = ?, sort_order = ? 
                         WHERE id = ?";
                $params = [
                    $data['label'] ?? null,
                    $data['color'] ?? '#FF0000',
                    $data['notes'] ?? null,
                    $data['is_visible'] ?? 1,
                    $data['is_active'] ?? 1,
                    $data['sort_order'] ?? 0,
                    $id
                ];
            } else {
                $query = "UPDATE tbl_layer_annotations 
                         SET geometry = ST_GeomFromText(?), label = ?, color = ?, notes = ?, 
                             is_visible = ?, is_active = ?, sort_order = ? 
                         WHERE id = ?";
                $params = [
                    $data['geometry'], // WKT format polygon
                    $data['label'] ?? null,
                    $data['color'] ?? '#FF0000',
                    $data['notes'] ?? null,
                    $data['is_visible'] ?? 1,
                    $data['is_active'] ?? 1,
                    $data['sort_order'] ?? 0,
                    $id
                ];
            }

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);

            return [
                'success' => true,
                'message' => 'Layer annotation updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update layer annotation error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update layer annotation: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete layer annotation
     */
    public function deleteLayerAnnotation($id) {
        try {
            $query = "DELETE FROM tbl_layer_annotations WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Layer annotation deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete layer annotation error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete layer annotation: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get layer annotations with visibility filter
     */
    public function getVisibleLayerAnnotations() {
        try {
            $query = "SELECT la.id, ST_AsText(la.geometry) as geometry, 
                            la.label, la.color, la.notes, la.is_visible, 
                            la.is_active, la.sort_order, la.created_at, la.updated_at
                     FROM tbl_layer_annotations la 
                     WHERE la.is_visible = 1 AND la.is_active = 1
                     ORDER BY la.sort_order ASC, la.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function($row) {
                return array_map(function($value) {
                    if (is_string($value)) {
                        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                    return $value;
                }, $row);
            }, $results);
        } catch (PDOException $e) {
            error_log("Get visible layer annotations error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Toggle annotation visibility
     */
    public function toggleAnnotationVisibility($id) {
        try {
            $query = "UPDATE tbl_layer_annotations 
                     SET is_visible = NOT is_visible 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            // Get the updated visibility status
            $checkQuery = "SELECT is_visible FROM tbl_layer_annotations WHERE id = ?";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([$id]);
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'message' => 'Annotation visibility updated successfully',
                'is_visible' => $result['is_visible']
            ];
        } catch (PDOException $e) {
            error_log("Toggle annotation visibility error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to toggle annotation visibility: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update annotation sort order
     */
    public function updateAnnotationSortOrder($id, $sortOrder) {
        try {
            $query = "UPDATE tbl_layer_annotations 
                     SET sort_order = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$sortOrder, $id]);

            return [
                'success' => true,
                'message' => 'Annotation sort order updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update annotation sort order error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update annotation sort order: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get combined data for map display
     */
    public function getMapData() {
        try {
            error_log("Starting getMapData...");
            
            $cemeteries = $this->getCemeteries();
            error_log("Cemeteries count: " . count($cemeteries));
            
            $roads = $this->getRoads();
            error_log("Roads count: " . count($roads));
            
            $burialRecords = $this->getBurialRecords();
            error_log("Burial records count: " . count($burialRecords));
            
            $gravePlots = $this->getGravePlots();
            error_log("Grave plots count: " . count($gravePlots));
            
            $layerAnnotations = $this->getVisibleLayerAnnotations();
            error_log("Visible layer annotations count: " . count($layerAnnotations));
            
            $result = [
                'success' => true,
                'data' => [
                    'cemeteries' => $cemeteries,
                    'roads' => $roads,
                    'burial_records' => $burialRecords,
                    'grave_plots' => $gravePlots,
                    'layer_annotations' => $layerAnnotations
                ]
            ];
            
            error_log("getMapData completed successfully");
            return $result;
            
        } catch (Exception $e) {
            error_log("Get map data error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Failed to load map data: ' . $e->getMessage()
            ];
        }
    }

    public function getGuestMapData() {
        try {
            error_log("Starting getGuestMapData...");
            
            $cemeteries = $this->getCemeteries();
            error_log("Cemeteries count: " . count($cemeteries));
            
            $roads = $this->getRoads();
            error_log("Roads count: " . count($roads));
            
            $burialRecords = $this->getBurialRecords();
            error_log("Burial records count: " . count($burialRecords));
            
            $gravePlots = $this->getGravePlots();
            error_log("Grave plots count: " . count($gravePlots));
            
            $layerAnnotations = $this->getVisibleLayerAnnotations();
            error_log("Visible layer annotations count: " . count($layerAnnotations));
            
            $result = [
                'success' => true,
                'data' => [
                    'cemeteries' => $cemeteries,
                    'roads' => $roads,
                    'burial_records' => $burialRecords,
                    'grave_plots' => $gravePlots,
                    'layer_annotations' => $layerAnnotations
                ]
            ];
            
            error_log("getMapData completed successfully");
            return $result;
            
        } catch (Exception $e) {
            error_log("Get map data error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Failed to load map data: ' . $e->getMessage()
            ];
        }
    }
}
?>
