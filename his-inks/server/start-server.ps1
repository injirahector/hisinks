Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "C:\Users\Admin\Desktop\hisinks\his-inks\server" -RedirectStandardOutput "server.log" -RedirectStandardError "server.err" -WindowStyle Hidden
Write-Host "Server starting..."
Start-Sleep -Seconds 3
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -ErrorAction Stop
    Write-Host "Server healthy: $($r.message)"
} catch {
    Write-Host "Server not responding yet: $($_.Exception.Message)"
}
