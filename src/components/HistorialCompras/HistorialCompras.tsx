import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { limpiarHistorial } from '../../features/transacciones/transaccionesSlice';
import { formatearCentavos } from '../../services/format';
import type { EstadoPago } from '../../types/api';
import styles from './HistorialCompras.module.css';

const formateadorFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const ETIQUETAS: Record<EstadoPago, string> = { APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', PENDIENTE: 'Pendiente' };
const MAX_VISIBLES = 5;

export function HistorialCompras() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.transacciones.items);

  if (items.length === 0) return null;

  return (
    <section className={styles.seccion} aria-labelledby="titulo-historial">
      <div className={styles.encabezado}>
        <h2 id="titulo-historial" className={styles.titulo}>
          Tus últimas compras
        </h2>
        <button type="button" className={styles.limpiar} onClick={() => dispatch(limpiarHistorial())}>
          Borrar
        </button>
      </div>

      <ul className={styles.lista}>
        {items.slice(0, MAX_VISIBLES).map((t) => (
          <li key={t.transaccionId} className={styles.item}>
            <div className={styles.datos}>
              <span className={styles.producto}>
                {t.cantidad} × {t.productoNombre}
              </span>
              <span className={styles.meta}>{formateadorFecha.format(new Date(t.fecha))}</span>
            </div>
            <div className={styles.derecha}>
              <span className={styles.monto}>{formatearCentavos(t.montoTotalEnCentavos)}</span>
              <span className={`${styles.estado} ${styles[t.estado]}`}>{ETIQUETAS[t.estado]}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.nota}>Guardado solo en este dispositivo. Nunca se almacenan datos de tarjeta.</p>
    </section>
  );
}
