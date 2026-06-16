from datetime import datetime # Para captura do instante real do servidor
import pytz # Biblioteca para gestão inteligente de fusos horários (Timezones)
from src.infrastructure.config import settings

# [TIRE PRINT DAQUI - SLIDE: CLOUD & INFRAESTRUTURA]
# COMO EXPLICAR: "Cuidamos da 'Temporização' do sistema. Como servidores na nuvem (AWS) rodam 
# em horários universais (UTC), criamos este TimeService para garantir que todos os logs 
# e datas de aprovação estejam sempre no horário de Brasília (UTC-3)."
class TimeService:
    """Serviço centralizado para gestão de fuso horário America/Sao_Paulo (GMT-3)"""
    
    @staticmethod
    def get_now() -> datetime:
        """Retorna o horário atual com timezone America/Sao_Paulo (Naive para Neon)"""
        tz = pytz.timezone(settings.TIMEZONE)
        return datetime.now(tz).replace(tzinfo=None)

    @staticmethod
    def get_now_br() -> datetime:
        """Alias para get_now() enfatizando o fuso horário Brasil/SP para storytelling de testes"""
        return TimeService.get_now()

    @staticmethod
    def to_local(dt: datetime) -> datetime:
        """Converte um datetime (geralmente UTC do banco) para o fuso local configurado"""
        if dt.tzinfo is None:
            # Assume que se não tem tz, é UTC vindo do banco
            dt = pytz.utc.localize(dt)
        
        tz = pytz.timezone(settings.TIMEZONE)
        return dt.astimezone(tz)
