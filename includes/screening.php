<?php
require_once __DIR__ . '/config.php';

/**
 * Extract plain text from uploaded resume file
 */
function extractResumeText($filePath, $ext) {
    $ext = strtolower($ext);
    if ($ext === 'txt') {
        return file_get_contents($filePath);
    }
    if ($ext === 'pdf') {
        $text = shell_exec('pdftotext ' . escapeshellarg($filePath) . ' - 2>/dev/null');
        if ($text) return $text;
        $content = file_get_contents($filePath);
        $text = '';
        preg_match_all('/BT\s*(.*?)\s*ET/s', $content, $matches);
        foreach ($matches[1] as $block) {
            preg_match_all('/\((.*?)\)/', $block, $strMatches);
            foreach ($strMatches[1] as $str) {
                $text .= $str . ' ';
            }
        }
        return $text ?: $content;
    }
    if (in_array($ext, ['doc', 'docx'])) {
        if ($ext === 'docx') {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                $xml = $zip->getFromName('word/document.xml');
                $zip->close();
                if ($xml) {
                    return strip_tags(str_replace(['</w:p>', '</w:r>'], ["\n", ' '], $xml));
                }
            }
        }
        return file_get_contents($filePath);
    }
    return file_get_contents($filePath);
}

/**
 * Score a resume against a job's requirements
 */
function scoreResume($resumeText, $job) {
    $resumeText  = strtolower($resumeText);

    $required  = array_filter(array_map('trim', explode(',', strtolower($job['required_skills']))));
    $preferred = array_filter(array_map('trim', explode(',', strtolower($job['preferred_skills'] ?? ''))));
    $keywords  = array_filter(array_map('trim', explode(',', strtolower($job['keywords'] ?? ''))));

    $matched  = [];
    $missing  = [];
    $reqScore = 0;

    foreach ($required as $skill) {
        if ($skill && skillFoundInText($skill, $resumeText)) {
            $matched[] = $skill;
            $reqScore++;
        } else {
            $missing[] = $skill;
        }
    }
    $reqRatio = count($required) > 0 ? $reqScore / count($required) : 0;

    $prefMatched = 0;
    foreach ($preferred as $skill) {
        if ($skill && skillFoundInText($skill, $resumeText)) {
            $matched[] = $skill . ' (preferred)';
            $prefMatched++;
        }
    }
    $prefRatio = count($preferred) > 0 ? $prefMatched / count($preferred) : 0;

    $kwMatched = 0;
    foreach ($keywords as $kw) {
        if ($kw && strpos($resumeText, $kw) !== false) {
            $kwMatched++;
        }
    }
    $kwRatio = count($keywords) > 0 ? $kwMatched / count($keywords) : 0;

    $expBonus = 0;
    if (isset($job['min_experience']) && $job['min_experience'] > 0) {
        preg_match_all('/(\d+)\s*\+?\s*year[s]?\s*(of)?\s*(experience)?/i', $resumeText, $m);
        if (!empty($m[1])) {
            $years = max(array_map('intval', $m[1]));
            if ($years >= $job['min_experience']) $expBonus = 5;
        }
    }

    $score = ($reqRatio * 60) + ($prefRatio * 25) + ($kwRatio * 15) + $expBonus;
    $score = min(100, round($score, 2));

    return [
        'score'          => $score,
        'matched_skills' => array_unique($matched),
        'missing_skills' => array_unique($missing),
    ];
}

/**
 * Check if a skill appears in resume text (with alias support)
 */
function skillFoundInText($skill, $text) {
    if (strpos($text, $skill) !== false) return true;
    $aliases = [
        'javascript'               => ['js'],
        'typescript'               => ['ts'],
        'python'                   => ['py'],
        'postgresql'               => ['postgres', 'pg'],
        'machine learning'         => ['ml'],
        'artificial intelligence'  => ['ai'],
        'user interface'           => ['ui'],
        'user experience'          => ['ux'],
        'cascading style sheets'   => ['css'],
        'hypertext markup language'=> ['html'],
        'structured query language'=> ['sql'],
    ];
    foreach ($aliases as $full => $shorts) {
        if ($skill === $full) {
            foreach ($shorts as $s) {
                if (preg_match('/\b' . preg_quote($s, '/') . '\b/i', $text)) return true;
            }
        }
        if (in_array($skill, $shorts)) {
            if (strpos($text, $full) !== false) return true;
        }
    }
    return false;
}

/**
 * Process a submitted resume: save file, extract text, score, store in DB
 */
function processResume($name, $email, $phone, $jobId, $file) {
    $db = getDB();

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_TYPES)) {
        return ['success' => false, 'message' => 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT'];
    }
    if ($file['size'] > MAX_FILE_SIZE) {
        return ['success' => false, 'message' => 'File too large. Max 5MB.'];
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $filename = uniqid('resume_') . '_' . time() . '.' . $ext;
    $dest = UPLOAD_DIR . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        return ['success' => false, 'message' => 'Failed to save file. Check uploads/resumes/ folder permissions.'];
    }

    $resumeText = extractResumeText($dest, $ext);

    $stmt = $db->prepare("SELECT * FROM jobs WHERE id = ?");
    $stmt->execute([$jobId]);
    $job = $stmt->fetch();

    $score = 0; $matchedSkills = ''; $missingSkills = '';
    if ($job) {
        $result        = scoreResume($resumeText, $job);
        $score         = $result['score'];
        $matchedSkills = implode(', ', $result['matched_skills']);
        $missingSkills = implode(', ', $result['missing_skills']);
    }

    $stmt = $db->prepare("
        INSERT INTO candidates (name, email, phone, resume_file, resume_text, job_id, match_score, matched_skills, missing_skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $email, $phone, $filename, $resumeText, $jobId, $score, $matchedSkills, $missingSkills]);

    return [
        'success' => true,
        'score'   => $score,
        'matched' => $matchedSkills,
        'missing' => $missingSkills,
        'message' => 'Resume submitted successfully!',
    ];
}
?>
