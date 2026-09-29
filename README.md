# Proyecto Frontend: Tienda-Wompi

Frontend móvil (React + Vite + Redux Toolkit + CSS Modules) de la tienda con pago con tarjeta crédito vía Wompi.(port:4000)

Consume el backend `tienda-backend` (NestJS). (port:3000)

## Estructura de carpetas del proyecto Frontend

![Logotipo del proyecto](/images/Estructura1.png)

---

## Flujo de páginas de la app - DEMO

### 1. **Listado** (`/`): nombre, descripción, precio y botón **Ver detalles**.

### 2. **Detalle** (`/producto/:id`): datos del producto, campo de **unidades** y botón **Pagar con tarjeta de crédito**.

### 3. **Modal wizard** (3 pasos):
   1. **Tarjeta** — datos validados en el cliente (Luhn, vencimiento, CVC, términos).
   2. **Resumen** — importe (precio × unidades) + tarifa base + tarifa de envío + total. Los montos los calcula el **backend**; la UI solo los muestra.
   3. **Pago** — ícono de "transacción en proceso" mientras se confirma.
### 4. Al terminar se **cierra el modal** y se muestra el resultado (aprobado / rechazado / pendiente con verificación automática).

---

Llamadas al backend: `GET /productos` · `POST /pagos/iniciar` · `POST /pagos/:id/confirmar` · `GET /pagos/:id/estado` (polling si queda pendiente).


## Arquitectura (Flux / Redux)

| Slice | Responsabilidad |
|---|---|
| `productos` | Listado (`GET /productos`) |
| `pago` | Máquina de estados: `inactivo → iniciando → modalAbierto → confirmando → finalizado` |
| `transacciones` | Historial de compras; reacciona a las acciones de `pago` y se persiste en `localStorage` |

---

## **Seguridad de datos de pago:** número de tarjeta, CVC, nombre e identificación viven solo en el estado
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
.env      # VITE_API_BASE_URL y VITE_DEMO_USUARIO_ID (usuario del seed del backend)
npm run dev               # http://localhost:4000
```

En **desarrollo**, el paso 1 muestra atajos "Aprobada / Rechazada" que rellenan tarjetas de prueba del
sandbox de Wompi. No existen en el build de producción.

```bash
npm test          # 40 tests (Vitest)
npm run build     # typecheck + build de producción
```
---

## Notas

- No hay autenticación en este alcance: el usuario esta en base de dato.  `VITE_DEMO_USUARIO_ID`.
- Si el usuario cierra el modal sin pagar, la orden queda `PENDIENTE` en el backend (sin cobro).

---

# DATOS DE PRUEBA (datos requeridos para verificar la funcionalidad)

- No hay autenticación en este alcance: el usuario esta en base de dato.  `VITE_DEMO_USUARIO_ID`.
- Si el usuario cierra el modal sin pagar, la orden queda `PENDIENTE` en el backend (sin cobro).

# Datos insertados en la base de datos PostgreSQL 

![Logotipo del proyecto](/images/producto_portatil.png)

En los recursos del proyecto TIENDA BACKEND WOMPI se tienen los respectivos scripts para crear la base de datos, las tablas y insertar datos de productos.

Documento detallado para el alistamiento de la Base de Datos - PostgreQSL

## Instrucciones para el proyecto frontend

En este documento se presentan las instrucciones para el uso y funcionamiento de la aplicación.

[Ver instrucciones de uso:](Instrucciones-base-datos.md)



---

# Flujo funcional de la aplicación 
## (evidencias)

# Paso 0: Punto de inicio "Listado de productos"


## Página de Inicio


Abre http://localhost:4000


![Logotipo del proyecto](/images/lista_productos.png)

En la imagen se observa la página por defecto.

Se presenta el listado de productos que están registrados en la base de datos (PostgreSQL).

La entidad producto tiene los datos de: "nombre", "cantidad", "precio del producto"...
Se tiene un espacio para una imagén miniatura (thumbnails).

La App presenta inicialmente un listado de todos los prodouctos, lo que facilita al usuario observar varios productos solamente en el primer listado.

Al lado izquierdo de cada producto se tiene un botón "Ver detalles".

![Logotipo del proyecto](/images/boton_detalles.png)

Este botón dirigue al cliente hacia una página de "producto detallado", donde se visualiza más información del producto concreto.

* El nombre
* La descripción
* El precio
* Las Unidades a comprar
* Información del inventario

Si el cliente desea "Comprar" el producto seleccionado la APP presenta un botón para "Pagar con tarjeta de crédito"


![Logotipo del proyecto](/images/boton_pago.png)


---
# Flujo wizard PAGO

Este es un flujo de varios paso donde se presenta de manera ordenada la captura de datos, la validación y finalmente una transacción monetaria.


## PASO 1: "Tarjeta" 
### Datos generales de Tarjeta de Crédito

En esta parte del proceso se presenta un formulario con los datos de la terjeta de crédito el nombre del cliente, identificación, números de cuotas a pagar y un checkbox para "Aceptar los términos y condiciones..."


![Logotipo del proyecto](/images/Pago_paso1.png)

Para la APP DEMO, se presenta una sección donde se presenta una "tarjeta de prueba" donde el cliente al pulsar "Aprobada" o "Rechazada" se colocan datos de prueba ya registrados en la App como se ve en la imagen.


![Logotipo del proyecto](/images/Pago_paso2.png)

El cliente puede registrar el número de cuotas que desea para dividir el pago. 

Se debe "Aceptar", marcar el checkbox para "Aceptar los terminos y condiciones..."

y finalmente pulsar sobre el botón "Siguiente".


![Logotipo del proyecto](/images/Pago_paso2_prueba2.png)


## PASO 2: "Resumen" 
### Presentación de los datos ingresados


En este paso "Resumen" se presenta el nombre del producto seleccionado, los valores de la transacción; como el valor del número de articulos comprados, los impuestos y otras tarifas asociadas.


Se destaca el "TOTAL A PAGAR" para facilitar al cliente su revisión y aprobación.

Los datos sensibles se manejan en memoria no se almacenan todos los datos.

### Se permina el retorno al paso anterior. 

Se presenta al cliente la opción de retorno al paso anterior.

### Pagar. 

Finalmente se tiene un botón de pagar con el valor total.


![Logotipo del proyecto](/images/Pago_paso3_resumen.png)

## PASO 3: "Pago" 
### Procesamiento del pago - "Transacción monetaria con Wompi"

En esta parte del proceso se realiza la transacción entre el "Comercio" y la API de Wompi para el cobro del valor del artículo y otros valores asocioados.

Si la transacción o la red presenta una latencia o demora se tiene una imagen de "cargando o en proceso" como retroalimentación hacia el cliente y visualice si la APP sigue funcionando o se bloquea.


![Logotipo del proyecto](/images/Pago_paso4_transaccion.png)


Dentro de este momento del proceso en el backend suceden varios pasos y uno de esos eventos son: 
* Crear la transacción
* Validar los datos de la tarjeta
* Verificar el inventario 
* Otras validaciones...

Se presenta en la pantalla un resumen con datos generales e informa al cliente el proceso que se esta realizando "Estamos verificando tu pago".


![Logotipo del proyecto](/images/Pago_paso5_verificar_pago.png)


Finalmente se tiene una pantalla final de confirmación del "Estado" de la transacción
ACEPTADA que significa que la transacción en todos sus paso fue exitosa.
-  RECHAZADA si alguno de los pasos falla.


![Logotipo del proyecto](/images/Pago_paso6_transaccion_aprobada.png)

Para finalizar e independiente del resultado de la transacción se presenta un botón de retorno al menú principal "Volver a la tienda".

El retorno presenta la información de la transacciones realizadas y su estado.

![Logotipo del proyecto](/images/lista_productos_retorno.png)




