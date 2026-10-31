# Open a tools page in headless Edge and print the contents of #out
param([string]$Page, [int]$WaitMs = 120000, [int]$Budget = 8000, [string]$Query = '', [int]$RealMs = 0)
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$prof = Join-Path $env:TEMP "tekuteku-edge-$PID"
$outFile = Join-Path $env:TEMP "tekuteku-dom-$PID.html"
$uri = ([Uri](Resolve-Path $Page).Path).AbsoluteUri + $Query
$args2 = @('--headless=new', '--disable-gpu', '--allow-file-access-from-files', "--user-data-dir=$prof", $(if ($RealMs) { "--timeout=$RealMs" } else { "--virtual-time-budget=$Budget" }), '--dump-dom', $uri)
$p = Start-Process -FilePath $edge -ArgumentList $args2 -RedirectStandardOutput $outFile -PassThru -WindowStyle Hidden
if (-not $p.WaitForExit($WaitMs)) { $p.Kill(); 'TIMEOUT' }
$dom = $null
foreach ($try in 1..20) { try { $dom = [IO.File]::ReadAllText($outFile, [Text.Encoding]::UTF8); break } catch { Start-Sleep -Milliseconds 300 } }
$m = [regex]::Match($dom, '<pre id="out"[^>]*>([\s\S]+?)</pre>')
if ($m.Success) { [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value) } else { 'NO OUTPUT'; $dom.Substring(0, [Math]::Min(600, $dom.Length)) }
Remove-Item $outFile -ErrorAction SilentlyContinue
Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue
