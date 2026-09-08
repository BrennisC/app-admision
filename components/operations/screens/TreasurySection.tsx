"use client";

import { useState } from "react";
import { DataTable, Field, FormActions, ScreenLayout } from "../../shared/ui";
import { number, printReceipt, text } from "../../shared/api";
import type { Api, Resources, Submit } from "../../shared/types";
import styles from "./TreasurySection.module.css";

export function TreasurySection({
  resources,
  api,
  submit,
}: {
  resources: Resources;
  api: Api;
  submit: Submit;
}) {
  const openCash = resources.cajas.find((row) => row.estado === "ABIERTA");
  const pendingOrders = resources.ordenes.filter(
    (row) => row.estado === "PENDIENTE",
  );
  const [metodo, setMetodo] = useState("EFECTIVO");
  const totalPagos = resources.pagos
    .filter((r) => r.estado === "CONFIRMADO")
    .reduce((s, r) => s + Number(r.monto), 0);

  return (
    <ScreenLayout
      title="Caja y registro de pago"
      description="Abre una caja, cobra órdenes pendientes y emite comprobante sin duplicar el pago."
      aside={
        openCash
          ? `Caja ${text(openCash.id_caja)} abierta por ${text(openCash.usuario)} · saldo inicial S/ ${Number(openCash.saldo_inicial).toFixed(2)}.`
          : "Debes abrir una caja antes de cobrar. Una caja cerrada no acepta movimientos."
      }
    >
      {!openCash ? (
        <form
          className={styles.compact}
          id="tesoreria"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await submit(
              "/cajas/apertura",
              { saldoInicial: number(form.get("saldoInicial")) },
              "Caja abierta correctamente",
            );
          }}
        >
          <Field label="Saldo inicial">
            <input
              name="saldoInicial"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
            />
          </Field>
          <button className="secondary-button">Abrir caja</button>
        </form>
      ) : (
        <form
          className={styles.compact}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await submit(
              `/cajas/${text(openCash.id_caja)}/cierre`,
              { saldoFinal: number(form.get("saldoFinal")) },
              "Caja cerrada y arqueada",
            );
          }}
        >
          <Field label="Saldo final declarado (arqueo)">
            <input
              name="saldoFinal"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </Field>
          <button className="secondary-button">Cerrar caja con arqueo</button>
        </form>
      )}

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const order = pendingOrders.find(
            (row) => number(row.id_orden) === number(form.get("idOrden")),
          );
          if (metodo !== "EFECTIVO" && !text(form.get("voucher")).trim())
            return;
          const ok = await submit(
            "/pagos",
            {
              idOrden: number(form.get("idOrden")),
              monto: number(order?.monto),
              metodoPago: metodo,
              voucher: text(form.get("voucher")),
            },
            "Pago confirmado y movimiento de caja registrado",
          );
          if (ok) event.currentTarget.reset();
        }}
      >
        <Field label="Orden pendiente" wide>
          <select name="idOrden" required>
            <option value="">Seleccionar orden</option>
            {pendingOrders.map((row) => (
              <option key={text(row.id_orden)} value={text(row.id_orden)}>
                {text(row.codigo)} · S/ {text(row.monto)} · insc #
                {text(row.id_inscripcion)}
              </option>
            ))}
            {!pendingOrders.length && (
              <option value="" disabled>
                Sin órdenes pendientes — crea una inscripción primero
              </option>
            )}
          </select>
        </Field>
        <Field label="Método">
          <select
            name="metodoPago"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
          >
            <option>EFECTIVO</option>
            <option>TRANSFERENCIA</option>
            <option>BANCO</option>
            <option>YAPE</option>
            <option>PLIN</option>
            <option>TARJETA</option>
          </select>
        </Field>
        <Field
          label={`Voucher ${metodo === "EFECTIVO" ? "(opcional)" : "(obligatorio)"}`}
        >
          <input
            name="voucher"
            placeholder={
              metodo === "EFECTIVO"
                ? "Solo si aplica"
                : "N° operación / voucher"
            }
            required={metodo !== "EFECTIVO"}
          />
        </Field>
        <FormActions
          label="Confirmar pago"
          disabled={!openCash || !pendingOrders.length}
        />
      </form>

      <h3 className={styles.subtitle}>
        Últimos pagos · total S/ {totalPagos.toFixed(2)}
      </h3>
      <div className={styles.receipts}>
        {resources.pagos.slice(0, 8).map((row) => (
          <div key={text(row.id_pago)}>
            <span>
              <strong>{text(row.codigo_pago)}</strong>
              <small>
                S/ {Number(row.monto).toFixed(2)} · {text(row.metodo_pago)} ·{" "}
                {text(row.voucher) || "sin voucher"}
              </small>
            </span>
            <button onClick={() => void printReceipt(number(row.id_pago), api)}>
              Ver comprobante
            </button>
          </div>
        ))}
        {!resources.pagos.length && (
          <div className={styles.empty}>Todavía no hay pagos.</div>
        )}
      </div>

      <h3 className={styles.subtitle}>Historial de cajas</h3>
      <DataTable
        rows={resources.cajas}
        columns={[
          "id_caja",
          "usuario",
          "saldo_inicial",
          "saldo_final",
          "estado",
        ]}
      />
    </ScreenLayout>
  );
}
