import pytest
from datetime import datetime
import pytz
from src.infrastructure.utils.time_service import TimeService

def test_time_service_returns_sao_paulo_naive_datetime():
    """get_now() retorna datetime naive (sem tz) para compatibilidade com Neon"""
    now = TimeService.get_now()
    assert now.tzinfo is None

def test_time_service_conversion_from_utc():
    utc_now = datetime.now(pytz.utc)
    local_now = TimeService.to_local(utc_now)
    assert str(local_now.tzinfo) == "America/Sao_Paulo"
    assert utc_now.timestamp() == local_now.timestamp()

def test_time_service_conversion_from_naive():
    naive_dt = datetime(2026, 4, 10, 12, 0, 0)
    local_dt = TimeService.to_local(naive_dt)
    assert local_dt.tzinfo is not None
    assert str(local_dt.tzinfo) == "America/Sao_Paulo"
    assert local_dt.hour == 9
