<?php
require_once '../../../components/render.php';

// Use the new clean approach
renderPage(__DIR__ . '/staff_content.php', [
    'page_js' => 'main.js'
]);
?>
