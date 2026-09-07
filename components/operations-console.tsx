"use client";

import { useEffect, useState } from "react";

type Screen = "postulante" | "inscripcion" | "ordenes" | "tesoreria" | "resultados" | "catalogos" | "usuarios" | "auditoria";
type Row = Record<string, string | number | boolean | null>;

interface Catalogs {
  convocatorias: Row[];
  facultades: Row[];
  carreras: Row[];
  conceptosPago: Row[];
}

interface Resources {
  catalogos: Catalogs;
  inscripciones: Row[];
  ordenes: Row[];
  cajas: Row[];
  pagos: Row[];
  resultados: Row[];
  auditoria: Row[];
  usuarios: Row[];
  dashboard: Row;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const EMPTY_RESOURCES: Resources = {
  catalogos: { convocatorias: [], facultades: [], carreras: [], conceptosPago: [] },
  inscripciones: [], ordenes: [], cajas: [], pagos: [], resultados: [], auditoria: [], usuarios: [], dashboard: {},
};

const SCREENS: { id: Screen; label: string; step: string }[] = [
  { id: "postulante", label: "Nuevo postulante", step: "01" },
  { id: "inscripcion", label: "Inscripción", step: "02" },
  { id: "ordenes", label: "Órdenes", step: "03" },
  { id: "tesoreria", label: "Caja y pago", step: "04" },
  { id: "resultados", label: "Resultados", step: "05" },
  { id: "catalogos", label: "Catálogos", step: "—" },
  { id: "usuarios", label: "Usuarios", step: "—" },
  { id: "auditoria", label: "Auditoría", step: "—" },
];

export function OperationsConsole({ token }: { token: string }) {
  const [screen, setScreen] = useState<Screen>("inscripcion");
  const [resources, setResources] = useState<Resources>(EMPTY_RESOURCES);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string }>();
  const [loading, setLoading] = useState(true);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
    });
    const body = await response.json() as T & { message?: string | string[] };
    if (!response.ok) {
      const message = Array.isArray(body.message) ? body.message.join(". ") : body.message;
      throw new Error(message ?? "La operación no pudo completarse");
    }
    return body;
  }

  async function refresh() {
    setLoading(true);
    const paths = ["/catalogos", "/inscripciones", "/ordenes-pago", "/cajas", "/pagos", "/resultados", "/dashboard"];
    try {
      const [catalogos, inscripciones, ordenes, cajas, pagos, resultados, dashboard] = await Promise.all(paths.map((path) => api<unknown>(path)));
      let auditoria: Row[] = [];
      let usuarios: Row[] = [];
      try { auditoria = await api<Row[]>("/auditoria"); } catch { /* Visible only to administrators. */ }
      try { usuarios = await api<Row[]>("/usuarios"); } catch { /* Visible only to administrators. */ }
      setResources({ catalogos: catalogos as Catalogs, inscripciones: inscripciones as Row[], ordenes: ordenes as Row[], cajas: cajas as Row[], pagos: pagos as Row[], resultados: resultados as Row[], auditoria, usuarios, dashboard: dashboard as Row });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "No se pudieron cargar las operaciones" });
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const openScreen = (event: Event) => setScreen((event as CustomEvent<Screen>).detail);
    window.addEventListener("open-operation", openScreen);
    return () => { window.clearTimeout(timer); window.removeEventListener("open-operation", openScreen); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(path: string, data: Row, success: string, method = "POST") {
    setNotice(undefined);
    try {
      await api(path, { method, body: JSON.stringify(data) });
      if (path === "/postulantes") window.dispatchEvent(new Event("postulantes-updated"));
      setNotice({ tone: "success", text: success });
      await refresh();
      return true;
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "La operación no pudo completarse" });
      return false;
    }
  }

  return (
    <section className="operations-panel" id="operaciones">
      <div className="workflow-header">
        <div><span className="eyebrow">Flujo operativo</span><h2>Procesar admisión</h2></div>
        <span className="sync-state">{loading ? "Sincronizando..." : "Datos actualizados"}</span>
      </div>
      <div className="workflow-tabs" role="tablist" aria-label="Módulos del sistema">
        {SCREENS.map((item) => (
          <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => { setScreen(item.id); setNotice(undefined); }} role="tab" aria-selected={screen === item.id}>
            <span>{item.step}</span>{item.label}
          </button>
        ))}
      </div>
      {notice && <div className={`operation-notice ${notice.tone}`} role="status">{notice.text}</div>}
      <div className="operation-screen">
        {screen === "postulante" && <ApplicantForm submit={submit} />}
        {screen === "inscripcion" && <EnrollmentScreen resources={resources} api={api} submit={submit} />}
        {screen === "ordenes" && <OrdersScreen orders={resources.ordenes} />}
        {screen === "tesoreria" && <TreasuryScreen resources={resources} api={api} submit={submit} />}
        {screen === "resultados" && <ResultsScreen resources={resources} submit={submit} />}
        {screen === "catalogos" && <CatalogScreen catalogs={resources.catalogos} submit={submit} />}
        {screen === "usuarios" && <UsersScreen rows={resources.usuarios} submit={submit} />}
        {screen === "auditoria" && <AuditScreen rows={resources.auditoria} />}
      </div>
    </section>
  );
}

function ApplicantForm({ submit }: { submit: Submit }) {
  return (
    <ScreenLayout title="Registrar postulante" description="Crea la identidad principal antes de iniciar una inscripción." aside="El DNI debe contener exactamente ocho dígitos y no puede repetirse.">
      <form className="operation-form" onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        const ok = await submit("/postulantes", formObject(form, ["dni", "nombres", "apellidos", "tipoColegio", "telefono", "correo", "direccion", "fechaNacimiento"]), "Postulante registrado correctamente");
        if (ok) event.currentTarget.reset();
      }}>
        <Field label="DNI"><input name="dni" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required /></Field>
        <Field label="Nombres"><input name="nombres" required /></Field>
        <Field label="Apellidos"><input name="apellidos" required /></Field>
        <Field label="Tipo de colegio"><select name="tipoColegio"><option value="">Seleccionar</option><option>ESTATAL</option><option>PRIVADO</option></select></Field>
        <Field label="Teléfono"><input name="telefono" inputMode="tel" /></Field>
        <Field label="Correo"><input name="correo" type="email" /></Field>
        <Field label="Dirección" wide><input name="direccion" /></Field>
        <Field label="Fecha de nacimiento"><input name="fechaNacimiento" type="date" /></Field>
        <FormActions label="Guardar postulante" />
      </form>
    </ScreenLayout>
  );
}

function EnrollmentScreen({ resources, api, submit }: { resources: Resources; api: Api; submit: Submit }) {
  const [dni, setDni] = useState("");
  const [applicant, setApplicant] = useState<Row>();
  const [lookupError, setLookupError] = useState("");
  async function findApplicant() {
    setLookupError(""); setApplicant(undefined);
    try { setApplicant(await api<Row>(`/postulantes/dni/${dni}`)); } catch (error) { setLookupError(error instanceof Error ? error.message : "No encontrado"); }
  }
  return (
    <ScreenLayout title="Crear inscripción" description="Localiza al postulante y genera una orden de pago automáticamente." aside="Una persona solo puede mantener una inscripción activa por convocatoria.">
      <div className="lookup-row"><Field label="DNI del postulante"><input value={dni} onChange={(event) => setDni(event.target.value)} maxLength={8} /></Field><button type="button" className="secondary-button" onClick={findApplicant} disabled={dni.length !== 8}>Buscar persona</button></div>
      {lookupError && <p className="inline-error">{lookupError}</p>}
      {applicant && <div className="found-person"><span>{String(applicant.nombres)[0]}{String(applicant.apellidos)[0]}</span><div><strong>{text(applicant.nombres)} {text(applicant.apellidos)}</strong><small>DNI {text(applicant.dni)} · ID {text(applicant.id)}</small></div></div>}
      <form className="operation-form" id="inscripciones" onSubmit={async (event) => {
        event.preventDefault(); if (!applicant) return;
        const form = new FormData(event.currentTarget);
        await submit("/inscripciones", { idPostulante: number(applicant.id), idConvocatoria: number(form.get("idConvocatoria")), idCarrera: number(form.get("idCarrera")), modalidad: text(form.get("modalidad")), idConcepto: number(form.get("idConcepto")) }, "Inscripción y orden de pago creadas");
      }}>
        <Field label="Convocatoria"><select name="idConvocatoria" required><option value="">Seleccionar</option>{resources.catalogos.convocatorias.map((row) => <option key={text(row.id_convocatoria)} value={text(row.id_convocatoria)}>{text(row.nombre)}</option>)}</select></Field>
        <Field label="Carrera"><select name="idCarrera" required><option value="">Seleccionar</option>{resources.catalogos.carreras.map((row) => <option key={text(row.id_carrera)} value={text(row.id_carrera)}>{text(row.nombre)}</option>)}</select></Field>
        <Field label="Modalidad"><select name="modalidad" required><option value="ORDINARIO">Ordinario</option><option value="PRIMEROS_PUESTOS">Primeros puestos</option><option value="TRASLADO">Traslado</option></select></Field>
        <Field label="Concepto de pago"><select name="idConcepto" required>{resources.catalogos.conceptosPago.map((row) => <option key={text(row.id_concepto)} value={text(row.id_concepto)}>{text(row.descripcion)} · S/ {text(row.monto)}</option>)}</select></Field>
        <FormActions label="Crear inscripción y orden" disabled={!applicant} />
      </form>
    </ScreenLayout>
  );
}

function OrdersScreen({ orders }: { orders: Row[] }) {
  return <ScreenLayout title="Órdenes de pago" description="Deudas generadas desde inscripciones válidas." aside={`${orders.filter((row) => row.estado === "PENDIENTE").length} órdenes pendientes de cobro.`}><DataTable rows={orders} columns={["codigo", "id_inscripcion", "monto", "fecha_vencimiento", "estado"]} /></ScreenLayout>;
}

function TreasuryScreen({ resources, api, submit }: { resources: Resources; api: Api; submit: Submit }) {
  const openCash = resources.cajas.find((row) => row.estado === "ABIERTA");
  const pendingOrders = resources.ordenes.filter((row) => row.estado === "PENDIENTE");
  return (
    <ScreenLayout title="Caja y registro de pago" description="Abre una caja y aplica pagos a órdenes pendientes." aside={openCash ? `Caja ${text(openCash.id_caja)} abierta por ${text(openCash.usuario)}.` : "Debes abrir una caja antes de cobrar."}>
      {!openCash ? (
        <form className="compact-action" id="tesoreria" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await submit("/cajas/apertura", { saldoInicial: number(form.get("saldoInicial")) }, "Caja abierta correctamente"); }}>
          <Field label="Saldo inicial"><input name="saldoInicial" type="number" min="0" step="0.01" defaultValue="0" required /></Field><button className="secondary-button">Abrir caja</button>
        </form>
      ) : (
        <form className="compact-action" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await submit(`/cajas/${text(openCash.id_caja)}/cierre`, { saldoFinal: number(form.get("saldoFinal")) }, "Caja cerrada y arqueada"); }}>
          <Field label="Saldo final declarado"><input name="saldoFinal" type="number" min="0" step="0.01" required /></Field><button className="secondary-button">Cerrar caja</button>
        </form>
      )}
      <form className="operation-form payment-form" onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget); const order = pendingOrders.find((row) => number(row.id_orden) === number(form.get("idOrden")));
        const ok = await submit("/pagos", { idOrden: number(form.get("idOrden")), monto: number(order?.monto), metodoPago: text(form.get("metodoPago")), voucher: text(form.get("voucher")) }, "Pago confirmado y movimiento de caja registrado");
        if (ok) event.currentTarget.reset();
      }}>
        <Field label="Orden pendiente" wide><select name="idOrden" required><option value="">Seleccionar orden</option>{pendingOrders.map((row) => <option key={text(row.id_orden)} value={text(row.id_orden)}>{text(row.codigo)} · S/ {text(row.monto)}</option>)}</select></Field>
        <Field label="Método"><select name="metodoPago"><option>EFECTIVO</option><option>TRANSFERENCIA</option><option>BANCO</option><option>YAPE</option><option>PLIN</option><option>TARJETA</option></select></Field>
        <Field label="Voucher"><input name="voucher" placeholder="Obligatorio excepto efectivo" /></Field>
        <FormActions label="Confirmar pago" disabled={!openCash || !pendingOrders.length} />
      </form>
      <h3 className="subsection-title">Últimos pagos</h3>
      <div className="receipt-list">{resources.pagos.slice(0, 8).map((row) => <div key={text(row.id_pago)}><span><strong>{text(row.codigo_pago)}</strong><small>S/ {Number(row.monto).toFixed(2)} · {text(row.metodo_pago)}</small></span><button onClick={() => void printReceipt(number(row.id_pago), api)}>Ver comprobante</button></div>)}{!resources.pagos.length && <div className="mini-empty">Todavía no hay pagos.</div>}</div>
    </ScreenLayout>
  );
}

function ResultsScreen({ resources, submit }: { resources: Resources; submit: Submit }) {
  const confirmable = resources.inscripciones.filter((row) => row.estado === "PAGADO");
  const confirmed = resources.inscripciones.filter((row) => row.estado === "CONFIRMADO" && !resources.resultados.some((result) => number(result.id_inscripcion) === number(row.id_inscripcion)));
  return (
    <ScreenLayout title="Confirmación y resultados" description="Confirma inscripciones pagadas y registra su resultado académico." aside="No se admite un resultado sobre una inscripción pendiente o no confirmada.">
      <div className="confirmation-list" id="resultados">{confirmable.slice(0, 6).map((row) => <div key={text(row.id_inscripcion)}><span>Inscripción #{text(row.id_inscripcion)}</span><button onClick={() => void submit(`/inscripciones/${text(row.id_inscripcion)}/confirmacion`, {}, "Inscripción confirmada")}>Confirmar</button></div>)}{!confirmable.length && <p>No hay inscripciones pagadas pendientes de confirmación.</p>}</div>
      <form className="operation-form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await submit("/resultados", { idInscripcion: number(form.get("idInscripcion")), puntaje: number(form.get("puntaje")), puesto: number(form.get("puesto")), condicion: text(form.get("condicion")) }, "Resultado registrado"); }}>
        <Field label="Inscripción confirmada"><select name="idInscripcion" required><option value="">Seleccionar</option>{confirmed.map((row) => <option key={text(row.id_inscripcion)} value={text(row.id_inscripcion)}>Inscripción #{text(row.id_inscripcion)}</option>)}</select></Field>
        <Field label="Puntaje"><input name="puntaje" type="number" min="0" step="0.0001" required /></Field>
        <Field label="Puesto"><input name="puesto" type="number" min="0" required /></Field>
        <Field label="Condición"><select name="condicion"><option value="INGRESANTE">Ingresante</option><option value="NO_INGRESANTE">No ingresante</option><option value="AUSENTE">Ausente</option></select></Field>
        <FormActions label="Registrar resultado" disabled={!confirmed.length} />
      </form>
      <h3 className="subsection-title">Resultados registrados</h3><DataTable rows={resources.resultados.slice(0, 8)} columns={["id_inscripcion", "puntaje", "puesto", "condicion"]} />
    </ScreenLayout>
  );
}

function CatalogScreen({ catalogs, submit }: { catalogs: Catalogs; submit: Submit }) {
  const [type, setType] = useState<"convocatoria" | "carrera" | "concepto">("convocatoria");
  return (
    <ScreenLayout title="Catálogos maestros" description="Configura convocatorias, carreras y conceptos antes de operar." aside={`${catalogs.convocatorias.length} convocatorias · ${catalogs.carreras.length} carreras.`}>
      <div className="catalog-switch"><button className={type === "convocatoria" ? "active" : ""} onClick={() => setType("convocatoria")}>Convocatoria</button><button className={type === "carrera" ? "active" : ""} onClick={() => setType("carrera")}>Carrera</button><button className={type === "concepto" ? "active" : ""} onClick={() => setType("concepto")}>Concepto</button></div>
      {type === "convocatoria" && <form className="operation-form" onSubmit={async (event) => { event.preventDefault(); const f = new FormData(event.currentTarget); await submit("/convocatorias", { nombre: text(f.get("nombre")), fechaInicio: text(f.get("fechaInicio")), fechaFin: text(f.get("fechaFin")), fechaExamen: text(f.get("fechaExamen")) }, "Convocatoria creada"); }}><Field label="Nombre"><input name="nombre" placeholder="2027-I" required /></Field><Field label="Inicio"><input name="fechaInicio" type="date" required /></Field><Field label="Fin"><input name="fechaFin" type="date" required /></Field><Field label="Examen"><input name="fechaExamen" type="date" required /></Field><FormActions label="Crear convocatoria" /></form>}
      {type === "carrera" && <form className="operation-form" onSubmit={async (event) => { event.preventDefault(); const f = new FormData(event.currentTarget); await submit("/carreras", { codigo: text(f.get("codigo")), idFacultad: number(f.get("idFacultad")), nombre: text(f.get("nombre")) }, "Carrera creada"); }}><Field label="Código"><input name="codigo" required /></Field><Field label="Facultad"><select name="idFacultad">{catalogs.facultades.map((row) => <option key={text(row.id_facultad)} value={text(row.id_facultad)}>{text(row.nombre)}</option>)}</select></Field><Field label="Nombre" wide><input name="nombre" required /></Field><FormActions label="Crear carrera" /></form>}
      {type === "concepto" && <form className="operation-form" onSubmit={async (event) => { event.preventDefault(); const f = new FormData(event.currentTarget); await submit("/conceptos-pago", { codigo: text(f.get("codigo")), descripcion: text(f.get("descripcion")), monto: number(f.get("monto")) }, "Concepto creado"); }}><Field label="Código"><input name="codigo" required /></Field><Field label="Descripción"><input name="descripcion" required /></Field><Field label="Monto"><input name="monto" type="number" min="0.01" step="0.01" required /></Field><FormActions label="Crear concepto" /></form>}
    </ScreenLayout>
  );
}

function AuditScreen({ rows }: { rows: Row[] }) {
  return <ScreenLayout title="Auditoría" description="Trazabilidad de mutaciones y movimientos críticos." aside="La bitácora es de solo lectura para los usuarios funcionales."><DataTable rows={rows} columns={["fecha", "usuario", "accion", "modulo", "registro", "detalle"]} /></ScreenLayout>;
}

function UsersScreen({ rows, submit }: { rows: Row[]; submit: Submit }) {
  return (
    <ScreenLayout title="Usuarios y roles" description="Crea accesos con el mínimo permiso necesario para cada función." aside="Solo ADMIN puede consultar y crear usuarios.">
      <form className="operation-form" onSubmit={async (event) => { event.preventDefault(); const f = new FormData(event.currentTarget); const ok = await submit("/usuarios", { username: text(f.get("username")), password: text(f.get("password")), nombre: text(f.get("nombre")), rol: text(f.get("rol")) }, "Usuario creado"); if (ok) event.currentTarget.reset(); }}>
        <Field label="Nombre completo"><input name="nombre" required /></Field>
        <Field label="Usuario"><input name="username" minLength={3} required /></Field>
        <Field label="Contraseña inicial"><input name="password" type="password" minLength={8} required /></Field>
        <Field label="Rol"><select name="rol"><option>ADMISION</option><option>TESORERIA</option><option>CAJERO</option><option>CONSULTA</option><option>ADMIN</option></select></Field>
        <FormActions label="Crear usuario" />
      </form>
      <h3 className="subsection-title">Accesos activos</h3><DataTable rows={rows} columns={["username", "nombre", "rol", "estado"]} />
    </ScreenLayout>
  );
}

function ScreenLayout({ title, description, aside, children }: { title: string; description: string; aside: string; children: React.ReactNode }) {
  return <div><div className="screen-heading"><div><h3>{title}</h3><p>{description}</p></div><aside>{aside}</aside></div>{children}</div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`form-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

function FormActions({ label, disabled }: { label: string; disabled?: boolean }) {
  return <div className="form-actions"><button type="submit" className="primary-button" disabled={disabled}>{label}</button></div>;
}

function DataTable({ rows, columns }: { rows: Row[]; columns: string[] }) {
  if (!rows.length) return <div className="mini-empty">Todavía no hay registros.</div>;
  return <div className="mini-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.slice(0, 15).map((row, index) => <tr key={String(row[columns[0]]) || index}>{columns.map((column) => <td key={column}>{formatCell(row[column], column)}</td>)}</tr>)}</tbody></table></div>;
}

type Submit = (path: string, data: Row, success: string, method?: string) => Promise<boolean>;
type Api = <T>(path: string, init?: RequestInit) => Promise<T>;
function formObject(form: FormData, fields: string[]): Row { return Object.fromEntries(fields.map((field) => [field, text(form.get(field))])); }
function text(value: unknown): string { return value === null || value === undefined ? "" : String(value); }
function number(value: unknown): number { return Number(value) || 0; }
function formatCell(value: unknown, column: string): string { const raw = text(value); if (column.includes("fecha") && raw) return new Date(raw).toLocaleDateString("es-PE"); if (column === "monto") return `S/ ${Number(value).toFixed(2)}`; return raw || "—"; }

async function printReceipt(id: number, api: Api) {
  const receipt = await api<Row>(`/pagos/${id}/comprobante`);
  const popup = window.open("", "comprobante", "width=720,height=780");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${text(receipt.numero)}</title><style>body{font:14px Arial;padding:48px;color:#17201d}header{border-bottom:3px solid #123f32;padding-bottom:18px}h1{font:28px Georgia;margin:5px 0}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}.total{font-size:22px;font-weight:bold}.note{margin-top:35px;color:#68736e}@media print{button{display:none}}</style></head><body><header><small>Universidad Nacional Agraria de la Selva</small><h1>Comprobante de pago</h1><strong>${text(receipt.numero)}</strong></header><div class="row"><span>Postulante</span><b>${text(receipt.postulante)}</b></div><div class="row"><span>DNI</span><b>${text(receipt.dni)}</b></div><div class="row"><span>Orden</span><b>${text(receipt.orden)}</b></div><div class="row"><span>Concepto</span><b>${text(receipt.concepto)}</b></div><div class="row"><span>Método</span><b>${text(receipt.metodoPago)}</b></div><div class="row total"><span>Total</span><b>S/ ${Number(receipt.monto).toFixed(2)}</b></div><p class="note">Emitido el ${new Date(text(receipt.fecha)).toLocaleString("es-PE")} por ${text(receipt.cajero)}.</p><button onclick="window.print()">Imprimir o guardar como PDF</button></body></html>`);
  popup.document.close();
}
