import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
import json
from typing import Any
import os


class StructuredLogger:
    """Structured logger for API requests and responses"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler with rotation
        log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, "api.log"),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
        )
        file_handler.setLevel(logging.INFO)
        
        class JSONFormatter(logging.Formatter):
            def format(self, record: logging.LogRecord) -> str:
                log_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "request_id": getattr(record, "request_id", None),
                    "user_id": getattr(record, "user_id", None),
                    "ip_address": getattr(record, "ip_address", None),
                    "path": getattr(record, "path", None),
                    "method": getattr(record, "method", None),
                    "status_code": getattr(record, "status_code", None),
                    "duration_ms": getattr(record, "duration_ms", None),
                }
                return json.dumps(log_entry)
        
        file_handler.setFormatter(JSONFormatter())
        self.logger.addHandler(file_handler)
    
    def log_request(
        self,
        request_id: str,
        method: str,
        path: str,
        ip_address: str,
        user_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Log incoming request"""
        self.logger.info(
            "Request received",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "ip_address": ip_address,
                "user_id": user_id,
                **kwargs,
            },
        )
    
    def log_response(
        self,
        request_id: str,
        status_code: int,
        duration_ms: float,
        **kwargs: Any,
    ) -> None:
        """Log outgoing response"""
        self.logger.info(
            "Response sent",
            extra={
                "request_id": request_id,
                "status_code": status_code,
                "duration_ms": duration_ms,
                **kwargs,
            },
        )
    
    def log_error(
        self,
        request_id: str,
        error: Exception,
        **kwargs: Any,
    ) -> None:
        """Log error"""
        self.logger.error(
            "Error occurred",
            exc_info=True,
            extra={
                "request_id": request_id,
                **kwargs,
            },
        )
