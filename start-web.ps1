param(
  [ValidateSet('dev','dev-fast','prod','reset','stop','logs','logs-live','repair')]
  [string]$Mode = 'dev'
)

$ErrorActionPreference = 'Stop'
$ScriptRevision = '2026-04-10-r3'
$WebDir = Join-Path $PSScriptRoot 'web'
$Port = 3000
$HostName = 'localhost'
$Url = "http://$HostName`:$Port"
$DashboardHost = if ($env:BOOK_DASHBOARD_HOST) { $env:BOOK_DASHBOARD_HOST } else { '127.0.0.1' }
$DashboardPort = if ($env:BOOK_DASHBOARD_PORT) { [int]$env:BOOK_DASHBOARD_PORT } else { 8765 }
$DashboardHealthUrl = "http://$DashboardHost`:$DashboardPort/api/health"
$DashboardScript = Join-Path $PSScriptRoot 'dashboard_server.py'
$DashboardPidFile = Join-Path $PSScriptRoot '.dashboard-server.pid'
$DashboardLogFile = Join-Path $PSScriptRoot '.dashboard-server.log'
$DashboardErrorLogFile = Join-Path $PSScriptRoot '.dashboard-server.err.log'
$DashboardForceRestart = $false
$SkipDashboard = $false
$SkipWebChecks = $false
if ($env:BOOK_DASHBOARD_FORCE_RESTART) {
  $DashboardForceRestart = @('1', 'true', 'yes', 'on') -contains $env:BOOK_DASHBOARD_FORCE_RESTART.ToLowerInvariant()
}
if ($env:BOOK_SKIP_DASHBOARD) {
  $SkipDashboard = @('1', 'true', 'yes', 'on') -contains $env:BOOK_SKIP_DASHBOARD.ToLowerInvariant()
}
if ($env:BOOK_WEB_SKIP_CHECKS) {
  $SkipWebChecks = @('1', 'true', 'yes', 'on') -contains $env:BOOK_WEB_SKIP_CHECKS.ToLowerInvariant()
}

function WriteHeader {
  Write-Host ''
  Write-Host '============================================'
  Write-Host '  BOOK Web - PowerShell Localhost Baslatiliyor'
  Write-Host "  $Url"
  Write-Host '============================================'
  Write-Host "[rev] $ScriptRevision"
  Write-Host "[script] $PSCommandPath"
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
  param(
    [int]$TimeoutSec = 2
  )

  if ($TimeoutSec -lt 1) {
    $TimeoutSec = 1
  }

  try {
    $response = InvokeDashboardRequest -Url $DashboardHealthUrl -TimeoutSec $TimeoutSec
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
  } catch {
    try {
      $rawStatus = InvokeDashboardRawHealthStatus -TimeoutSec $TimeoutSec
      return ($rawStatus -ge 200 -and $rawStatus -lt 300)
    } catch {
      return $false
    }
  }
}

function InvokeDashboardRawHealthStatus {
  param(
    [int]$TimeoutSec = 2
  )

  if ($TimeoutSec -lt 1) {
    $TimeoutSec = 1
  }

  $client = [System.Net.Sockets.TcpClient]::new()
  $timeoutMs = [Math]::Max(1000, $TimeoutSec * 1000)

  try {
    $connectTask = $client.ConnectAsync($DashboardHost, $DashboardPort)
    if (-not $connectTask.Wait($timeoutMs)) {
      throw "TCP connect timeout"
    }

    $stream = $client.GetStream()
    $stream.ReadTimeout = $timeoutMs
    $stream.WriteTimeout = $timeoutMs
    $requestText = "GET /api/health HTTP/1.1`r`nHost: $DashboardHost`:$DashboardPort`r`nConnection: close`r`nAccept: application/json`r`n`r`n"
    $requestBytes = [System.Text.Encoding]::ASCII.GetBytes($requestText)
    $stream.Write($requestBytes, 0, $requestBytes.Length)
    $stream.Flush()

    $buffer = New-Object byte[] 4096
    $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
    if ($bytesRead -le 0) {
      throw "No response bytes"
    }

    $head = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
    $firstLine = ($head -split "`r`n")[0]
    if ($firstLine -match '^HTTP/\d+\.\d+\s+(\d{3})') {
      return [int]$Matches[1]
    }

    throw "Invalid HTTP status line: $firstLine"
  } finally {
    $client.Dispose()
  }
}

function InvokeDashboardRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [string]$Method = 'GET',
    [int]$TimeoutSec = 8,
    [string]$Body = '',
    [string]$ContentType = 'application/json; charset=utf-8'
  )

  if ($TimeoutSec -lt 1) {
    $TimeoutSec = 1
  }

  $request = [System.Net.HttpWebRequest]::Create($Url)
  $request.Method = $Method.ToUpperInvariant()
  $timeoutMs = [Math]::Max(1000, $TimeoutSec * 1000)
  $request.Timeout = $timeoutMs
  $request.ReadWriteTimeout = $timeoutMs
  $request.Proxy = $null
  $request.Accept = 'application/json'

  if ($request.Method -ne 'GET' -and $Body -ne $null) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $request.ContentType = $ContentType
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    try {
      $stream.Write($bytes, 0, $bytes.Length)
    } finally {
      $stream.Dispose()
    }
  }

  try {
    $response = [System.Net.HttpWebResponse]$request.GetResponse()
    try {
      $responseBody = ''
      $responseStream = $response.GetResponseStream()
      if ($responseStream) {
        $reader = New-Object System.IO.StreamReader($responseStream)
        try {
          $responseBody = $reader.ReadToEnd()
        } finally {
          $reader.Dispose()
        }
      }
      return @{
        StatusCode = [int]$response.StatusCode
        Body = $responseBody
      }
    } finally {
      $response.Dispose()
    }
  } catch [System.Net.WebException] {
    $webEx = $_.Exception
    if ($webEx.Response -is [System.Net.HttpWebResponse]) {
      $errorResponse = [System.Net.HttpWebResponse]$webEx.Response
      try {
        $responseBody = ''
        $responseStream = $errorResponse.GetResponseStream()
        if ($responseStream) {
          $reader = New-Object System.IO.StreamReader($responseStream)
          try {
            $responseBody = $reader.ReadToEnd()
          } finally {
            $reader.Dispose()
          }
        }
        return @{
          StatusCode = [int]$errorResponse.StatusCode
          Body = $responseBody
        }
      } finally {
        $errorResponse.Dispose()
      }
    }
    throw
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
    $targets = Get-CimInstance -ClassName Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe' OR Name = 'py.exe'" -OperationTimeoutSec 3 |
      Where-Object { $_.CommandLine -and $_.CommandLine -match 'dashboard_server\.py' }
  } catch {
    Write-Host "[warn] Dashboard process taramasi atlandi: $($_.Exception.Message)"
    $targets = @()
  }

  foreach ($target in $targets) {
    $targetPid = [int]$target.ProcessId
    try {
      taskkill /PID $targetPid /T /F 2>&1 | Out-Null
      Write-Host "[info] Dashboard process temizlendi. PID: $targetPid"
    } catch {
      Write-Host "[warn] Dashboard process PID $targetPid durdurulamadi: $($_.Exception.Message)"
    }
  }
}

function GetDashboardPortListenerPids {
  $pids = @()
  try {
    $listeners = netstat -ano | Select-String ":$DashboardPort" | Select-String 'LISTENING'
    foreach ($listener in $listeners) {
      $parts = ($listener.ToString() -split '\s+') | Where-Object { $_ }
      if ($parts.Length -ge 5) {
        $pidText = $parts[-1]
        $parsedPid = 0
        if ([int]::TryParse($pidText, [ref]$parsedPid) -and $parsedPid -gt 0) {
          $pids += $parsedPid
        }
      }
    }
  } catch {
    return @()
  }
  return @($pids | Sort-Object -Unique)
}

function StopDashboardPortListeners {
  $listenerPids = GetDashboardPortListenerPids
  foreach ($listenerPid in $listenerPids) {
    try {
      $process = Get-Process -Id $listenerPid -ErrorAction SilentlyContinue
      $processName = if ($process) { $process.ProcessName } else { 'unknown' }
      taskkill /PID $listenerPid /T /F 2>&1 | Out-Null
      Write-Host "[info] Dashboard port listener temizlendi. PID: $listenerPid ($processName)"
    } catch {
      Write-Host "[warn] Dashboard port listener PID $listenerPid durdurulamadi: $($_.Exception.Message)"
    }
  }
}

function ResolvePythonCommand {
  $candidates = @(
    @{ FilePath = 'python'; PrefixArgs = @() },
    @{ FilePath = 'python3'; PrefixArgs = @() },
    @{ FilePath = 'py'; PrefixArgs = @('-3') }
  )

  foreach ($candidate in $candidates) {
    if (-not (Get-Command $candidate.FilePath -ErrorAction SilentlyContinue)) {
      continue
    }
    try {
      $checkArgs = @()
      if ($candidate.PrefixArgs) {
        $checkArgs += $candidate.PrefixArgs
      }
      $checkArgs += @('-c', 'import sys; raise SystemExit(0 if sys.version_info[0] >= 3 else 1)')
      & $candidate.FilePath @checkArgs | Out-Null
      if ($LASTEXITCODE -eq 0) {
        return $candidate
      }
    } catch {
      continue
    }
  }

  throw 'Python bulunamadi. Python 3 kurup PATH''e ekle.'
}

function GetDashboardLogTail {
  param(
    [int]$Lines = 80
  )

  $sections = @()

  if (Test-Path $DashboardLogFile) {
    $stdoutTail = (Get-Content $DashboardLogFile -Tail $Lines -ErrorAction SilentlyContinue) -join [Environment]::NewLine
    if ($stdoutTail) {
      $sections += "stdout:`n$stdoutTail"
    }
  }

  if (Test-Path $DashboardErrorLogFile) {
    $stderrTail = (Get-Content $DashboardErrorLogFile -Tail $Lines -ErrorAction SilentlyContinue) -join [Environment]::NewLine
    if ($stderrTail) {
      $sections += "stderr:`n$stderrTail"
    }
  }

  if ($sections.Count -eq 0) {
    return ''
  }

  return ($sections -join [Environment]::NewLine + [Environment]::NewLine)
}

function GetDashboardDebugSnapshot {
  $sections = @()

  try {
    $listeners = netstat -ano | Select-String ":$DashboardPort" | Select-String 'LISTENING'
    if ($listeners) {
      $listenerLines = $listeners | Select-Object -First 5 | ForEach-Object { $_.ToString().Trim() }
      $sections += "port_listeners:`n$($listenerLines -join [Environment]::NewLine)"
    } else {
      $sections += "port_listeners: none on $DashboardPort"
    }
  } catch {
    $sections += "port_listeners_error: $($_.Exception.Message)"
  }

  try {
    $processLines = Get-CimInstance -ClassName Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe' OR Name = 'py.exe'" -OperationTimeoutSec 3 |
      Where-Object { $_.CommandLine -and $_.CommandLine -match 'dashboard_server\.py' } |
      Select-Object -First 5 |
      ForEach-Object { "PID=$($_.ProcessId) Name=$($_.Name) Cmd=$($_.CommandLine)" }
    if ($processLines) {
      $sections += "dashboard_processes:`n$($processLines -join [Environment]::NewLine)"
    } else {
      $sections += 'dashboard_processes: none'
    }
  } catch {
    $sections += "dashboard_processes_error: $($_.Exception.Message)"
  }

  if ($sections.Count -eq 0) {
    return ''
  }

  return ($sections -join [Environment]::NewLine) + [Environment]::NewLine
}

function StopDashboard {
  $trackedPid = ReadDashboardPid
  if ($trackedPid) {
    try {
      taskkill /PID $trackedPid /T /F 2>&1 | Out-Null
      Write-Host "[info] Dashboard durduruldu. PID: $trackedPid"
    } catch {
      Write-Host "[warn] Dashboard PID $trackedPid durdurulamadi: $($_.Exception.Message)"
    }
  }
  StopDashboardByCommandLine
  StopDashboardPortListeners
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
  $args += '-u'
  $args += $DashboardScript

  $pythonDescriptor = $python.FilePath
  $descriptorArgs = @()
  if ($python.PrefixArgs) {
    $descriptorArgs += $python.PrefixArgs
  }
  $descriptorArgs += '-u'
  if ($descriptorArgs.Count -gt 0) {
    $pythonDescriptor = "$pythonDescriptor $($descriptorArgs -join ' ')"
  }
  Write-Host "[info] Dashboard Python: $pythonDescriptor"

  $env:BOOK_DASHBOARD_HOST = $DashboardHost
  $env:BOOK_DASHBOARD_PORT = "$DashboardPort"

  Remove-Item $DashboardLogFile -ErrorAction SilentlyContinue
  Remove-Item $DashboardErrorLogFile -ErrorAction SilentlyContinue

  $proc = Start-Process `
    -FilePath $python.FilePath `
    -ArgumentList $args `
    -WorkingDirectory $PSScriptRoot `
    -RedirectStandardOutput $DashboardLogFile `
    -RedirectStandardError $DashboardErrorLogFile `
    -PassThru `
    -WindowStyle Hidden
  Set-Content -Path $DashboardPidFile -Value $proc.Id -Encoding ascii

  $maxWaitSeconds = 60
  $deadline = (Get-Date).AddSeconds($maxWaitSeconds)
  $nextProgressAt = (Get-Date).AddSeconds(5)

  while ((Get-Date) -lt $deadline) {
    if (TestDashboardHealthy -TimeoutSec 1) {
      Write-Host "[info] Dashboard baslatildi: $DashboardHealthUrl"
      return
    }
    try {
      $proc.Refresh()
      if ($proc.HasExited) {
        $logTail = GetDashboardLogTail -Lines 80
        if ($logTail) {
          throw "Dashboard process erken kapandi (exit: $($proc.ExitCode)).`n$logTail"
        }
        throw "Dashboard process erken kapandi (exit: $($proc.ExitCode))."
      }
    } catch {
      throw $_
    }

    if ((Get-Date) -ge $nextProgressAt) {
      Write-Host "[info] Dashboard bekleniyor... ($([Math]::Max(0, [int](($deadline - (Get-Date)).TotalSeconds)))s)"
      $nextProgressAt = (Get-Date).AddSeconds(5)
    }

    Start-Sleep -Milliseconds 250
  }

  $debugSnapshot = GetDashboardDebugSnapshot
  $logTail = GetDashboardLogTail -Lines 80
  if ($debugSnapshot -or $logTail) {
    throw "Dashboard baslatilamadi: $DashboardHealthUrl`n$debugSnapshot$logTail"
  }
  throw "Dashboard baslatilamadi: $DashboardHealthUrl"
}

function InvokeBackendStartupSmoke {
  $baseUrl = "http://$DashboardHost`:$DashboardPort"
  $healthUrl = "$baseUrl/api/health"
  $workflowUrl = "$baseUrl/api/workflows"

  $healthResponse = InvokeDashboardRequest -Url $healthUrl -TimeoutSec 8
  $healthStatus = [int]$healthResponse.StatusCode
  if ($healthStatus -lt 200 -or $healthStatus -ge 300) {
    throw "Backend health smoke failed ($healthStatus): $healthUrl -> $($healthResponse.Body)"
  }

  $workflowResponse = InvokeDashboardRequest -Url $workflowUrl -Method 'POST' -TimeoutSec 8 -Body '{}'
  $workflowStatus = [int]$workflowResponse.StatusCode
  $workflowBody = $workflowResponse.Body

  if ($workflowStatus -eq 503) {
    throw "Backend workflow smoke failed (503): $workflowUrl -> $workflowBody"
  }
  if ($workflowStatus -ne 400) {
    throw "Backend workflow smoke expected 400 but got ${workflowStatus}: $workflowUrl -> $workflowBody"
  }

  Write-Host '[info] Backend smoke passed: health=200, workflow_validation=400'
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
    Write-Host "[info] Port $Port uzerinde calisan surec bulunamadi."
  }
}

function InvokePnpmInWeb {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args
  )

  Push-Location $WebDir
  try {
    & pnpm @Args
    if ($LASTEXITCODE -ne 0) {
      throw "pnpm $($Args -join ' ') komutu basarisiz (exit: $LASTEXITCODE)."
    }
  } finally {
    Pop-Location
  }
}

function TestNextPackages {
  Push-Location $WebDir
  try {
    & node -e "require.resolve('next/package.json'); require.resolve('next/dist/bin/next');"
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  } finally {
    Pop-Location
  }
}

function TestNextShim {
  $nextShim = Join-Path $WebDir 'node_modules\.bin\next.cmd'
  return (Test-Path $nextShim)
}

function EnsureWebDependencies {
  $nodeModules = Join-Path $WebDir 'node_modules'
  $needsInstall = (-not (Test-Path $nodeModules)) -or (-not (TestNextShim))

  if ($needsInstall) {
    Write-Host '[info] Web bagimliliklari kontrol ediliyor...'
    try {
      InvokePnpmInWeb -Args @('install', '--frozen-lockfile', '--config.confirmModulesPurge=false')
    } catch {
      Write-Host '[warn] Lockfile guncel degil, --no-frozen-lockfile ile tekrar deneniyor...'
      InvokePnpmInWeb -Args @('install', '--no-frozen-lockfile', '--config.confirmModulesPurge=false')
    }
  }

  if ((-not (TestNextShim)) -or (-not (TestNextPackages))) {
    Write-Host '[warn] Next bagimliliklari dogrulanamadi, onarim deneniyor...'
    InvokePnpmInWeb -Args @('install', '--force', '--config.confirmModulesPurge=false')
  }

  if ((-not (TestNextShim)) -or (-not (TestNextPackages))) {
    throw "Next bagimliliklari hazirlanamadi. 'start-web.bat repair' komutunu calistirin."
  }
}

function TestPrismaClientGenerated {
  Push-Location $WebDir
  try {
    # pnpm can place generated files under .pnpm store paths, so verify via Node resolution.
    & node -e "require('@prisma/client');"
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  } finally {
    Pop-Location
  }
}

function EnsurePrismaClient {
  if (TestPrismaClientGenerated) {
    return
  }

  Write-Host '[info] Prisma client uretiliyor...'
  InvokePnpmInWeb -Args @('exec', 'prisma', 'generate')

  if (-not (TestPrismaClientGenerated)) {
    throw "Prisma client uretilemedi. 'start-web.bat repair' komutunu calistirin."
  }
}

function RepairDependencies {
  WriteHeader
  Write-Host '[mode] repair (PowerShell native)'
  Write-Host '[info] Web bagimliliklari sifirlaniyor...'

  $nodeModules = Join-Path $WebDir 'node_modules'
  $nextBuild = Join-Path $WebDir '.next'

  if (Test-Path $nodeModules) {
    Remove-Item -Recurse -Force $nodeModules
  }
  if (Test-Path $nextBuild) {
    Remove-Item -Recurse -Force $nextBuild
  }

  InvokePnpmInWeb -Args @('install', '--force', '--config.confirmModulesPurge=false')
  EnsurePrismaClient

  if ((-not (TestNextShim)) -or (-not (TestNextPackages))) {
    throw 'Bagimlilik onarimi basarisiz oldu.'
  }

  Write-Host '[info] Bagimlilik onarimi tamamlandi.'
}

function StartDev {
  param(
    [switch]$FastMode
  )

  $effectiveSkipDashboard = $SkipDashboard -or $FastMode
  $effectiveSkipWebChecks = $SkipWebChecks -or $FastMode

  WriteHeader
  if ($FastMode) {
    Write-Host '[mode] dev-fast (PowerShell native, backend/check skip)'
  } else {
    Write-Host '[mode] dev (PowerShell native, stabil profile)'
  }
  Write-Host '[info] Durdurmak icin Ctrl+C'
  Write-Host "[info] Tarayici adresi: $Url"
  Write-Host ''
  if ($effectiveSkipDashboard) {
    if ($FastMode -and -not $SkipDashboard) {
      Write-Host '[warn] Dashboard adimi atlandi (dev-fast mode).'
    } else {
      Write-Host '[warn] Dashboard adimi atlandi (BOOK_SKIP_DASHBOARD=1).'
    }
  } else {
    if ($DashboardForceRestart) {
      EnsureDashboard -ForceRestart
    } else {
      EnsureDashboard
    }
    InvokeBackendStartupSmoke
  }
  if ($effectiveSkipWebChecks) {
    if ($FastMode -and -not $SkipWebChecks) {
      Write-Host '[info] Hizli baslatma aktif: bagimlilik/prisma kontrolleri atlandi (dev-fast mode).'
    } else {
      Write-Host '[info] Hizli baslatma aktif: bagimlilik/prisma kontrolleri atlandi (BOOK_WEB_SKIP_CHECKS=1).'
    }
  } else {
    EnsureWebDependencies
    EnsurePrismaClient
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
  if ($SkipDashboard) {
    Write-Host '[warn] Dashboard adimi atlandi (BOOK_SKIP_DASHBOARD=1).'
  } else {
    if ($DashboardForceRestart) {
      EnsureDashboard -ForceRestart
    } else {
      EnsureDashboard
    }
    InvokeBackendStartupSmoke
  }
  EnsureWebDependencies
  EnsurePrismaClient
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

function ShowLogsLive {
  $logPath = Join-Path $WebDir '.next\dev\logs\next-development.log'
  if (Test-Path $logPath) {
    Get-Content $logPath -Tail 80 -Wait
  } else {
    Write-Host 'Log dosyasi bulunamadi.'
  }
}

switch ($Mode) {
  'dev' { StartDev }
  'dev-fast' { StartDev -FastMode }
  'prod' { StartProd }
  'reset' { StopWeb; Start-Sleep -Seconds 1; StartDev }
  'repair' { StopWeb; RepairDependencies; Start-Sleep -Seconds 1; StartDev }
  'stop' { StopWeb }
  'logs' { ShowLogs }
  'logs-live' { ShowLogsLive }
}
