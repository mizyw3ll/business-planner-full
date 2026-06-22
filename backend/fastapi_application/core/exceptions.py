from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Any
from datetime import datetime
import logging
from enum import Enum
import uuid


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR"
    CONFLICT_ERROR = "CONFLICT_ERROR"
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    BAD_GATEWAY = "BAD_GATEWAY"


class APIException(HTTPException):
    """Base API exception with error code and details"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        headers: dict[str, Any] | None = None,
        **kwargs: Any,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.timestamp = datetime.now().isoformat()
        self.path = kwargs.get("path", "/")
        self.method = kwargs.get("method", "UNKNOWN")
        self.request_id = kwargs.get("request_id", str(uuid.uuid4()))


class ValidationException(APIException):
    """Exception for validation errors"""
    
    def __init__(self, detail: str, field_errors: dict[str, str] | None = None):
        super().__init__(
            status_code=422,
            detail=detail,
            error_code=ErrorCode.VALIDATION_ERROR,
            field_errors=field_errors or {},
        )


class AuthenticationException(APIException):
    """Exception for authentication errors"""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=401,
            detail=detail,
            error_code=ErrorCode.AUTHENTICATION_ERROR,
        )


class AuthorizationException(APIException):
    """Exception for authorization errors"""
    
    def __init__(self, detail: str = "Not authorized to access this resource"):
        super().__init__(
            status_code=403,
            detail=detail,
            error_code=ErrorCode.AUTHORIZATION_ERROR,
        )


class NotFoundException(APIException):
    """Exception for not found errors"""
    
    def __init__(self, resource: str, id: Any):
        super().__init__(
            status_code=404,
            detail=f"{resource} with id {id} not found",
            error_code=ErrorCode.NOT_FOUND_ERROR,
        )


class ConflictException(APIException):
    """Exception for conflict errors"""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=409,
            detail=detail,
            error_code=ErrorCode.CONFLICT_ERROR,
        )
