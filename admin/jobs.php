<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();

$db  = getDB();
$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['form_action'] ?? '';
    if ($action === 'add' || $action === 'edit') {
        $data = [
            $_POST['title'],
            $_POST['department'],
            $_POST['description'],
            $_POST['required_skills'],
            $_POST['preferred_skills'],
            intval($_POST['min_experience']),
            $_POST['keywords'],
            $_POST['status'],
        ];
        if ($action === 'add') {
            $stmt = $db->prepare("INSERT INTO jobs (title,department,description,required_skills,preferred_skills,min_experience,keywords,status) VALUES (?,?,?,?,?,?,?,?)");
            $stmt->execute($data);
            $msg = 'Job added successfully.';
        } else {
            $data[] = intval($_POST['job_id']);
            $stmt = $db->prepare("UPDATE jobs SET title=?,department=?,description=?,required_skills=?,preferred_skills=?,min_experience=?,keywords=?,status=? WHERE id=?");
            $stmt->execute($data);
            $msg = 'Job updated.';
        }
    } elseif ($action === 'delete') {
        $stmt = $db->prepare("DELETE FROM jobs WHERE id=?");
        $stmt->execute([intval($_POST['job_id'])]);
        $msg = 'Job deleted.';
    }
}

$editJob = null;
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM jobs WHERE id=?");
    $stmt->execute([intval($_GET['edit'])]);
    $editJob = $stmt->fetch();
}

$jobs = $db->query("SELECT j.*, (SELECT COUNT(*) FROM candidates c WHERE c.job_id=j.id) as app_count FROM jobs j ORDER BY j.created_at DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Jobs – ResumeAI</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',sans-serif; background:#f4f6f9; color:#333; }
        .container { max-width:1100px; margin:0 auto; padding:0 20px; }
        .header { background:#1a237e; color:#fff; }
        .header-inner { display:flex; align-items:center; justify-content:space-between; height:60px; }
        .logo { font-size:1.1rem; font-weight:700; color:#fff; }
        .logo span { color:#90caf9; }
        .nav a { color:#cfd8dc; text-decoration:none; margin-left:20px; font-size:0.9rem; }
        .nav a:hover, .nav a.active { color:#fff; }
        .main { padding:28px 0; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
        .panel { background:#fff; border-radius:10px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.07); }
        .panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .panel-header h2 { font-size:1.1rem; }
        .badge { background:#e8eaf6; color:#1a237e; padding:3px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px; }
        .form-group { display:flex; flex-direction:column; gap:5px; }
        .form-group.full { grid-column:1/-1; }
        .form-group label { font-size:0.82rem; font-weight:600; color:#444; }
        .form-group input, .form-group select, .form-group textarea { border:1px solid #ddd; border-radius:6px; padding:9px 12px; font-size:0.88rem; outline:none; transition:border 0.2s; font-family:inherit; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color:#1a237e; }
        .btn-primary { background:#1a237e; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-size:0.88rem; font-weight:600; cursor:pointer; }
        .btn-primary:hover { background:#283593; }
        .btn-outline-sm { border:1px solid #ddd; background:#fff; color:#555; padding:6px 12px; border-radius:6px; font-size:0.82rem; cursor:pointer; text-decoration:none; display:inline-block; }
        .btn-danger { border:1px solid #ef4444; background:#fff; color:#ef4444; padding:6px 12px; border-radius:6px; font-size:0.82rem; cursor:pointer; }
        .job-card { border:1px solid #e0e0e0; border-radius:8px; padding:14px; margin-bottom:10px; }
        .job-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
        .job-card h3 { font-size:0.95rem; font-weight:600; }
        .dept { font-size:0.8rem; color:#777; }
        .tag { font-size:0.72rem; background:#f5f5f5; color:#555; padding:2px 7px; border-radius:4px; }
        .alert-success { background:#e8f5e9; color:#2e7d32; border-left:4px solid #43a047; padding:12px 16px; border-radius:6px; margin-bottom:18px; font-size:0.9rem; }
        .footer { text-align:center; padding:20px; font-size:0.82rem; color:#aaa; border-top:1px solid #e5e7eb; background:#fff; margin-top:30px; }
        @media(max-width:768px) { .two-col { grid-template-columns:1fr; } .form-grid { grid-template-columns:1fr; } }
    </style>
</head>
<body>
<header class="header">
    <div class="container">
        <div class="header-inner">
            <div class="logo"><span>Resume</span>AI</div>
            <nav class="nav">
                <a href="dashboard.php">Candidates</a>
                <a href="jobs.php" class="active">Jobs</a>
                <a href="logout.php">Logout</a>
            </nav>
        </div>
    </div>
</header>
<main class="main">
    <div class="container">
        <?php if ($msg): ?>
        <div class="alert-success"><?= htmlspecialchars($msg) ?></div>
        <?php endif; ?>
        <div class="two-col">
            <section class="panel">
                <div class="panel-header"><h2><?= $editJob ? 'Edit Job' : 'Add New Job' ?></h2></div>
                <form method="POST">
                    <input type="hidden" name="form_action" value="<?= $editJob ? 'edit' : 'add' ?>">
                    <?php if ($editJob): ?><input type="hidden" name="job_id" value="<?= $editJob['id'] ?>"><?php endif; ?>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Job Title *</label>
                            <input type="text" name="title" required value="<?= htmlspecialchars($editJob['title'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label>Department</label>
                            <input type="text" name="department" value="<?= htmlspecialchars($editJob['department'] ?? '') ?>">
                        </div>
                        <div class="form-group full">
                            <label>Description</label>
                            <textarea name="description" rows="3"><?= htmlspecialchars($editJob['description'] ?? '') ?></textarea>
                        </div>
                        <div class="form-group full">
                            <label>Required Skills * <small style="font-weight:400;color:#aaa;">(comma-separated)</small></label>
                            <input type="text" name="required_skills" required value="<?= htmlspecialchars($editJob['required_skills'] ?? '') ?>" placeholder="PHP,MySQL,JavaScript">
                        </div>
                        <div class="form-group full">
                            <label>Preferred Skills <small style="font-weight:400;color:#aaa;">(comma-separated)</small></label>
                            <input type="text" name="preferred_skills" value="<?= htmlspecialchars($editJob['preferred_skills'] ?? '') ?>" placeholder="Laravel,React,Docker">
                        </div>
                        <div class="form-group">
                            <label>Min. Experience (years)</label>
                            <input type="number" name="min_experience" min="0" value="<?= $editJob['min_experience'] ?? 0 ?>">
                        </div>
                        <div class="form-group">
                            <label>Keywords <small style="font-weight:400;color:#aaa;">(comma-separated)</small></label>
                            <input type="text" name="keywords" value="<?= htmlspecialchars($editJob['keywords'] ?? '') ?>" placeholder="api,backend,web">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status">
                                <option value="active"  <?= (!$editJob || $editJob['status']==='active') ?'selected':'' ?>>Active</option>
                                <option value="closed"  <?= ($editJob && $editJob['status']==='closed')  ?'selected':'' ?>>Closed</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;margin-top:4px;">
                        <button type="submit" class="btn-primary"><?= $editJob ? 'Update Job' : 'Add Job' ?></button>
                        <?php if ($editJob): ?><a href="jobs.php" class="btn-outline-sm">Cancel</a><?php endif; ?>
                    </div>
                </form>
            </section>

            <section class="panel">
                <div class="panel-header"><h2>All Jobs</h2><span class="badge"><?= count($jobs) ?></span></div>
                <?php foreach ($jobs as $j): ?>
                <div class="job-card">
                    <div class="job-card-top">
                        <div>
                            <h3><?= htmlspecialchars($j['title']) ?></h3>
                            <p class="dept"><?= htmlspecialchars($j['department']) ?> &nbsp;·&nbsp; <span class="tag"><?= $j['status'] ?></span></p>
                        </div>
                        <span style="font-size:0.82rem;color:#888;"><?= $j['app_count'] ?> apps</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:10px;">
                        <a href="jobs.php?edit=<?= $j['id'] ?>" class="btn-outline-sm">Edit</a>
                        <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this job and its data?')">
                            <input type="hidden" name="form_action" value="delete">
                            <input type="hidden" name="job_id" value="<?= $j['id'] ?>">
                            <button type="submit" class="btn-danger">Delete</button>
                        </form>
                    </div>
                </div>
                <?php endforeach; ?>
            </section>
        </div>
    </div>
</main>
<footer class="footer">© <?= date('Y') ?> ResumeAI Portal</footer>
</body>
</html>
