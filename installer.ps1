# PowerShell script to automate installation and make Mitior OS a native desktop app
# To run this, right-click and select "Run with PowerShell"

$ErrorActionPreference = "Stop"
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "        MITIOR OS - SYSTEM SUITE INSTALLER & DESKTOP SHORTCUT         " -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Detect/Install Node.js
try {
    $nodeCheck = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCheck) {
        Write-Host "[*] Node.js not found. Installing Node.js silently using Windows Winget..." -ForegroundColor Yellow
        Start-Process winget -ArgumentList "install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements" -NoNewWindow -Wait
        Write-Host "[OK] Node.js successfully installed! Please restart the script if Node is not detected immediately." -ForegroundColor Green
    } else {
        Write-Host "[OK] Node.js is already installed ($($nodeCheck.Version))." -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Automating Node.js install failed. Please download from: https://nodejs.org/" -ForegroundColor Red
}

# Step 2: Install App Dependencies & Build
Write-Host "[*] Installing dependencies with NPM..." -ForegroundColor Cyan
Start-Process npm -ArgumentList "install" -NoNewWindow -Wait

Write-Host "[*] Building offline production assets..." -ForegroundColor Cyan
Start-Process npm -ArgumentList "run build" -NoNewWindow -Wait

# Step 3: Create Desktop Windows Shortcut
try {
    Write-Host "[*] Creating Desktop Shortcut for easy double-click launch..." -ForegroundColor Cyan
    $WshShell = New-Object -ComObject WScript.Shell
    $DesktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath("Desktop"), "Mitior OS Premium.lnk")
    $Shortcut = $WshShell.CreateShortcut($DesktopPath)
    
    # Path to current working folder and launch file
    $CurrentDir = Get-Location
    $Shortcut.TargetPath = "$CurrentDir\launch.bat"
    $Shortcut.WorkingDirectory = $CurrentDir
    $Shortcut.Description = "Launch Mitior OS Desktop Application"
    $Shortcut.IconLocation = "shell32.dll, 224" # Elegant network/operating globe icon
    $Shortcut.Save()
    
    Write-Host "[SUCCESS] Desktop Shortcut 'Mitior OS Premium' created successfully!" -ForegroundColor Green
} catch {
    Write-Host "[!] Failed to create Desktop Shortcut automatically. You can always run the app by double-clicking 'launch.bat'." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host " INSTALLATION COMPLETE! Double-click your new Desktop Shortcut to run! " -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host ""
Read-Host -Prompt "Press Enter to exit and launch secure workspace now..."

Start-Process "$CurrentDir\launch.bat"
