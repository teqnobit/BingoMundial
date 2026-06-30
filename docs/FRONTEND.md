# Documentación Frontend - Bingo Mundial

## 📋 Tabla de Contenidos
1. [Estructura General](#estructura-general)
2. [Dependencias Principales](#dependencias-principales)
3. [Configuración Base](#configuración-base)
4. [Sistema de Routing](#sistema-de-routing)
5. [Sistema de Autenticación](#sistema-de-autenticación)
6. [Cliente API](#cliente-api)
7. [Componentes](#componentes)
8. [Páginas](#páginas)
9. [Hooks de React](#hooks-de-react)
10. [Hooks de Librerías](#hooks-de-librerías)
11. [Custom Hooks (Oportunidades)](#custom-hooks-oportunidades)

---

## Estructura General

```
frontend/
├── index.html              # Archivo HTML principal
├── package.json            # Dependencias y scripts
├── vite.config.js          # Configuración de Vite
└── src/
    ├── main.jsx            # Punto de entrada de React
    ├── App.jsx             # Componente raíz con routing
    ├── App.css             # Estilos globales
    ├── index.css           # Estilos base
    ├── api/
    │   └── client.js       # Cliente Axios configurado
    ├── auth/
    │   └── session.js      # Gestión de sesión localStorage
    ├── components/         # Componentes reutilizables
    │   ├── AsideOraciones.jsx
    │   ├── Grid4x4.jsx
    │   └── Header.jsx
    └── pages/              # Componentes de página
        ├── Login.jsx
        ├── Signup.jsx
        └── Dashboard.jsx
```

---

## Dependencias Principales

### Producción
- **react** (18.3.1): Biblioteca UI principal
- **react-dom** (18.3.1): Renderizado DOM de React
- **react-router-dom** (7.1.1): Enrutamiento SPA (Single Page Application)
- **axios** (1.7.9): Cliente HTTP para llamadas API
- **@dnd-kit/core** (6.3.1): Sistema drag-and-drop
- **@dnd-kit/sortable** (10.0.0): Utilidades para reordenamiento
- **@dnd-kit/utilities** (3.2.2): Funciones auxiliares de dnd-kit

### Desarrollo
- **vite** (6.0.6): Build tool ultrarrápido
- **@vitejs/plugin-react** (4.3.4): Plugin Vite para React JSX

---

## Configuración Base

### main.jsx
Punto de entrada que configura:
- **BrowserRouter**: Habilita el routing de React Router
- **React.StrictMode**: Modo estricto para detectar problemas en desarrollo
- **App**: Componente raíz

```javascript
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

### vite.config.js
```javascript
// Configuración típica de Vite con plugin de React
// - Dev server con HMR (Hot Module Replacement)
// - Optimización de bundle en producción
```

---

## Sistema de Routing

### App.jsx
Define todas las rutas de la aplicación:

| Ruta | Componente | Tipo | Descripción |
|------|-----------|------|-------------|
| `/` | Dashboard | Privada | Redirecciona a dashboard |
| `/login` | Login | Pública | Formulario de login |
| `/signup` | Signup | Pública | Formulario de registro |
| `/dashboard` | Dashboard | Privada | Página principal del juego |

### Componentes de Ruta

**PrivateRoute**: Protege rutas privadas
- Si no hay autenticación → Redirecciona a `/login`
- Si hay autenticación → Renderiza el componente

**PublicRoute**: Protege rutas públicas
- Si hay autenticación → Redirecciona a `/dashboard`
- Si no hay autenticación → Renderiza el componente

```javascript
function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children
}
```

---

## Sistema de Autenticación

### session.js
Módulo de utilidades para gestionar la sesión en `localStorage`:

| Función | Descripción |
|---------|------------|
| `saveSession(token, usuario)` | Guarda token y datos del usuario |
| `clearSession()` | Limpia token y datos del usuario |
| `getToken()` | Obtiene el token actual |
| `getUsuario()` | Obtiene datos del usuario (parseado) |
| `isAuthenticated()` | Verifica si hay sesión activa |

```javascript
// Ejemplo de uso
saveSession('eyJhb...', { id: 1, nombre: 'Juan' })
const usuario = getUsuario() // { id: 1, nombre: 'Juan' }
const token = getToken()     // 'eyJhb...'
clearSession()               // Limpia todo
```

---

## Cliente API

### client.js
Cliente Axios preconfigurado con:
- **Base URL**: `/api`
- **Interceptor de request**: Agrega token `Authorization` automáticamente
- **Headers**: `Bearer {token}` si existe sesión activa

```javascript
const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

### Ejemplo de uso en componentes:
```javascript
// GET
const { data } = await api.get('/oraciones')

// POST
await api.post('/auth/login', form)

// PUT
await api.put(`/oraciones/${id}`, { texto })

// DELETE
await api.delete(`/oraciones/${id}`)
```

---

## Componentes

### Header.jsx
Encabezado de la aplicación con datos del usuario

**Props:**
- `titulo`: Título a mostrar
- `onLogout`: Callback para cerrar sesión
- `usuario`: Objeto con datos del usuario

```javascript
<Header 
  titulo="Bingo Mundial"
  onLogout={handleLogout}
  usuario={usuario}
/>
```

### Grid4x4.jsx
Cuadrícula 4×4 para el juego de bingo con celdas droppable

**Componentes internos:**
- **Celda**: Cada celda individual de la cuadrícula
  - USA: `useDroppable()` para recibir drops
  - Muestra estado visual cuando se arrastra encima

```javascript
function Celda({ fila, columna }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${fila}-${columna}`,
    data: { fila, columna },
  })
  
  return (
    <div
      ref={setNodeRef}
      className={`grid-cell ${isOver ? 'over' : ''}`}
    />
  )
}
```

### AsideOraciones.jsx
Panel lateral con lista de oraciones

**Componentes internos:**
- **OracionItem**: Item individual en la lista

**Props:**
- `oraciones`: Array de oraciones
- `onAgregar`: Callback para agregar oración
- `onEditar`: Callback para editar oración
- `onEliminar`: Callback para eliminar oración

**Funcionalidades:**
- Formulario para agregar nueva oración
- Edición inline (click en ✎)
- Eliminar (botón ✕)
- Draggable para reordenar
- Validación de longitud (max 500 caracteres)

```javascript
<OracionItem
  oracion={oracion}
  onEditar={handleEditar}
  onEliminar={handleEliminar}
/>
```

---

## Páginas

### Login.jsx
Página de inicio de sesión

**Funcionalidades:**
- Formulario con usuario y contraseña
- Validación de errores
- Loading state durante la petición
- Redirección a dashboard si login es exitoso
- Link a página de signup

**Flujo:**
1. Usuario ingresa credenciales
2. Envía POST a `/auth/login`
3. Si es exitoso: guarda sesión y redirecciona
4. Si falla: muestra error en UI

### Signup.jsx
Página de registro

**Funcionalidades:**
- Formulario con usuario y contraseña
- Validación de contraseña mínima (4 caracteres)
- Validación de errores
- Loading state
- Redirección a login si registro es exitoso
- Link a página de login

**Flujo:**
1. Usuario ingresa credenciales
2. Envía POST a `/auth/register`
3. Si es exitoso: redirecciona a login
4. Si falla: muestra error en UI

### Dashboard.jsx
Página principal del juego (privada)

**Secciones:**
- Header con usuario y botón logout
- Aside izquierdo: lista de oraciones
- Main: cuadrícula 4×4 y feedback de drops

**Funcionalidades principales:**
- Cargar oraciones al montar el componente
- Agregar oraciones
- Editar oraciones
- Eliminar oraciones
- Reordenar oraciones por drag
- Arrastrar oraciones a celdas de la cuadrícula
- Feedback visual del último drop realizado

**Flujo de drag-and-drop:**
1. Usuario inicia drag sobre una oración
2. Sistema muestra preview en `DragOverlay`
3. Usuario suelta en celda o en otro item
4. Se ejecuta la lógica correspondiente (reordenar o drop en celda)
5. Se actualiza UI y BD

---

## Hooks de React

React proporciona varios hooks para gestionar estado y efectos. En este frontend se usan:

### useState()
**Propósito:** Gestionar estado local de un componente

```javascript
const [count, setCount] = useState(0)
const [nombre, setNombre] = useState('')
const [oraciones, setOraciones] = useState([])
```

**Ejemplos en el proyecto:**
- `[oraciones, setOraciones]`: Lista de oraciones en Dashboard
- `[error, setError]`: Mensaje de error en Login/Signup
- `[loading, setLoading]`: Estado de carga en formularios
- `[editando, setEditando]`: Toggle de modo edición en OracionItem
- `[texto, setTexto]`: Texto del input de edición

### useEffect()
**Propósito:** Ejecutar efectos secundarios (llamadas API, suscripciones, etc)

```javascript
useEffect(() => {
  // Código a ejecutar
  return () => {
    // Limpieza (opcional)
  }
}, [dependencias]) // Array de dependencias
```

**Ejemplo en Dashboard:**
```javascript
useEffect(() => {
  cargarOraciones().catch(() => {
    clearSession()
    navigate('/login')
  })
}, [cargarOraciones, navigate])
```

**Flujo:**
1. Se monta el componente Dashboard
2. Se ejecuta `cargarOraciones()`
3. Si falla: limpia sesión y redirecciona
4. Si hay cambios en dependencias: se re-ejecuta

### useCallback()
**Propósito:** Memorizar funciones para optimizar rendimiento y evitar re-renders innecesarios

```javascript
const memoizedFunction = useCallback(() => {
  // Lógica
}, [dependencias])
```

**Ejemplo en Dashboard:**
```javascript
const cargarOraciones = useCallback(async () => {
  const { data } = await api.get('/oraciones')
  setOraciones(data)
}, [])
```

**Beneficio:** La función se crea una sola vez en memoria. Sin `useCallback`, cada render crearía una nueva función y causaría re-renders innecesarios en componentes hijos.

### useNavigate()
**Propósito:** Navegar programáticamente entre rutas (de React Router)

```javascript
const navigate = useNavigate()

// Navegar
navigate('/dashboard')
navigate('/login')
```

**Usado en:**
- Login: Redireccionar a dashboard después de login exitoso
- Dashboard: Redireccionar a login si hay error
- Signup: Redireccionar a login después de registro

---

## Hooks de Librerías

### Hooks de dnd-kit

#### useSortable()
**Propósito:** Hace un elemento draggable y sortable dentro de un contexto

```javascript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id, disabled })
```

**Propiedades retornadas:**
- `setNodeRef`: Ref del DOM a adjuntar al elemento
- `listeners`: Event listeners para drag
- `attributes`: Atributos ARIA para accesibilidad
- `transform`: Transformación CSS durante drag
- `transition`: CSS transition animation
- `isDragging`: Boolean indicando si está siendo arrastrado

**Ejemplo en OracionItem:**
```javascript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({
  id: oracion.id,
  disabled: editando, // Desactiva drag si está editando
})

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.4 : 1, // Opacity visual
}
```

#### useDroppable()
**Propósito:** Define una zona donde se pueden soltar elementos

```javascript
const { setNodeRef, isOver } = useDroppable({
  id,
  data, // Datos adicionales
})
```

**Propiedades retornadas:**
- `setNodeRef`: Ref del DOM a adjuntar
- `isOver`: Boolean indicando si hay un elemento encima

**Ejemplo en Celda:**
```javascript
const { setNodeRef, isOver } = useDroppable({
  id: `cell-${fila}-${columna}`,
  data: { fila, columna },
})

return (
  <div
    ref={setNodeRef}
    className={`grid-cell ${isOver ? 'over' : ''}`}
  />
)
```

#### useSensor() y useSensors()
**Propósito:** Configurar triggers para iniciar drag

```javascript
const sensors = useSensors(
  useSensor(PointerSensor, { 
    activationConstraint: { distance: 6 } // Mín. 6px para iniciar drag
  })
)
```

**Ejemplo en Dashboard:**
```javascript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
)

<DndContext sensors={sensors} {...} >
```

---

## Custom Hooks (Oportunidades)

Actualmente el proyecto **NO tiene custom hooks**, pero aquí hay sugerencias para mejorar:

### 1. useAuth() - Gestionar autenticación
```javascript
// hooks/useAuth.js
import { useNavigate } from 'react-router-dom'
import { saveSession, clearSession, getUsuario, isAuthenticated } from '../auth/session'
import api from '../api/client'

export function useAuth() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (nombre, contrasena) => {
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', nombre)
      form.append('password', contrasena)
      
      const { data } = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      
      saveSession(data.access_token, data.usuario)
      setUsuario(data.usuario)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    setUsuario(null)
    navigate('/login')
  }

  return { usuario, loading, error, login, logout, isAuthenticated: isAuthenticated() }
}
```

**Uso en Login:**
```javascript
const { login, loading, error } = useAuth()

const handleSubmit = (e) => {
  e.preventDefault()
  login(nombre, contrasena)
}
```

### 2. useOraciones() - Gestionar oraciones
```javascript
// hooks/useOraciones.js
import { useState, useCallback, useEffect } from 'react'
import api from '../api/client'

export function useOraciones() {
  const [oraciones, setOraciones] = useState([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/oraciones')
      setOraciones(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const agregar = useCallback(async (texto) => {
    await api.post('/oraciones', { texto })
    await cargar()
  }, [cargar])

  const editar = useCallback(async (id, texto) => {
    await api.put(`/oraciones/${id}`, { texto })
    await cargar()
  }, [cargar])

  const eliminar = useCallback(async (id) => {
    await api.delete(`/oraciones/${id}`)
    await cargar()
  }, [cargar])

  const reordenar = useCallback(async (ids) => {
    const { data } = await api.put('/oraciones/reordenar', { ids })
    setOraciones(data)
  }, [])

  return {
    oraciones,
    loading,
    cargar,
    agregar,
    editar,
    eliminar,
    reordenar,
  }
}
```

**Uso en Dashboard:**
```javascript
const { oraciones, cargar, agregar, editar, eliminar, reordenar } = useOraciones()

useEffect(() => {
  cargar().catch(() => {
    clearSession()
    navigate('/login')
  })
}, [cargar, navigate])
```

### 3. useDragAndDrop() - Centralizar lógica D&D
```javascript
// hooks/useDragAndDrop.js
import { useState, useCallback } from 'react'
import { useSensors, useSensor, PointerSensor, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export function useDragAndDrop(items, onReorder) {
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragStart = useCallback((event) => {
    const item = items.find((i) => i.id === event.active.id)
    setActiveItem(item || null)
  }, [items])

  const handleDragEnd = useCallback((event) => {
    setActiveItem(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(items, oldIndex, newIndex)
      onReorder(reordered)
    }
  }, [items, onReorder])

  return {
    activeItem,
    sensors,
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragEnd,
  }
}
```

---

## Flujos Principales

### Flujo de Login
```
Usuario abre /login
  ↓
Ingresa credenciales
  ↓
Click en "Entrar"
  ↓
POST /api/auth/login
  ↓
¿Success?
  ├─ Sí → saveSession() → navigate('/dashboard')
  └─ No → mostrar error
```

### Flujo de Dashboard
```
Usuario abre /dashboard (PrivateRoute verifica isAuthenticated)
  ↓
Carga oraciones: GET /api/oraciones
  ↓
Mostrar lista y grid
  ↓
Usuario acciones:
  ├─ Agregar → POST /api/oraciones
  ├─ Editar → PUT /api/oraciones/{id}
  ├─ Eliminar → DELETE /api/oraciones/{id}
  ├─ Reordenar → PUT /api/oraciones/reordenar
  └─ Drop en celda → POST /api/oraciones/drop
  ↓
Recargar oraciones y actualizar UI
```

---

## Tips y Buenas Prácticas

✅ **Qué se hace bien:**
- Separación de concerns (API, Auth, Components)
- Protección de rutas privadas
- Interceptor de headers automático en API
- Componentes pequeños y reutilizables
- Sistema drag-and-drop robusto

⚠️ **Mejoras sugeridas:**
1. Crear custom hooks para reducir lógica en componentes
2. Agregar manejo de errores más robusto
3. Implementar Context API para state global (si crece)
4. Agregar loading/skeleton screens
5. Validar inputs en frontend antes de enviar
6. Agregar propiedades `key` únicas en listas
7. Implementar debounce en búsquedas (si las hay)

---

## Resumen de Hooks Utilizados

| Hook | Ubicación | Propósito |
|------|-----------|----------|
| `useState()` | Login, Signup, Dashboard, Components | Gestionar estado local |
| `useEffect()` | Dashboard | Cargar datos al montar |
| `useCallback()` | Dashboard | Memorizar funciones |
| `useNavigate()` | Login, Signup, Dashboard | Navegación programática |
| `useSortable()` | OracionItem | Draggable items |
| `useDroppable()` | Celda | Drop zones |
| `useSensor()` | Dashboard | Configurar sensors D&D |

---

## Recursos Adicionales

- [React Hooks Docs](https://react.dev/reference/react)
- [React Router Docs](https://reactrouter.com/)
- [Axios Docs](https://axios-http.com/)
- [dnd-kit Docs](https://docs.dndkit.com/)
- [Vite Docs](https://vitejs.dev/)
