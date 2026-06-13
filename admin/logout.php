<?php
require_once __DIR__ . '/../includes/auth.php';
startSecureSession();
session_unset();
session_destroy();
header('Location: login.php?msg=logged_out');
exit;
