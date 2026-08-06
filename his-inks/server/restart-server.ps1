# restart-server.ps1
$serverDir = 'C:/Users/Admin/Desktop/hisinks/his-inks/server'
$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('Killed PID ' + $conn.OwningProcess); Start-Sleep -Seconds 1 } else { Write-Host 'Port 5000 free' }
$logOut = $serverDir + '/server.log'
$logErr = $serverDir + '/server.err'
$proc = Start-Process -FilePath 'node' -ArgumentList 'src/server.js' -WorkingDirectory $serverDir -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru -WindowStyle Hidden
Write-Host ('Server started PID ' + $proc.Id)
Start-Sleep -Seconds 4
try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -ErrorAction Stop; Write-Host ('READY: ' + $r.message) } catch { Write-Host 'Not responding yet' }