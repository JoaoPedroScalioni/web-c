param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,

    [Parameter(Mandatory=$true)]
    [string]$DockerHubToken,

    [string]$Tag = "latest"
)

Write-Host "=== Elevva - Docker Hub Push Script ===" -ForegroundColor Cyan

# Login no Docker Hub
Write-Host "`n[1/5] Logging in to Docker Hub..." -ForegroundColor Yellow
$env:DOCKER_HUB_USERNAME = $DockerHubUsername
$env:DOCKER_HUB_TOKEN = $DockerHubToken
Write-Host $DockerHubToken | docker login --username $DockerHubUsername --password-stdin

# Build da imagem da API (produção)
Write-Host "`n[2/5] Building API image (Dockerfile.prod)..." -ForegroundColor Yellow
docker build -f Dockerfile.prod -t "${DockerHubUsername}/elevva-api:${Tag}" -t "${DockerHubUsername}/elevva-api:latest" .

# Build da imagem do Frontend
Write-Host "`n[3/5] Building Web image (frontend/Dockerfile.prod)..." -ForegroundColor Yellow
docker build -f frontend/Dockerfile.prod -t "${DockerHubUsername}/elevva-web:${Tag}" -t "${DockerHubUsername}/elevva-web:latest" ./frontend

# Push da API
Write-Host "`n[4/5] Pushing API image to Docker Hub..." -ForegroundColor Yellow
docker push "${DockerHubUsername}/elevva-api:${Tag}"
docker push "${DockerHubUsername}/elevva-api:latest"

# Push do Frontend
Write-Host "`n[5/5] Pushing Web image to Docker Hub..." -ForegroundColor Yellow
docker push "${DockerHubUsername}/elevva-web:${Tag}"
docker push "${DockerHubUsername}/elevva-web:latest"

Write-Host "`n=== Done! Images pushed to Docker Hub ===" -ForegroundColor Green
Write-Host "  - ${DockerHubUsername}/elevva-api:${Tag}"
Write-Host "  - ${DockerHubUsername}/elevva-web:${Tag}"
