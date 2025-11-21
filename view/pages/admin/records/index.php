<?php
require_once '../../../components/render.php';

// Use the new clean approach
renderPage(__DIR__ . '/index_content.php', [
    'page_js' => ['js/main.js']
]);
?>
