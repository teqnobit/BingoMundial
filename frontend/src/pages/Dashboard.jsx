import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { clearSession, getUsuario, isGuest } from '../auth/session'
import AsideOraciones from '../components/AsideOraciones'
import GridCarrusel from '../components/GridCarrusel'
import Header from '../components/Header'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const esInvitado = isGuest()
  const [oraciones, setOraciones] = useState([])
  const [celdas, setCeldas] = useState([])
  const [grids, setGrids] = useState([])
  const [activeOracion, setActiveOracion] = useState(null)
  const [lastDrop, setLastDrop] = useState(null)
  const [activeGrid, setActiveGrid] = useState(null)
  const [anchoWindow, setAnchoWindow] = useState(window.innerWidth)

  // Derivar estadosCeldas desde los datos del grid activo (persistidos en el servidor)
  const estadosCeldasActivo = useMemo(() => {
    const celdasGrid = activeGrid ? activeGrid.celdas : celdas
    const estados = {}
    for (const celda of celdasGrid) {
      if (celda.estado && celda.estado !== 'normal') {
        estados[`${celda.fila}-${celda.columna}`] = celda.estado
      }
    }
    return estados
  }, [activeGrid, celdas])

  useEffect(() => {
    const handleResize = () => {
      setAnchoWindow(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const esGridPropio = !esInvitado && (!activeGrid || activeGrid.usuario.id === usuario?.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const cargarOraciones = useCallback(async () => {
    try {
      const { data } = await api.get('/oraciones')
      setOraciones(data)
    } catch (error) {
      console.error('Error al cargar oraciones:', error.response?.data || error.message)
    }
  }, [])

  const cargarCeldas = useCallback(async () => {
    try {
      const { data } = await api.get('/oraciones/celdas')
      setCeldas(data)
    } catch (error) {
      console.error('Error al cargar celdas:', error.response?.data || error.message)
    }
  }, [])

  const cargarGrids = useCallback(async () => {
    try {
      const { data } = await api.get('/oraciones/grids')
      setGrids(data)
    } catch (error) {
      console.error('Error al cargar grids:', error.response?.data || error.message)
    }
  }, [])

  useEffect(() => {
    cargarOraciones().catch(() => {
      if (!esInvitado) {
        clearSession()
        navigate('/login')
      }
    })
    if (!esInvitado) {
      cargarCeldas().catch(() => {
        clearSession()
        navigate('/login')
      })
    }
    cargarGrids().catch(() => {
      if (!esInvitado) {
        clearSession()
        navigate('/login')
      }
    })
  }, [cargarOraciones, cargarCeldas, cargarGrids, navigate, esInvitado])

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  async function handleAgregar(texto) {
    try {
      await api.post('/oraciones', { texto })
      await cargarOraciones()
    } catch (error) {
      console.error('Error al agregar oración:', error.response?.data || error.message)
    }
  }

  async function handleEditar(id, texto) {
    try {
      await api.put(`/oraciones/${id}`, { texto })
      await cargarOraciones()
    } catch (error) {
      console.error('Error al editar oración:', error.response?.data || error.message)
    }
  }

  async function handleEliminar(id) {
    try {
      await api.delete(`/oraciones/${id}`)
      await cargarOraciones()
      await cargarCeldas()
    } catch (error) {
      console.error('Error al eliminar oración:', error.response?.data || error.message)
    }
  }

  async function handleReordenar(ids) {
    try {
      const { data } = await api.put('/oraciones/reordenar', { ids })
      setOraciones(data)
    } catch (error) {
      console.error('Error al reordenar oraciones:', error.response?.data || error.message)
    }
  }

  /**
   * Se invoca al soltar una oración sobre una celda de la cuadrícula.
   * Puedes extender esta función para persistir posiciones u otras acciones.
   */
  async function handleDropEnCelda(oracion, fila, columna) {
    if (!esGridPropio) return
    try {
      const payload = {
        oracion_id: oracion.id,
        fila,
        columna,
      }

      const { data } = await api.post('/oraciones/drop', payload)
      setLastDrop(data)

      await cargarCeldas()
      await cargarGrids()

      // Punto de extensión local: emite evento personalizado para otros módulos
      window.dispatchEvent(
        new CustomEvent('oracion-drop', {
          detail: { oracion, fila, columna, respuesta: data },
        }),
      )
    } catch (error) {
      console.error('Error al hacer drop:', error.response?.data || error.message)
    }
  }

  async function handleClickCelda(fila, columna) {
    if (!esGridPropio) return
    const key = `${fila}-${columna}`
    const estadoActual = estadosCeldasActivo[key] || 'normal'

    // Ciclar entre: normal -> fallido -> completado -> normal
    let nuevoEstado
    if (estadoActual === 'normal') {
      nuevoEstado = 'fallido'
    } else if (estadoActual === 'fallido') {
      nuevoEstado = 'completado'
    } else {
      nuevoEstado = 'normal'
    }

    try {
      await api.put('/oraciones/celdas/estado', { fila, columna, estado: nuevoEstado })
      await cargarCeldas()
      await cargarGrids()
    } catch (error) {
      console.error('Error al actualizar estado de celda:', error.response?.data || error.message)
    }
  }

  function handleDragStart(event) {
    if (!esGridPropio) return
    const oracion = oraciones.find((o) => o.id === event.active.id)
    setActiveOracion(oracion || null)
  }

  function handleDragEnd(event) {
    if (!esGridPropio) return
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
      <Header titulo="Bingo Mundial" onLogout={handleLogout} usuario={usuario} esInvitado={esInvitado} />

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
            {(anchoWindow > 1024) && <AsideOraciones
              oraciones={oraciones}
              celdas={activeGrid ? activeGrid.celdas : celdas}
              onAgregar={handleAgregar}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              isEditable={esGridPropio && !esInvitado}
            />}
          </SortableContext>

          <section className="dashboard-body">
            <GridCarrusel
              grids={grids}
              estadosCeldas={estadosCeldasActivo}
              onClickCelda={handleClickCelda}
              onGridChange={setActiveGrid}
              anchoWindow={anchoWindow}
            />
            {lastDrop && (
              <p className="drop-feedback">
                Último drop: «{lastDrop.oracion.texto}» → celda [{lastDrop.fila},{' '}
                {lastDrop.columna}]
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
