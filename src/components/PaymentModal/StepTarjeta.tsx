import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { DatosTarjetaFormulario } from '../../features/pago/pagoSlice';
import { validarFormulario, type ErroresFormulario } from '../../features/pago/validaciones';
import styles from './PaymentModal.module.css';

const DATOS_VACIOS: DatosTarjetaFormulario = {
  numeroTarjeta: '',
  mesExpiracion: '',
  anioExpiracion: '',
  cvc: '',
  nombreEnTarjeta: '',
  tipoIdentificacion: 'CC',
  numeroIdentificacion: '',
  numeroCuotas: 1,
  aceptaTerminosYCondiciones: false,
};

const OPCIONES_CUOTAS = [1, 2, 3, 6, 12, 24, 36];

/** Solo en desarrollo: tarjetas ficticias del sandbox de Wompi para probar cada desenlace. */
function datosDePrueba(tipo: 'aprobada' | 'rechazada'): DatosTarjetaFormulario {
  return {
    ...DATOS_VACIOS,
    numeroTarjeta: tipo === 'aprobada' ? '4242 4242 4242 4242' : '4111 1111 1111 1111',
    mesExpiracion: '12',
    anioExpiracion: String(new Date().getFullYear() + 2),
    cvc: '123',
    nombreEnTarjeta: 'Juan Perez',
    numeroIdentificacion: '1020304050',
    // Los términos NO se marcan solos: el usuario debe aceptarlos conscientemente.
  };
}

function formatearNumeroTarjeta(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

interface StepTarjetaProps {
  valorInicial: DatosTarjetaFormulario | null;
  onSiguiente: (datos: DatosTarjetaFormulario) => void;
}

export function StepTarjeta({ valorInicial, onSiguiente }: StepTarjetaProps) {
  const [datos, setDatos] = useState<DatosTarjetaFormulario>(valorInicial ?? DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Al fallar la validación, el foco va al primer campo inválido.
  useEffect(() => {
    if (Object.keys(errores).length > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [errores]);

  function actualizar<K extends keyof DatosTarjetaFormulario>(campo: K, valor: DatosTarjetaFormulario[K]) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validarFormulario(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length === 0) {
      onSiguiente(datos);
    }
  }

  const erroresFila = [errores.mesExpiracion, errores.anioExpiracion, errores.cvc].filter(Boolean).join(' · ');

  return (
    <form ref={formRef} className={styles.paso} onSubmit={alEnviar} noValidate>
      <div className={styles.cuerpo}>
        {import.meta.env.DEV && (
          <div className={styles.pruebas}>
            <span>Tarjeta de prueba:</span>
            <button type="button" onClick={() => setDatos(datosDePrueba('aprobada'))}>
              Aprobada
            </button>
            <button type="button" onClick={() => setDatos(datosDePrueba('rechazada'))}>
              Rechazada
            </button>
          </div>
        )}

        <div className={styles.campo}>
          <label htmlFor="numeroTarjeta">Número de tarjeta</label>
          <input
            id="numeroTarjeta"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={datos.numeroTarjeta}
            aria-invalid={Boolean(errores.numeroTarjeta)}
            onChange={(e) => actualizar('numeroTarjeta', formatearNumeroTarjeta(e.target.value))}
          />
          {errores.numeroTarjeta && <p className={styles.error}>{errores.numeroTarjeta}</p>}
        </div>

        <div className={styles.fila}>
          <div className={styles.campo}>
            <label htmlFor="mesExpiracion">Mes</label>
            <input
              id="mesExpiracion"
              inputMode="numeric"
              autoComplete="cc-exp-month"
              placeholder="MM"
              maxLength={2}
              value={datos.mesExpiracion}
              aria-invalid={Boolean(errores.mesExpiracion)}
              onChange={(e) => actualizar('mesExpiracion', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className={styles.campo}>
            <label htmlFor="anioExpiracion">Año</label>
            <input
              id="anioExpiracion"
              inputMode="numeric"
              autoComplete="cc-exp-year"
              placeholder="AAAA"
              maxLength={4}
              value={datos.anioExpiracion}
              aria-invalid={Boolean(errores.anioExpiracion)}
              onChange={(e) => actualizar('anioExpiracion', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className={styles.campo}>
            <label htmlFor="cvc">CVC</label>
            <input
              id="cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              maxLength={4}
              value={datos.cvc}
              aria-invalid={Boolean(errores.cvc)}
              onChange={(e) => actualizar('cvc', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
        {erroresFila && <p className={styles.error}>{erroresFila}</p>}

        <div className={styles.campo}>
          <label htmlFor="nombreEnTarjeta">Nombre en la tarjeta</label>
          <input
            id="nombreEnTarjeta"
            autoComplete="cc-name"
            placeholder="Como aparece en la tarjeta"
            value={datos.nombreEnTarjeta}
            aria-invalid={Boolean(errores.nombreEnTarjeta)}
            onChange={(e) => actualizar('nombreEnTarjeta', e.target.value)}
          />
          {errores.nombreEnTarjeta && <p className={styles.error}>{errores.nombreEnTarjeta}</p>}
        </div>

        <div className={styles.fila}>
          <div className={styles.campo}>
            <label htmlFor="tipoIdentificacion">Tipo doc.</label>
            <select
              id="tipoIdentificacion"
              value={datos.tipoIdentificacion}
              onChange={(e) => actualizar('tipoIdentificacion', e.target.value)}
            >
              {['CC', 'CE', 'TI', 'PA', 'NIT'].map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.campo} ${styles.campoAncho}`}>
            <label htmlFor="numeroIdentificacion">Número de identificación</label>
            <input
              id="numeroIdentificacion"
              inputMode="numeric"
              value={datos.numeroIdentificacion}
              aria-invalid={Boolean(errores.numeroIdentificacion)}
              onChange={(e) => actualizar('numeroIdentificacion', e.target.value)}
            />
          </div>
        </div>
        {errores.numeroIdentificacion && <p className={styles.error}>{errores.numeroIdentificacion}</p>}

        <div className={styles.campo}>
          <label htmlFor="numeroCuotas">Cuotas</label>
          <select id="numeroCuotas" value={datos.numeroCuotas} onChange={(e) => actualizar('numeroCuotas', Number(e.target.value))}>
            {OPCIONES_CUOTAS.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'cuota' : 'cuotas'}
              </option>
            ))}
          </select>
        </div>

        <label className={styles.terminos}>
          <input
            type="checkbox"
            checked={datos.aceptaTerminosYCondiciones}
            aria-invalid={Boolean(errores.aceptaTerminosYCondiciones)}
            onChange={(e) => actualizar('aceptaTerminosYCondiciones', e.target.checked)}
          />
          <span>Acepto los términos y condiciones y la política de tratamiento de datos personales.</span>
        </label>
        {errores.aceptaTerminosYCondiciones && <p className={styles.error}>{errores.aceptaTerminosYCondiciones}</p>}
      </div>

      <div className={styles.pie}>
        <button type="submit" className={styles.botonPrimario}>
          Siguiente
        </button>
      </div>
    </form>
  );
}
