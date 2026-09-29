import { useState } from 'react';
import type { Producto } from '../../types/api';
import { formatearCentavos } from '../../services/format';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  producto: Producto;
  onVerDetalles: (producto: Producto) => void;
}

// Placeholder mientras el backend no envía imagenUrl por producto.
// public/images/picture.png se sirve en la raíz como /images/picture.png (así funciona Vite).
const IMAGEN_POR_DEFECTO = '/images/';

export function ProductCard({ producto, onVerDetalles }: ProductCardProps) {
  const agotado = producto.stock <= 0;

  const [fallaImagen, setFallaImagen] = useState(false);
  const rutaImagen = producto.imagenUrl ?? IMAGEN_POR_DEFECTO;
  const mostrarImagen = !fallaImagen;

  return (
    <article className={styles.tarjeta}>
      <div className={styles.imagen} aria-hidden="true">
        {mostrarImagen ? (
          <img
            src={rutaImagen + producto.nombre.split(" ")[0] + ".png"}
            alt=""
            className={styles.imagenFoto}
            loading="lazy"
            onError={() => setFallaImagen(true)} // archivo faltante/404 -> cae a la inicial
          />
        ) : (
          producto.nombre.charAt(0).toUpperCase()      
        )
        }
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
