"use client";

import { useDeferredValue, useEffect, useState } from "react";

interface Applicant {
  id: number;
  convocatoria: string;
  nombres: string;
  apellidos: string;
  dni: string;
  facultad: string;
  carrera: string;
  tipoColegio: string;
  puntaje: number | null;
  estado: string;
}

interface ApplicantsResponse {
  data: Applicant[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const PAGE_SIZE = 15;

export function ApplicantsDashboard() {
  const [response, setResponse] = useState<ApplicantsResponse>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (deferredSearch) params.set("search", deferredSearch);
    if (status) params.set("estado", status);

    async function loadApplicants() {
      setIsLoading(true);
      setError("");
      try {
        const result = await fetch(`${API_URL}/postulantes?${params}`, {
          signal: controller.signal,
        });
        if (!result.ok) throw new Error("La API no pudo obtener los postulantes");
        setResponse((await result.json()) as ApplicantsResponse);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadApplicants();
    return () => controller.abort();
  }, [deferredSearch, page, status]);

  const firstResult = response?.meta.total
    ? (response.meta.page - 1) * response.meta.limit + 1
    : 0;
  const lastResult = response
    ? Math.min(response.meta.page * response.meta.limit, response.meta.total)
    : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">UA</div>
          <div>
            <strong>Admisión UNAS</strong>
            <span>Gestión académica</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
          <p>General</p>
          <a href="#resumen"><NavIcon name="grid" />Resumen</a>
          <p>Admisión</p>
          <a className="active" href="#postulantes"><NavIcon name="users" />Postulantes</a>
          <a href="#proximamente"><NavIcon name="file" />Inscripciones</a>
          <a href="#proximamente"><NavIcon name="calendar" />Convocatorias</a>
          <a href="#proximamente"><NavIcon name="book" />Carreras</a>
          <p>Tesorería</p>
          <a href="#proximamente"><NavIcon name="wallet" />Pagos</a>
          <a href="#proximamente"><NavIcon name="chart" />Reportes</a>
        </nav>

        <div className="sidebar-note">
          <span>Fuente activa</span>
          <strong>sistema XLSX</strong>
          <small>7,693 registros históricos</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Proceso de admisión</span>
            <h1>Postulantes</h1>
          </div>
          <div className="topbar-actions">
            <span className={`api-indicator ${error ? "offline" : ""}`}>
              <i />{error ? "API sin conexión" : "API conectada"}
            </span>
            <button className="avatar" type="button" aria-label="Cuenta de usuario">AD</button>
          </div>
        </header>

        <section className="summary-grid" id="resumen" aria-label="Resumen">
          <article className="summary-card primary">
            <span>Total registrado</span>
            <strong>{formatNumber(response?.meta.total)}</strong>
            <small>Base histórica consolidada</small>
          </article>
          <article className="summary-card">
            <span>Vista actual</span>
            <strong>{response?.data.length ?? 0}</strong>
            <small>Registros en esta página</small>
          </article>
          <article className="summary-card">
            <span>Convocatoria</span>
            <strong>{response?.data[0]?.convocatoria || "—"}</strong>
            <small>Primera coincidencia</small>
          </article>
        </section>

        <section className="data-panel" id="postulantes">
          <div className="panel-heading">
            <div>
              <h2>Registro de postulantes</h2>
              <p>Consulta la información importada desde el archivo institucional.</p>
            </div>
            <button className="primary-button" type="button" disabled title="Disponible en el siguiente incremento">
              <span>+</span> Nuevo postulante
            </button>
          </div>

          <div className="filters">
            <label className="search-field">
              <span className="sr-only">Buscar postulante</span>
              <SearchIcon />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por DNI, nombres, apellidos o carrera"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda">×</button>
              )}
            </label>
            <label className="select-field">
              <span>Estado</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="Ingresante">Ingresante</option>
                <option value="No Ingresante">No ingresante</option>
                <option value="Ausente">Ausente</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="feedback error-box" role="alert">
              <strong>No pudimos conectar con el backend.</strong>
              <span>{error}. Ejecuta <code>pnpm dev</code> para iniciar ambas aplicaciones.</span>
            </div>
          ) : (
            <>
              <div className="table-wrap" aria-busy={isLoading}>
                <table>
                  <thead>
                    <tr>
                      <th>Postulante</th>
                      <th>DNI</th>
                      <th>Convocatoria</th>
                      <th>Carrera</th>
                      <th>Puntaje</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 7 }, (_, index) => <SkeletonRow key={index} />)
                    ) : response?.data.length ? (
                      response.data.map((applicant) => (
                        <tr key={applicant.id}>
                          <td data-label="Postulante">
                            <div className="person-cell">
                              <span>{initials(applicant.nombres, applicant.apellidos)}</span>
                              <div>
                                <strong>{applicant.nombres} {applicant.apellidos}</strong>
                                <small>{applicant.facultad || "Facultad no registrada"}</small>
                              </div>
                            </div>
                          </td>
                          <td data-label="DNI" className="mono">{applicant.dni}</td>
                          <td data-label="Convocatoria">{applicant.convocatoria || "—"}</td>
                          <td data-label="Carrera">{applicant.carrera || "—"}</td>
                          <td data-label="Puntaje" className="score">{applicant.puntaje ?? "—"}</td>
                          <td data-label="Estado"><StatusBadge status={applicant.estado} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">
                            <strong>No encontramos coincidencias</strong>
                            <span>Prueba con otro DNI, nombre o estado.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="pagination">
                <span>Mostrando {firstResult}–{lastResult} de {formatNumber(response?.meta.total)}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current - 1)}
                    disabled={isLoading || page <= 1}
                  >
                    Anterior
                  </button>
                  <b>Página {page} de {response?.meta.totalPages || 1}</b>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={isLoading || page >= (response?.meta.totalPages ?? 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLocaleLowerCase("es");
  const tone = normalized === "ingresante" ? "success" : normalized.includes("no") ? "neutral" : "warning";
  return <span className={`status-badge ${tone}`}>{status || "Sin estado"}</span>;
}

function SkeletonRow() {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      <td><i className="wide" /></td><td><i /></td><td><i /></td>
      <td><i className="wide" /></td><td><i /></td><td><i /></td>
    </tr>
  );
}

function initials(names: string, surnames: string) {
  return `${names.trim()[0] ?? ""}${surnames.trim()[0] ?? ""}`.toUpperCase();
}

function formatNumber(value?: number) {
  return value === undefined ? "—" : new Intl.NumberFormat("es-PE").format(value);
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
    calendar: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 5.5V19",
    wallet: "M3 6h18v14H3zM3 9h18M16 14h2",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}
