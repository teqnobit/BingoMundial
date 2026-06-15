from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


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
