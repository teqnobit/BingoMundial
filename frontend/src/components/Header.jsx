export default function Header({ titulo, onLogout, usuario }) {
  return (
    <header className="dashboard-header">
      <h1>{titulo}</h1>
      <div className="header-actions">
        {usuario && <span className="header-user">{usuario.nombre}</span>}
        <button type="button" onClick={onLogout}>
          Salir
        </button>
      </div>
    </header>
  )
}
