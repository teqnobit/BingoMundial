import { useDroppable } from '@dnd-kit/core'

function Celda({ fila, columna, celdas }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${fila}-${columna}`,
    data: { fila, columna },
  })

  // Buscar si hay una oración en esta celda
  const celdaOracion = celdas.find(c => c.fila === fila && c.columna === columna)

  return (
    <div
      ref={setNodeRef}
      className={`grid-cell ${isOver ? 'over' : ''} ${celdaOracion ? 'with-oracion' : ''}`}
      data-fila={fila}
      data-columna={columna}
      style={celdaOracion ? { '--celda-color': celdaOracion.color } : {}}
    >
      {celdaOracion && (
        <div className="celda-oracion">
          <p>{celdaOracion.oracion.texto}</p>
        </div>
      )}
    </div>
  )
}

export default function Grid5x5({ celdas = [] }) {
  const filas = Array.from({ length: 5 }, (_, i) => i)
  const columnas = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className="grid-5x5">
      {filas.map((fila) =>
        columnas.map((columna) => (
          <Celda key={`${fila}-${columna}`} fila={fila} columna={columna} celdas={celdas} />
        )),
      )}
    </div>
  )
}
