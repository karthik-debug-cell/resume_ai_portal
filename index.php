<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/screening.php';

$db = getDB();
$message = '';
$messageType = '';
$result = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'submit_resume') {
    $name  = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $jobId = intval($_POST['job_id'] ?? 0);

    if (!$name || !$email || !$jobId || empty($_FILES['resume']['name'])) {
        $message     = 'Please fill in all required fields and upload your resume.';
        $messageType = 'error';
    } else {
        $result      = processResume($name, $email, $phone, $jobId, $_FILES['resume']);
        $message     = $result['message'];
        $messageType = $result['success'] ? 'success' : 'error';
    }
}

$jobs = $db->query("SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC")->fetchAll();

// Use candidates table (not applications)
$totalApplicants  = $db->query("SELECT COUNT(*) FROM candidates")->fetchColumn();
$totalShortlisted = $db->query("SELECT COUNT(*) FROM candidates WHERE status='shortlisted'")->fetchColumn();

$selectedJob = null;
if (isset($_GET['job'])) {
    $stmt = $db->prepare("SELECT * FROM jobs WHERE id = ? AND status = 'active'");
    $stmt->execute([intval($_GET['job'])]);
    $selectedJob = $stmt->fetch();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ResumeAI Portal</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', sans-serif; background:#f4f6f9; color:#333; }
        .container { max-width:1100px; margin:0 auto; padding:0 20px; }

        .header { background:#1a237e; color:#fff; padding:0; }
        .header-inner { display:flex; align-items:center; justify-content:space-between; height:60px; }
        .logo { font-size:1.2rem; font-weight:700; color:#fff; text-decoration:none; }
        .logo span { color:#90caf9; }
        .nav a { color:#cfd8dc; text-decoration:none; margin-left:20px; font-size:0.9rem; }
        .nav a:hover { color:#fff; }
        .nav .btn-admin { background:#fff; color:#1a237e; padding:6px 14px; border-radius:4px; font-weight:600; }

        .hero { background:linear-gradient(135deg,#1a237e,#283593); color:#fff; padding:50px 0 40px; }
        .hero h1 { font-size:2rem; margin-bottom:10px; }
        .hero p { color:#c5cae9; margin-bottom:25px; }
        .hero-badge { display:inline-block; background:rgba(255,255,255,0.15); padding:5px 14px; border-radius:20px; font-size:0.8rem; margin-bottom:14px; }
        .hero-stats { display:flex; gap:30px; margin-top:20px; }
        .stat span { font-size:1.8rem; font-weight:700; display:block; }
        .stat label { font-size:0.8rem; color:#c5cae9; }

        .main { padding:30px 0; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }

        .panel { background:#fff; border-radius:10px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.07); }
        .panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .panel-header h2 { font-size:1.1rem; }
        .badge { background:#e8eaf6; color:#1a237e; padding:3px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; }

        .job-card { display:block; text-decoration:none; color:#333; border:1px solid #e0e0e0; border-radius:8px; padding:14px; margin-bottom:10px; transition:all 0.2s; }
        .job-card:hover, .job-card.active { border-color:#1a237e; background:#f0f4ff; }
        .job-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
        .job-card h3 { font-size:0.95rem; font-weight:600; }
        .dept { font-size:0.8rem; color:#777; margin-top:2px; }
        .job-exp { font-size:0.78rem; background:#e3f2fd; color:#1565c0; padding:2px 8px; border-radius:4px; white-space:nowrap; }

        .skill-tags { display:flex; flex-wrap:wrap; gap:5px; }
        .tag { font-size:0.75rem; background:#f5f5f5; color:#555; padding:2px 8px; border-radius:4px; }
        .tag.required { background:#e8f5e9; color:#2e7d32; }

        .job-desc { font-size:0.88rem; color:#555; margin-bottom:18px; line-height:1.6; }
        .info-row { margin:14px 0; }
        .info-row strong { font-size:0.82rem; color:#333; display:block; margin-bottom:6px; }
        .mt4 { margin-top:4px; }

        .apply-form .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px; }
        .form-group { display:flex; flex-direction:column; gap:5px; }
        .form-group.full { grid-column:1/-1; }
        .form-group label { font-size:0.82rem; font-weight:600; color:#444; }
        .form-group input { border:1px solid #ddd; border-radius:6px; padding:9px 12px; font-size:0.88rem; outline:none; transition:border 0.2s; }
        .form-group input:focus { border-color:#1a237e; }

        .file-drop { border:2px dashed #c5cae9; border-radius:8px; padding:20px; text-align:center; position:relative; cursor:pointer; }
        .file-drop input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
        .file-icon { font-size:1.8rem; display:block; margin-bottom:6px; }
        .file-drop p { font-size:0.85rem; color:#666; }
        .file-drop small { color:#aaa; font-size:0.78rem; }
        .file-name { margin-top:8px; font-size:0.82rem; color:#1a237e; font-weight:600; }

        .btn-primary { background:#1a237e; color:#fff; border:none; padding:12px 24px; border-radius:6px; font-size:0.9rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:background 0.2s; }
        .btn-primary:hover { background:#283593; }

        .alert { padding:14px 18px; border-radius:8px; margin-bottom:20px; font-size:0.9rem; }
        .alert-success { background:#e8f5e9; color:#2e7d32; border-left:4px solid #43a047; }
        .alert-error   { background:#ffebee; color:#c62828; border-left:4px solid #e53935; }

        .result-card { display:flex; gap:20px; align-items:center; }
        .score-circle { width:80px; height:80px; border-radius:50%; background:#1a237e; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
        .score-circle strong { font-size:1.3rem; }
        .score-circle small { font-size:0.65rem; color:#c5cae9; }
        .result-details h3 { margin-bottom:8px; }
        .result-details p { font-size:0.85rem; margin-bottom:4px; }

        .empty-state { text-align:center; padding:50px 20px; color:#aaa; }
        .empty-icon { font-size:2.5rem; margin-bottom:14px; }
        .empty-state h3 { color:#555; margin-bottom:8px; }

        .footer { text-align:center; padding:24px; font-size:0.82rem; color:#999; border-top:1px solid #e0e0e0; background:#fff; margin-top:40px; }

        @media(max-width:768px) {
            .two-col { grid-template-columns:1fr; }
            .apply-form .form-grid { grid-template-columns:1fr; }
            .hero-stats { gap:16px; }
        }
    </style>
</head>
<body>

<header class="header">
    <div class="container">
        <div class="header-inner">
            <a class="logo" href="index.php"><span>Resume</span>AI Portal</a>
            <nav class="nav">
                <a href="index.php">Jobs</a>
                <a href="admin/login.php" class="btn-admin">Admin Login</a>
            </nav>
        </div>
    </div>
</header>

<section class="hero">
    <div class="container">
        <div class="hero-badge">AI-Powered Screening</div>
        <h1>Find the Right Fit, Faster.</h1>
        <p>Upload your resume and our AI instantly matches your skills against job requirements.</p>
        <div class="hero-stats">
            <div class="stat"><span><?= count($jobs) ?></span><label>Open Roles</label></div>
            <div class="stat"><span><?= $totalApplicants ?></span><label>Applicants</label></div>
            <div class="stat"><span><?= $totalShortlisted ?></span><label>Shortlisted</label></div>
        </div>
    </div>
</section>

<main class="main">
    <div class="container">

        <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?>">
            <?php if ($messageType === 'success' && $result): ?>
                <div class="result-card">
                    <div class="score-circle">
                        <strong><?= $result['score'] ?>%</strong>
                        <small>Match</small>
                    </div>
                    <div class="result-details">
                        <h3>✅ Resume Submitted!</h3>
                        <?php if (!empty($result['matched'])): ?>
                        <p><strong>✔ Matched:</strong> <?= htmlspecialchars($result['matched']) ?></p>
                        <?php endif; ?>
                        <?php if (!empty($result['missing'])): ?>
                        <p><strong>✗ Missing:</strong> <?= htmlspecialchars($result['missing']) ?></p>
                        <?php endif; ?>
                    </div>
                </div>
            <?php else: ?>
                <?= htmlspecialchars($message) ?>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <div class="two-col">

            <section class="panel">
                <div class="panel-header">
                    <h2>Open Positions</h2>
                    <span class="badge"><?= count($jobs) ?> Roles</span>
                </div>
                <div class="job-list">
                    <?php foreach ($jobs as $job): ?>
                    <a href="index.php?job=<?= $job['id'] ?>" class="job-card <?= ($selectedJob && $selectedJob['id'] == $job['id']) ? 'active' : '' ?>">
                        <div class="job-card-top">
                            <div>
                                <h3><?= htmlspecialchars($job['title']) ?></h3>
                                <p class="dept"><?= htmlspecialchars($job['department']) ?></p>
                            </div>
                            <span class="job-exp"><?= $job['min_experience'] ?>+ yrs</span>
                        </div>
                        <div class="skill-tags">
                            <?php foreach (array_slice(explode(',', $job['required_skills']), 0, 4) as $sk): ?>
                            <span class="tag"><?= trim(htmlspecialchars($sk)) ?></span>
                            <?php endforeach; ?>
                        </div>
                    </a>
                    <?php endforeach; ?>
                </div>
            </section>

            <section class="panel">
                <?php if ($selectedJob): ?>
                <div class="panel-header">
                    <h2>Apply: <?= htmlspecialchars($selectedJob['title']) ?></h2>
                </div>
                <div class="job-desc">
                    <p><?= nl2br(htmlspecialchars($selectedJob['description'])) ?></p>
                    <div class="info-row">
                        <strong>Required Skills</strong>
                        <div class="skill-tags mt4">
                            <?php foreach (explode(',', $selectedJob['required_skills']) as $sk): ?>
                            <span class="tag required"><?= trim(htmlspecialchars($sk)) ?></span>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <form method="POST" enctype="multipart/form-data" class="apply-form">
                    <input type="hidden" name="action" value="submit_resume">
                    <input type="hidden" name="job_id" value="<?= $selectedJob['id'] ?>">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" name="name" required placeholder="Jane Doe">
                        </div>
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" required placeholder="jane@email.com">
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone" placeholder="+91 98765 43210">
                        </div>
                        <div class="form-group full">
                            <label>Resume *</label>
                            <div class="file-drop">
                                <input type="file" name="resume" id="resumeFile" accept=".pdf,.doc,.docx,.txt" required>
                                <span class="file-icon">📄</span>
                                <p>Drop your resume here or <u>browse</u></p>
                                <small>PDF, DOC, DOCX, TXT · Max 5MB</small>
                                <div class="file-name" id="fileName"></div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary">Submit &amp; Get Match Score →</button>
                </form>

                <?php else: ?>
                <div class="empty-state">
                    <div class="empty-icon">👈</div>
                    <h3>Select a Job</h3>
                    <p>Choose a position from the list to view details and apply.</p>
                </div>
                <?php endif; ?>
            </section>

        </div>
    </div>
</main>

<footer class="footer">
    © <?= date('Y') ?> ResumeAI Portal &nbsp;·&nbsp; AI-Powered Resume Screening
</footer>

<script>
    document.getElementById('resumeFile')?.addEventListener('change', function() {
        document.getElementById('fileName').textContent = this.files[0]?.name || '';
    });
</script>
</body>
</html>
