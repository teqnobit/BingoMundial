from pydantic import BaseModel, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    contrasena: str = Field(min_length=4, max_length=128)


class UsuarioResponse(BaseModel):
    id: int
    nombre: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse


class OracionCreate(BaseModel):
    texto: str = Field(min_length=1, max_length=500)


class OracionUpdate(BaseModel):
    texto: str = Field(min_length=1, max_length=500)


class OracionResponse(BaseModel):
    id: int
    texto: str
    orden: int

    model_config = {"from_attributes": True}


class OrdenUpdate(BaseModel):
    ids: list[int]


class DropPayload(BaseModel):
    oracion_id: int
    fila: int = Field(ge=0, le=4)
    columna: int = Field(ge=0, le=4)


class EstadoCeldaUpdate(BaseModel):
    fila: int = Field(ge=0, le=4)
    columna: int = Field(ge=0, le=4)
    estado: str = Field(pattern="^(normal|fallido|completado)$")


class CeldaOracionResponse(BaseModel):
    id: int
    fila: int
    columna: int
    color: str
    estado: str
    oracion: OracionResponse

    model_config = {"from_attributes": True}


class GridUsuarioResponse(BaseModel):
    usuario: UsuarioResponse
    celdas: list[CeldaOracionResponse]

    model_config = {"from_attributes": True}
