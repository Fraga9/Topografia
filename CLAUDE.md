# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional topographic management system for CEMEX, designed for quality control in road construction projects. The system handles station measurements, elevation calculations, and compliance analysis according to SCT tolerances.

### Architecture
- **Frontend**: React 19 + Vite + TanStack Query + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Supabase Auth
- **Database**: PostgreSQL with Supabase (Row Level Security enabled)
- **Authentication**: Supabase JWT tokens

## Development Commands

### Frontend (topografia-frontend/)
```bash
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (topografia-backend/)
```bash
pip install -r requirements.txt    # Install dependencies
uvicorn main:app --reload          # Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000  # Development with external access
python main.py                     # Alternative start method
```

### Database Setup
The project uses Supabase PostgreSQL with automatic table creation on startup. No manual migration commands are needed as SQLAlchemy handles table creation automatically.

## Key Architecture Patterns

### Frontend Hook-Based Architecture
The frontend follows a specialized hook pattern where each domain has its own hooks:
- `hooks/auth/` - Authentication (useAuth, useLogin, useLogout)
- `hooks/proyectos/` - Projects (useProyectos, useProyecto, useCreateProyecto)
- `hooks/estaciones/` - Stations (useEstaciones, useEstacion, useCreateEstacion)
- `hooks/mediciones/` - Measurements (useMediciones, useCreateMedicion)
- `hooks/lecturas/` - Readings (useLecturas, useCreateLectura)

### Backend Modular Structure
- `models/` - SQLAlchemy models with automatic calculations
- `schemas/` - Pydantic schemas for validation
- `routers/` - FastAPI routers with CRUD operations
- `auth.py` - Supabase JWT authentication middleware
- `database.py` - Database connection and session management

### State Management
- **TanStack Query** for server state (cache, optimistic updates, background refetching)
- **React Context** for authentication state
- **Zustand** for complex client state when needed

## Authentication Flow

All API endpoints except public ones (`/`, `/health`, `/info`, `/status`, `/auth/test`) require Supabase JWT authentication:
```
Authorization: Bearer <supabase_jwt_token>
```

Row Level Security (RLS) is enabled in Supabase, ensuring users only access their own data.

## Data Model Relationships

1. **Usuario** (User Profiles)
   - ↓ Has many Proyectos
2. **Proyecto** (Projects)
   - ↓ Has many Estaciones Teóricas
   - ↓ Has many Mediciones
3. **Estación Teórica** (Theoretical Stations)
   - Design reference points with KM positions and elevations
4. **Medición** (Field Measurements)
   - ↓ Has many Lecturas
   - Contains station setup data (banco de nivel)
5. **Lectura** (Division Readings)
   - Individual survey readings at cross-sectional divisions

## Automatic Calculations

### Database Triggers Handle
- **Mediciones**: `altura_aparato = bn_altura + bn_lectura`
- **Lecturas**: `elv_base_real = altura_aparato - lectura_mira`
- **Proyectos**: `total_estaciones` calculated from KM range and intervals

### Frontend Services
- `calculationService.js` - Complex topographic calculations
- `unitConversion.js` - Unit conversions for survey data
- Volume calculations using Simpson's method
- SCT tolerance compliance checking

## Important Development Notes

### Frontend Conventions
- Use hooks for all server state management
- Follow the established hook naming pattern (`useEntityName`)
- Implement optimistic updates for better UX
- Use TanStack Query DevTools in development
- All forms use React Hook Form with custom validators

### Backend Conventions
- All protected endpoints use `get_current_user` dependency
- Follow CRUD pattern: GET, POST, PUT, PATCH, DELETE
- Use Pydantic schemas for request/response validation
- Implement proper error handling with meaningful messages
- Use SQLAlchemy relationships for efficient queries

### API Testing
- Interactive docs available at `/docs` (Swagger UI)
- Alternative docs at `/redoc`
- Use `/auth/test` to understand authentication requirements
- Health check at `/health` for system monitoring

## Common Workflows

### Adding New Entities
1. Create SQLAlchemy model in `models/`
2. Create Pydantic schemas in `schemas/`
3. Create router with CRUD operations in `routers/`
4. Add router to `main.py`
5. Create specialized hooks in `hooks/`
6. Implement UI components using the hooks

### Testing API Endpoints
Use the automatically generated documentation at `http://localhost:8000/docs` for interactive testing, or refer to `API_TESTING.md` for curl examples.

### Working with Calculations
Topographic calculations are handled automatically by database triggers for basic operations. Complex calculations are implemented in frontend services. Always validate against SCT tolerances for compliance.