<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();

$db = getDB();

$totalCandidates  = $db->query("SELECT COUNT(*) FROM candidates")->fetchColumn();
$shortlisted      = $db->query("SELECT COUNT(*) FROM candidates WHERE status='shortlisted'")->fetchColumn();
$pending          = $db->query("SELECT COUNT(*) FROM candidates WHERE status='pending'")->fetchColumn();
$avgScore         = $db->query("SELECT ROUND(AVG(match_score),1) FROM candidates")->fetchColumn() ?: 0;

$filterJob    = intval($_GET['job_id'] ?? 0);
$filterStatus = $_GET['status'] ?? '';
$search       = trim($_GET['search'] ?? '');
$minScore     = intval($_GET['min_score'] ?? 0);

$where  = ['1=1'];
$params = [];
if ($filterJob)    { $where[] = 'c.job_id = ?'; $params[] = $filterJob; }
if ($filterStatus) { $where[] = 'c.status = ?'; $params[] = $filterStatus; }
if ($search)       { $where[] = '(c.name LIKE ? OR c.email LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; }
if ($minScore > 0) { $where[] = 'c.match_score >= ?'; $params[] = $minScore; }
$whereStr = implode(' AND ', $where);

// Status update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $stmt = $db->prepare("UPDATE candidates SET status=? WHERE id=?");
    $stmt->execute([$_POST['status'], intval($_POST['candidate_id'])]);
    header('Location: dashboard.php?' . http_build_query($_GET));
    exit;
}

$stmt = $db->prepare("
    SELECT c.*, j.title as job_title
    FROM candidates c
    LEFT JOIN jobs j ON c.job_id = j.id
    WHERE $whereStr
    ORDER BY c.match_score DESC, c.submitted_at DESC
");
$stmt->execute($params);
$candidates = $stmt->fetchAll();

$jobs = $db->query("SELECT id, title FROM jobs ORDER BY title")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard – ResumeAI Admin</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',sans-serif; background:#f4f6f9; color:#333; }
        .container { max-width:1200px; margin:0 auto; padding:0 20px; }
        .header { background:#1a237e; color:#fff; padding:0; }
        .header-inner { display:flex; align-items:center; justify-content:space-between; height:60px; }
        .logo { font-size:1.1rem; font-weight:700; color:#fff; }
        .logo span { color:#90caf9; }
        .nav a { color:#cfd8dc; text-decoration:none; margin-left:20px; font-size:0.9rem; }
        .nav a:hover, .nav a.active { color:#fff; }
        .main { padding:28px 0; }
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border-radius:10px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .stat-card.accent { border-left:4px solid #f59e0b; }
        .stat-card.green  { border-left:4px solid #22c55e; }
        .stat-card.blue   { border-left:4px solid #3b82f6; }
        .stat-num { display:block; font-size:2rem; font-weight:700; color:#1a237e; }
        .stat-lbl { font-size:0.8rem; color:#888; margin-top:4px; display:block; }
        .filter-bar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; background:#fff; padding:16px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .filter-bar input, .filter-bar select { border:1px solid #ddd; border-radius:6px; padding:8px 12px; font-size:0.85rem; outline:none; }
        .filter-bar input { flex:1; min-width:180px; }
        .btn-primary { background:#1a237e; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-size:0.85rem; font-weight:600; cursor:pointer; }
        .btn-outline-sm { border:1px solid #ddd; background:#fff; color:#555; padding:6px 12px; border-radius:6px; font-size:0.82rem; cursor:pointer; text-decoration:none; }
        .table-wrap { background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.06); overflow:auto; }
        table { width:100%; border-collapse:collapse; font-size:0.87rem; }
        th { background:#f8f9ff; padding:12px 14px; text-align:left; font-weight:600; color:#555; border-bottom:1px solid #e5e7eb; }
        td { padding:11px 14px; border-bottom:1px solid #f0f0f0; vertical-align:middle; }
        tr:last-child td { border-bottom:none; }
        tr:hover td { background:#fafbff; }
        .score-bar { display:flex; align-items:center; gap:8px; min-width:100px; }
        .score-fill { height:6px; border-radius:3px; flex-shrink:0; }
        .score-bar span { font-size:0.82rem; font-weight:600; white-space:nowrap; }
        .status-select { border:1px solid #ddd; border-radius:5px; padding:4px 8px; font-size:0.8rem; cursor:pointer; }
        .status-select.status-pending    { color:#b45309; background:#fffbeb; }
        .status-select.status-reviewed   { color:#1d4ed8; background:#eff6ff; }
        .status-select.status-shortlisted{ color:#166534; background:#f0fdf4; }
        .status-select.status-rejected   { color:#991b1b; background:#fef2f2; }
        .footer { text-align:center; padding:20px; font-size:0.82rem; color:#aaa; border-top:1px solid #e5e7eb; background:#fff; margin-top:30px; }
        @media(max-width:768px) { .stats-grid { grid-template-columns:1fr 1fr; } }
    </style>
</head>
<body>
<header class="header">
    <div class="container">
        <div class="header-inner">
            <div class="logo"><span>Resume</span>AI <small style="font-weight:400;font-size:0.8rem;color:#90caf9;">Admin</small></div>
            <nav class="nav">
                <a href="dashboard.php" class="active">Candidates</a>
                <a href="jobs.php">Jobs</a>
                <a href="logout.php">Logout</a>
            </nav>
        </div>
    </div>
</header>
<main class="main">
    <div class="container">
        <div class="stats-grid">
            <div class="stat-card"><span class="stat-num"><?= $totalCandidates ?></span><span class="stat-lbl">Total Applicants</span></div>
            <div class="stat-card accent"><span class="stat-num"><?= $pending ?></span><span class="stat-lbl">Pending Review</span></div>
            <div class="stat-card green"><span class="stat-num"><?= $shortlisted ?></span><span class="stat-lbl">Shortlisted</span></div>
            <div class="stat-card blue"><span class="stat-num"><?= $avgScore ?>%</span><span class="stat-lbl">Avg Match Score</span></div>
        </div>

        <form method="GET" class="filter-bar">
            <input type="text" name="search" placeholder="Search name or email…" value="<?= htmlspecialchars($search) ?>">
            <select name="job_id">
                <option value="">All Jobs</option>
                <?php foreach ($jobs as $j): ?>
                <option value="<?= $j['id'] ?>" <?= $filterJob == $j['id'] ? 'selected' : '' ?>><?= htmlspecialchars($j['title']) ?></option>
                <?php endforeach; ?>
            </select>
            <select name="status">
                <option value="">All Statuses</option>
                <option value="pending"     <?= $filterStatus==='pending'     ?'selected':'' ?>>Pending</option>
                <option value="reviewed"    <?= $filterStatus==='reviewed'    ?'selected':'' ?>>Reviewed</option>
                <option value="shortlisted" <?= $filterStatus==='shortlisted' ?'selected':'' ?>>Shortlisted</option>
                <option value="rejected"    <?= $filterStatus==='rejected'    ?'selected':'' ?>>Rejected</option>
            </select>
            <select name="min_score">
                <option value="0">Any Score</option>
                <option value="50" <?= $minScore==50?'selected':'' ?>>50%+</option>
                <option value="70" <?= $minScore==70?'selected':'' ?>>70%+</option>
                <option value="85" <?= $minScore==85?'selected':'' ?>>85%+</option>
            </select>
            <button type="submit" class="btn-primary">Filter</button>
            <a href="dashboard.php" class="btn-outline-sm">Clear</a>
        </form>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Job</th><th>Match Score</th><th>Matched Skills</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <?php if (empty($candidates)): ?>
                    <tr><td colspan="9" style="text-align:center;padding:3rem;color:#aaa;">No candidates found.</td></tr>
                    <?php endif; ?>
                    <?php foreach ($candidates as $i => $c): ?>
                    <tr>
                        <td><?= $i + 1 ?></td>
                        <td><strong><?= htmlspecialchars($c['name']) ?></strong></td>
                        <td><a href="mailto:<?= htmlspecialchars($c['email']) ?>" style="color:#1a237e;"><?= htmlspecialchars($c['email']) ?></a></td>
                        <td><?= htmlspecialchars($c['job_title'] ?? '-') ?></td>
                        <td>
                            <div class="score-bar">
                                <div class="score-fill" style="width:<?= min(100,$c['match_score']) ?>px;background:<?= $c['match_score']>=70?'#22c55e':($c['match_score']>=40?'#f59e0b':'#ef4444') ?>"></div>
                                <span><?= $c['match_score'] ?>%</span>
                            </div>
                        </td>
                        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><?= $c['matched_skills'] ? htmlspecialchars(substr($c['matched_skills'],0,60)).(strlen($c['matched_skills'])>60?'…':'') : '-' ?></td>
                        <td>
                            <form method="POST" style="display:inline;">
                                <input type="hidden" name="candidate_id" value="<?= $c['id'] ?>">
                                <input type="hidden" name="update_status" value="1">
                                <select name="status" class="status-select status-<?= $c['status'] ?>" onchange="this.form.submit()">
                                    <option value="pending"     <?= $c['status']==='pending'    ?'selected':'' ?>>Pending</option>
                                    <option value="reviewed"    <?= $c['status']==='reviewed'   ?'selected':'' ?>>Reviewed</option>
                                    <option value="shortlisted" <?= $c['status']==='shortlisted'?'selected':'' ?>>Shortlisted</option>
                                    <option value="rejected"    <?= $c['status']==='rejected'   ?'selected':'' ?>>Rejected</option>
                                </select>
                            </form>
                        </td>
                        <td><?= date('d M Y', strtotime($c['submitted_at'])) ?></td>
                        <td><a href="view_candidate.php?id=<?= $c['id'] ?>" class="btn-outline-sm">View</a></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>
<footer class="footer">© <?= date('Y') ?> ResumeAI Portal Admin</footer>
</body>
</html>
