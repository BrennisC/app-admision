"use client";

import { Field, FormActions, ScreenLayout } from "../../shared/ui";
import { formObject } from "../../shared/api";
import type { Submit } from "../../shared/types";
import styles from "./ApplicantForm.module.css";

export function ApplicantForm({ submit }: { submit: Submit }) {
  return (
    <ScreenLayout
      title="Registrar postulante"
      description="Crea la identidad principal antes de iniciar una inscripción."
      aside="El DNI debe contener exactamente ocho dígitos y no puede repetirse."
    >
      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const ok = await submit(
            "/postulantes",
            formObject(form, [
              "dni",
              "nombres",
              "apellidos",
              "tipoColegio",
              "telefono",
              "correo",
              "direccion",
              "fechaNacimiento",
            ]),
            "Postulante registrado correctamente",
          );
          if (ok) event.currentTarget.reset();
        }}
      >
        <Field label="DNI">
          <input
            name="dni"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            required
          />
        </Field>
        <Field label="Nombres">
          <input name="nombres" required />
        </Field>
        <Field label="Apellidos">
          <input name="apellidos" required />
        </Field>
        <Field label="Tipo de colegio">
          <select name="tipoColegio">
            <option value="">Seleccionar</option>
            <option>ESTATAL</option>
            <option>PRIVADO</option>
          </select>
        </Field>
        <Field label="Teléfono">
          <input name="telefono" inputMode="tel" />
        </Field>
        <Field label="Correo">
          <input name="correo" type="email" />
        </Field>
        <Field label="Dirección" wide>
          <input name="direccion" />
        </Field>
        <Field label="Fecha de nacimiento">
          <input name="fechaNacimiento" type="date" />
        </Field>
        <FormActions label="Guardar postulante" />
      </form>
    </ScreenLayout>
  );
}
