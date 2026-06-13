<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';

startSecureSession();
if (isAdminLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    if (adminLogin($username, $password)) {
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Invalid username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login – ResumeAI</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',sans-serif; background:#f4f6f9; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        .auth-card { background:#fff; border-radius:12px; padding:40px; width:100%; max-width:400px; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
        .logo { text-align:center; margin-bottom:28px; font-size:1.4rem; font-weight:700; color:#1a237e; }
        .logo span { color:#90caf9; }
        h2 { text-align:center; margin-bottom:8px; font-size:1.3rem; color:#222; }
        .sub { text-align:center; color:#888; margin-bottom:28px; font-size:0.9rem; }
        .form-group { margin-bottom:16px; }
        .form-group label { display:block; font-size:0.83rem; font-weight:600; color:#444; margin-bottom:6px; }
        .form-group input { width:100%; border:1px solid #ddd; border-radius:7px; padding:10px 13px; font-size:0.9rem; outline:none; transition:border 0.2s; }
        .form-group input:focus { border-color:#1a237e; }
        .btn-primary { width:100%; background:#1a237e; color:#fff; border:none; padding:12px; border-radius:7px; font-size:0.95rem; font-weight:600; cursor:pointer; margin-top:8px; transition:background 0.2s; }
        .btn-primary:hover { background:#283593; }
        .alert-error { background:#ffebee; color:#c62828; border-left:4px solid #e53935; padding:12px 16px; border-radius:6px; font-size:0.88rem; margin-bottom:18px; }
        .back-link { text-align:center; margin-top:18px; font-size:0.88rem; }
        .back-link a { color:#1a237e; text-decoration:none; }
        .hint { text-align:center; font-size:0.78rem; color:#aaa; margin-top:10px; }
    </style>
</head>
<body>
<div class="auth-card">
    <div class="logo"><span>Resume</span>AI Portal</div>
    <h2>Admin Login</h2>
    <p class="sub">Access the screening dashboard</p>

    <?php if ($error): ?>
    <div class="alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form method="POST">
        <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" required placeholder="admin" autofocus>
        </div>
        <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn-primary">Sign In</button>
    </form>
    <div class="back-link"><a href="../index.php">← Back to Portal</a></div>
    <p class="hint">Default: admin / admin123</p>
</div>
</body>
</html>
