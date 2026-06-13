<?php
require_once __DIR__ . '/config.php';

function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function isAdminLoggedIn() {
    startSecureSession();
    return isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);
}

function requireAdmin() {
    if (!isAdminLoggedIn()) {
        header('Location: ' . (strpos($_SERVER['PHP_SELF'], '/admin/') !== false ? '' : 'admin/') . 'login.php');
        exit;
    }
}

function adminLogin($username, $password) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password'])) {
        startSecureSession();
        $_SESSION['admin_id']   = $user['id'];
        $_SESSION['admin_user'] = $user['username'];
        return true;
    }
    return false;
}

function adminLogout() {
    startSecureSession();
    session_destroy();
    header('Location: login.php');
    exit;
}
?>
