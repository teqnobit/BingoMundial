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
import GridCarrusel from '../components/GridCarrusel'
import Header from '../components/Header'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const [oraciones, setOraciones] = useState([])
  const [celdas, setCeldas] = useState([])
  const [grids, setGrids] = useState([])
  const [activeOracion, setActiveOracion] = useState(null)
  const [lastDrop, setLastDrop] = useState(null)
  const [estadosCeldas, setEstadosCeldas] = useState(() => {
    try {
      const saved = localStorage.getItem('bingo_estados_celdas')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [activeGrid, setActiveGrid] = useState(null)
  const [anchoWindow, setAnchoWindow] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => {
      setAnchoWindow(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  useEffect(() => {
    localStorage.setItem('bingo_estados_celdas', JSON.stringify(estadosCeldas))
  }, [estadosCeldas])

  const esGridPropio = !activeGrid || activeGrid.usuario.id === usuario?.id

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
      clearSession()
      navigate('/login')
    })
    cargarCeldas().catch(() => {
      clearSession()
      navigate('/login')
    })
    cargarGrids().catch(() => {
      clearSession()
      navigate('/login')
    })
  }, [cargarOraciones, cargarCeldas, cargarGrids, navigate])

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
      // Buscar si la oración ya estaba colocada en alguna celda antes del drop
      const celdaExistente = celdas.find((c) => c.oracion.id === oracion.id)

      const payload = {
        oracion_id: oracion.id,
        fila,
        columna,
      }

      const { data } = await api.post('/oraciones/drop', payload)
      setLastDrop(data)

      const usuarioIdActivo = activeGrid?.usuario?.id || usuario?.id
      if (usuarioIdActivo) {
        setEstadosCeldas((prev) => {
          const estadosUsuario = { ...(prev[usuarioIdActivo] || {}) }
          const keyDestino = `${fila}-${columna}`

          if (celdaExistente) {
            const keyOrigen = `${celdaExistente.fila}-${celdaExistente.columna}`
            const estadoOrigen = estadosUsuario[keyOrigen]

            // Eliminar estado de la coordenada de origen
            delete estadosUsuario[keyOrigen]

            // Mover al destino si tenía un estado asignado
            if (estadoOrigen) {
              estadosUsuario[keyDestino] = estadoOrigen
            } else {
              delete estadosUsuario[keyDestino]
            }
          } else {
            // Si viene del aside (es nueva en el grid), limpiar cualquier estado previo en la celda destino
            delete estadosUsuario[keyDestino]
          }

          return {
            ...prev,
            [usuarioIdActivo]: estadosUsuario,
          }
        })
      }

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

  function handleClickCelda(fila, columna) {
    if (!esGridPropio) return
    const key = `${fila}-${columna}`
    const usuarioIdActivo = activeGrid?.usuario?.id || usuario?.id
    if (!usuarioIdActivo) return

    const estadosCeldasUsuario = estadosCeldas[usuarioIdActivo] || {}
    const estadoActual = estadosCeldasUsuario[key] || 'normal'

    // Ciclar entre: normal -> fallido -> completado -> normal
    let nuevoEstado
    if (estadoActual === 'normal') {
      nuevoEstado = 'fallido'
    } else if (estadoActual === 'fallido') {
      nuevoEstado = 'completado'
    } else {
      nuevoEstado = 'normal'
    }

    setEstadosCeldas((prev) => ({
      ...prev,
      [usuarioIdActivo]: {
        ...prev[usuarioIdActivo],
        [key]: nuevoEstado === 'normal' ? undefined : nuevoEstado,
      },
    }))
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
      <Header titulo="Bingo Mundial" onLogout={handleLogout} usuario={usuario} />

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
              isEditable={esGridPropio}
            />}
          </SortableContext>

          <section className="dashboard-body">
            <GridCarrusel
              grids={grids}
              estadosCeldas={activeGrid ? (estadosCeldas[activeGrid.usuario.id] || {}) : {}}
              onClickCelda={handleClickCelda}
              onGridChange={setActiveGrid}
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
