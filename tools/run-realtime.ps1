# Open a tools page in headless Edge, wait in real time, then read #out over the local debug port.
# Needed for tests that use IndexedDB, which does not advance under virtual time.
param([string]$Page, [int]$WaitSec = 12, [int]$Port = 9344)
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$prof = Join-Path $env:TEMP "tekuteku-rt-$PID"
$uri = ([Uri](Resolve-Path $Page).Path).AbsoluteUri
$p = Start-Process -FilePath $edge -ArgumentList @('--headless=new', '--disable-gpu', '--allow-file-access-from-files', "--remote-debugging-port=$Port", "--remote-allow-origins=http://127.0.0.1:$Port", "--user-data-dir=$prof", $uri) -PassThru -WindowStyle Hidden
try {
  Start-Sleep -Seconds $WaitSec
  $targets = Invoke-RestMethod -UseBasicParsing -Uri "http://127.0.0.1:$Port/json/list" -TimeoutSec 10
  $t = @($targets | Where-Object { $_.type -eq 'page' -and $_.url -like '*tools*' })[0]
  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.Options.SetRequestHeader('Origin', "http://127.0.0.1:$Port")
  $ct = [Threading.CancellationToken]::None
  $ws.ConnectAsync([Uri]$t.webSocketDebuggerUrl, $ct).Wait()
  $msg = '{"id":1,"method":"Runtime.evaluate","params":{"expression":"document.getElementById(\"out\").textContent"}}'
  $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
  $ws.SendAsync([ArraySegment[byte]]::new($bytes), 'Text', $true, $ct).Wait()
  $buf = New-Object byte[] 1048576
  $ms = New-Object IO.MemoryStream
  do {
    $r = $ws.ReceiveAsync([ArraySegment[byte]]::new($buf), $ct).Result
    $ms.Write($buf, 0, $r.Count)
  } while (-not $r.EndOfMessage)
  $json = [Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json
  $json.result.result.value
} finally {
  if (-not $p.HasExited) { $p.Kill() }
  Start-Sleep -Milliseconds 500
  Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue
}
