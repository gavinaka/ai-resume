[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$publishedDist = Join-Path $root 'dist'
$dist = Join-Path $root 'dist.staging'
$expectedDist = [System.IO.Path]::GetFullPath($publishedDist)
$expectedStagingDist = [System.IO.Path]::GetFullPath($dist)

if ([System.IO.Path]::GetFullPath($publishedDist) -ne $expectedDist) {
    throw 'Release target is not the expected dist directory.'
}

if (-not $expectedDist.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Release target escaped the website root.'
}

if (-not $expectedStagingDist.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Release staging target escaped the website root.'
}

if (Test-Path -LiteralPath $dist) {
    Remove-Item -LiteralPath $dist -Recurse -Force
}

New-Item -ItemType Directory -Path $dist | Out-Null

$publicFiles = @(
    'index.html',
    'resume.html',
    'styles.css',
    'resume.css',
    'script.js',
    'evidence-data.js',
    'site-data.js',
    'infinite-canvas.html',
    'canvas.css',
    'canvas.js',
    '404.html',
    'robots.txt',
    'sitemap.xml',
    'assets\akagavin-portrait.jpg',
    'assets\akagavin-editorial.jpg',
    'assets\akagavin-editorial-960.jpg',
    'assets\akagavin-social.jpg',
    'assets\film-grain.png',
    'assets\fonts\fira-code-latin.woff2',
    'assets\fonts\barlow-condensed-600-latin.woff2',
    'assets\fonts\barlow-condensed-800-latin.woff2',
    'assets\fonts\barlow-condensed-900-latin.woff2',
    'assets\fonts\OFL-Barlow-Condensed.txt',
    'pages\project.html',
    'pages\project.css',
    'pages\project.js'
)

foreach ($relativePath in $publicFiles) {
    $source = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Missing release source file: $relativePath"
    }
    $destination = Join-Path $dist $relativePath
    $destinationDirectory = Split-Path -Parent $destination
    if (-not (Test-Path -LiteralPath $destinationDirectory)) {
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    }
    Copy-Item -LiteralPath $source -Destination $destination
}

Copy-Item -LiteralPath (Join-Path $root 'deploy\_headers') -Destination (Join-Path $dist '_headers')

$versionedAssets = @(
    'styles.css',
    'resume.css',
    'script.js',
    'evidence-data.js',
    'site-data.js',
    'canvas.css',
    'canvas.js',
    'pages\project.css',
    'pages\project.js'
)
$htmlFiles = Get-ChildItem -LiteralPath $dist -Recurse -File -Filter '*.html'
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

foreach ($relativePath in $versionedAssets) {
    $assetPath = Join-Path $dist $relativePath
    $assetName = [System.IO.Path]::GetFileName($assetPath)
    $assetVersion = (Get-FileHash -LiteralPath $assetPath -Algorithm SHA256).Hash.Substring(0, 12).ToLowerInvariant()
    $escapedName = [regex]::Escape($assetName)
    $referencePattern = "(?<prefix>(?:src|href)=[`"'])(?<url>[^`"']*$escapedName)(?:\?v=[^`"']*)?(?<suffix>[`"'])"
    $replacementCount = 0

    foreach ($htmlFile in $htmlFiles) {
        $content = [System.IO.File]::ReadAllText($htmlFile.FullName)
        $rewritten = [regex]::Replace($content, $referencePattern, {
            param($match)
            $script:replacementCount += 1
            return $match.Groups['prefix'].Value + $match.Groups['url'].Value + '?v=' + $assetVersion + $match.Groups['suffix'].Value
        })
        if ($rewritten -ne $content) {
            [System.IO.File]::WriteAllText($htmlFile.FullName, $rewritten, $utf8WithoutBom)
        }
    }

    if ($replacementCount -eq 0) {
        throw "Release asset has no HTML reference to fingerprint: $relativePath"
    }
}

$unversionedAssetPattern = '(?:src|href)=["''][^"'']+\.(?:css|js)["'']'
$malformedVersionPattern = '(?:src|href)=["''][^"'']+\.(?:css|js)\?v=[0-9a-f]{12}[^"''\s>]+'
foreach ($htmlFile in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($htmlFile.FullName)
    if ($content -match $unversionedAssetPattern) {
        throw "Unversioned CSS or JS reference detected in release HTML: $($htmlFile.FullName)"
    }
    if ($content -match $malformedVersionPattern) {
        throw "Malformed fingerprinted CSS or JS reference detected in release HTML: $($htmlFile.FullName)"
    }
}

$forbiddenNames = @('00_PROFILE_BRIEF.md', '01_EVIDENCE_LEDGER.md', '02_PUBLIC_CONTENT_REVIEW.md', 'README.md', 'archive', 'deploy', 'scripts', '.wrangler')
foreach ($name in $forbiddenNames) {
    if (Test-Path -LiteralPath (Join-Path $dist $name)) {
        throw "Forbidden release item detected: $name"
    }
}

$textFiles = Get-ChildItem -LiteralPath $dist -Recurse -File | Where-Object {
    $_.Extension -in @('.html', '.css', '.js', '.txt', '.json', '.xml') -or $_.Name -eq '_headers'
}

$privatePathPattern = 'C:\\Users\\|C:/Users/|\\Desktop\\|/Desktop/'
$secretPattern = '(?i)(sk-[a-z0-9]{20,}|api[_-]?key\s*[:=]\s*["''][^"'']+|access[_-]?token\s*[:=]\s*["''][^"'']+|webhook_secret\s*=\s*\S+)'
$phonePattern = '(?<!\d)1[3-9]\d{9}(?!\d)'
$emailPattern = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
$privateNetworkPattern = '(?i)(file://|localhost|127\.0\.0\.1|0\.0\.0\.0)'
$activeNetworkPattern = '(?i)\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\('
$browserStoragePattern = '(?i)\b(localStorage|sessionStorage|indexedDB)\b'

foreach ($file in $textFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    if ($content -match $privatePathPattern) {
        throw "Private local path detected in release: $($file.FullName)"
    }
    if ($content -match $secretPattern) {
        throw "Credential-like content detected in release: $($file.FullName)"
    }
    if ($content -match $phonePattern) {
        throw "Phone-number-like content detected in release: $($file.FullName)"
    }
    if ($content -match $emailPattern) {
        throw "Email-like content detected in release: $($file.FullName)"
    }
    if ($content -match $privateNetworkPattern) {
        throw "Private network or local URL detected in release: $($file.FullName)"
    }
    if ($content -match $activeNetworkPattern) {
        throw "Active network API detected in release: $($file.FullName)"
    }
    if ($content -match $browserStoragePattern) {
        throw "Browser storage API detected in release: $($file.FullName)"
    }
}

Add-Type -AssemblyName System.Drawing
$sensitiveExifIds = @(
    0x8825, # GPS IFD
    0x010F, # Camera make
    0x0110, # Camera model
    0x0131, # Software
    0x013B, # Artist
    0x8298, # Copyright
    0x9003, # Date taken
    0x9004, # Date digitized
    0x9286, # User comment
    0xA430, # Camera owner
    0xA431, # Camera serial
    0xA434  # Lens model
)

Get-ChildItem -LiteralPath (Join-Path $dist 'assets') -Recurse -File | Where-Object {
    $_.Extension -in @('.jpg', '.jpeg', '.png')
} | ForEach-Object {
    $imageFile = $_
    $image = [System.Drawing.Image]::FromFile($imageFile.FullName)
    try {
        $propertyIds = @($image.PropertyIdList)
        $detected = @($sensitiveExifIds | Where-Object { $propertyIds -contains $_ })
        if ($detected.Count -gt 0) {
            throw "Sensitive EXIF metadata detected in release image: $($imageFile.FullName)"
        }
    }
    finally {
        $image.Dispose()
    }
}

$requiredReleaseFiles = @(
    'index.html',
    'resume.html',
    '404.html',
    '_headers',
    'site-data.js',
    'evidence-data.js',
    'assets\akagavin-portrait.jpg',
    'assets\akagavin-editorial.jpg',
    'assets\akagavin-editorial-960.jpg',
    'assets\akagavin-social.jpg',
    'assets\film-grain.png',
    'robots.txt',
    'sitemap.xml',
    'pages\project.html',
    'resume.html'
)

foreach ($relativePath in $requiredReleaseFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $dist $relativePath) -PathType Leaf)) {
        throw "Required release output missing: $relativePath"
    }
}

try {
    [xml](Get-Content -LiteralPath (Join-Path $dist 'sitemap.xml') -Raw -Encoding utf8) | Out-Null
}
catch {
    throw "Invalid sitemap.xml: $($_.Exception.Message)"
}

$robotsContent = Get-Content -LiteralPath (Join-Path $dist 'robots.txt') -Raw -Encoding utf8
if ($robotsContent -notmatch '(?im)^User-agent:\s*\*$' -or $robotsContent -notmatch '(?im)^Sitemap:\s*https://') {
    throw 'robots.txt is missing a public user-agent or sitemap declaration.'
}

$backupDist = Join-Path $root 'dist.backup'
$expectedBackupDist = [System.IO.Path]::GetFullPath($backupDist)
if (-not $expectedBackupDist.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Release backup target escaped the website root.'
}

if (Test-Path -LiteralPath $backupDist) {
    Remove-Item -LiteralPath $backupDist -Recurse -Force
}

try {
    if (Test-Path -LiteralPath $publishedDist) {
        Move-Item -LiteralPath $publishedDist -Destination $backupDist
    }
    Move-Item -LiteralPath $dist -Destination $publishedDist
    if (Test-Path -LiteralPath $backupDist) {
        Remove-Item -LiteralPath $backupDist -Recurse -Force -ErrorAction SilentlyContinue
    }
}
catch {
    if (-not (Test-Path -LiteralPath $publishedDist) -and (Test-Path -LiteralPath $backupDist)) {
        Move-Item -LiteralPath $backupDist -Destination $publishedDist
    }
    throw
}

$dist = $publishedDist
$files = Get-ChildItem -LiteralPath $dist -Recurse -File
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum

[PSCustomObject]@{
    Status = 'PASS'
    Output = $dist
    Files = $files.Count
    TotalBytes = $totalBytes
    TotalMiB = [Math]::Round($totalBytes / 1MB, 2)
}
