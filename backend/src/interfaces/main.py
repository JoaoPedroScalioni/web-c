from fastapi import FastAPI # O framework principal da nossa API
from fastapi.middleware.cors import CORSMiddleware # Para permitir que o Frontend acesse o Backend com segurança
from src.interfaces.routes import router
from src.interfaces.auth import router as auth_router
from src.domain.exceptions import DomainException, PostNotFoundError
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import os

# Configuração de Logs para auditoria técnica B2B
log_level = os.getenv("LOG_LEVEL", "WARNING").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.WARNING))
logger = logging.getLogger(__name__)

# Garante que a pasta de uploads local existe no disco
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="Elevva Marketing App - API B2B",
    description="Motor de aprovação Kanban e visual pins com Bypass AWS S3",
    version="1.0.0"
)

@app.on_event("startup")
async def startup():
    logger.info("Elevva B2B API iniciada com sucesso")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Elevva B2B API encerrando recursos")

from src.infrastructure.config import settings

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Passar a lista exata aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    """
    Captura global de erros de negócio da Elevva.
    Mapeia exceções de domínio para status HTTP apropriados.
    """
    status_code = 400
    if isinstance(exc, PostNotFoundError):
        status_code = 404
    
    logger.warning(f"Domain Error capturado: {exc.message}")
    
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message, "type": exc.__class__.__name__}
    )

# Injeção dos Roteadores Clean Architecture Elevva
app.include_router(auth_router)
app.include_router(router)

# Servindo arquivos estáticos locais (Custo Zero / Bye S3)
app.mount("/media", StaticFiles(directory="uploads"), name="media")

@app.get("/health")
async def health_check():
    """Rota de telemetria crua para o Load Balancer e Docker Healthcheck"""
    return {"status": "ok", "message": "Elevva API is operational."}
