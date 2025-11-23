<?php
// require __DIR__ . '/../vendor/autoload.php';
// Set expiration date and time (YYYY-MM-DD HH:MM:SS format)
$expireDateTime = strtotime("2025-12-24 12:00:00"); // Change to your desired date & time
$currentDateTime = time();

// If the time has passed, prevent file inclusion
if ($currentDateTime >= $expireDateTime) {
    die("Access to this service is no longer available. Please contact the administrator.");
}
session_start();
//Database Config

// define("H", "localhost");
// define("U", "root");
// define("P", "");
// define("DB", "cementery_db_two");
define("H", "mysql-d77de55-vannycon001-3b2f.c.aivencloud.com:25521");
define("U", "avnadmin");
define("P", "AVNS_M8MYUL4UG_rvOxyfubU");
define("DB", "cementery_new_db");
define("URL", "http://localhost/Projects/cementry_system_v2/");
define("FILEPATH", "C:\xampp\htdocs\Projects\cementry_system_v2");

date_default_timezone_set("Asia/Manila");

