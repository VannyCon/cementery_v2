<?php
// Include the render helper
require_once '../../../components/render.php';

// Use the new clean approach
renderPage(__DIR__ . '/cemetery_content.php', [
    'page' => 'map',
    'page_js' => ['modal.js', 'road.js', 'main.js', 'layer.js', 'location-tracker.js']
]);
?>
