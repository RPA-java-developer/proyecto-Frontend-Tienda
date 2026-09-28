# tienda-frontend

Frontend móvil (React + Vite + Redux Toolkit + CSS Modules) de la tienda con pago con tarjeta vía Wompi.
Consume el backend `tienda-backend` (NestJS).

## Flujo

1. **Listado** (`/`): nombre, descripción, precio y botón **Ver detalles**.
2. **Detalle** (`/producto/:id`): datos del producto, campo de **unidades** y botón **Pagar con tarjeta de crédito**.
3. **Modal wizard** (3 pasos):
   1. **Tarjeta** — datos validados en el cliente (Luhn, vencimiento, CVC, términos).
   2. **Resumen** — importe (precio × unidades) + tarifa base + tarifa de envío + total. Los montos los calcula el **backend**; la UI solo los muestra.
   3. **Pago** — ícono de "transacción en proceso" mientras se confirma.
4. Al terminar se **cierra el modal** y se muestra el resultado (aprobado / rechazado / pendiente con verificación automática).

Llamadas al backend: `GET /productos` · `POST /pagos/iniciar` · `POST /pagos/:id/confirmar` · `GET /pagos/:id/estado` (polling si queda pendiente).

## Arquitectura (Flux / Redux)

| Slice | Responsabilidad |
|---|---|
| `productos` | Listado (`GET /productos`) |
| `pago` | Máquina de estados: `inactivo → iniciando → modalAbierto → confirmando → finalizado` |
| `transacciones` | Historial de compras; reacciona a las acciones de `pago` y se persiste en `localStorage` |

**Seguridad de datos de pago:** número de tarjeta, CVC, nombre e identificación viven solo en el estado
local del modal (`useState`) y viajan como argumento transitorio del thunk. **Ningún reducer los guarda
y nunca llegan a `localStorage`** (hay tests que lo verifican). Solo se persiste: id de orden/transacción,
producto, cantidad, monto, estado y fecha. Los datos leídos de `localStorage` se validan (forma y tipos)
antes de usarse.

## Mobile-first

CSS base para 375 px (iPhone SE) y `min-width` para escalar. Modal como *bottom-sheet* en móvil y
diálogo centrado desde 600 px. Objetivos táctiles ≥ 44 px, inputs de 16 px (sin auto-zoom en iOS),
`safe-area-inset` para notch/barra inferior, sin scroll horizontal (verificado a 320, 375, 768 y 1280 px).

## Puesta en marcha

```bash
npm install
cp .env.example .env      # VITE_API_BASE_URL y VITE_DEMO_USUARIO_ID (usuario del seed del backend)
npm run dev               # http://localhost:5173
```

En **desarrollo**, el paso 1 muestra atajos "Aprobada / Rechazada" que rellenan tarjetas de prueba del
sandbox de Wompi. No existen en el build de producción.

```bash
npm test          # 40 tests (Vitest)
npm run build     # typecheck + build de producción
```

## Notas

- No hay autenticación en este alcance: el usuario sale de `VITE_DEMO_USUARIO_ID`.
- Si el usuario cierra el modal sin pagar, la orden queda `PENDIENTE` en el backend (sin cobro).
