<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');         // Change if needed
define('DB_PASS', '');             // Change if needed
define('DB_NAME', 'resume_portal');

define('UPLOAD_DIR', __DIR__ . '/../uploads/resumes/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['pdf', 'doc', 'docx', 'txt']);
define('SITE_NAME', 'ResumeAI Portal');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            die('<h3 style="color:red;font-family:sans-serif;padding:20px;">Database connection failed: ' . htmlspecialchars($e->getMessage()) . '<br><small>Check your DB credentials in includes/config.php</small></h3>');
        }
    }
    return $pdo;
}
?>
