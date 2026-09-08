"use client";

import { useState } from "react";
import { Field, FormActions, ScreenLayout } from "../../shared/ui";
import { number, text } from "../../shared/api";
import type { Catalogs, Submit } from "../../shared/types";
import styles from "./CatalogsSection.module.css";

export function CatalogsSection({
  catalogs,
  submit,
}: {
  catalogs: Catalogs;
  submit: Submit;
}) {
  const [type, setType] = useState<"convocatoria" | "carrera" | "concepto">(
    "convocatoria",
  );

  return (
    <ScreenLayout
      title="Catálogos maestros"
      description="Configura convocatorias, carreras y conceptos antes de operar."
      aside={`${catalogs.convocatorias.length} convocatorias · ${catalogs.carreras.length} carreras.`}
    >
      <div className={styles.switch}>
        <button
          className={type === "convocatoria" ? styles.active : ""}
          onClick={() => setType("convocatoria")}
        >
          Convocatoria
        </button>
        <button
          className={type === "carrera" ? styles.active : ""}
          onClick={() => setType("carrera")}
        >
          Carrera
        </button>
        <button
          className={type === "concepto" ? styles.active : ""}
          onClick={() => setType("concepto")}
        >
          Concepto
        </button>
      </div>
      {type === "convocatoria" && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await submit(
              "/convocatorias",
              {
                nombre: text(f.get("nombre")),
                fechaInicio: text(f.get("fechaInicio")),
                fechaFin: text(f.get("fechaFin")),
                fechaExamen: text(f.get("fechaExamen")),
              },
              "Convocatoria creada",
            );
          }}
        >
          <Field label="Nombre">
            <input name="nombre" placeholder="2027-I" required />
          </Field>
          <Field label="Inicio">
            <input name="fechaInicio" type="date" required />
          </Field>
          <Field label="Fin">
            <input name="fechaFin" type="date" required />
          </Field>
          <Field label="Examen">
            <input name="fechaExamen" type="date" required />
          </Field>
          <FormActions label="Crear convocatoria" />
        </form>
      )}
      {type === "carrera" && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await submit(
              "/carreras",
              {
                codigo: text(f.get("codigo")),
                idFacultad: number(f.get("idFacultad")),
                nombre: text(f.get("nombre")),
              },
              "Carrera creada",
            );
          }}
        >
          <Field label="Código">
            <input name="codigo" required />
          </Field>
          <Field label="Facultad">
            <select name="idFacultad">
              {catalogs.facultades.map((row) => (
                <option
                  key={text(row.id_facultad)}
                  value={text(row.id_facultad)}
                >
                  {text(row.nombre)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nombre" wide>
            <input name="nombre" required />
          </Field>
          <FormActions label="Crear carrera" />
        </form>
      )}
      {type === "concepto" && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await submit(
              "/conceptos-pago",
              {
                codigo: text(f.get("codigo")),
                descripcion: text(f.get("descripcion")),
                monto: number(f.get("monto")),
              },
              "Concepto creado",
            );
          }}
        >
          <Field label="Código">
            <input name="codigo" required />
          </Field>
          <Field label="Descripción">
            <input name="descripcion" required />
          </Field>
          <Field label="Monto">
            <input name="monto" type="number" min="0.01" step="0.01" required />
          </Field>
          <FormActions label="Crear concepto" />
        </form>
      )}
    </ScreenLayout>
  );
}
