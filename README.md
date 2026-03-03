# 🏐 Liga Nacional de Voleibol de Playa - Versión PRO

Sistema profesional de gestión de torneos con base de datos en la nube, autenticación y actualización en tiempo real.

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Real-time**: Supabase Realtime Subscriptions
- **Auth**: Supabase Authentication
- **Routing**: React Router DOM
- **Icons**: Lucide React

---

## 📋 Características Principales

### ✅ Vista Pública (Sin Login)
- 📊 Rankings nacionales por categoría y género
- 🏆 Tablas de posiciones en tiempo real
- 📅 Fixture de partidos
- 🔴 Resultados en vivo
- 📱 Diseño Mobile First

### ✅ Vista Administrador (Protegida)
- 👥 Gestión de jugadores (CRUD)
- 🎯 Creación de torneos
- 🤝 Inscripción de duplas
- ⚡ Sistema serpiente automático
- 📝 Ingreso rápido de resultados
- 🔄 Actualización automática de standings
- 🏁 Cierre de fases y generación de playoffs

### ✅ Lógica Avanzada
- 🎲 Algoritmo serpiente (Snake Seeding)
- 📊 Cálculo de standings según reglas FIVB:
  1. Partidos Ganados (PG)
  2. Ratio de Sets (SF/SC)
  3. Ratio de Puntos (PF/PC)
  4. Enfrentamiento directo
- ✓ Validación de scores (21+ pts, diff 2)
- 🔄 Realtime updates con WebSockets

---

## 🗄️ Schema de Base de Datos

```sql
players          -- Jugadores con ranking individual
tournaments      -- Torneos/Etapas
teams            -- Duplas por torneo
groups           -- Grupos (A, B, C...)
team_groups      -- Relación N:M equipos-grupos
matches          -- Partidos con scores set por set
standings        -- Tablas de posiciones (auto-calculadas)
ranking_history  -- Historial de puntos
```

### Relaciones Principales:
- Un torneo tiene muchos equipos
- Un grupo pertenece a un torneo
- Un partido tiene 2 equipos
- Los standings se calculan automáticamente vía trigger

---

## 🔧 Instalación

### 1. Prerequisitos
```bash
- Node.js 18+
- Cuenta en Supabase (gratis)
```

### 2. Clonar y Setup
```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 3. Configurar Supabase

#### A. Crear proyecto en Supabase
1. Ve a https://app.supabase.com
2. Click en "New Project"
3. Espera 2 minutos mientras se crea

#### B. Ejecutar el Schema
1. En Supabase Dashboard → SQL Editor
2. Copia y pega todo el contenido de `supabase/schema.sql`
3. Click en "Run"

#### C. Configurar Autenticación
1. Supabase Dashboard → Authentication → Providers
2. Habilita "Email"
3. Crea un usuario admin:
   - Settings → Authentication → Add user
   - Email: admin@volleyball.com
   - Password: (tu contraseña segura)

#### D. Obtener Keys
1. Settings → API
2. Copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
3. Pégalos en tu archivo `.env`

### 4. Ejecutar la App
```bash
npm run dev
```

Abre: `http://localhost:5173`

---

## 🎯 Uso de la Aplicación

### Como Usuario Público

1. **Ver Torneos Activos**
   - Página principal muestra todos los torneos
   - Click en un torneo para ver detalles

2. **Ver Tablas de Posiciones**
   - Dentro de cada torneo → Tab "Grupos"
   - Ver standings actualizados en tiempo real
   - Todos los criterios FIVB visibles

3. **Ver Fixture**
   - Tab "Partidos" muestra todos los matches
   - Filtrar por grupo o estado
   - Ver resultados en vivo

### Como Administrador

1. **Login**
   - Click en "Admin" en el header
   - Ingresar credenciales
   - Acceso al dashboard

2. **Crear Torneo**
   ```
   Dashboard → Torneos → Nuevo Torneo
   - Nombre: "Parada 1 - Mollendo"
   - Categoría: U17
   - Género: Masculino
   - Número de grupos: 2
   ```

3. **Inscribir Duplas**
   ```
   Torneo → Inscripción
   - Seleccionar Jugador 1
   - Seleccionar Jugador 2
   - El puntaje combinado se calcula automáticamente
   ```

4. **Generar Grupos**
   ```
   Una vez inscritas las duplas:
   - Click "Generar Grupos (Sistema Serpiente)"
   - Los equipos se distribuyen automáticamente
   - Se crean los partidos round-robin
   ```

5. **Ingresar Resultados**
   ```
   Dashboard → Partidos → Seleccionar partido
   - Set 1: 21-18
   - Set 2: 19-21
   - Set 3: 15-13
   - Al guardar:
     ✓ Se determina el ganador
     ✓ Se actualiza la tabla automáticamente
     ✓ Los cambios son visibles en tiempo real
   ```

6. **Cerrar Fase de Grupos**
   ```
   Una vez finalizados todos los partidos de grupos:
   - Click "Cerrar Fase de Grupos"
   - Se clasifican los 1ros y 2dos de cada grupo
   - Se generan cuartos de final automáticamente
   ```

---

## 📊 Algoritmo de Standings

La función `calculateGroupStandings()` en `src/utils/standings.ts` implementa:

### Cálculo de Estadísticas:
```typescript
Para cada partido finalizado:
  1. Contar sets ganados (quien gana un set: score_a > score_b)
  2. Sumar puntos totales (set1 + set2 + set3)
  3. Determinar ganador (quien gane 2 sets)
  4. Actualizar:
     - Partidos Jugados
     - Partidos Ganados/Perdidos
     - Sets Favor/Contra
     - Puntos Favor/Contra
```

### Criterios de Ordenamiento (FIVB):
```typescript
1. Mayor Partidos Ganados
   ↓ (si empate)
2. Mayor Ratio Sets (Sets Favor / Sets Contra)
   ↓ (si empate)
3. Mayor Ratio Puntos (Puntos Favor / Puntos Contra)
   ↓ (si empate)
4. Enfrentamiento Directo
```

### Cálculo de Ratios:
```typescript
Ratio Sets = Sets Favor / Sets Contra
Ratio Puntos = Puntos Favor / Puntos Contra

Si Sets Contra = 0 → Ratio = Sets Favor
Si Puntos Contra = 0 → Ratio = Puntos Favor
```

---

## 🔄 Real-time Updates

### Cómo Funciona:
```typescript
1. Usuario Admin ingresa resultado
   ↓
2. Se ejecuta mutation de TanStack Query
   ↓
3. Se actualiza la BD en Supabase
   ↓
4. Trigger SQL recalcula standings automáticamente
   ↓
5. Supabase Realtime notifica a clientes conectados
   ↓
6. React Query invalida cache
   ↓
7. UI se actualiza automáticamente en TODOS los dispositivos
```

### Suscripciones Activas:
- `useTournamentRealtime(tournamentId)` - Cambios en torneos
- `useMatchesRealtime(tournamentId)` - Cambios en partidos
- `useStandingsRealtime(groupId)` - Cambios en standings

---

## 🔐 Seguridad (Row Level Security)

### Políticas Implementadas:

```sql
-- LECTURA: Todos pueden leer (público)
CREATE POLICY "Public read access" ON [tabla] FOR SELECT USING (true);

-- ESCRITURA: Solo usuarios autenticados
CREATE POLICY "Authenticated users can insert/update/delete" 
ON [tabla] FOR [INSERT/UPDATE/DELETE] 
TO authenticated USING (true);
```

### Verificación:
- Los usuarios no autenticados solo pueden hacer SELECT
- Las mutaciones (INSERT/UPDATE/DELETE) requieren auth token
- Supabase valida el token en cada request

---

## 📁 Estructura del Proyecto

```
volleyball-pro/
├── src/
│   ├── components/
│   │   ├── public/
│   │   │   └── StandingsTable.tsx     # Tabla de posiciones
│   │   ├── admin/
│   │   │   └── MatchScoreInput.tsx    # Input de resultados
│   │   └── shared/                     # Componentes compartidos
│   ├── hooks/
│   │   ├── useTournaments.ts           # Queries de torneos
│   │   ├── useMatches.ts               # Queries de partidos
│   │   └── useStandings.ts             # Queries de standings
│   ├── lib/
│   │   └── supabase.ts                 # Cliente de Supabase
│   ├── types/
│   │   └── database.ts                 # Tipos TypeScript
│   └── utils/
│       └── standings.ts                # Lógica de cálculos
├── supabase/
│   └── schema.sql                      # Schema completo de BD
├── package.json
├── .env.example
└── README.md
```

---

## 🧪 Testing del Algoritmo

### Test Manual:

```typescript
// Datos de prueba
Equipo A vs Equipo B
Set 1: 21-18 → Ganador: A (1-0)
Set 2: 19-21 → Ganador: B (1-1)
Set 3: 15-12 → Ganador: A (2-1)

// Estadísticas esperadas:
Team A:
- PG: 1, PP: 0
- SF: 2, SC: 1 → Ratio: 2.000
- PF: 55, PC: 51 → Ratio: 1.078

Team B:
- PG: 0, PP: 1
- SF: 1, SC: 2 → Ratio: 0.500
- PF: 51, PC: 55 → Ratio: 0.927
```

### Validación de Scores:

```typescript
validateSetScore(21, 19) → true  ✓
validateSetScore(25, 23) → true  ✓
validateSetScore(20, 18) → false ✗ (< 21)
validateSetScore(21, 20) → false ✗ (diff < 2)
```

---

## 🚀 Deployment

### Opción 1: Vercel (Recomendado)
```bash
# Conectar con GitHub
vercel

# Variables de entorno:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Opción 2: Netlify
```bash
netlify deploy --prod

# En Netlify Dashboard → Environment Variables
```

---

## 📝 Scripts Disponibles

```bash
npm run dev       # Desarrollo local
npm run build     # Compilar producción
npm run preview   # Preview del build
npm run lint      # ESLint
```

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
**Solución**: Verifica que `.env` exista y tenga las keys correctas

### Error: "Failed to connect to Supabase"
**Solución**: Verifica que la URL de Supabase sea correcta (debe incluir https://)

### Standings no se actualizan
**Solución**: 
1. Verifica que el trigger SQL esté creado
2. Revisa la consola del navegador
3. Verifica que el partido esté marcado como "finalizado"

### Real-time no funciona
**Solución**:
1. Supabase Dashboard → Database → Replication
2. Verifica que las tablas tengan Realtime habilitado

---

## 🎓 Conceptos Clave Implementados

- ✅ PostgreSQL con triggers automáticos
- ✅ Row Level Security (RLS)
- ✅ Realtime WebSockets
- ✅ Optimistic Updates
- ✅ Server State Management con React Query
- ✅ TypeScript strict mode
- ✅ Computed columns en SQL
- ✅ Foreign keys y CASCADE
- ✅ Transacciones atómicas
- ✅ Índices para performance

---

## 📞 Soporte

Para bugs o dudas:
1. Revisar este README
2. Revisar comentarios en el código
3. Revisar logs de Supabase Dashboard

---

## 🔥 Próximas Mejoras

- [ ] Export a PDF de brackets
- [ ] Gráficos de estadísticas
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con cámaras de streaming
- [ ] Sistema de árbitros
- [ ] Multi-idioma

---

*Desarrollado con ❤️ para la Liga Nacional de Menores de Voleibol de Playa*
*Versión 2.0.0 - Febrero 2026*
