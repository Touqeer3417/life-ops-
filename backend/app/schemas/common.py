from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class ReadinessResponse(BaseModel):
    status: str
    database: str


class MessageResponse(BaseModel):
    message: str
