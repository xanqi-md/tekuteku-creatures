# Open tools/shot.html in headless Edge and save PNGs
param([string]$OutDir, [string[]]$Shots = @('title', 'map', 'stage', 'mon', 'dex', 'mix'), [int]$W = 1100, [int]$H = 1000)
$root = Split-Path $PSScriptRoot -Parent
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
New-Item -ItemType Directory -Force $OutDir | Out-Null
foreach ($s in $Shots) {
  $prof = Join-Path $env:TEMP "tekuteku-shot-$PID-$s"
  $png = Join-Path $OutDir "$s-$W.png"
  $uri = ([Uri]"$PSScriptRoot\shot.html").AbsoluteUri + "?shot=$s"
  $a = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', "--user-data-dir=$prof", "--window-size=$W,$H", '--virtual-time-budget=6000', "--screenshot=$png", $uri)
  $p = Start-Process -FilePath $edge -ArgumentList $a -PassThru -WindowStyle Hidden
  if (-not $p.WaitForExit(40000)) { $p.Kill() }
  Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue
  "$png " + (Test-Path $png)
}
