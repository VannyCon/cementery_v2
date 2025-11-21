<?php
require_once('../connection/connection.php');

class StaffServices extends config {
    // ============ BURIAL RECORDS MANAGEMENT ============


    public function getAllStaff($page = 1, $size = 12, $search = '', $featured = null) {
        try {
            $page = max(1, (int)$page);
            $size = max(1, min(100, (int)$size));
            $offset = ($page - 1) * $size;

            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(username LIKE :search OR email LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

			$query = "SELECT * FROM tbl_users $whereSql ORDER BY name ASC LIMIT :limit OFFSET :offset";
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
     * Create a new burial record
     */
    public function createBurialRecord($data) {
        try {
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
                $data['grave_id_fk'],
                $data['next_of_kin'] ?? null,
                $data['contact_info'] ?? null,
                $data['notes'] ?? null
            ]);

            return [
                'success' => true,
                'message' => 'Burial record created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create burial record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update burial record
     */
    public function updateBurialRecord($id, $data) {
        try {
            $query = "UPDATE tbl_burial_records 
                     SET deceased_name = ?, date_of_birth = ?, date_of_death = ?, burial_date = ?, 
                         grave_number = ?, grave_id_fk = ?, next_of_kin = ?, contact_info = ?, notes = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['deceased_name'],
                $data['date_of_birth'] ?? null,
                $data['date_of_death'],
                $data['burial_date'],
                $data['grave_number'],
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
            $query = "DELETE FROM tbl_burial_records WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Burial record deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete burial record: ' . $e->getMessage()
            ];
        }
    }   

    // ============ STAFF USERS (tbl_users) =========

    public function getStaffUsers($page = 1, $size = 20, $search = '') {
        try {
            $page = max(1, (int)$page);
            $size = max(1, min(100, (int)$size));
            $offset = ($page - 1) * $size;

            $whereClauses = ["`role` = :role"];
            $params = [':role' => 'staff'];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(username LIKE :search OR email LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = 'WHERE ' . implode(' AND ', $whereClauses);

            $sql = "SELECT `id`, `username`, `email`, `role`, `created_at`
                    FROM `tbl_users` $whereSql
                    ORDER BY `created_at` DESC
                    LIMIT :limit OFFSET :offset";
            $stmt = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v, $k === ':role' ? PDO::PARAM_STR : PDO::PARAM_STR);
            }
            $stmt->bindValue(':limit', (int)$size, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get staff users error: " . $e->getMessage());
            return [];
        }
    }

    public function countStaffUsers($search = '') {
        try {
            $whereClauses = ["`role` = :role"];
            $params = [':role' => 'staff'];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(username LIKE :search OR email LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = 'WHERE ' . implode(' AND ', $whereClauses);

            $sql = "SELECT COUNT(*) as total FROM `tbl_users` $whereSql";
            $stmt = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v, $k === ':role' ? PDO::PARAM_STR : PDO::PARAM_STR);
            }
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($row['total'] ?? 0);
        } catch (PDOException $e) {
            error_log("Count staff users error: " . $e->getMessage());
            return 0;
        }
    }
}
?>
