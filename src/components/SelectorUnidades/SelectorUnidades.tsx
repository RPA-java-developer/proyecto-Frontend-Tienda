import { useEffect, useState } from 'react';
import styles from './SelectorUnidades.module.css';

interface SelectorUnidadesProps {
  valor: number;
  maximo: number;
  disabled?: boolean;
  onChange: (cantidad: number) => void;
}

/** Campo de unidades: botones −/+ y edición directa por teclado numérico. */
export function SelectorUnidades({ valor, maximo, disabled = false, onChange }: SelectorUnidadesProps) {
  // Texto local para permitir borrar el campo mientras se escribe; se normaliza al salir.
  const [texto, setTexto] = useState(String(valor));

  useEffect(() => {
    setTexto(String(valor));
  }, [valor]);

  function alEscribir(entrada: string) {
    const soloDigitos = entrada.replace(/\D/g, '').slice(0, 4);
    setTexto(soloDigitos);
    const numero = Number(soloDigitos);
    if (numero >= 1) onChange(numero);
  }

  return (
    <div className={styles.selector}>
      <label htmlFor="unidades" className={styles.etiqueta}>
        Unidades
      </label>
      <div className={styles.controles}>
        <button
          type="button"
          className={styles.boton}
          onClick={() => onChange(valor - 1)}
          disabled={disabled || valor <= 1}
          aria-label="Restar una unidad"
        >
          −
        </button>
        <input
          id="unidades"
          className={styles.entrada}
          inputMode="numeric"
          pattern="[0-9]*"
          value={texto}
          disabled={disabled}
          onChange={(e) => alEscribir(e.target.value)}
          onBlur={() => setTexto(String(valor))}
          aria-describedby="unidades-ayuda"
        />
        <button
          type="button"
          className={styles.boton}
          onClick={() => onChange(valor + 1)}
          disabled={disabled || valor >= maximo}
          aria-label="Sumar una unidad"
        >
          +
        </button>
      </div>
      <span id="unidades-ayuda" className={styles.ayuda}>
        {maximo > 0 ? `Máximo ${maximo} disponible${maximo === 1 ? '' : 's'}` : 'Sin stock'}
      </span>
    </div>
  );
}
