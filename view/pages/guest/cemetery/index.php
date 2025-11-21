<?php
// Include the render helper
require_once '../../../components/render.php';

// Use the new clean approach
renderGuestPage(__DIR__ . '/index_content.php', [
    'page_js' => ['js/main.js']
]);
?>
