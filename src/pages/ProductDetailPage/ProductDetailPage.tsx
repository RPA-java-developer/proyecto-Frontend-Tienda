import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { cargarProductos } from '../../features/productos/productosSlice';
import { establecerCantidad, iniciarPago, reiniciarPago } from '../../features/pago/pagoSlice';
import { Header } from '../../components/Header/Header';
import { SelectorUnidades } from '../../components/SelectorUnidades/SelectorUnidades';
import { PaymentModal } from '../../components/PaymentModal/PaymentModal';
import { ResultadoPago } from '../../components/ResultadoPago/ResultadoPago';
import { formatearCentavos } from '../../services/format';
import styles from './ProductDetailPage.module.css';

// No hay autenticación en este alcance: el usuario de la demo viene de la configuración.
const USUARIO_ID_DEMO = import.meta.env.VITE_DEMO_USUARIO_ID;

export function ProductDetailPage() {
  const { productoId } = useParams<{ productoId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, estado: estadoProductos, error: errorProductos } = useAppSelector((s) => s.productos);
  const pago = useAppSelector((s) => s.pago);
  const producto = items.find((p) => p.id === productoId);

  // Siempre se entra con un flujo de pago limpio (salvo que haya uno en vuelo).
  const faseRef = useRef(pago.fase);
  faseRef.current = pago.fase;
  useEffect(() => {
    const limpiar = () => {
      if (faseRef.current !== 'confirmando' && faseRef.current !== 'iniciando') {
        dispatch(reiniciarPago());
      }
    };
    limpiar();
    return limpiar;
  }, [dispatch]);

  // Entrada directa por URL / recarga: hay que traer los productos.
  useEffect(() => {
    if (estadoProductos === 'inactivo') void dispatch(cargarProductos());
  }, [estadoProductos, dispatch]);

  // Cuando el pago se resuelve (aprobado/rechazado), se refresca el stock mostrado.
  const estadoResultado = pago.resultado?.estado;
  useEffect(() => {
    if (estadoResultado && estadoResultado !== 'PENDIENTE') void dispatch(cargarProductos());
  }, [estadoResultado, dispatch]);

  if (!producto) {
    const cargando = estadoProductos === 'inactivo' || estadoProductos === 'cargando';
    return (
      <div className={styles.pagina}>
        <Header titulo="Detalle" onVolver={() => navigate('/')} />
        <div className={styles.mensaje} role={estadoProductos === 'error' ? 'alert' : 'status'}>
          {cargando && <p>Cargando producto…</p>}
          {estadoProductos === 'error' && <p>{errorProductos}</p>}
          {estadoProductos === 'exito' && <p>No encontramos este producto.</p>}
          {!cargando && (
            <button type="button" className={styles.secundario} onClick={() => navigate('/')}>
              Volver a la tienda
            </button>
          )}
        </div>
      </div>
    );
  }

  const agotado = producto.stock <= 0;
  const iniciando = pago.fase === 'iniciando';
  const finalizado = pago.fase === 'finalizado' && pago.productoId === producto.id;
  const modalVisible = pago.fase === 'modalAbierto' || pago.fase === 'confirmando';
  const bloqueado = pago.fase !== 'inactivo';

  function manejarPagar() {
    if (!producto) return;
    void dispatch(iniciarPago({ usuarioId: USUARIO_ID_DEMO, productoId: producto.id, productoNombre: producto.nombre }));
  }

  return (
    <div className={styles.pagina}>
      <Header titulo="Detalle del producto" onVolver={() => navigate('/')} />

      <main className={styles.contenido}>
        <div className={styles.imagen} aria-hidden="true">
          {producto.nombre.charAt(0).toUpperCase()}
        </div>

        <h2 className={styles.nombre}>{producto.nombre}</h2>
        <p className={styles.descripcion}>{producto.descripcion}</p>
        <p className={styles.precio}>
          {formatearCentavos(producto.precioEnCentavos)} <span className={styles.porUnidad}>por unidad</span>
        </p>

        {finalizado ? (
          <ResultadoPago
            onVolverATienda={() => navigate('/')}
            onReintentar={() => dispatch(reiniciarPago())}
          />
        ) : (
          <>
            {!agotado && (
              <SelectorUnidades
                valor={pago.cantidad}
                maximo={producto.stock}
                disabled={bloqueado}
                onChange={(cantidad) => dispatch(establecerCantidad({ cantidad, maximo: producto.stock }))}
              />
            )}
            {agotado && <p className={styles.agotado}>Este producto está agotado.</p>}

            {pago.errorInicio && (
              <p className={styles.errorInicio} role="alert">
                {pago.errorInicio}
              </p>
            )}
          </>
        )}
      </main>

      {!finalizado && (
        <div className={styles.barraInferior}>
          <button type="button" className={styles.botonPagar} onClick={manejarPagar} disabled={agotado || bloqueado}>
            {iniciando ? 'Preparando tu pago…' : agotado ? 'Agotado' : 'Pagar con tarjeta de crédito'}
          </button>
        </div>
      )}

      {modalVisible && <PaymentModal producto={producto} />}
    </div>
  );
}
