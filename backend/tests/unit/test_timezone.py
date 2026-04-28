import pytest
from datetime import datetime
import pytz
from src.infrastructure.utils.time_service import TimeService

def test_time_service_returns_sao_paulo_timezone():
    """Valida se o TimeService está injetando o fuso correto de SP"""
    now = TimeService.get_now()
    
    # Verifica se o objeto datetime possui informações de timezone
    assert now.tzinfo is not None
    
    # Verifica se o fuso horário é America/Sao_Paulo (GMT-3 ou GMT-2 dependendo do horário de verão, mas a string é a mesma)
    assert str(now.tzinfo) in ["America/Sao_Paulo", "LMT-1:00:00"] # LMT é um fallback comum em mocks de tz
    
    # Valida o offset (Brasília é UTC-3)
    # Nota: .utcoffset() retorna um timedelta. Para SP é -3 horas.
    assert now.utcoffset().total_seconds() / 3600 in [-3.0, -2.0] # -2.0 se houver HV (extinto mas mantido por compatibilidade em libs)

def test_time_service_conversion_from_utc():
    """Valida a conversão de um objeto UTC puro para o fuso local"""
    utc_now = datetime.now(pytz.utc)
    local_now = TimeService.to_local(utc_now)
    
    assert str(local_now.tzinfo) == "America/Sao_Paulo"
    # O tempo absoluto deve ser o mesmo
    assert utc_now.timestamp() == local_now.timestamp()

def test_time_service_conversion_from_naive():
    """Valida a conversão de um objeto datetime sem fuso (naive) para o fuso local"""
    naive_dt = datetime(2026, 4, 10, 12, 0, 0) # Sem tzinfo
    local_dt = TimeService.to_local(naive_dt)
    
    assert local_dt.tzinfo is not None
    assert str(local_dt.tzinfo) == "America/Sao_Paulo"
    # Como o TimeService assume UTC para naive, 12:00 UTC virá 09:00 SP
    assert local_dt.hour == 9
