"use client";

import { useState } from "react";
import { DataTable, Field, FormActions, ScreenLayout } from "../../shared/ui";
import { number, text } from "../../shared/api";
import type { Api, Resources, Row, Submit } from "../../shared/types";
import styles from "./EnrollmentSection.module.css";

export function EnrollmentSection({
  resources,
  api,
  submit,
}: {
  resources: Resources;
  api: Api;
  submit: Submit;
}) {
  const [dni, setDni] = useState("");
  const [applicant, setApplicant] = useState<Row>();
  const [lookupError, setLookupError] = useState("");
  const [filter, setFilter] = useState("");

  async function findApplicant() {
    setLookupError("");
    setApplicant(undefined);
    try {
      setApplicant(await api<Row>(`/postulantes/dni/${dni}`));
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "No encontrado");
    }
  }

  const filtered = resources.inscripciones.filter((row) => {
    if (!filter) return true;
    return `${text(row.id_inscripcion)} ${text(row.estado)} ${text(row.modalidad)}`
      .toLowerCase()
      .includes(filter.toLowerCase());
  });

  return (
    <ScreenLayout
      title="Crear inscripción"
      description="Localiza al postulante y genera una orden de pago automáticamente."
      aside="Una persona solo puede mantener una inscripción activa por convocatoria."
    >
      <div className={styles.lookup}>
        <Field label="DNI del postulante">
          <input
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            maxLength={8}
          />
        </Field>
        <button
          type="button"
          className="secondary-button"
          onClick={findApplicant}
          disabled={dni.length !== 8}
        >
          Buscar persona
        </button>
      </div>
      {lookupError && <p className={styles.error}>{lookupError}</p>}
      {applicant && (
        <div className={styles.found}>
          <span>
            {String(applicant.nombres)[0]}
            {String(applicant.apellidos)[0]}
          </span>
          <div>
            <strong>
              {text(applicant.nombres)} {text(applicant.apellidos)}
            </strong>
            <small>
              DNI {text(applicant.dni)} · ID {text(applicant.id)}
            </small>
          </div>
        </div>
      )}
      <form
        className={styles.form}
        id="inscripciones"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!applicant) return;
          const form = new FormData(event.currentTarget);
          const ok = await submit(
            "/inscripciones",
            {
              idPostulante: number(applicant.id),
              idConvocatoria: number(form.get("idConvocatoria")),
              idCarrera: number(form.get("idCarrera")),
              modalidad: text(form.get("modalidad")),
              idConcepto: number(form.get("idConcepto")),
            },
            "Inscripción y orden de pago creadas",
          );
          if (ok) setApplicant(undefined);
        }}
      >
        <Field label="Convocatoria">
          <select name="idConvocatoria" required>
            <option value="">Seleccionar</option>
            {resources.catalogos.convocatorias.map((row) => (
              <option
                key={text(row.id_convocatoria)}
                value={text(row.id_convocatoria)}
              >
                {text(row.nombre)} · {text(row.estado)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Carrera">
          <select name="idCarrera" required>
            <option value="">Seleccionar</option>
            {resources.catalogos.carreras.map((row) => (
              <option key={text(row.id_carrera)} value={text(row.id_carrera)}>
                {text(row.nombre)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Modalidad">
          <select name="modalidad" required>
            <option value="ORDINARIO">Ordinario</option>
            <option value="PRIMEROS_PUESTOS">Primeros puestos</option>
            <option value="TRASLADO">Traslado</option>
          </select>
        </Field>
        <Field label="Concepto de pago">
          <select name="idConcepto" required>
            {resources.catalogos.conceptosPago.map((row) => (
              <option key={text(row.id_concepto)} value={text(row.id_concepto)}>
                {text(row.descripcion)} · S/ {text(row.monto)}
              </option>
            ))}
          </select>
        </Field>
        <FormActions label="Crear inscripción y orden" disabled={!applicant} />
      </form>
      <h3 className={styles.subtitle}>
        Inscripciones registradas ({filtered.length})
      </h3>
      <div className={styles.lookup}>
        <Field label="Filtrar por estado o modalidad">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Ej: PAGADO, PENDIENTE_PAGO…"
          />
        </Field>
      </div>
      <DataTable
        rows={filtered}
        columns={[
          "id_inscripcion",
          "id_postulante",
          "id_carrera",
          "modalidad",
          "estado",
        ]}
        action={(row) =>
          row.estado === "PAGADO"
            ? {
                label: "Confirmar",
                onClick: () =>
                  void submit(
                    `/inscripciones/${text(row.id_inscripcion)}/confirmacion`,
                    {},
                    "Inscripción confirmada",
                  ),
              }
            : undefined
        }
      />
    </ScreenLayout>
  );
}
