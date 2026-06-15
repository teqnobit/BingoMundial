import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import api from '../api/client'
import { clearSession, getUsuario } from '../auth/session'
import AsideOraciones from '../components/AsideOraciones'
import Grid5x5 from '../components/Grid5x5'
import Header from '../components/Header'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const [oraciones, setOraciones] = useState([])
  const [activeOracion, setActiveOracion] = useState(null)
  const [lastDrop, setLastDrop] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const cargarOraciones = useCallback(async () => {
    const { data } = await api.get('/oraciones')
    setOraciones(data)
  }, [])

  useEffect(() => {
    cargarOraciones().catch(() => {
      clearSession()
      navigate('/login')
    })
  }, [cargarOraciones, navigate])

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  async function handleAgregar(texto) {
    await api.post('/oraciones', { texto })
    await cargarOraciones()
  }

  async function handleEditar(id, texto) {
    await api.put(`/oraciones/${id}`, { texto })
    await cargarOraciones()
  }

  async function handleEliminar(id) {
    await api.delete(`/oraciones/${id}`)
    await cargarOraciones()
  }

  async function handleReordenar(ids) {
    const { data } = await api.put('/oraciones/reordenar', { ids })
    setOraciones(data)
  }

  /**
   * Se invoca al soltar una oración sobre una celda de la cuadrícula.
   * Puedes extender esta función para persistir posiciones u otras acciones.
   */
  async function handleDropEnCelda(oracion, fila, columna) {
    const payload = {
      oracion_id: oracion.id,
      fila,
      columna,
    }

    const { data } = await api.post('/oraciones/drop', payload)
    setLastDrop(data)

    // Punto de extensión local: emite evento personalizado para otros módulos
    window.dispatchEvent(
      new CustomEvent('oracion-drop', {
        detail: { oracion, fila, columna, respuesta: data },
      }),
    )
  }

  function handleDragStart(event) {
    const oracion = oraciones.find((o) => o.id === event.active.id)
    setActiveOracion(oracion || null)
  }

  function handleDragEnd(event) {
    setActiveOracion(null)
    const { active, over } = event
    if (!over) return

    // Soltar en celda de la cuadrícula
    if (over.id.toString().startsWith('cell-')) {
      const [, fila, columna] = over.id.toString().split('-').map(Number)
      const oracion = oraciones.find((o) => o.id === active.id)
      if (oracion) {
        handleDropEnCelda(oracion, fila, columna)
      }
      return
    }

    // Reordenar dentro del aside
    const activeId = active.id
    const overId = over.id
    if (typeof activeId === 'number' && typeof overId === 'number' && activeId !== overId) {
      const oldIndex = oraciones.findIndex((o) => o.id === activeId)
      const newIndex = oraciones.findIndex((o) => o.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(oraciones, oldIndex, newIndex)
        setOraciones(reordered)
        handleReordenar(reordered.map((o) => o.id))
      }
    }
  }

  return (
    <div className="dashboard">
      <Header titulo="Bingo Mundial — Lienzo" onLogout={handleLogout} usuario={usuario} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="dashboard-main">
          <SortableContext
            items={oraciones.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <AsideOraciones
              oraciones={oraciones}
              onAgregar={handleAgregar}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
            />
          </SortableContext>

          <section className="dashboard-body">
            <Grid5x5 />
            {lastDrop && (
              <p className="drop-feedback">
                Último drop: «{lastDrop.oracion.texto}» → celda [{lastDrop.celda.fila},{' '}
                {lastDrop.celda.columna}]
              </p>
            )}
          </section>
        </div>

        <DragOverlay>
          {activeOracion ? (
            <div className="oracion-item dragging">{activeOracion.texto}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
