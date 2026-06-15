from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Color verde del gradiente de celdas con oraciones
CELDA_COLOR_VERDE = "#059669"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    contrasena: Mapped[str] = mapped_column(String(255), nullable=False)

    oraciones: Mapped[list["Oracion"]] = relationship(
        back_populates="usuario",
        cascade="all, delete-orphan",
        order_by="Oracion.orden",
    )


class Oracion(Base):
    __tablename__ = "oraciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=0)

    usuario: Mapped["Usuario"] = relationship(back_populates="oraciones")
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

    usuario: Mapped["Usuario"] = relationship()
    oracion: Mapped["Oracion"] = relationship(back_populates="celdas")
