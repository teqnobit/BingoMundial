import { useState, useRef, useEffect } from 'react'

export default function Header({ titulo, onLogout, usuario }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickFuera(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const onMenuOptionClicked = (url) => {
    window.open(url, '_blank')
  }

  return (
    <header className="dashboard-header">
      <h1>{titulo}</h1>
      {usuario && (
        <div className="hamburger-menu" ref={menuRef}>
          <button
            type="button"
            className="hamburger-trigger"
            onClick={() => setMenuAbierto(prev => !prev)}
            aria-expanded={menuAbierto}
            aria-label="Menú de usuario"
          >
            <span className="hamburger-nombre">{usuario.nombre}</span>
            <span className="hamburger-icon">{menuAbierto ? '▲' : '▼'}</span>
          </button>
          {menuAbierto && (
            <ul className="hamburger-dropdown">
              <li>
                <button
                  type="button"
                  className="hamburger-item"
                  onClick={() => { setMenuAbierto(false); onMenuOptionClicked('https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/standings'); }}
                >
                  📒 Scores
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hamburger-item"
                  onClick={() => { setMenuAbierto(false); onMenuOptionClicked('https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures'); }}
                >
                  🆚 Juegos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hamburger-item"
                  onClick={() => { setMenuAbierto(false); onMenuOptionClicked('https://futbol-libres.su/'); }}
                >
                  ⚽ Donde Ver
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hamburger-item"
                  onClick={() => { setMenuAbierto(false); onMenuOptionClicked('https://a4.espncdn.com/combiner/i?img=%2Fphoto%2F2026%2F0331%2FIRAK_GRUPOS.png&w=1140&cquality=40&format=jpg'); }}
                >
                  🔠 Grupos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hamburger-item"
                  onClick={() => { setMenuAbierto(false); onLogout(); }}
                >
                  🚪 Salir
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </header>
  )
}
