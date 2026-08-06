# test-slot-exclusion.ps1  --  one customer per day rule
$base   = "http://localhost:5000/api"
$passed = 0
$failed = 0

function Pass($msg) { Write-Host "  PASS: $msg" -ForegroundColor Green; $script:passed++ }
function Fail($msg) { Write-Host "  FAIL: $msg" -ForegroundColor Red;   $script:failed++ }

function Invoke-Api {
    param([string]$Uri, [string]$Method="GET", [string]$Body=$null, [hashtable]$Headers=@{})
    $params = @{ Uri=$Uri; Method=$Method; ContentType="application/json"; Headers=$Headers; ErrorAction="Stop" }
    if ($Body) { $params.Body = $Body }
    try { return Invoke-RestMethod @params }
    catch { $raw = $_.ErrorDetails.Message; if ($raw) { return $raw | ConvertFrom-Json } else { throw } }
}

Write-Host ""
Write-Host "=== ONE CUSTOMER PER DAY + BREAK + CLOSED DAY TESTS ===" -ForegroundColor Cyan
Write-Host ""

# --- Step 0: Admin login ---
Write-Host "--- Step 0: Admin login ---"
$loginBody = '{"email":"admin@hisinks.com","password":"Admin1234!"}'
$loginRes  = Invoke-Api -Uri "$base/auth/login" -Method POST -Body $loginBody
$token     = $loginRes.data.token
if ($token) { Pass "Admin token obtained" } else { Fail "Admin login failed"; exit 1 }
$authHeaders = @{ Authorization = "Bearer $token" }

# --- Test 1: Baseline (no bookings) ---
Write-Host ""
Write-Host "--- Test 1: Baseline (Monday 2026-08-10, no bookings) ---"
$before = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
$baseSlots = $before.data.totalSlots
if ($before.data.isOpen)               { Pass "Monday is open" }                   else { Fail "Monday should be open" }
if ($before.data.fullyBooked -eq $false){ Pass "fullyBooked=false (no bookings)" } else { Fail "fullyBooked should be false initially" }
if ($baseSlots -eq 7)                  { Pass "totalSlots=7" }                     else { Fail "totalSlots=$baseSlots, expected 7" }
if ($before.data.slots.Count -eq 7)    { Pass "availableSlots=7" }                 else { Fail "availableSlots=$($before.data.slots.Count), expected 7" }
$has1300 = $before.data.slots | Where-Object { $_.start -eq "13:00" }
if (-not $has1300) { Pass "Break slot 13:00 excluded" } else { Fail "13:00 should not appear (break)" }
$slotList = ($before.data.slots | ForEach-Object { $_.start }) -join ", "
Write-Host "  Slots: $slotList"

# --- Test 2: Create one booking ---
Write-Host ""
Write-Host "--- Test 2: Create a booking on 2026-08-10 ---"
$b1 = @{
    customerName  = "First Customer"
    phone         = "0712345678"
    tattooIdea    = "Phoenix"
    description   = "A rising phoenix on the back"
    placement     = "Upper back"
    size          = "Large"
    preferredDate = "2026-08-10T09:00:00.000Z"
} | ConvertTo-Json -Compress
$bookingRes = Invoke-Api -Uri "$base/bookings" -Method POST -Body $b1
$bookingId  = $bookingRes.data.booking._id
$bStatus    = $bookingRes.data.booking.status
if ($bookingId)             { Pass "Booking created id=$bookingId" } else { Fail "Booking creation failed" }
if ($bStatus -eq "pending") { Pass "status=pending" }               else { Fail "status=$bStatus, expected pending" }

# --- Test 3: Entire day now fully booked (pending) ---
Write-Host ""
Write-Host "--- Test 3: Entire day blocked after one pending booking ---"
$after1 = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($after1.data.isOpen)                { Pass "isOpen still true (day is open)" }   else { Fail "isOpen should stay true" }
if ($after1.data.fullyBooked -eq $true) { Pass "fullyBooked=true (pending booking)" } else { Fail "fullyBooked should be true" }
if ($after1.data.slots.Count -eq 0)    { Pass "slots=[] (whole day blocked)" }        else { Fail "slots=$($after1.data.slots.Count), expected 0" }

# --- Test 4: Still fully booked after confirmed ---
Write-Host ""
Write-Host "--- Test 4: Day still blocked after status->confirmed ---"
Invoke-Api -Uri "$base/bookings/$bookingId/status" -Method PATCH -Body '{"status":"confirmed"}' -Headers $authHeaders | Out-Null
$after2 = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($after2.data.fullyBooked -eq $true) { Pass "fullyBooked=true (confirmed booking)" } else { Fail "fullyBooked should be true when confirmed" }
if ($after2.data.slots.Count -eq 0)    { Pass "slots=[] (confirmed keeps day blocked)" } else { Fail "slots=$($after2.data.slots.Count), expected 0" }

# --- Test 5: Day reopens after cancellation ---
Write-Host ""
Write-Host "--- Test 5: Day reopens after cancellation ---"
$cancelBody = '{"status":"cancelled"}'
Invoke-Api -Uri "$base/bookings/$bookingId/status" -Method PATCH -Body $cancelBody -Headers $authHeaders | Out-Null
$after3 = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($after3.data.fullyBooked -eq $false) { Pass "fullyBooked=false after cancel" }     else { Fail "fullyBooked should be false after cancel" }
if ($after3.data.slots.Count -eq 7)     { Pass "All 7 slots back after cancel" }       else { Fail "slots=$($after3.data.slots.Count), expected 7" }

# --- Test 6: Break slot (13:00) never appears regardless ---
Write-Host ""
Write-Host "--- Test 6: Break slot 13:00 never appears ---"
$breakCheck = $after3.data.slots | Where-Object { $_.start -eq "13:00" }
if (-not $breakCheck) { Pass "13:00 (break) never in available slots" } else { Fail "13:00 should never appear" }

# --- Test 7: Closed day (Sunday) ---
Write-Host ""
Write-Host "--- Test 7: Closed day (Sunday 2026-08-09) ---"
$sunday = Invoke-Api -Uri "$base/availability/slots?date=2026-08-09"
if ($sunday.data.isOpen -eq $false)  { Pass "Sunday isOpen=false" }        else { Fail "Sunday should be closed" }
if ($sunday.data.slots.Count -eq 0)  { Pass "Sunday slots=0" }             else { Fail "Sunday should have 0 slots" }
if ($sunday.success -eq $true)       { Pass "200 response for closed day" } else { Fail "Expected success=true" }

# --- Test 8: Admin closes Monday, verify slots=0, then reopen ---
Write-Host ""
Write-Host "--- Test 8: Admin closes Monday, verify slots=0, then reopen ---"
$closeRes = Invoke-Api -Uri "$base/availability/Monday" -Method PATCH -Body '{"isOpen":false}' -Headers $authHeaders
if ($closeRes.success) { Pass "Monday set to closed" } else { Fail "PATCH Monday isOpen=false failed" }
$closedSlots = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($closedSlots.data.isOpen -eq $false) { Pass "Monday returns isOpen=false" } else { Fail "Expected isOpen=false" }
if ($closedSlots.data.slots.Count -eq 0) { Pass "Monday slots=0 when closed" }  else { Fail "Expected 0 slots, got $($closedSlots.data.slots.Count)" }
$reopenRes = Invoke-Api -Uri "$base/availability/Monday" -Method PATCH -Body '{"isOpen":true}' -Headers $authHeaders
if ($reopenRes.success) { Pass "Monday reopened" } else { Fail "Reopen failed" }
$reopened = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($reopened.data.isOpen)             { Pass "Monday isOpen=true again" }       else { Fail "Monday should be open" }
if ($reopened.data.slots.Count -eq 7)  { Pass "All 7 slots available after reopen" } else { Fail "slots=$($reopened.data.slots.Count), expected 7" }

# --- Test 9: Day blocks for a different time on the same date ---
Write-Host ""
Write-Host "--- Test 9: Any booking on a date blocks ALL slots (not just that time) ---"
$b2 = @{
    customerName  = "Second Customer"
    phone         = "0700000099"
    tattooIdea    = "Dragon"
    description   = "Dragon on the chest"
    placement     = "Chest"
    size          = "Large"
    preferredDate = "2026-08-10T14:00:00.000Z"
} | ConvertTo-Json -Compress
$b2Res = Invoke-Api -Uri "$base/bookings" -Method POST -Body $b2
$b2Id  = $b2Res.data.booking._id
if ($b2Id) { Pass "Second booking created (14:00)" } else { Fail "Second booking failed" }
$afterB2 = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($afterB2.data.fullyBooked -eq $true) { Pass "fullyBooked=true (14:00 booking blocks whole day)" } else { Fail "fullyBooked should be true" }
if ($afterB2.data.slots.Count -eq 0)     { Pass "slots=[] (all slots blocked, not just 14:00)" }       else { Fail "slots=$($afterB2.data.slots.Count), expected 0" }

# Verify a different date is NOT affected
$otherDay = Invoke-Api -Uri "$base/availability/slots?date=2026-08-11"
if ($otherDay.data.fullyBooked -ne $true -and $otherDay.data.slots.Count -gt 0) {
    Pass "2026-08-11 (Tuesday) unaffected by Monday booking"
} else {
    Fail "2026-08-11 should still have slots (different date)"
}

# --- Cleanup ---
Write-Host ""
Write-Host "--- Cleanup ---"
Invoke-Api -Uri "$base/bookings/$b2Id/status" -Method PATCH -Body $cancelBody -Headers $authHeaders | Out-Null
$cleaned = Invoke-Api -Uri "$base/availability/slots?date=2026-08-10"
if ($cleaned.data.slots.Count -eq 7) { Pass "All slots restored after cleanup" } else { Fail "slots=$($cleaned.data.slots.Count), expected 7" }

# --- Summary ---
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
$color = if ($failed -eq 0) { "Green" } else { "Red" }
Write-Host "RESULTS: $passed passed, $failed failed" -ForegroundColor $color
Write-Host "=========================================" -ForegroundColor Cyan
