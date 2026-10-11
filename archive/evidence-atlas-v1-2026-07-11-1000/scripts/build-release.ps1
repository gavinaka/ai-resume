[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dist = Join-Path $root 'dist'
$expectedDist = [System.IO.Path]::GetFullPath((Join-Path $root 'dist'))

if ([System.IO.Path]::GetFullPath($dist) -ne $expectedDist) {
    throw 'Release target is not the expected dist directory.'
}

if (-not $expectedDist.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Release target escaped the website root.'
}

if (Test-Path -LiteralPath $dist) {
    Remove-Item -LiteralPath $dist -Recurse -Force
}

New-Item -ItemType Directory -Path $dist | Out-Null

$publicFiles = @(
    'index.html',
    'styles.css',
    'script.js',
    'evidence-data.js',
    'site-data.js',
    'infinite-canvas.html',
    'canvas.css',
    'canvas.js'
)

$publicDirectories = @('assets', 'pages')

foreach ($relativePath in $publicFiles) {
    $source = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Missing release source file: $relativePath"
    }
    Copy-Item -LiteralPath $source -Destination (Join-Path $dist $relativePath)
}

foreach ($relativePath in $publicDirectories) {
    $source = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $source -PathType Container)) {
        throw "Missing release source directory: $relativePath"
    }
    Copy-Item -LiteralPath $source -Destination $dist -Recurse
}

Copy-Item -LiteralPath (Join-Path $root 'deploy\_headers') -Destination (Join-Path $dist '_headers')
Copy-Item -LiteralPath (Join-Path $root 'index.html') -Destination (Join-Path $dist '404.html')

$forbiddenNames = @('00_PROFILE_BRIEF.md', '01_EVIDENCE_LEDGER.md', '02_PUBLIC_CONTENT_REVIEW.md', 'README.md', 'archive', 'deploy', 'scripts')
foreach ($name in $forbiddenNames) {
    if (Test-Path -LiteralPath (Join-Path $dist $name)) {
        throw "Forbidden release item detected: $name"
    }
}

$textFiles = Get-ChildItem -LiteralPath $dist -Recurse -File | Where-Object {
    $_.Extension -in @('.html', '.css', '.js', '.txt', '.json') -or $_.Name -eq '_headers'
}

$privatePathPattern = 'C:\\Users\\|C:/Users/|\\Desktop\\|/Desktop/'
$secretPattern = '(?i)(sk-[a-z0-9]{20,}|api[_-]?key\s*[:=]\s*["''][^"'']+|access[_-]?token\s*[:=]\s*["''][^"'']+|webhook_secret\s*=\s*\S+)'

foreach ($file in $textFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    if ($content -match $privatePathPattern) {
        throw "Private local path detected in release: $($file.FullName)"
    }
    if ($content -match $secretPattern) {
        throw "Credential-like content detected in release: $($file.FullName)"
    }
}

$requiredReleaseFiles = @(
    'index.html',
    '404.html',
    '_headers',
    'site-data.js',
    'evidence-data.js',
    'assets\akagavin-portrait.jpg',
    'pages\project.html'
)

foreach ($relativePath in $requiredReleaseFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $dist $relativePath) -PathType Leaf)) {
        throw "Required release output missing: $relativePath"
    }
}

$files = Get-ChildItem -LiteralPath $dist -Recurse -File
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum

[PSCustomObject]@{
    Status = 'PASS'
    Output = $dist
    Files = $files.Count
    TotalBytes = $totalBytes
    TotalMiB = [Math]::Round($totalBytes / 1MB, 2)
}
