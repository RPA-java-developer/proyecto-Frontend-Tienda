import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { consultarEstadoPago } from '../../features/pago/pagoSlice';
import { formatearCentavos } from '../../services/format';
import styles from './ResultadoPago.module.css';

const INTERVALO_MS = 3000;
const MAX_INTENTOS = 20; // ~1 minuto de verificación

interface ResultadoPagoProps {
  onVolverATienda: () => void;
  onReintentar: () => void;
}

export function ResultadoPago({ onVolverATienda, onReintentar }: ResultadoPagoProps) {
  const dispatch = useAppDispatch();
  const resultado = useAppSelector((s) => s.pago.resultado);
  const errorConfirmacion = useAppSelector((s) => s.pago.errorConfirmacion);
  const productoNombre = useAppSelector((s) => s.pago.productoNombre);
  const cantidad = useAppSelector((s) => s.pago.cantidad);
  const [intentos, setIntentos] = useState(0);

  const estado = resultado?.estado;
  const transaccionId = resultado?.transaccionId;

  // Mientras Wompi resuelve un pago PENDIENTE, se consulta el estado cada 3 s (máx. ~1 min).
  useEffect(() => {
    if (estado !== 'PENDIENTE' || !transaccionId || intentos >= MAX_INTENTOS) return;
    const temporizador = setTimeout(() => {
      void dispatch(consultarEstadoPago({ transaccionId }));
      setIntentos((n) => n + 1);
    }, INTERVALO_MS);
    return () => clearTimeout(temporizador);
  }, [estado, transaccionId, intentos, dispatch]);

  // ---- Fallo "duro" (red, validación, stock agotado, pasarela caída...) ----
  if (!resultado) {
    return (
      <section className={`${styles.panel} ${styles.error}`} role="alert">
        <div className={styles.icono} aria-hidden="true">
          ✕
        </div>
        <h2 className={styles.titulo}>No pudimos completar el pago</h2>
        <p className={styles.mensaje}>{errorConfirmacion}</p>
        <div className={styles.acciones}>
          <button type="button" className={styles.primario} onClick={onReintentar}>
            Intentar de nuevo
          </button>
          <button type="button" className={styles.secundario} onClick={onVolverATienda}>
            Volver a la tienda
          </button>
        </div>
      </section>
    );
  }

  const variante = resultado.estado === 'APROBADA' ? styles.exito : resultado.estado === 'PENDIENTE' ? styles.pendiente : styles.error;

  return (
    <section className={`${styles.panel} ${variante}`} role="status" aria-live="polite">
      {resultado.estado === 'PENDIENTE' ? (
        <div className={styles.spinner} aria-hidden="true" />
      ) : (
        <div className={styles.icono} aria-hidden="true">
          {resultado.estado === 'APROBADA' ? '✓' : '✕'}
        </div>
      )}

      <h2 className={styles.titulo}>
        {resultado.estado === 'APROBADA' && '¡Pago aprobado!'}
        {resultado.estado === 'RECHAZADA' && 'Pago rechazado'}
        {resultado.estado === 'PENDIENTE' && 'Estamos verificando tu pago'}
      </h2>

      <p className={styles.mensaje}>
        {resultado.estado === 'APROBADA' && 'Tu compra fue confirmada y el producto quedó asignado a tu pedido.'}
        {resultado.estado === 'RECHAZADA' && 'La transacción no fue aprobada, por lo que no se realizó el cobro. Puedes intentar con otra tarjeta.'}
        {resultado.estado === 'PENDIENTE' &&
          (intentos >= MAX_INTENTOS
            ? 'La verificación está tardando más de lo normal. Tu pedido queda registrado; vuelve a revisar más tarde.'
            : 'El banco aún está procesando la transacción. Esto puede tardar unos segundos; te avisaremos aquí.')}
      </p>

      <dl className={styles.detalle}>
        <div>
          <dt>Número de transacción</dt>
          <dd className={styles.codigo}>{resultado.transaccionId}</dd>
        </div>
        <div>
          <dt>Producto</dt>
          <dd>
            {cantidad} × {productoNombre}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatearCentavos(resultado.montoTotalEnCentavos)}</dd>
        </div>
      </dl>

      <div className={styles.acciones}>
        {resultado.estado === 'RECHAZADA' && (
          <button type="button" className={styles.primario} onClick={onReintentar}>
            Intentar de nuevo
          </button>
        )}
        <button type="button" className={resultado.estado === 'RECHAZADA' ? styles.secundario : styles.primario} onClick={onVolverATienda}>
          Volver a la tienda
        </button>
      </div>
    </section>
  );
}
