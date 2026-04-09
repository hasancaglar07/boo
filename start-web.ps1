param(
  [ValidateSet('dev','prod','reset','stop','logs')]
  [string]$Mode = 'dev'
)

$ErrorActionPreference = 'Stop'
$WebDir = Join-Path $PSScriptRoot 'web'
$Port = 3000
$HostName = 'localhost'
$Url = "http://$HostName`:$Port"
$DashboardHost = if ($env:BOOK_DASHBOARD_HOST) { $env:BOOK_DASHBOARD_HOST } else { '127.0.0.1' }
$DashboardPort = if ($env:BOOK_DASHBOARD_PORT) { [int]$env:BOOK_DASHBOARD_PORT } else { 8765 }
$DashboardHealthUrl = "http://$DashboardHost`:$DashboardPort/api/health"
$DashboardScript = Join-Path $PSScriptRoot 'dashboard_server.py'
$DashboardPidFile = Join-Path $PSScriptRoot '.dashboard-server.pid'
$DashboardForceRestart = $false
if ($env:BOOK_DASHBOARD_FORCE_RESTART) {
  $DashboardForceRestart = @('1', 'true', 'yes', 'on') -contains $env:BOOK_DASHBOARD_FORCE_RESTART.ToLowerInvariant()
}

function WriteHeader {
  Write-Host ''
  Write-Host '============================================'
  Write-Host '  BOOK Web - PowerShell Localhost Baslatiliyor'
  Write-Host "  $Url"
  Write-Host '============================================'
  Write-Host ''
}

function GetPortPid {
  $line = netstat -ano | Select-String ":$Port" | Select-String 'LISTENING' | Select-Object -First 1
  if (-not $line) { return $null }
  $parts = ($line.ToString() -split '\s+') | Where-Object { $_ }
  if ($parts.Length -lt 5) { return $null }
  return [int]$parts[-1]
}

function TestDashboardHealthy {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $DashboardHealthUrl -TimeoutSec 2
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
  } catch {
    return $false
  }
}

function ReadDashboardPid {
  if (-not (Test-Path $DashboardPidFile)) { return $null }
  try {
    $raw = (Get-Content $DashboardPidFile -ErrorAction Stop | Select-Object -First 1).Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    $pidNum = [int]$raw
    $process = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
    if ($process) { return $pidNum }
  } catch {
    return $null
  }
  return $null
}

function StopDashboardByCommandLine {
  try {
    $targets = Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe' OR Name = 'py.exe'" |
      Where-Object { $_.CommandLine -and $_.CommandLine -match 'dashboard_server\.py' }
  } catch {
    $targets = @()
  }

  foreach ($target in $targets) {
    $targetPid = [int]$target.ProcessId
    try {
      Stop-Process -Id $targetPid -Force -ErrorAction Stop
      Write-Host "[info] Dashboard process temizlendi. PID: $targetPid"
    } catch {
      Write-Host "[warn] Dashboard process PID $targetPid durdurulamadi: $($_.Exception.Message)"
    }
  }
}

function ResolvePythonCommand {
  if (Get-Command python -ErrorAction SilentlyContinue) {
    return @{ FilePath = 'python'; PrefixArgs = @() }
  }
  if (Get-Command py -ErrorAction SilentlyContinue) {
    return @{ FilePath = 'py'; PrefixArgs = @('-3') }
  }
  throw 'Python bulunamadi. Python 3 kurup PATH''e ekle.'
}

function StopDashboard {
  $trackedPid = ReadDashboardPid
  if ($trackedPid) {
    try {
      taskkill /PID $trackedPid /F 2>&1 | Out-Null
      Write-Host "[info] Dashboard durduruldu. PID: $trackedPid"
    } catch {
      Write-Host "[warn] Dashboard PID $trackedPid durdurulamadi: $($_.Exception.Message)"
    }
  }
  StopDashboardByCommandLine
  if (Test-Path $DashboardPidFile) {
    Remove-Item $DashboardPidFile -ErrorAction SilentlyContinue
  }
}

function EnsureDashboard {
  param(
    [switch]$ForceRestart
  )

  if (-not $ForceRestart -and (TestDashboardHealthy)) {
    Write-Host "[info] Dashboard hazir: $DashboardHealthUrl"
    return
  }

  if (-not (Test-Path $DashboardScript)) {
    throw "Dashboard script bulunamadi: $DashboardScript"
  }

  StopDashboard

  $python = ResolvePythonCommand
  $args = @()
  if ($python.PrefixArgs) {
    $args += $python.PrefixArgs
  }
  $args += $DashboardScript

  $proc = Start-Process -FilePath $python.FilePath -ArgumentList $args -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
  Set-Content -Path $DashboardPidFile -Value $proc.Id -Encoding ascii

  for ($i = 0; $i -lt 40; $i++) {
    if (TestDashboardHealthy) {
      Write-Host "[info] Dashboard baslatildi: $DashboardHealthUrl"
      return
    }
    Start-Sleep -Milliseconds 250
  }

  throw "Dashboard baslatilamadi: $DashboardHealthUrl"
}

function StopPortProcess {
  $portPid = GetPortPid
  if ($portPid) {
    try {
      Write-Host "[info] Port $Port kullanan surec kapatiliyor. PID: $portPid"
      taskkill /PID $portPid /F 2>&1 | Out-Null
      Start-Sleep -Milliseconds 750
    } catch {
      Write-Host "[warn] PID $portPid kapatilamadi: $($_.Exception.Message)"
    }
  } else {
    Write-Host '[info] Port $Port uzerinde calisan surec bulunamadi.'
  }
}

function StartDev {
  WriteHeader
  Write-Host '[mode] dev (PowerShell native, WSL yok)'
  Write-Host '[info] Durdurmak icin Ctrl+C'
  Write-Host "[info] Tarayici adresi: $Url"
  Write-Host ''
  if ($DashboardForceRestart) {
    EnsureDashboard -ForceRestart
  } else {
    EnsureDashboard
  }
  StopPortProcess
  Write-Host '[info] Tarayici aciliyor...'
  Start-Process $Url | Out-Null
  Set-Location $WebDir
  pnpm dev --hostname $HostName --port $Port
}

function StartProd {
  WriteHeader
  Write-Host '[mode] prod'
  if ($DashboardForceRestart) {
    EnsureDashboard -ForceRestart
  } else {
    EnsureDashboard
  }
  StopPortProcess
  Set-Location $WebDir
  pnpm build
  Start-Process $Url | Out-Null
  pnpm start
}

function StopWeb {
  $portPid = GetPortPid
  if ($portPid) {
    taskkill /PID $portPid /F 2>&1 | Out-Null
    Write-Host "Durduruldu. PID: $portPid"
  } else {
    Write-Host '3000 portunda calisan surec bulunamadi.'
  }
  StopDashboard
}

function ShowLogs {
  $logPath = Join-Path $WebDir '.next\dev\logs\next-development.log'
  if (Test-Path $logPath) {
    Get-Content $logPath -Tail 120
  } else {
    Write-Host 'Log dosyasi bulunamadi.'
  }
}

switch ($Mode) {
  'dev' { StartDev }
  'prod' { StartProd }
  'reset' { StopWeb; Start-Sleep -Seconds 1; StartDev }
  'stop' { StopWeb }
  'logs' { ShowLogs }
}
