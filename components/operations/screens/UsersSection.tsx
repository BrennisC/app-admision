"use client";

import { DataTable, Field, FormActions, ScreenLayout } from "../../shared/ui";
import { text } from "../../shared/api";
import type { Row, Submit } from "../../shared/types";
import styles from "./UsersSection.module.css";

export function UsersSection({ rows, submit }: { rows: Row[]; submit: Submit }) {
  return (
    <ScreenLayout title="Usuarios y roles" description="Crea accesos con el mínimo permiso necesario para cada función." aside="Solo ADMIN puede consultar y crear usuarios.">
      <form className={styles.form} onSubmit={async (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const ok = await submit("/usuarios", {
          username: text(f.get("username")),
          password: text(f.get("password")),
          nombre: text(f.get("nombre")),
          rol: text(f.get("rol")),
        }, "Usuario creado");
        if (ok) event.currentTarget.reset();
      }}>
        <Field label="Nombre completo"><input name="nombre" required /></Field>
        <Field label="Usuario"><input name="username" minLength={3} required /></Field>
        <Field label="Contraseña inicial"><input name="password" type="password" minLength={8} required /></Field>
        <Field label="Rol"><select name="rol"><option>ADMISION</option><option>TESORERIA</option><option>CAJERO</option><option>CONSULTA</option><option>ADMIN</option></select></Field>
        <FormActions label="Crear usuario" />
      </form>
      <h3 className={styles.subtitle}>Accesos activos</h3>
      <DataTable rows={rows} columns={["username", "nombre", "rol", "estado"]} />
    </ScreenLayout>
  );
}
