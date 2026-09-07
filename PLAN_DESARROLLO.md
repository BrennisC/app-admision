# Plan de desarrollo del TPS de Admision y Tesoreria

Este plan lleva el repositorio actual desde una aplicacion Next.js minima hasta un MVP capaz de registrar postulantes, inscripciones y pagos sobre XLSX. La persistencia en Excel es transitoria: las reglas de negocio no dependeran de ExcelJS, de modo que PostgreSQL pueda reemplazarla sin reescribir los casos de uso.

## Resultado del MVP

Un usuario autorizado podra completar este flujo:

```text
Postulante -> Inscripcion -> Orden de pago -> Pago -> Comprobante
            -> Confirmacion -> Puntaje -> Resultado
```

El MVP termina cuando el flujo funciona de extremo a extremo, conserva trazabilidad y puede recuperarse ante un fallo de escritura.

## Estado inicial verificado

| Elemento | Estado |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript y Tailwind CSS 4 |
| Backend | No existe todavia |
| Gestor del workspace | pnpm 10 |
| Fuente de datos | `postulantes.xlsx` |
| Hoja existente | `postulantes` |
| Registros existentes | 7,693 |
| Columnas existentes | ID, Convocatoria, Nombres, Apellidos, DNI, Facultad, Carrera, Tipo de colegio, Costo, Voucher, Fecha, Puntaje, Estado |

El libro actual es una fuente historica desnormalizada. No se debe reemplazar ni modificar directamente durante la construccion inicial.

## Alcance

### Incluido en el MVP

- Autenticacion y autorizacion por roles.
- Consulta, registro y edicion de postulantes.
- Gestion de convocatorias, facultades, carreras y conceptos de pago.
- Registro de inscripciones y generacion de ordenes de pago.
- Apertura de caja, registro de pagos, movimientos y cierre de caja.
- Emision de comprobantes PDF.
- Registro e importacion de resultados.
- Auditoria de operaciones criticas.
- Dashboard operativo y reportes esenciales.
- Importacion inicial desde `postulantes.xlsx`.

### Fuera del MVP

- Pago en linea con pasarela bancaria.
- Facturacion electronica integrada con SUNAT.
- Portal de autoservicio para postulantes.
- Aplicacion movil.
- Despliegue con varias instancias del backend mientras XLSX sea la persistencia principal.

## Arquitectura objetivo

```text
frontend (Next.js)
        |
        | REST / JSON
        v
backend (NestJS)
        |
        | casos de uso + contratos de repositorio
        v
adaptador ExcelJS ----------------> sistema_admision.xlsx
        |
        `---- reemplazo futuro ----> PostgreSQL + Prisma
```

### Regla de dependencia

Los servicios de negocio dependeran de contratos como `PostulanteRepository` o `PagoRepository`, no de `ExcelService`. ExcelJS sera una implementacion de esos contratos dentro de infraestructura.

```text
PagosService -> PagoRepository -> ExcelPagoRepository -> ExcelWorkbookService
```

Al migrar, `ExcelPagoRepository` se reemplazara por `PrismaPagoRepository`; el controlador y las reglas del pago permaneceran iguales.

### Estructura prevista

```text
app-admision/
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- services/
|   `-- types/
|-- backend/
|   |-- src/
|   |   |-- auth/
|   |   |-- usuarios/
|   |   |-- postulantes/
|   |   |-- convocatorias/
|   |   |-- carreras/
|   |   |-- inscripciones/
|   |   |-- tesoreria/
|   |   |-- caja/
|   |   |-- resultados/
|   |   |-- auditoria/
|   |   `-- infrastructure/excel/
|   |-- data/
|   |   |-- source/postulantes.xlsx
|   |   |-- backups/
|   |   `-- sistema_admision.xlsx
|   `-- test/
|-- packages/
|   `-- contracts/
`-- pnpm-workspace.yaml
```

`packages/contracts` solo contendra tipos compartidos estables si realmente se necesitan. No debe convertirse en un segundo modelo de dominio.

## Modelo de datos inicial

El libro `sistema_admision.xlsx` tendra estas hojas:

| Hoja | Responsabilidad | Clave principal |
| --- | --- | --- |
| `postulantes` | Datos personales del postulante | `id_postulante` |
| `convocatorias` | Periodos de admision | `id_convocatoria` |
| `facultades` | Catalogo de facultades | `id_facultad` |
| `carreras` | Catalogo de carreras | `id_carrera` |
| `inscripciones` | Postulacion a una convocatoria y carrera | `id_inscripcion` |
| `conceptos_pago` | Tarifas cobrables | `id_concepto` |
| `ordenes_pago` | Deuda generada por una inscripcion | `id_orden` |
| `pagos` | Pago aplicado a una orden | `id_pago` |
| `cajas` | Turnos de caja | `id_caja` |
| `movimientos_caja` | Ingresos, egresos y reversos | `id_movimiento` |
| `resultados` | Puntaje, puesto y condicion | `id_resultado` |
| `usuarios` | Acceso y rol | `id_usuario` |
| `auditoria` | Trazabilidad inmutable | `id_auditoria` |

### Restricciones esenciales

- `postulantes.dni` sera unico y se almacenara como texto.
- Una persona tendra como maximo una inscripcion activa por convocatoria.
- Cada orden tendra un codigo unico con formato `OP-{ANIO}-{CORRELATIVO}`.
- Un pago confirmado no se editara; cualquier correccion generara anulacion o devolucion.
- Una caja cerrada no aceptara movimientos.
- El monto se almacenara como numero decimal, sin `S/` dentro de la celda.
- Fechas y horas se normalizaran en ISO 8601 en la API.
- Los estados se validaran mediante enumeraciones, no como texto libre.
- La auditoria sera de solo insercion para los usuarios funcionales.

## Seguridad y consistencia del XLSX

Excel no ofrece transacciones ni control de concurrencia. Mientras sea la base principal se aplicaran estas reglas:

- Ejecutar una sola instancia del backend.
- Serializar todas las escrituras con un bloqueo exclusivo en proceso.
- Cargar, validar y modificar el libro dentro de una unica operacion critica.
- Guardar primero en un archivo temporal y reemplazar el libro solo al completar la escritura.
- Crear una copia de seguridad antes de cada operacion financiera y aplicar retencion configurable.
- Rechazar el pago completo si falla cualquier actualizacion de orden, inscripcion, caja o auditoria.
- No abrir ni editar manualmente `sistema_admision.xlsx` mientras el backend este ejecutandose.
- Registrar errores estructurados sin incluir contrasenas, JWT ni datos sensibles completos.

Estas medidas reducen el riesgo, pero no convierten Excel en una base multiusuario. Si se necesitan varias instancias o alta concurrencia, PostgreSQL deja de ser una fase opcional y pasa a ser un requisito previo.

## Plan por fases

### Fase 0 - Base tecnica

**Objetivo:** dejar frontend, backend y herramientas ejecutandose desde el workspace.

**Entregables:**

- Reubicar la aplicacion Next.js existente en `frontend/` sin cambiar su comportamiento.
- Crear `backend/` con NestJS, validacion global, Swagger y configuracion por entorno.
- Configurar scripts raiz para desarrollo, lint, pruebas y build.
- Definir variables como `API_PORT`, `JWT_SECRET`, `WORKBOOK_PATH` y `BACKUP_PATH`.
- Agregar pruebas de salud para `GET /health`.

**Criterio de salida:** frontend y backend arrancan juntos; lint, pruebas y build base finalizan correctamente.

### Fase 1 - Persistencia XLSX e importacion

**Objetivo:** construir una persistencia segura y reproducible.

**Entregables:**

- Crear los contratos de repositorio y `ExcelWorkbookService`.
- Crear el libro normalizado con encabezados y catalogos iniciales.
- Implementar bloqueo, escritura temporal, reemplazo atomico y respaldo.
- Crear un importador idempotente para los 7,693 registros historicos.
- Generar un reporte de filas importadas, rechazadas, duplicadas y datos sin equivalencia.
- Conservar `postulantes.xlsx` como fuente de solo lectura.

**Criterio de salida:** dos ejecuciones del importador producen el mismo resultado y no duplican registros; una escritura interrumpida no corrompe el libro vigente.

### Fase 2 - Identidad y auditoria base

**Objetivo:** proteger las operaciones antes de incorporar movimientos financieros.

**Entregables:**

- Login con JWT y contrasenas bcrypt.
- Roles `ADMIN`, `ADMISION`, `TESORERIA`, `CAJERO` y `CONSULTA`.
- Guards por autenticacion y rol.
- Usuario administrador inicial creado por comando de inicializacion, no con clave fija en el repositorio.
- Auditoria de inicio de sesion y mutaciones.

**Criterio de salida:** los endpoints privados rechazan usuarios anonimos y cada rol solo ejecuta acciones autorizadas.

### Fase 3 - Postulantes

**Objetivo:** alcanzar el primer incremento visible y util.

**Entregables:**

- API para listar, buscar por ID o DNI, registrar y editar.
- Paginacion, busqueda por DNI/nombre/apellido y filtros de estado.
- Validacion de DNI duplicado y DTOs documentados en Swagger.
- Pantalla responsive de listado con estados de carga, vacio y error.
- Formularios de alta y edicion.

**Criterio de salida:** la web consulta los 7,693 registros mediante `GET /postulantes`, puede crear y editar sin duplicar DNI y registra auditoria.

### Fase 4 - Catalogos e inscripciones

**Objetivo:** registrar una postulacion valida.

**Entregables:**

- CRUD de convocatorias, facultades, carreras y conceptos de pago.
- Relaciones de carrera con facultad y vigencia por estado.
- Alta y consulta de inscripciones.
- Validacion de convocatoria vigente, carrera activa y duplicidad.
- Formulario guiado por DNI, convocatoria, carrera y modalidad.

**Criterio de salida:** una inscripcion valida queda en `PENDIENTE_PAGO`; una combinacion invalida no modifica el libro.

### Fase 5 - Ordenes de pago

**Objetivo:** generar deuda trazable a partir de una inscripcion.

**Entregables:**

- Generacion automatica e idempotente de orden al crear la inscripcion.
- Correlativo unico, monto copiado desde el concepto y fecha de vencimiento.
- Consulta por codigo, DNI, inscripcion y estado.
- Anulacion controlada de ordenes sin pago.

**Criterio de salida:** reintentar la operacion no crea dos ordenes para la misma inscripcion y concepto.

### Fase 6 - Caja, pagos y comprobante

**Objetivo:** completar el flujo financiero en una sola operacion consistente.

**Entregables:**

- Apertura y cierre de caja con arqueo.
- Busqueda de deuda pendiente por DNI o codigo de orden.
- Registro de pago para efectivo, transferencia, banco, Yape, Plin y tarjeta.
- Validacion de caja abierta, monto, voucher obligatorio segun metodo y orden pendiente.
- Actualizacion conjunta de pago, orden, inscripcion, movimiento y auditoria.
- Comprobante PDF con codigo verificable e impresion posterior sin duplicar el pago.
- Anulacion y devolucion como operaciones compensatorias.

**Criterio de salida:** un pago exitoso deja orden `PAGADA`, inscripcion `PAGADO`, movimiento de caja y auditoria; ante cualquier fallo no queda un estado parcial visible.

### Fase 7 - Confirmacion y resultados

**Objetivo:** cerrar el ciclo academico de la inscripcion.

**Entregables:**

- Confirmacion de inscripciones pagadas.
- Registro individual e importacion masiva de puntajes.
- Validacion y vista previa antes de importar.
- Calculo o carga de puesto y condicion segun reglas aprobadas de cada convocatoria.
- Listados de ingresantes, no ingresantes y ausentes.

**Criterio de salida:** solo una inscripcion confirmada puede recibir resultado y una importacion invalida no aplica cambios parciales.

### Fase 8 - Dashboard y reportes

**Objetivo:** ofrecer informacion operativa verificable.

**Entregables:**

- Indicadores de postulantes, inscripciones, resultados y recaudacion.
- Filtros por convocatoria, carrera, facultad y rango de fechas.
- Reportes de postulantes, resultados, pagos, pendientes y caja diaria.
- Exportacion XLSX y PDF a partir de la API.

**Criterio de salida:** cada total del dashboard puede reconciliarse con su reporte detallado usando los mismos filtros.

### Fase 9 - Estabilizacion y entrega

**Objetivo:** preparar el sistema para uso controlado.

**Entregables:**

- Pruebas end-to-end del flujo completo y de permisos.
- Pruebas de recuperacion ante fallo de escritura.
- Restauracion verificada desde respaldo.
- Manual operativo y matriz de roles.
- Registro de decisiones y limitaciones conocidas.
- Ensayo de migracion de los datos normalizados a PostgreSQL.

**Criterio de salida:** los usuarios responsables aceptan el flujo, los respaldos se restauran y no quedan defectos criticos abiertos.

## Orden de los primeros incrementos

| Incremento | Demostracion | Dependencias |
| --- | --- | --- |
| 1 | `GET /health` y frontend conectado | Fase 0 |
| 2 | Importacion repetible de 7,693 registros | Fases 0-1 |
| 3 | Login y permisos | Fase 2 |
| 4 | Tabla y formulario de postulantes | Fases 1-3 |
| 5 | Inscripcion con orden pendiente | Fases 3-5 |
| 6 | Apertura de caja y pago con comprobante | Fase 6 |
| 7 | Confirmacion y resultado | Fase 7 |
| 8 | Dashboard y reportes reconciliables | Fase 8 |

## API minima del MVP

```http
POST   /auth/login
GET    /health

GET    /postulantes
GET    /postulantes/:id
GET    /postulantes/dni/:dni
POST   /postulantes
PATCH  /postulantes/:id

GET    /convocatorias
POST   /convocatorias
PATCH  /convocatorias/:id
GET    /facultades
GET    /carreras
POST   /carreras
PATCH  /carreras/:id
GET    /conceptos-pago
POST   /conceptos-pago

GET    /inscripciones
GET    /inscripciones/:id
POST   /inscripciones
POST   /inscripciones/:id/confirmacion

GET    /ordenes-pago
GET    /ordenes-pago/:id
POST   /ordenes-pago/:id/anulacion

POST   /cajas/apertura
POST   /cajas/:id/cierre
GET    /cajas/:id/movimientos
POST   /pagos
GET    /pagos
GET    /pagos/:id
GET    /pagos/:id/comprobante
POST   /pagos/:id/anulacion

POST   /resultados/importacion
GET    /resultados
GET    /auditoria
GET    /reportes/:tipo
```

La creacion de una inscripcion debe generar su orden dentro del mismo caso de uso. No se expone un `POST /ordenes-pago` generico para evitar deuda sin una causa de negocio valida.

## Estrategia de pruebas

| Nivel | Que protege |
| --- | --- |
| Unitarias | Estados, montos, correlativos, roles y reglas de inscripcion/pago |
| Integracion | Repositorios XLSX sobre libros temporales y recuperacion de escritura |
| API | Validaciones, codigos HTTP, autenticacion e idempotencia |
| End-to-end | Flujo postulante a resultado y permisos por rol |
| Reconciliacion | Igualdad entre pagos, movimientos de caja, reportes y dashboard |

Cada fase debe agregar pruebas con sus reglas; no se reservara una fase final para empezar a probar.

## Definition of Done

Una historia se considera terminada cuando:

- Cumple sus criterios de aceptacion y permisos.
- Incluye validaciones y manejo de errores esperados.
- Tiene pruebas de comportamiento relevantes.
- No rompe lint, pruebas ni build.
- Documenta su endpoint en Swagger.
- Registra auditoria cuando modifica datos sensibles o financieros.
- Mantiene el libro consistente ante reintentos y fallos conocidos.

## Riesgos y decisiones pendientes

| Riesgo o decision | Tratamiento |
| --- | --- |
| Mapeo de estados historicos | Definir tabla de equivalencias antes de importar |
| Registros historicos sin DNI valido | Rechazar o marcar para revision; nunca inventar DNI |
| Reglas para puesto e ingresante | Deben ser aprobadas por Admision antes de automatizarlas |
| Numeracion del comprobante | Confirmar si es recibo interno o documento regulado |
| Retencion de datos personales | Definir accesos, respaldos y periodo de conservacion |
| Concurrencia de cajeros | Medir en piloto; migrar a PostgreSQL antes de escalar |

## Primer bloque de trabajo

El primer bloque implementable comprende las fases 0 y 1:

- Estructurar el workspace con `frontend/` y `backend/`.
- Crear NestJS con `GET /health` y Swagger.
- Implementar contratos de repositorio y la infraestructura XLSX segura.
- Crear `sistema_admision.xlsx` sin alterar el archivo fuente.
- Importar y validar los 7,693 registros historicos.
- Dejar automatizados lint, pruebas y build.

Solo despues de validar este bloque se inicia autenticacion y el modulo de postulantes.
