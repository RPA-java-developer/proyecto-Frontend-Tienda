import { configureStore } from '@reduxjs/toolkit';
import productosReducer from '../features/productos/productosSlice';
import pagoReducer from '../features/pago/pagoSlice';
import transaccionesReducer, { CLAVE_LOCAL_STORAGE } from '../features/transacciones/transaccionesSlice';

export const store = configureStore({
  reducer: {
    productos: productosReducer,
    pago: pagoReducer,
    transacciones: transaccionesReducer,
  },
});

// Persistencia del historial: se escribe SOLO cuando esa porción cambia de referencia.
// Los datos de tarjeta nunca llegan a este store, así que jamás pueden llegar a localStorage.
let historialPrevio = store.getState().transacciones.items;
store.subscribe(() => {
  const historialActual = store.getState().transacciones.items;
  if (historialActual === historialPrevio) return;
  historialPrevio = historialActual;
  try {
    localStorage.setItem(CLAVE_LOCAL_STORAGE, JSON.stringify(historialActual));
  } catch {
    // Modo privado / cuota llena: no debe tumbar la app.
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
