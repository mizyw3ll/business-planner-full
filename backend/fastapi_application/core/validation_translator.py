"""Translation of Pydantic/FastAPI validation errors to Russian."""
from fastapi.exceptions import RequestValidationError


# Error code → Russian message mapping
_RU_MAP: dict[str, callable] = {
    "string_too_long": lambda ctx: f"Не более {ctx['max_length']} символов",
    "string_too_short": lambda ctx: f"Не менее {ctx['min_length']} символов",
    "string_too_large": lambda ctx: f"Не более {ctx['max_length']} символов",
    "string_too_small": lambda ctx: f"Не менее {ctx['min_length']} символов",
    "value_error": lambda ctx: str(ctx.get("error", ctx.get("msg", "Ошибка валидации"))),
    "value_error.missing": lambda ctx: "Обязательное поле",
    "greater_than_equal": lambda ctx: f"Значение должно быть не менее {ctx['ge']}",
    "greater_than": lambda ctx: f"Значение должно быть больше {ctx['gt']}",
    "less_than_equal": lambda ctx: f"Значение должно быть не более {ctx['le']}",
    "less_than": lambda ctx: f"Значение должно быть меньше {ctx['lt']}",
    "int_parsing": lambda ctx: "Целое число",
    "int_parsing_error": lambda ctx: "Целое число",
    "int_type": lambda ctx: "Целое число",
    "float_parsing": lambda ctx: "Число",
    "float_type": lambda ctx: "Число",
    "decimal_parsing": lambda ctx: "Число",
    "bool_type": lambda ctx: "Логическое значение",
    "bool_parsing": lambda ctx: "Логическое значение",
    "list_type": lambda ctx: "Список",
    "dict_type": lambda ctx: "Словарь",
    "none_required": lambda ctx: "Значение должно быть null",
    "none_not_allowed": lambda ctx: "Значение не должно быть null",
    "string_type": lambda ctx: "Строка",
    "enum": lambda ctx: f"Некорректное значение. {ctx.get('expected', '')}",
    "enum_parsing": lambda ctx: f"Некорректное значение. {ctx.get('expected', '')}",
    "missing": lambda ctx: "Обязательное поле",
    "extra_forbidden": lambda ctx: "Лишнее поле",
}


def _translate_code(code: str, msg: str, ctx: dict) -> str:
    """Translate a single Pydantic error code to Russian."""
    handler = _RU_MAP.get(code)
    if handler:
        return handler(ctx)
    return msg


def translate_request_validation(exc: RequestValidationError) -> dict:
    """Translate RequestValidationError body to Russian messages."""
    new_errors = []
    for err in exc.errors():
        loc = err.get("loc", [])
        ctx = err.get("ctx", {})
        msg = _translate_code(err.get("type", ""), err.get("msg", ""), ctx)
        new_errors.append({
            "loc": loc,
            "msg": msg,
            "type": err.get("type", ""),
        })
    return {"detail": new_errors}
