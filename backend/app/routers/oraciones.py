from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import CeldaOracion, CELDA_COLOR_VERDE, Oracion, Usuario
from app.schemas import (
    CeldaOracionResponse,
    DropPayload,
    GridUsuarioResponse,
    OracionCreate,
    OracionResponse,
    OracionUpdate,
    OrdenUpdate,
)

router = APIRouter(prefix="/oraciones", tags=["oraciones"])


@router.get("", response_model=list[OracionResponse])
def listar_oraciones(
    db: Session = Depends(get_db),
):
    """Obtiene todas las oraciones (compartidas por todos los usuarios)."""
    oraciones = db.query(Oracion).order_by(Oracion.orden).all()
    return oraciones


@router.post("", response_model=OracionResponse, status_code=status.HTTP_201_CREATED)
def crear_oracion(
    payload: OracionCreate,
    db: Session = Depends(get_db),
):
    """Crea una nueva oración compartida por todos los usuarios."""
    max_orden = db.query(Oracion).count()
    oracion = Oracion(
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
):
    """Actualiza una oración compartida."""
    oracion = _get_oracion_or_404(db, oracion_id)
    oracion.texto = payload.texto
    db.commit()
    db.refresh(oracion)
    return oracion


@router.delete("/{oracion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_oracion(
    oracion_id: int,
    db: Session = Depends(get_db),
):
    """Elimina una oración compartida."""
    oracion = _get_oracion_or_404(db, oracion_id)
    db.delete(oracion)
    db.commit()


@router.put("/reordenar", response_model=list[OracionResponse])
def reordenar_oraciones(
    payload: OrdenUpdate,
    db: Session = Depends(get_db),
):
    """Reordena todas las oraciones compartidas."""
    oraciones = db.query(Oracion).all()
    ids_globales = {o.id for o in oraciones}
    if set(payload.ids) != ids_globales:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La lista de ids no coincide con todas las oraciones",
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


@router.get("/grids", response_model=list[GridUsuarioResponse])
def obtener_todos_grids(
    db: Session = Depends(get_db),
):
    """Obtiene todos los grids (usuario + celdas) de todos los usuarios."""
    usuarios = db.query(Usuario).all()
    grids = []
    
    for usuario in usuarios:
        celdas = (
            db.query(CeldaOracion)
            .filter(CeldaOracion.usuario_id == usuario.id)
            .all()
        )
        grids.append({
            "usuario": usuario,
            "celdas": celdas,
        })
    
    return grids


@router.post("/drop", response_model=CeldaOracionResponse)
def registrar_drop(
    payload: DropPayload,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra una oración soltada en una celda de la cuadrícula."""
    oracion = _get_oracion_or_404(db, payload.oracion_id)
    
    # Si esta oración ya está en alguna otra celda del usuario, eliminarla de ahí
    db.query(CeldaOracion).filter(
        CeldaOracion.usuario_id == current_user.id,
        CeldaOracion.oracion_id == payload.oracion_id,
    ).delete()
    
    # Eliminar cualquier oración existente en la celda destino del usuario
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


def _get_oracion_or_404(db: Session, oracion_id: int) -> Oracion:
    oracion = db.query(Oracion).filter(Oracion.id == oracion_id).first()
    if not oracion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oración no encontrada",
        )
    return oracion
