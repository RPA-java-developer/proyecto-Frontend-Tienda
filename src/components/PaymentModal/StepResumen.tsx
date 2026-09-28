import type { DatosTarjetaFormulario } from '../../features/pago/pagoSlice';
import type { DesglosePago, Producto } from '../../types/api';
import { formatearCentavos } from '../../services/format';
import styles from './PaymentModal.module.css';

interface StepResumenProps {
  producto: Producto;
  cantidad: number;
  desglose: DesglosePago;
  datosTarjeta: DatosTarjetaFormulario;
  onAtras: () => void;
  onPagar: () => void;
}

export function StepResumen({ producto, cantidad, desglose, datosTarjeta, onAtras, onPagar }: StepResumenProps) {
  // Los porcentajes se DERIVAN de lo que calculó el backend, para que la etiqueta nunca mienta.
  const porcentaje = (parte: number) =>
    desglose.subtotalEnCentavos > 0 ? Math.round((parte * 100) / desglose.subtotalEnCentavos) : 0;
  const ultimosCuatro = datosTarjeta.numeroTarjeta.replace(/\s/g, '').slice(-4);

  return (
    <div className={styles.paso}>
      <div className={styles.cuerpo}>
        <dl className={styles.resumen}>
          <div className={styles.linea}>
            <dt>Producto</dt>
            <dd>
              {producto.nombre} × {cantidad}
            </dd>
          </div>
          <div className={styles.linea}>
            <dt>
              Importe del producto ({cantidad} × {formatearCentavos(producto.precioEnCentavos)})
            </dt>
            <dd>{formatearCentavos(desglose.subtotalEnCentavos)}</dd>
          </div>
          <div className={styles.linea}>
            <dt>Tarifa base añadida ({porcentaje(desglose.tarifaBaseEnCentavos)}%)</dt>
            <dd>{formatearCentavos(desglose.tarifaBaseEnCentavos)}</dd>
          </div>
          <div className={styles.linea}>
            <dt>Tarifa de envío ({porcentaje(desglose.tarifaEnvioEnCentavos)}%)</dt>
            <dd>{formatearCentavos(desglose.tarifaEnvioEnCentavos)}</dd>
          </div>
          <div className={`${styles.linea} ${styles.lineaTotal}`}>
            <dt>Total a pagar</dt>
            <dd>{formatearCentavos(desglose.totalEnCentavos)}</dd>
          </div>
        </dl>

        <p className={styles.nota}>
          Tarjeta terminada en {ultimosCuatro} · {datosTarjeta.numeroCuotas} {datosTarjeta.numeroCuotas === 1 ? 'cuota' : 'cuotas'}
        </p>
      </div>

      <div className={styles.pie}>
        <button type="button" className={styles.botonSecundario} onClick={onAtras}>
          Atrás
        </button>
        <button type="button" className={styles.botonPrimario} onClick={onPagar}>
          Pagar {formatearCentavos(desglose.totalEnCentavos)}
        </button>
      </div>
    </div>
  );
}
