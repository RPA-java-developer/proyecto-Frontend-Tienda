import type { DatosTarjetaFormulario } from './pagoSlice';

export type ErroresFormulario = Partial<Record<keyof DatosTarjetaFormulario, string>>;

function pasaLuhn(numero: string): boolean {
  let suma = 0;
  let alternar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = parseInt(numero.charAt(i), 10);
    if (alternar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
    alternar = !alternar;
  }
  return suma % 10 === 0;
}

/**
 * Validación en el cliente = feedback inmediato (espejo de las reglas del dominio del backend).
 * El backend SIEMPRE vuelve a validar todo; esto nunca es la única barrera.
 */
export function validarFormulario(datos: DatosTarjetaFormulario, ahora: Date = new Date()): ErroresFormulario {
  const errores: ErroresFormulario = {};
  const numeroLimpio = datos.numeroTarjeta.replace(/\s/g, '');

  if (!/^[0-9]{13,19}$/.test(numeroLimpio) || !pasaLuhn(numeroLimpio)) {
    errores.numeroTarjeta = 'Número de tarjeta inválido.';
  }

  const mes = Number(datos.mesExpiracion);
  if (!/^[0-9]{1,2}$/.test(datos.mesExpiracion) || mes < 1 || mes > 12) {
    errores.mesExpiracion = 'Mes inválido';
  }

  if (!/^([0-9]{2}|[0-9]{4})$/.test(datos.anioExpiracion)) {
    errores.anioExpiracion = 'Año inválido';
  } else if (!errores.mesExpiracion) {
    const anio = datos.anioExpiracion.length === 2 ? 2000 + Number(datos.anioExpiracion) : Number(datos.anioExpiracion);
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;
    if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
      errores.anioExpiracion = 'Tarjeta vencida';
    }
  }

  if (!/^[0-9]{3,4}$/.test(datos.cvc)) {
    errores.cvc = 'CVC inválido';
  }
  if (datos.nombreEnTarjeta.trim().length < 3) {
    errores.nombreEnTarjeta = 'Ingresa el nombre tal como aparece en la tarjeta.';
  }
  if (datos.numeroIdentificacion.trim().length === 0) {
    errores.numeroIdentificacion = 'Ingresa tu número de identificación.';
  }
  if (!Number.isInteger(datos.numeroCuotas) || datos.numeroCuotas < 1 || datos.numeroCuotas > 36) {
    errores.numeroCuotas = 'Cuotas inválidas.';
  }
  if (!datos.aceptaTerminosYCondiciones) {
    errores.aceptaTerminosYCondiciones = 'Debes aceptar los términos y condiciones.';
  }

  return errores;
}
