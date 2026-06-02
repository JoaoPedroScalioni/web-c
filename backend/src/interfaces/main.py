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

# O coração do ciclo de vida da Aplicação B2B
app = FastAPI(
    title="Elevva Marketing App - API B2B",
    description="Motor de aprovação Kanban e visual pins com Bypass AWS S3",
    version="1.0.0"
)

# Defina as origens permitidas (Blindagem B2B)
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

# Governança de CORS para permitir restrito acesso do Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Permitir tokens/cookies de autenticação
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
