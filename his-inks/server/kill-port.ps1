$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force
    Write-Host "Killed PID $($conn.OwningProcess) (was using port 5000)"
} else {
    Write-Host "No process found on port 5000"
}
