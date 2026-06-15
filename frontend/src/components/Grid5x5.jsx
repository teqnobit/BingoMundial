import { useDroppable } from '@dnd-kit/core'

function Celda({ fila, columna, celdas, estadosCeldas, onClickCelda }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${fila}-${columna}`,
    data: { fila, columna },
  })

  // Buscar si hay una oración en esta celda
  const celdaOracion = celdas.find(c => c.fila === fila && c.columna === columna)
  
  // Obtener el estado actual de la celda
  const key = `${fila}-${columna}`
  const estadoActual = estadosCeldas?.[key] || 'normal'

  return (
    <div
      ref={setNodeRef}
      className={`grid-cell ${isOver ? 'over' : ''} ${celdaOracion ? 'with-oracion' : ''} celda-${estadoActual}`}
      data-fila={fila}
      data-columna={columna}
      data-estado={estadoActual}
      onClick={() => onClickCelda?.(fila, columna)}
      style={celdaOracion ? { '--celda-color': celdaOracion.color } : {}}
    >
      {celdaOracion && (
        <div className="celda-oracion">
          <p>{celdaOracion.oracion.texto}</p>
        </div>
      )}
      {estadoActual === 'fallido' && (
        <div className="celda-estado">
          <svg viewBox="0 0 100 100" className="celda-icon">
            <line x1="20" y1="20" x2="80" y2="80" strokeWidth="8" stroke="currentColor" />
            <line x1="80" y1="20" x2="20" y2="80" strokeWidth="8" stroke="currentColor" />
          </svg>
        </div>
      )}
      {estadoActual === 'completado' && (
        <div className="celda-estado">
          <svg viewBox="0 0 100 100" className="celda-icon">
            <circle cx="50" cy="50" r="40" strokeWidth="8" stroke="currentColor" fill="none" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default function Grid5x5({ celdas = [], estadosCeldas = {}, onClickCelda, readonly }) {
  const filas = Array.from({ length: 5 }, (_, i) => i)
  const columnas = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className={`grid-5x5 ${readonly ? 'readonly' : ''}`}>
      {filas.map((fila) =>
        columnas.map((columna) => (
          <Celda key={`${fila}-${columna}`} fila={fila} columna={columna} celdas={celdas} estadosCeldas={estadosCeldas} onClickCelda={onClickCelda} />
        )),
      )}
    </div>
  )
}
