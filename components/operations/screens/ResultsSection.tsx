"use client";

import { DataTable, Field, FormActions, ScreenLayout } from "../../shared/ui";
import { number, text } from "../../shared/api";
import type { Resources, Submit } from "../../shared/types";
import styles from "./ResultsSection.module.css";

export function ResultsSection({
  resources,
  submit,
}: {
  resources: Resources;
  submit: Submit;
}) {
  const confirmable = resources.inscripciones.filter(
    (row) => row.estado === "PAGADO",
  );
  const confirmed = resources.inscripciones.filter(
    (row) =>
      row.estado === "CONFIRMADO" &&
      !resources.resultados.some(
        (r) => number(r.id_inscripcion) === number(row.id_inscripcion),
      ),
  );

  return (
    <ScreenLayout
      title="Confirmación y resultados"
      description="Confirma inscripciones pagadas y registra su resultado académico."
      aside="No se admite un resultado sobre una inscripción pendiente o no confirmada."
    >
      <div className={styles.confirmList} id="resultados">
        {confirmable.slice(0, 6).map((row) => (
          <div key={text(row.id_inscripcion)}>
            <span>Inscripción #{text(row.id_inscripcion)}</span>
            <button
              onClick={() =>
                void submit(
                  `/inscripciones/${text(row.id_inscripcion)}/confirmacion`,
                  {},
                  "Inscripción confirmada",
                )
              }
            >
              Confirmar
            </button>
          </div>
        ))}
        {!confirmable.length && (
          <p>No hay inscripciones pagadas pendientes de confirmación.</p>
        )}
      </div>
      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await submit(
            "/resultados",
            {
              idInscripcion: number(form.get("idInscripcion")),
              puntaje: number(form.get("puntaje")),
              puesto: number(form.get("puesto")),
              condicion: text(form.get("condicion")),
            },
            "Resultado registrado",
          );
        }}
      >
        <Field label="Inscripción confirmada">
          <select name="idInscripcion" required>
            <option value="">Seleccionar</option>
            {confirmed.map((row) => (
              <option
                key={text(row.id_inscripcion)}
                value={text(row.id_inscripcion)}
              >
                Inscripción #{text(row.id_inscripcion)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Puntaje">
          <input name="puntaje" type="number" min="0" step="0.0001" required />
        </Field>
        <Field label="Puesto">
          <input name="puesto" type="number" min="0" required />
        </Field>
        <Field label="Condición">
          <select name="condicion">
            <option value="INGRESANTE">Ingresante</option>
            <option value="NO_INGRESANTE">No ingresante</option>
            <option value="AUSENTE">Ausente</option>
          </select>
        </Field>
        <FormActions label="Registrar resultado" disabled={!confirmed.length} />
      </form>
      <h3 className={styles.subtitle}>Resultados registrados</h3>
      <DataTable
        rows={resources.resultados.slice(0, 8)}
        columns={["id_inscripcion", "puntaje", "puesto", "condicion"]}
      />
    </ScreenLayout>
  );
}
