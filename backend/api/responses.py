"""Helpers for shaping API error responses consistently."""


def first_error_message(errors) -> str:
    """
    Flatten DRF serializer errors down to a single human-readable message.

    Endpoints in this API report failures as ``{'detail': '...'}``, so field
    errors coming out of a serializer need collapsing to one string rather than
    DRF's default per-field mapping.
    """
    if isinstance(errors, dict):
        for value in errors.values():
            message = first_error_message(value)
            if message:
                return message
        return 'Invalid request'
    if isinstance(errors, (list, tuple)):
        for item in errors:
            message = first_error_message(item)
            if message:
                return message
        return 'Invalid request'
    return str(errors)
