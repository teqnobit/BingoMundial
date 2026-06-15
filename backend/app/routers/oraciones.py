from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import CeldaOracion, CELDA_COLOR_VERDE, Oracion, Usuario
from app.schemas import (
    CeldaOracionResponse,
    DropPayload,
    OracionCreate,
    OracionResponse,
    OracionUpdate,
    OrdenUpdate,
)

router = APIRouter(prefix="/oraciones", tags=["oraciones"])


@router.get("", response_model=list[OracionResponse])
def listar_oraciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return current_user.oraciones


@router.post("", response_model=OracionResponse, status_code=status.HTTP_201_CREATED)
def crear_oracion(
    payload: OracionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    max_orden = (
        db.query(Oracion)
        .filter(Oracion.usuario_id == current_user.id)
        .count()
    )
    oracion = Oracion(
        usuario_id=current_user.id,
        texto=payload.texto,
        orden=max_orden,
    )
    db.add(oracion)
    db.commit()
    db.refresh(oracion)
    return oracion


@router.put("/{oracion_id}", response_model=OracionResponse)
def actualizar_oracion(
    oracion_id: int,
    payload: OracionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    oracion = _get_oracion_or_404(db, oracion_id, current_user.id)
    oracion.texto = payload.texto
    db.commit()
    db.refresh(oracion)
    return oracion


@router.delete("/{oracion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_oracion(
    oracion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    oracion = _get_oracion_or_404(db, oracion_id, current_user.id)
    db.delete(oracion)
    db.commit()


@router.put("/reordenar", response_model=list[OracionResponse])
def reordenar_oraciones(
    payload: OrdenUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    oraciones = (
        db.query(Oracion)
        .filter(Oracion.usuario_id == current_user.id)
        .all()
    )
    ids_usuario = {o.id for o in oraciones}
    if set(payload.ids) != ids_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La lista de ids no coincide con las oraciones del usuario",
        )

    oraciones_map = {o.id: o for o in oraciones}
    for index, oracion_id in enumerate(payload.ids):
        oraciones_map[oracion_id].orden = index

    db.commit()
    return sorted(oraciones, key=lambda o: o.orden)


@router.get("/celdas", response_model=list[CeldaOracionResponse])
def obtener_celdas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtiene todas las oraciones registradas en celdas del usuario."""
    celdas = (
        db.query(CeldaOracion)
        .filter(CeldaOracion.usuario_id == current_user.id)
        .all()
    )
    return celdas


@router.post("/drop", response_model=CeldaOracionResponse)
def registrar_drop(
    payload: DropPayload,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra una oración soltada en una celda de la cuadrícula."""
    oracion = _get_oracion_or_404(db, payload.oracion_id, current_user.id)
    
    # Eliminar cualquier oración existente en esta celda
    db.query(CeldaOracion).filter(
        CeldaOracion.usuario_id == current_user.id,
        CeldaOracion.fila == payload.fila,
        CeldaOracion.columna == payload.columna,
    ).delete()
    
    # Crear nueva entrada de oración en celda con color verde
    celda_oracion = CeldaOracion(
        usuario_id=current_user.id,
        oracion_id=payload.oracion_id,
        fila=payload.fila,
        columna=payload.columna,
        color=CELDA_COLOR_VERDE,
    )
    db.add(celda_oracion)
    db.commit()
    db.refresh(celda_oracion)
    return celda_oracion


def _get_oracion_or_404(db: Session, oracion_id: int, usuario_id: int) -> Oracion:
    oracion = (
        db.query(Oracion)
        .filter(Oracion.id == oracion_id, Oracion.usuario_id == usuario_id)
        .first()
    )
    if not oracion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oración no encontrada",
        )
    return oracion
