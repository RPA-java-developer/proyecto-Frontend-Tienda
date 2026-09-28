import type { Producto } from '../../types/api';
import { formatearCentavos } from '../../services/format';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  producto: Producto;
  onVerDetalles: (producto: Producto) => void;
}

export function ProductCard({ producto, onVerDetalles }: ProductCardProps) {
  const agotado = producto.stock <= 0;

  return (
    <article className={styles.tarjeta}>
      <div className={styles.imagen} aria-hidden="true">
        {producto.nombre.charAt(0).toUpperCase()}
      </div>

      <div className={styles.info}>
        <h3 className={styles.nombre}>{producto.nombre}</h3>
        <p className={styles.descripcion}>{producto.descripcion}</p>

        <div className={styles.pie}>
          <div className={styles.precioYStock}>
            <span className={styles.precio}>{formatearCentavos(producto.precioEnCentavos)}</span>
            {agotado && <span className={styles.agotado}>Agotado</span>}
          </div>
          <button
            type="button"
            className={styles.boton}
            onClick={() => onVerDetalles(producto)}
            aria-label={`Ver detalles de ${producto.nombre}`}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}
