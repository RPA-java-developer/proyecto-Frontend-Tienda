import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { cerrarModal, confirmarPago, type DatosTarjetaFormulario } from '../../features/pago/pagoSlice';
import type { Producto } from '../../types/api';
import { StepTarjeta } from './StepTarjeta';
import { StepResumen } from './StepResumen';
import { StepProcesando } from './StepProcesando';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
  producto: Producto;
}

const ETAPAS = ['Tarjeta', 'Resumen', 'Pago'];

/**
 * Wizard de 3 pasos. El paso (1|2) y los datos de tarjeta son estado LOCAL del modal:
 * al desmontarse (cerrar, o terminar el pago) se descartan de memoria. Redux solo
 * conoce la fase del pago (confirmando / finalizado), nunca la tarjeta.
 */
export function PaymentModal({ producto }: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const fase = useAppSelector((s) => s.pago.fase);
  const desglose = useAppSelector((s) => s.pago.desglose);
  const cantidad = useAppSelector((s) => s.pago.cantidad);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [datosTarjeta, setDatosTarjeta] = useState<DatosTarjetaFormulario | null>(null);
  const hojaRef = useRef<HTMLDivElement>(null);

  const confirmando = fase === 'confirmando';
  const etapaActual = confirmando ? 3 : paso;

  // Bloquea el scroll del fondo y maneja el foco (entra al diálogo, y vuelve al botón al cerrar).
  useEffect(() => {
    const overflowPrevio = document.body.style.overflow;
    const elementoPrevio = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    hojaRef.current?.focus();
    return () => {
      document.body.style.overflow = overflowPrevio;
      elementoPrevio?.focus?.();
    };
  }, []);

  // Escape cierra el modal, salvo que el pago esté en curso.
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !confirmando) {
        dispatch(cerrarModal());
      }
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [confirmando, dispatch]);

  if (!desglose) return null;

  function pagar() {
    if (!datosTarjeta) return;
    void dispatch(confirmarPago({ datosTarjeta, productoNombre: producto.nombre, cantidad }));
  }

  return (
    <div className={styles.fondo}>
      <div ref={hojaRef} className={styles.hoja} role="dialog" aria-modal="true" aria-labelledby="titulo-pago" tabIndex={-1}>
        <header className={styles.cabecera}>
          <h2 id="titulo-pago" className={styles.titulo}>
            Pagar con tarjeta de crédito
          </h2>
          <button
            type="button"
            className={styles.cerrar}
            onClick={() => dispatch(cerrarModal())}
            disabled={confirmando}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <ol className={styles.etapas} aria-label="Progreso del pago">
          {ETAPAS.map((nombre, indice) => {
            const numero = indice + 1;
            const estado = numero < etapaActual ? 'hecha' : numero === etapaActual ? 'actual' : 'pendiente';
            return (
              <li key={nombre} className={`${styles.etapa} ${styles[estado]}`} aria-current={numero === etapaActual ? 'step' : undefined}>
                <span className={styles.etapaNumero}>{numero < etapaActual ? '✓' : numero}</span>
                <span className={styles.etapaNombre}>{nombre}</span>
              </li>
            );
          })}
        </ol>

        {confirmando ? (
          <StepProcesando />
        ) : paso === 1 ? (
          <StepTarjeta
            valorInicial={datosTarjeta}
            onSiguiente={(datos) => {
              setDatosTarjeta(datos);
              setPaso(2);
            }}
          />
        ) : (
          datosTarjeta && (
            <StepResumen
              producto={producto}
              cantidad={cantidad}
              desglose={desglose}
              datosTarjeta={datosTarjeta}
              onAtras={() => setPaso(1)}
              onPagar={pagar}
            />
          )
        )}
      </div>
    </div>
  );
}
