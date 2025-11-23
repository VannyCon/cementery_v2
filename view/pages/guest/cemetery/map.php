<?php
require_once '../../../components/render.php';

// Use the new clean approach
renderGuestPage(__DIR__ . '/map_content.php', [
    'page' => 'map',
    'page_js' => ['js/navigation-utils.js', 'js/location-tracker.js', 'js/map.js']
]);
?>
