import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, mensajeDeError } from '../../services/api-client';
import type { Producto } from '../../types/api';

interface ProductosState {
  items: Producto[];
  estado: 'inactivo' | 'cargando' | 'exito' | 'error';
  error: string | null;
}

const estadoInicial: ProductosState = {
  items: [],
  estado: 'inactivo',
  error: null,
};

export const cargarProductos = createAsyncThunk<Producto[], void, { state: { productos: ProductosState }; rejectValue: string }>(
  'productos/cargar',
  async (_, { rejectWithValue }) => {
    try {
      return await apiGet<Producto[]>('/productos');
    } catch (error) {
      return rejectWithValue(mensajeDeError(error));
    }
  },
  {
    // Evita peticiones duplicadas si ya hay una en vuelo (p.ej. StrictMode en desarrollo).
    condition: (_, { getState }) => getState().productos.estado !== 'cargando',
  },
);

const productosSlice = createSlice({
  name: 'productos',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarProductos.pending, (state) => {
        state.estado = 'cargando';
        state.error = null; // los items previos se conservan mientras se refresca
      })
      .addCase(cargarProductos.fulfilled, (state, action) => {
        state.estado = 'exito';
        state.items = action.payload;
      })
      .addCase(cargarProductos.rejected, (state, action) => {
        state.estado = 'error';
        state.error = action.payload ?? 'No se pudieron cargar los productos.';
      });
  },
});

export default productosSlice.reducer;
