import { useDroppable } from '@dnd-kit/core'

function Celda({ fila, columna }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${fila}-${columna}`,
    data: { fila, columna },
  })

  return (
    <div
      ref={setNodeRef}
      className={`grid-cell ${isOver ? 'over' : ''}`}
      data-fila={fila}
      data-columna={columna}
    />
  )
}

export default function Grid5x5() {
  const filas = Array.from({ length: 5 }, (_, i) => i)
  const columnas = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className="grid-5x5">
      {filas.map((fila) =>
        columnas.map((columna) => (
          <Celda key={`${fila}-${columna}`} fila={fila} columna={columna} />
        )),
      )}
    </div>
  )
}
