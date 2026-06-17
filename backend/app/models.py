from sqlalchemy import ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Color verde del gradiente de celdas con oraciones
CELDA_COLOR_VERDE = "#059669"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    contrasena: Mapped[str] = mapped_column(String(255), nullable=False)
    tiene_permiso: Mapped[bool] = mapped_column(Boolean, default=False)

class Oracion(Base):
    __tablename__ = "oraciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=0)

    celdas: Mapped[list["CeldaOracion"]] = relationship(
        back_populates="oracion",
        cascade="all, delete-orphan",
    )


class CeldaOracion(Base):
    __tablename__ = "celdas_oraciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    oracion_id: Mapped[int] = mapped_column(ForeignKey("oraciones.id"), nullable=False)
    fila: Mapped[int] = mapped_column(Integer, nullable=False)
    columna: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str] = mapped_column(String(7), default=CELDA_COLOR_VERDE, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)

    usuario: Mapped["Usuario"] = relationship()
    oracion: Mapped["Oracion"] = relationship(back_populates="celdas")
