param(
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest

function Run-Command {
    param($cmd)
    Write-Host "Running: $cmd"
    $res = & cmd /c $cmd
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $cmd"
    }
    return $res
}

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    Set-Location (Join-Path $scriptDir "..")

    # Check npm
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npm = 'npm'
    } else {
        throw "'npm' not found. Install Node.js/npm or run this script in an environment where npm is available."
    }

    if (-not $SkipBuild) {
        Write-Host "Installing dependencies..."
        Run-Command "$npm ci --legacy-peer-deps"

        Write-Host "Building frontend (production)..."
        Run-Command "$npm run build -- --configuration=production"
    } else {
        Write-Host "Skipping build as requested"
    }

    Write-Host "Building Docker image 'petconnect-frontend:latest'..."
    Run-Command "docker build -t petconnect-frontend:latest ."

    Write-Host "Starting frontend with docker-compose..."
    Run-Command "docker-compose up -d"

    Write-Host "Done. Use 'docker-compose logs -f frontend' to follow logs."
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
