import styles from './PaymentModal.module.css';

export function StepProcesando() {
  return (
    <div className={styles.procesando} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.procesandoTitulo}>Transacción en proceso…</p>
      <p className={styles.nota}>Estamos confirmando tu pago. No cierres ni recargues esta ventana.</p>
    </div>
  );
}
