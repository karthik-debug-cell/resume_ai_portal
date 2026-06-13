<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();

$db  = getDB();
$id  = intval($_GET['id'] ?? 0);
$stmt = $db->prepare("SELECT c.*, j.title as job_title, j.required_skills, j.preferred_skills FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id WHERE c.id = ?");
$stmt->execute([$id]);
$c = $stmt->fetch();
if (!$c) { echo "<p style='padding:40px;font-family:sans-serif;'>Candidate not found. <a href='dashboard.php'>← Back</a></p>"; exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($c['name']) ?> – ResumeAI</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',sans-serif; background:#f4f6f9; color:#333; }
        .container { max-width:860px; margin:0 auto; padding:0 20px; }
        .header { background:#1a237e; color:#fff; }
        .header-inner { display:flex; align-items:center; justify-content:space-between; height:60px; }
        .logo { font-size:1.1rem; font-weight:700; color:#fff; }
        .logo span { color:#90caf9; }
        .nav a { color:#cfd8dc; text-decoration:none; margin-left:20px; font-size:0.9rem; }
        .main { padding:28px 0; }
        .panel { background:#fff; border-radius:10px; padding:28px; box-shadow:0 2px 8px rgba(0,0,0,0.07); }
        .panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .panel-header h2 { font-size:1.3rem; }
        .badge { background:#e8eaf6; color:#1a237e; padding:4px 12px; border-radius:20px; font-size:0.82rem; font-weight:600; }
        .meta-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #f0f0f0; }
        .meta-item strong { display:block; font-size:0.78rem; color:#888; margin-bottom:4px; }
        .meta-item p, .meta-item a { font-size:0.9rem; color:#333; }
        .score-highlight { display:flex; gap:20px; align-items:flex-start; background:#f8f9ff; border-radius:10px; padding:20px; margin-bottom:24px; }
        .big-score { width:90px; height:90px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; color:#fff; flex-shrink:0; }
        .big-score.good { background:#22c55e; }
        .big-score.ok   { background:#f59e0b; }
        .big-score.low  { background:#ef4444; }
        .score-highlight h3 { margin-bottom:8px; font-size:1rem; }
        .score-highlight p { font-size:0.88rem; margin-bottom:4px; line-height:1.6; }
        .resume-preview { background:#f9f9f9; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:20px; }
        .resume-preview h4 { margin-bottom:12px; font-size:0.9rem; color:#555; }
        .resume-preview pre { font-size:0.82rem; white-space:pre-wrap; word-break:break-word; line-height:1.6; color:#444; max-height:400px; overflow-y:auto; }
        .status-pending    { background:#fffbeb; color:#b45309; }
        .status-reviewed   { background:#eff6ff; color:#1d4ed8; }
        .status-shortlisted{ background:#f0fdf4; color:#166534; }
        .status-rejected   { background:#fef2f2; color:#991b1b; }
        .status-badge { padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; }
        .btn-primary { background:#1a237e; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-size:0.88rem; font-weight:600; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .footer { text-align:center; padding:20px; font-size:0.82rem; color:#aaa; border-top:1px solid #e5e7eb; background:#fff; margin-top:30px; }
    </style>
</head>
<body>
<header class="header">
    <div class="container">
        <div class="header-inner">
            <div class="logo"><span>Resume</span>AI</div>
            <nav class="nav"><a href="dashboard.php">← Back to Dashboard</a></nav>
        </div>
    </div>
</header>
<main class="main">
    <div class="container">
        <div class="panel">
            <div class="panel-header">
                <h2><?= htmlspecialchars($c['name']) ?></h2>
                <span class="badge"><?= htmlspecialchars($c['job_title'] ?? 'No Job') ?></span>
            </div>
            <div class="meta-grid">
                <div class="meta-item"><strong>Email</strong><p><a href="mailto:<?= htmlspecialchars($c['email']) ?>" style="color:#1a237e;"><?= htmlspecialchars($c['email']) ?></a></p></div>
                <div class="meta-item"><strong>Phone</strong><p><?= htmlspecialchars($c['phone'] ?: '-') ?></p></div>
                <div class="meta-item"><strong>Applied</strong><p><?= date('d M Y, H:i', strtotime($c['submitted_at'])) ?></p></div>
                <div class="meta-item"><strong>Status</strong><p><span class="status-badge status-<?= $c['status'] ?>"><?= ucfirst($c['status']) ?></span></p></div>
            </div>

            <div class="score-highlight">
                <div class="big-score <?= $c['match_score'] >= 70 ? 'good' : ($c['match_score'] >= 40 ? 'ok' : 'low') ?>">
                    <?= $c['match_score'] ?>%
                </div>
                <div>
                    <h3>Match Score</h3>
                    <?php if ($c['matched_skills']): ?>
                    <p><strong>✔ Matched:</strong> <?= htmlspecialchars($c['matched_skills']) ?></p>
                    <?php endif; ?>
                    <?php if ($c['missing_skills']): ?>
                    <p><strong>✗ Missing:</strong> <?= htmlspecialchars($c['missing_skills']) ?></p>
                    <?php endif; ?>
                </div>
            </div>

            <?php if ($c['resume_file']): ?>
            <div style="margin-bottom:20px;">
                <a href="../uploads/resumes/<?= urlencode($c['resume_file']) ?>" target="_blank" class="btn-primary">
                    📄 Download Resume
                </a>
            </div>
            <?php endif; ?>

            <?php if ($c['resume_text']): ?>
            <div class="resume-preview">
                <h4>Resume Text Preview</h4>
                <pre><?= htmlspecialchars(substr($c['resume_text'], 0, 2000)) ?><?= strlen($c['resume_text']) > 2000 ? "\n…[truncated]" : '' ?></pre>
            </div>
            <?php endif; ?>
        </div>
    </div>
</main>
<footer class="footer">© <?= date('Y') ?> ResumeAI Portal</footer>
</body>
</html>
