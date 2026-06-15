import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function OracionItem({ oracion, celdas, onEditar, onEliminar, isEditable }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(oracion.texto)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: oracion.id,
    disabled: editando || !isEditable,
  })

  // Verificar si esta oración ya está en alguna celda
  const estaEnCelda = celdas && celdas.some(c => c.oracion.id === oracion.id)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  async function guardar() {
    if (texto.trim() && texto !== oracion.texto) {
      await onEditar(oracion.id, texto.trim())
    }
    setEditando(false)
  }

  return (
    <li ref={setNodeRef} style={style} className={`oracion-item ${estaEnCelda ? 'en-celda' : ''}`}>
      {editando ? (
        <div className="oracion-edit">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardar()
              if (e.key === 'Escape') {
                setTexto(oracion.texto)
                setEditando(false)
              }
            }}
          />
          <button type="button" onClick={guardar}>
            OK
          </button>
        </div>
      ) : (
        <>
          {isEditable && (
            <span className="drag-handle" {...listeners} {...attributes} title="Arrastrar">
              ⠿
            </span>
          )}
          <span className="oracion-texto">{oracion.texto}</span>
          {isEditable && (
            <div className="oracion-actions">
              <button type="button" onClick={() => setEditando(true)} title="Editar">
                ✎
              </button>
              <button type="button" onClick={() => onEliminar(oracion.id)} title="Eliminar">
                ✕
              </button>
            </div>
          )}
        </>
      )}
    </li>
  )
}

export default function AsideOraciones({ oraciones, celdas, onAgregar, onEditar, onEliminar, isEditable }) {
  const [nueva, setNueva] = useState('')

  async function handleAgregar(e) {
    e.preventDefault()
    const texto = nueva.trim()
    if (!texto) return
    await onAgregar(texto)
    setNueva('')
  }

  return (
    <aside className="dashboard-aside">
      <h2>Oraciones</h2>
      <ul className="oraciones-list">
        {oraciones.map((oracion) => (
          <OracionItem
            key={oracion.id}
            oracion={oracion}
            celdas={celdas}
            onEditar={onEditar}
            onEliminar={onEliminar}
            isEditable={isEditable}
          />
        ))}
      </ul>

      {isEditable && (
        <form className="oracion-form" onSubmit={handleAgregar}>
          <input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Nueva oración corta..."
            maxLength={500}
          />
          <button type="submit">+</button>
        </form>
      )}
    </aside>
  )
}
