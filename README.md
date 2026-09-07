# Sistema de Admision

Primer incremento funcional del TPS de Admision y Tesoreria. La aplicacion consulta los 7,693 registros historicos de `postulantes.xlsx` mediante una API NestJS y los presenta en una interfaz Next.js con busqueda, filtros y paginacion.

## Requisitos

- Node.js 20 o superior.
- pnpm 10.
- `postulantes.xlsx` en la raiz del proyecto con una hoja llamada `postulantes`.

## Inicio rapido

```bash
pnpm install
pnpm dev
```

Servicios disponibles:

| Servicio | URL |
| --- | --- |
| Aplicacion web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |
| Estado de la API | http://localhost:3001/health |

## Comandos

```bash
pnpm dev          # Inicia frontend y backend
pnpm lint         # Valida ambos proyectos
pnpm test         # Ejecuta pruebas del backend
pnpm build        # Compila frontend y backend
pnpm dev:web      # Inicia solo Next.js
pnpm dev:api      # Inicia solo NestJS
```

## API implementada

```http
GET /health
GET /postulantes?page=1&limit=20
GET /postulantes?search=nombre&estado=Ingresante
GET /postulantes/dni/:dni
GET /postulantes/:id
```

La API mantiene el libro en modo de solo lectura y conserva una cache que se invalida cuando cambia la fecha de modificacion del archivo.

## Configuracion

Copia las variables requeridas desde `backend/.env.example` si necesitas cambiar puertos, origen CORS o ubicacion del XLSX. El frontend usa `NEXT_PUBLIC_API_URL`; su valor predeterminado es `http://localhost:3001`.

## Arquitectura

El modulo de postulantes depende del contrato `PostulanteRepository`. `ExcelPostulanteRepository` es solamente el adaptador actual, por lo que una futura implementacion con Prisma puede reemplazarlo sin modificar el controlador ni el servicio de aplicacion.

Consulta `PLAN_DESARROLLO.md` para ver las siguientes fases del TPS.
