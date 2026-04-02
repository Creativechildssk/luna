# Run both backend and web in Docker
Set-Location -Path (Split-Path $MyInvocation.MyCommand.Path)
docker compose up --build
