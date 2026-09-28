import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { cargarProductos } from '../../features/productos/productosSlice';
import { Header } from '../../components/Header/Header';
import { ProductList } from '../../components/ProductList/ProductList';
import { HistorialCompras } from '../../components/HistorialCompras/HistorialCompras';
import type { Producto } from '../../types/api';
import styles from './ProductListPage.module.css';

export function ProductListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, estado, error } = useAppSelector((s) => s.productos);

  // Cada vez que se entra al listado se refresca (el stock cambia tras cada compra).
  useEffect(() => {
    void dispatch(cargarProductos());
  }, [dispatch]);

  const cargandoPrimeraVez = items.length === 0 && (estado === 'inactivo' || estado === 'cargando');

  return (
    <div className={styles.pagina}>
      <Header titulo="Tienda" />

      {cargandoPrimeraVez && <p className={styles.mensaje}>Cargando productos…</p>}

      {estado === 'error' && items.length === 0 && (
        <div className={styles.mensaje} role="alert">
          <p>No se pudieron cargar los productos.</p>
          <p className={styles.detalleError}>{error}</p>
          <button type="button" className={styles.reintentar} onClick={() => void dispatch(cargarProductos())}>
            Reintentar
          </button>
        </div>
      )}

      {estado === 'exito' && items.length === 0 && <p className={styles.mensaje}>No hay productos disponibles por ahora.</p>}

      {items.length > 0 && (
        <ProductList productos={items} onVerDetalles={(producto: Producto) => navigate(`/producto/${producto.id}`)} />
      )}

      <HistorialCompras />
    </div>
  );
}
