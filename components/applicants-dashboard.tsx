"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { SessionUser } from "./auth/LoginScreen";
import { AppShell, type AppSection } from "./shell/AppShell";
import { DashboardSection } from "./dashboard/DashboardSection";
import { PostulantesTable } from "./postulantes/PostulantesTable";
import { EditApplicantModal } from "./postulantes/EditApplicantModal";
import { ReportsSection } from "./reportes/ReportsSection";
import { OperationsConsole } from "./operations/OperationsConsole";
import { API_URL } from "./shared/api";
import type { Applicant, ApplicantsResponse, DashboardData, DashboardSelection } from "./shared/types";

const PAGE_SIZE = 15;

const EMPTY_SELECTION: DashboardSelection = { anio: "", facultad: "", tipoColegio: "" };

export function ApplicantsDashboard({ token, user, onLogout }: { token: string; user: SessionUser; onLogout: () => void }) {
  const [section, setSection] = useState<AppSection>("postulantes");
  const [response, setResponse] = useState<ApplicantsResponse>();
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Applicant | null>(null);
  const [selection, setSelection] = useState<DashboardSelection>(EMPTY_SELECTION);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const reload = () => setRevision((v) => v + 1);
    window.addEventListener("postulantes-updated", reload);
    return () => window.removeEventListener("postulantes-updated", reload);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (deferredSearch) params.set("search", deferredSearch);
    if (status) params.set("estado", status);

    async function loadApplicants() {
      setIsLoading(true);
      setError("");
      try {
        const result = await fetch(`${API_URL}/postulantes?${params}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!result.ok) throw new Error("La API no pudo obtener los postulantes");
        setResponse((await result.json()) as ApplicantsResponse);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadApplicants();
    return () => controller.abort();
  }, [deferredSearch, page, revision, status, token]);

  useEffect(() => {
    if (section !== "resumen" && section !== "reportes") return;
    const controller = new AbortController();
    async function loadDashboard() {
      try {
        const params = new URLSearchParams();
        if (selection.anio) params.set("anio", selection.anio);
        if (selection.facultad) params.set("facultad", selection.facultad);
        if (selection.tipoColegio) params.set("tipoColegio", selection.tipoColegio);
        const query = params.toString();
        const result = await fetch(`${API_URL}/dashboard${query ? `?${query}` : ""}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (result.ok) setDashboard((await result.json()) as DashboardData);
      } catch { /* Progresivo: se muestra la tabla aunque falle. */ }
    }
    void loadDashboard();
    return () => controller.abort();
  }, [section, revision, token, selection]);

  function handleSection(next: AppSection, flowScreen?: string) {
    setSection(next);
    if (next === "flujo" && flowScreen) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-operation", { detail: flowScreen }));
        document.getElementById("operaciones")?.scrollIntoView({ behavior: "smooth" });
      }, 30);
    }
  }

  const canWrite = user.role === "ADMIN" || user.role === "ADMISION";
  const sidebarNote = dashboard
    ? `${new Intl.NumberFormat("es-PE").format(dashboard.postulantes)} postulantes · S/ ${dashboard.recaudacion.toFixed(2)} recaudado`
    : "7,693 registros históricos";

  return (
    <AppShell section={section} onSection={handleSection} user={user} error={error} sidebarNote={sidebarNote} onLogout={onLogout}>
      {section === "resumen" && (
        <DashboardSection
          dashboard={dashboard}
          totalFallback={response?.meta.total}
          selection={selection}
          onSelection={setSelection}
          onGo={(s) => handleSection("flujo", s)}
        />
      )}
      {section === "reportes" && <ReportsSection token={token} dashboard={dashboard} />}
      {(section === "postulantes" || section === "resumen") && (
        <PostulantesTable
          response={response}
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          status={status}
          onStatus={(v) => { setStatus(v); setPage(1); }}
          page={page}
          onPage={(fn) => setPage(fn)}
          isLoading={isLoading}
          error={error}
          canWrite={canWrite}
          onNew={() => handleSection("flujo", "postulante")}
          onEdit={setEditing}
        />
      )}
      {(section === "flujo" || section === "postulantes") && (
        <div style={{ marginTop: section === "postulantes" ? 18 : 0 }}>
          <OperationsConsole token={token} role={user.role} />
        </div>
      )}
      {editing && (
        <EditApplicantModal
          applicant={editing}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((v) => v + 1);
            window.dispatchEvent(new Event("postulantes-updated"));
          }}
        />
      )}
    </AppShell>
  );
}
