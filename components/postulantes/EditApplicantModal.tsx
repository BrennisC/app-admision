"use client";

import { useState } from "react";
import styles from "./postulantes.module.css";
import { API_URL } from "../shared/api";
import type { Applicant } from "../shared/types";

export function EditApplicantModal({
  applicant,
  token,
  onClose,
  onSaved,
}: {
  applicant: Applicant;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${API_URL}/postulantes/${applicant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombres: String(f.get("nombres")),
          apellidos: String(f.get("apellidos")),
          tipoColegio: String(f.get("tipoColegio") || ""),
        }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(". ")
            : (body.message ?? "No se pudo guardar"),
        );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar postulante"
      className={styles.overlay}
      onClick={onClose}
    >
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <span className="eyebrow">
          DNI {applicant.dni} · ID {applicant.id}
        </span>
        <h2>Editar postulante</h2>
        <p>
          El DNI no se edita para evitar duplicados. Solo nombres, apellidos y
          colegio.
        </p>
        <div className={styles.modalGrid}>
          <label>
            <span>Nombres</span>
            <input name="nombres" defaultValue={applicant.nombres} required />
          </label>
          <label>
            <span>Apellidos</span>
            <input
              name="apellidos"
              defaultValue={applicant.apellidos}
              required
            />
          </label>
          <label className={styles.full}>
            <span>Tipo de colegio</span>
            <select name="tipoColegio" defaultValue={applicant.tipoColegio}>
              <option value="">Seleccionar</option>
              <option>ESTATAL</option>
              <option>PRIVADO</option>
            </select>
          </label>
        </div>
        {error && <div className={styles.modalError}>{error}</div>}
        <div className={styles.modalActions}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
