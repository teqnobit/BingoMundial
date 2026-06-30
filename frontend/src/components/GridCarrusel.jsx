import { useState, useEffect } from 'react'
import api from '../api/client'
import { getUsuario, isGuest } from '../auth/session'
import Grid4x4 from './Grid4x4'
import { useSwipeable } from 'react-swipeable'

export default function GridCarrusel({ grids: gridsExterno, onNeedRefresh, estadosCeldas, onClickCelda, onGridChange, anchoWindow }) {
  const usuarioActual = getUsuario()
  const esInvitado = isGuest()
  const [grids, setGrids] = useState(gridsExterno || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(!gridsExterno)
  const handlers = useSwipeable({
    onSwipedLeft: handleSiguiente,
    onSwipedRight: handleAnterior,
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
  })

  useEffect(() => {
    if (!gridsExterno) {
      cargarGrids()
    }
  }, [gridsExterno])

  useEffect(() => {
    if (gridsExterno) {
      setGrids(gridsExterno)
      // Cuando los grids se actualicen, encontrar el índice del usuario actual
      if (!esInvitado && usuarioActual?.id) {
        const indiceUsuarioActual = gridsExterno.findIndex(
          (grid) => grid.usuario.id === usuarioActual.id
        )
        if (indiceUsuarioActual !== -1) {
          setCurrentIndex(indiceUsuarioActual)
        }
      }
    }
  }, [gridsExterno, usuarioActual?.id, esInvitado])

  async function cargarGrids() {
    try {
      const { data } = await api.get('/oraciones/grids')
      setGrids(data)

      // Encontrar el índice del usuario actual
      if (!esInvitado && usuarioActual?.id) {
        const indiceUsuarioActual = data.findIndex(
          (grid) => grid.usuario.id === usuarioActual.id
        )
        if (indiceUsuarioActual !== -1) {
          setCurrentIndex(indiceUsuarioActual)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error al cargar grids:', error)
      setLoading(false)
    }
  }

  function handleAnterior() {
    setCurrentIndex((prev) => (prev === 0 ? grids.length - 1 : prev - 1))
  }

  function handleSiguiente() {
    setCurrentIndex((prev) => (prev === grids.length - 1 ? 0 : prev + 1))
  }

  const gridActual = grids[currentIndex]
  const esGridPropio = !esInvitado && gridActual?.usuario?.id === usuarioActual?.id

  useEffect(() => {
    if (gridActual) {
      onGridChange?.(gridActual)
    }
  }, [gridActual, onGridChange])

  if (loading) {
    return <div className="grid-carrusel">Cargando grids...</div>
  }

  if (grids.length === 0) {
    return <div className="grid-carrusel">No hay grids disponibles</div>
  }

  return (
    <div className="grid-carrusel" {...handlers}>
      <div className="carrusel-header">
        <h3>{gridActual.usuario.nombre}</h3>
      </div>

      <div className="carrusel-container">
        {(anchoWindow > 1024) && (
          <button
            className="carrusel-btn carrusel-btn-anterior"
            onClick={handleAnterior}
            title="Anterior"
          >
            ◀
          </button>
        )}

        <div className="carrusel-grid">
          <Grid4x4
            celdas={gridActual.celdas}
            estadosCeldas={estadosCeldas}
            onClickCelda={esGridPropio ? onClickCelda : undefined}
            readonly={!esGridPropio}
          />
        </div>

        {(anchoWindow > 1024) && (
          <button
            className="carrusel-btn carrusel-btn-siguiente"
            onClick={handleSiguiente}
            title="Siguiente"
          >
            ▶
          </button>
        )}
      </div>

      <div className="carrusel-footer">
        <span className="carrusel-contador">
          {currentIndex + 1} de {grids.length}
        </span>
      </div>
    </div>
  )
}
