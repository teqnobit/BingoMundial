# Bingo Mundial

Aplicación con login/registro y un dashboard tipo lienzo: lista de oraciones arrastrables y cuadrícula 5×5.

## Stack

| Capa      | Tecnología                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + React Router      |
| Backend   | Python 3.11+ + FastAPI              |
| ORM       | SQLAlchemy 2.x                      |
| Base de datos | Microsoft SQL Server            |

## Estructura

```
BingoMundial/
├── backend/          # API FastAPI
├── frontend/         # React (Vite)
└── docs/
    └── DATABASE.md   # Conexión SQL Server + guía ORM
```

## Inicio rápido

### 1. Base de datos

Sigue la guía en [docs/DATABASE.md](docs/DATABASE.md): crea la BD `BingoMundial`, configura `.env` y arranca la API.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Editar .env con tu DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Flujo de la app

1. **Registro** (`/signup`) — crea un `Usuario` con `nombre` y `contrasena`.
2. **Login** (`/login`) — devuelve JWT; redirige al dashboard.
3. **Dashboard** (`/dashboard`):
   - **Header**: título a ancho completo + botón salir.
   - **Aside**: oraciones CRUD + reordenar arrastrando.
   - **Body**: cuadrícula 5×5 sin scroll; al soltar una oración en una celda se llama a `POST /api/oraciones/drop`.

## Extender el drop en la cuadrícula

**Backend:** edita `app/routers/oraciones.py` → endpoint `registrar_drop`.

**Frontend:** en `Dashboard.jsx`, función `handleDropEnCelda`, o escucha el evento:

```javascript
window.addEventListener('oracion-drop', (e) => {
  const { oracion, fila, columna, respuesta } = e.detail
  // Tu lógica aquí
})
```

## API principal

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login (form: username, password) |
| GET | `/api/auth/me` | Usuario actual (Bearer token) |
| GET | `/api/oraciones` | Listar oraciones |
| POST | `/api/oraciones` | Crear oración |
| PUT | `/api/oraciones/{id}` | Editar |
| DELETE | `/api/oraciones/{id}` | Eliminar |
| PUT | `/api/oraciones/reordenar` | Reordenar `{ "ids": [3,1,2] }` |
| POST | `/api/oraciones/drop` | Drop en celda `{ oracion_id, fila, columna }` |
