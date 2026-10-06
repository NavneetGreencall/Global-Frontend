<#
  Copies every file that the copied API code imports but your project is missing.

  It looks at src\lib, src\config and src\features in YOUR project, follows each
  import (both "@/..." and "./..." / "../..."), and if the imported file isn't in
  your project it copies it from the other frontend, at the same path.
  It repeats until nothing new is missing, because copied files can import more files.

  Usage (from your project root):
    .\copy-missing.ps1 -Source "D:\path\to\Global-Frontend"
#>
param(
  [Parameter(Mandatory = $true)] [string] $Source,      # the other frontend's root folder (the one with package.json)
  [string] $Project = (Get-Location).Path               # your project's root folder
)

$sep        = [IO.Path]::DirectorySeparatorChar
$projectSrc = [IO.Path]::GetFullPath((Join-Path $Project "src"))
$sourceSrc  = [IO.Path]::GetFullPath((Join-Path $Source  "src"))
if (-not (Test-Path $sourceSrc)) { Write-Error "Can't find $sourceSrc. Check the -Source path."; exit 1 }

$suffixes = @(".ts", ".tsx", "$($sep)index.ts", "$($sep)index.tsx")
$folderNames = @("lib", "config", "features", "components")

function Find-Existing([string] $base) {
  foreach ($s in $suffixes) { if (Test-Path -LiteralPath ($base + $s) -PathType Leaf) { return $s } }
  return $null
}

$copied = 0; $notFound = @{}; $uiFiles = @()
for ($round = 1; $round -le 15; $round++) {
  $copiedThisRound = 0
  $folders = $folderNames | ForEach-Object { Join-Path $projectSrc $_ } | Where-Object { Test-Path $_ }
  $files = Get-ChildItem -Path $folders -Recurse -File -Include *.ts, *.tsx
  foreach ($file in $files) {
    $text  = Get-Content -LiteralPath $file.FullName -Raw
    $specs = [regex]::Matches($text, '(?:from|import)\s*\(?\s*["'']([^"'']+)["'']') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
    foreach ($spec in $specs) {
      if ($spec.StartsWith("@/"))    { $base = Join-Path $projectSrc ($spec.Substring(2) -replace '/', $sep) }
      elseif ($spec.StartsWith(".")) { $base = Join-Path $file.DirectoryName ($spec -replace '/', $sep) }
      else { continue }                                   # npm package: not a file
      if ($spec -match '\.(css|scss|png|jpe?g|svg|gif|webp|json)$') { continue }   # styles/images: not code
      $base = [IO.Path]::GetFullPath($base)
      if (-not $base.StartsWith($projectSrc)) { continue }
      if (Find-Existing $base) { continue }              # already in your project

      $rel        = $base.Substring($projectSrc.Length)  # e.g. \lib\indian-mobile
      $sourceBase = $sourceSrc + $rel
      $suffix     = Find-Existing $sourceBase
      if ($suffix) {
        $dest = $projectSrc + $rel + $suffix
        New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
        Copy-Item -LiteralPath ($sourceBase + $suffix) -Destination $dest
        Write-Host ("Copied   src" + $rel + $suffix) -ForegroundColor Green
        if ($rel -match "^[\\/](components|routes)[\\/]") { $uiFiles += ("src" + $rel + $suffix) }
        $copied++; $copiedThisRound++
      } else {
        $notFound["$spec  (imported by $($file.Name))"] = $true
      }
    }
  }
  if ($copiedThisRound -eq 0) { break }
}

Write-Host ""
Write-Host "Copied $copied file(s)."
if ($notFound.Count) {
  Write-Host "Not found in the other frontend either:" -ForegroundColor Yellow
  $notFound.Keys | Sort-Object | ForEach-Object { Write-Host "  $_" }
}
if ($uiFiles.Count) {
  Write-Host "These came from UI folders (components/routes); tell me about them:" -ForegroundColor Yellow
  $uiFiles | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" }
}