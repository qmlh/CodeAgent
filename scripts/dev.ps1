# PowerShell script to start development with proper encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# Set environment variables
$env:PYTHONIOENCODING = "utf-8"
$env:FORCE_COLOR = "1"
$env:NODE_OPTIONS = "--max_old_space_size=4096"

Write-Host "Starting Multi-Agent IDE with UTF-8 encoding..." -ForegroundColor Green

# Start the development server
node scripts/dev.js