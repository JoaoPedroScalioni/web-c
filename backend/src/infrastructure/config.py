from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Mapeamento Rigoroso das Variáveis de Ambiente B2B"""
    DATABASE_URL: str
    JWT_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200 # 30 dias em B2B
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = ""
    AWS_REGION: str = "sa-east-1"
    TIMEZONE: str = "America/Sao_Paulo"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://web-c-kappa.vercel.app,https://app.elevva.com"
    
    # Tolerância a variáveis extras e vínculo absoluto via .env do Docker CWD
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
