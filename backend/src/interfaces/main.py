from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from contextlib import asynccontextmanager
from src.interfaces.routes import router
from src.interfaces.auth import router as auth_router
from src.interfaces.admin import router as admin_router
from src.domain.exceptions import DomainException, PostNotFoundError
from src.infrastructure.config import settings
from src.infrastructure.database import AsyncSessionLocal
from sqlalchemy import text
import logging
import os

# Configuração de Logs para auditoria técnica B2B
log_level = os.getenv("LOG_LEVEL", "WARNING").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.WARNING))
logger = logging.getLogger(__name__)

# Garante que a pasta de uploads local existe no disco
os.makedirs("uploads", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Elevva B2B API iniciada com sucesso")
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("ALTER TYPE poststatus ADD VALUE IF NOT EXISTS 'POSTADO'"))
            await session.commit()
            logger.info("Enum poststatus atualizado com POSTADO")
    except Exception:
        pass
    yield
    logger.info("Elevva B2B API encerrando recursos")

app = FastAPI(
    title="Elevva Marketing App - API B2B",
    description="Motor de aprovação Kanban e visual pins com Bypass AWS S3",
    version="1.0.0",
    lifespan=lifespan
)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
if "https://web-c-kappa.vercel.app" not in origins:
    origins.append("https://web-c-kappa.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(admin_router)

class _CachedStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

app.mount("/media", _CachedStaticFiles(directory="uploads"), name="media")

@app.get("/health")
async def health_check():
    """Rota de telemetria crua para o Load Balancer e Docker Healthcheck"""
    db_ok = False
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "message": "Elevva API is operational." if db_ok else "API running but database is unreachable."
    }
