<?php
/**
 * Layout rendering helper functions
 */

/**
 * Render a page using the layout template
 * 
 * @param string $page_path Path to the page content file
 * @param array $data Optional data to pass to the page
 */
function renderPage($page_path, $data = []) {
    // Extract data variables
    extract($data);
    
    // Set the page content path
    $page_content = $page_path;
    
    // Include the layout
    include __DIR__ . '/admin_layout.php';
}

/**
 * Render a staff page using the staff layout template
 * 
 * @param string $page_path Path to the page content file
 * @param array $data Optional data to pass to the page
 */
function renderStaffPage($page_path, $data = []) {
    // Extract data variables
    extract($data);
    
    // Set the page content path
    $page_content = $page_path;
    
    // Include the staff layout
    include __DIR__ . '/staff_layout.php';
}

/**
 * Render a guest page using the guest layout template
 * 
 * @param string $page_path Path to the page content file
 * @param array $data Optional data to pass to the page
 */
function renderGuestPage($page_path, $data = []) {
    // Extract data variables
    extract($data);
    
    // Set the page content path
    $page_content = $page_path;
    
    // Include the guest layout
    include __DIR__ . '/guest_layout.php';
}

/**
 * Render a partial view
 * 
 * @param string $partial_path Path to the partial file
 * @param array $data Optional data to pass to the partial
 */
function renderPartial($partial_path, $data = []) {
    // Extract data variables
    extract($data);
    
    // Include the partial
    include $partial_path;
}

/**
 * Start output buffering for content
 */
function startContent() {
    ob_start();
}

/**
 * End output buffering and return content
 */
function endContent() {
    return ob_get_clean();
}
