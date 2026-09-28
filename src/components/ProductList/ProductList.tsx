import type { Producto } from '../../types/api';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './ProductList.module.css';

interface ProductListProps {
  productos: Producto[];
  onVerDetalles: (producto: Producto) => void;
}

export function ProductList({ productos, onVerDetalles }: ProductListProps) {
  return (
    <div className={styles.lista}>
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onVerDetalles={onVerDetalles} />
      ))}
    </div>
  );
}
