"use client";

import styles from "./postulantes.module.css";
import { SearchIcon, StatusBadge } from "../shared/ui";
import { formatNumber, initials } from "../shared/api";
import type { Applicant, ApplicantsResponse } from "../shared/types";

interface Props {
  response?: ApplicantsResponse;
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  page: number;
  onPage: (fn: (c: number) => number) => void;
  isLoading: boolean;
  error: string;
  canWrite: boolean;
  onNew: () => void;
  onEdit: (a: Applicant) => void;
}

export function PostulantesTable({ response, search, onSearch, status, onStatus, page, onPage, isLoading, error, canWrite, onNew, onEdit }: Props) {
  const firstResult = response?.meta.total ? (response.meta.page - 1) * response.meta.limit + 1 : 0;
  const lastResult = response ? Math.min(response.meta.page * response.meta.limit, response.meta.total) : 0;

  return (
    <section className={styles.panel} id="postulantes">
      <div className={styles.heading}>
        <div><h2>Registro de postulantes</h2><p>Consulta la información importada desde el archivo institucional.</p></div>
        {canWrite && <button className="primary-button" type="button" onClick={onNew}><span>+</span> Nuevo postulante</button>}
      </div>
      <div className={styles.filters}>
        <label className={styles.search}>
          <span className="sr-only">Buscar postulante</span>
          <SearchIcon />
          <input value={search} onChange={(e) => { onSearch(e.target.value); }} placeholder="Buscar por DNI, nombres, apellidos o carrera" />
          {search && <button type="button" onClick={() => onSearch("")} aria-label="Limpiar búsqueda">×</button>}
        </label>
        <label className={styles.select}>
          <span>Estado</span>
          <select value={status} onChange={(e) => onStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="Ingresante">Ingresante</option>
            <option value="No Ingresante">No ingresante</option>
            <option value="Ausente">Ausente</option>
          </select>
        </label>
      </div>
      {error ? (
        <div className={styles.errorBox} role="alert"><strong>No pudimos conectar con el backend.</strong><span>{error}. Ejecuta <code>pnpm dev</code> para iniciar ambas aplicaciones.</span></div>
      ) : (
        <>
          <div className={styles.tableWrap} aria-busy={isLoading}>
            <table>
              <thead><tr><th>Postulante</th><th>DNI</th><th>Convocatoria</th><th>Carrera</th><th>Puntaje</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 7 }, (_, i) => (
                    <tr className={styles.skeleton} key={i} aria-hidden="true"><td><i className={styles.wide} /></td><td><i /></td><td><i /></td><td><i className={styles.wide} /></td><td><i /></td><td><i /></td><td><i /></td></tr>
                  ))
                ) : response?.data.length ? (
                  response.data.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Postulante"><div className={styles.person}><span>{initials(a.nombres, a.apellidos)}</span><div><strong>{a.nombres} {a.apellidos}</strong><small>{a.facultad || "Facultad no registrada"}</small></div></div></td>
                      <td data-label="DNI" className={styles.mono}>{a.dni}</td>
                      <td data-label="Convocatoria">{a.convocatoria || "—"}</td>
                      <td data-label="Carrera">{a.carrera || "—"}</td>
                      <td data-label="Puntaje" className={styles.score}>{a.puntaje ?? "—"}</td>
                      <td data-label="Estado"><StatusBadge status={a.estado} /></td>
                      <td data-label="Acción">{canWrite ? <button className="secondary-button" onClick={() => onEdit(a)}>Editar</button> : <span>Solo lectura</span>}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7}><div className={styles.empty}><strong>No encontramos coincidencias</strong><span>Prueba con otro DNI, nombre o estado.</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.pagination}>
            <span>Mostrando {firstResult}–{lastResult} de {formatNumber(response?.meta.total)}</span>
            <div>
              <button type="button" onClick={() => onPage((c) => c - 1)} disabled={isLoading || page <= 1}>Anterior</button>
              <b>Página {page} de {response?.meta.totalPages || 1}</b>
              <button type="button" onClick={() => onPage((c) => c + 1)} disabled={isLoading || page >= (response?.meta.totalPages ?? 1)}>Siguiente</button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
