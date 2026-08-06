$base = 'http://localhost:5000/api'
$passed = 0
$failed = 0

function Pass($msg) { Write-Host "  PASS: $msg" -ForegroundColor Green; $global:passed++ }
function Fail($msg) { Write-Host "  FAIL: $msg" -ForegroundColor Red;  $global:failed++ }

# ── Test 1: GET /api/availability ─────────────────────────────────────────────
Write-Host "`n--- TEST 1: GET /api/availability (schedule + init) ---"
$r = Invoke-RestMethod -Uri "$base/availability" -Method GET
if ($r.success -eq $true) { Pass "success=true" } else { Fail "success not true" }
if ($r.count -eq 7)        { Pass "count=7 (all 7 days)" } else { Fail "count=$($r.count), expected 7" }

$mon = $r.data.schedule | Where-Object { $_.dayOfWeek -eq 'Monday' }
$sat = $r.data.schedule | Where-Object { $_.dayOfWeek -eq 'Saturday' }
$sun = $r.data.schedule | Where-Object { $_.dayOfWeek -eq 'Sunday' }

if ($mon.isOpen -eq $true -and $mon.openTime -eq '09:00' -and $mon.closeTime -eq '17:00') { Pass "Monday 09:00-17:00 open" } else { Fail "Monday config wrong" }
if ($mon.breakStart -eq '13:00' -and $mon.breakEnd -eq '14:00') { Pass "Monday break 13:00-14:00" } else { Fail "Monday break wrong" }
if ($sat.isOpen -eq $true -and $sat.openTime -eq '10:00' -and $sat.closeTime -eq '15:00') { Pass "Saturday 10:00-15:00 open" } else { Fail "Saturday config wrong" }
if ($sun.isOpen -eq $false) { Pass "Sunday closed" } else { Fail "Sunday should be closed" }

# ── Test 2: GET slots for Monday 2026-08-10 ───────────────────────────────────
Write-Host "`n--- TEST 2: GET slots for 2026-08-10 (Monday, 60min slots) ---"
$r2 = Invoke-RestMethod -Uri "$base/availability/slots?date=2026-08-10" -Method GET
if ($r2.data.isOpen -eq $true)          { Pass "isOpen=true" } else { Fail "isOpen wrong" }
if ($r2.data.dayOfWeek -eq 'Monday')    { Pass "dayOfWeek=Monday" } else { Fail "dayOfWeek wrong" }
# Mon 09:00-17:00 = 8hrs = 8 slots minus 1hr break = 7 slots
if ($r2.data.totalSlots -eq 7)          { Pass "totalSlots=7" } else { Fail "totalSlots=$($r2.data.totalSlots), expected 7" }
if ($r2.data.slots.Count -eq 7)         { Pass "availableSlots=7 (none booked)" } else { Fail "availableSlots=$($r2.data.slots.Count), expected 7" }

# Verify break slots excluded (13:00 slot should not appear)
$hasBreak = $r2.data.slots | Where-Object { $_.start -eq '13:00' }
if (-not $hasBreak) { Pass "Break slot 13:00 excluded" } else { Fail "Break slot 13:00 should be excluded" }

$r2.data.slots | ForEach-Object { Write-Host "    $($_.start) - $($_.end)" }

# ── Test 3: GET slots for Sunday (closed) ────────────────────────────────────
Write-Host "`n--- TEST 3: GET slots for 2026-08-09 (Sunday - closed) ---"
$r3 = Invoke-RestMethod -Uri "$base/availability/slots?date=2026-08-09" -Method GET
if ($r3.data.isOpen -eq $false)       { Pass "Sunday isOpen=false" } else { Fail "Sunday should be closed" }
if ($r3.data.slots.Count -eq 0)       { Pass "Sunday slots=0" } else { Fail "Sunday should have 0 slots" }

# ── Test 4: Invalid date ──────────────────────────────────────────────────────
Write-Host "`n--- TEST 4: Invalid date param ---"
try {
    Invoke-RestMethod -Uri "$base/availability/slots?date=not-a-date" -Method GET -ErrorAction Stop
    Fail "Should have returned 422"
} catch {
    $body = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($body.success -eq $false) { Pass "422 for invalid date" } else { Fail "Expected 422" }
}

# ── Test 5: Missing date ──────────────────────────────────────────────────────
Write-Host "`n--- TEST 5: Missing date param ---"
try {
    Invoke-RestMethod -Uri "$base/availability/slots" -Method GET -ErrorAction Stop
    Fail "Should have returned 422"
} catch {
    $body = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($body.success -eq $false) { Pass "422 for missing date" } else { Fail "Expected 422" }
}

# ── Test 6: PATCH without auth ────────────────────────────────────────────────
Write-Host "`n--- TEST 6: PATCH without auth token ---"
try {
    $body = @{ slotDuration = 30 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $body -ContentType 'application/json' -ErrorAction Stop
    Fail "Should have returned 401"
} catch {
    $respBody = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($respBody.success -eq $false) { Pass "401 without token" } else { Fail "Expected 401" }
}

# ── Admin login ───────────────────────────────────────────────────────────────
Write-Host "`n--- Logging in as admin ---"
$token = $null
try {
    $loginBody = '{"email":"admin@hisinks.com","password":"Admin1234!"}'
    $loginRes = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    $token = $loginRes.data.token
    Pass "Admin login successful"
} catch {
    Write-Host "  INFO: Admin login failed ($($_.Exception.Message)) - skipping admin tests" -ForegroundColor Yellow
}

if ($token) {
    $headers = @{ Authorization = "Bearer $token" }

    # ── Test 7: PATCH Monday - update slotDuration ────────────────────────────
    Write-Host "`n--- TEST 7: PATCH Monday slotDuration=90 ---"
    $patchBody = '{"slotDuration":90}'
    $r7 = Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $patchBody -ContentType 'application/json' -Headers $headers
    if ($r7.success -eq $true)              { Pass "PATCH success" } else { Fail "PATCH failed" }
    if ($r7.data.day.slotDuration -eq 90)   { Pass "slotDuration updated to 90" } else { Fail "slotDuration wrong: $($r7.data.day.slotDuration)" }

    # ── Test 8: Slots reflect new duration ───────────────────────────────────
    Write-Host "`n--- TEST 8: Slots for Monday with 90min slots ---"
    $r8 = Invoke-RestMethod -Uri "$base/availability/slots?date=2026-08-10" -Method GET
    # 09:00-17:00 with 90min slots: 09:00-10:30, 10:30-12:00, 15:00-16:30
    # 12:00-13:30 and 13:30-15:00 both overlap the 13:00-14:00 break → skipped
    # Correct total = 3 slots
    if ($r8.data.totalSlots -eq 3)  { Pass "totalSlots=3 (90min slots, 2 overlap break)" } else { Fail "totalSlots=$($r8.data.totalSlots), expected 3" }
    $r8.data.slots | ForEach-Object { Write-Host "    $($_.start) - $($_.end)" }

    # ── Test 9: Restore Monday to 60min ──────────────────────────────────────
    Write-Host "`n--- TEST 9: Restore Monday slotDuration=60 ---"
    $restoreBody = '{"slotDuration":60}'
    $r9 = Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $restoreBody -ContentType 'application/json' -Headers $headers
    if ($r9.data.day.slotDuration -eq 60) { Pass "slotDuration restored to 60" } else { Fail "restore failed" }

    # ── Test 10: PATCH invalid time format ───────────────────────────────────
    Write-Host "`n--- TEST 10: PATCH invalid openTime format ---"
    try {
        $badBody = '{"openTime":"9:00"}'
        Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $badBody -ContentType 'application/json' -Headers $headers -ErrorAction Stop
        Fail "Should have returned 422"
    } catch {
        $respBody = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($respBody.success -eq $false) { Pass "422 for bad time format" } else { Fail "Expected 422" }
    }

    # ── Test 11: openTime >= closeTime ────────────────────────────────────────
    Write-Host "`n--- TEST 11: PATCH openTime >= closeTime ---"
    try {
        $badBody = '{"openTime":"17:00","closeTime":"09:00"}'
        Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $badBody -ContentType 'application/json' -Headers $headers -ErrorAction Stop
        Fail "Should have returned 422"
    } catch {
        $respBody = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($respBody.success -eq $false) { Pass "422 for openTime >= closeTime" } else { Fail "Expected 422" }
    }

    # ── Test 12: Break outside working hours ─────────────────────────────────
    Write-Host "`n--- TEST 12: Break outside working hours ---"
    try {
        $badBody = '{"openTime":"09:00","closeTime":"17:00","breakStart":"07:00","breakEnd":"08:00"}'
        Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $badBody -ContentType 'application/json' -Headers $headers -ErrorAction Stop
        Fail "Should have returned 422 or 500"
    } catch {
        Pass "Rejected break outside working hours"
    }

    # ── Test 13: slotDuration out of range ────────────────────────────────────
    Write-Host "`n--- TEST 13: slotDuration out of range ---"
    try {
        $badBody = '{"slotDuration":300}'
        Invoke-RestMethod -Uri "$base/availability/Monday" -Method PATCH -Body $badBody -ContentType 'application/json' -Headers $headers -ErrorAction Stop
        Fail "Should have returned 422"
    } catch {
        $respBody = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($respBody.success -eq $false) { Pass "422 for slotDuration > 240" } else { Fail "Expected 422" }
    }

    # ── Test 14: Invalid day name ─────────────────────────────────────────────
    Write-Host "`n--- TEST 14: PATCH invalid day name ---"
    try {
        $body = '{"slotDuration":60}'
        Invoke-RestMethod -Uri "$base/availability/Funday" -Method PATCH -Body $body -ContentType 'application/json' -Headers $headers -ErrorAction Stop
        Fail "Should have returned 422"
    } catch {
        $respBody = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($respBody.success -eq $false) { Pass "422 for invalid day name" } else { Fail "Expected 422" }
    }

    # ── Test 15: GET slots for Saturday (open, no break) ─────────────────────
    Write-Host "`n--- TEST 15: GET slots for Saturday (no break) ---"
    # Find next Saturday from 2026-08-08
    $r15 = Invoke-RestMethod -Uri "$base/availability/slots?date=2026-08-08" -Method GET
    if ($r15.data.dayOfWeek -eq 'Saturday')  { Pass "dayOfWeek=Saturday" } else { Fail "dayOfWeek=$($r15.data.dayOfWeek)" }
    if ($r15.data.isOpen -eq $true)           { Pass "Saturday isOpen=true" } else { Fail "Saturday should be open" }
    # 10:00-15:00 = 5hrs = 5 slots (60min, no break)
    if ($r15.data.totalSlots -eq 5)           { Pass "Saturday totalSlots=5" } else { Fail "Saturday totalSlots=$($r15.data.totalSlots), expected 5" }
    if ($r15.data.bookedCount -eq 0)          { Pass "Saturday bookedCount=0" } else { Fail "bookedCount=$($r15.data.bookedCount)" }
    $r15.data.slots | ForEach-Object { Write-Host "    $($_.start) - $($_.end)" }
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n========================================="
Write-Host "RESULTS: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Red' })
Write-Host "========================================="
