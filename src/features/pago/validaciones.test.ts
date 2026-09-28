import { describe, expect, it } from 'vitest';
import { validarFormulario } from './validaciones';
import type { DatosTarjetaFormulario } from './pagoSlice';

const AHORA = new Date('2026-09-28T12:00:00');

function datosValidos(overrides: Partial<DatosTarjetaFormulario> = {}): DatosTarjetaFormulario {
  return {
    numeroTarjeta: '4242 4242 4242 4242',
    mesExpiracion: '12',
    anioExpiracion: '2029',
    cvc: '123',
    nombreEnTarjeta: 'Juan Perez',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '1020304050',
    numeroCuotas: 1,
    aceptaTerminosYCondiciones: true,
    ...overrides,
  };
}

describe('validarFormulario', () => {
  it('acepta datos válidos', () => {
    expect(validarFormulario(datosValidos(), AHORA)).toEqual({});
  });

  it('rechaza un número que no pasa Luhn', () => {
    expect(validarFormulario(datosValidos({ numeroTarjeta: '4242 4242 4242 4241' }), AHORA).numeroTarjeta).toBeDefined();
  });

  it('rechaza un número demasiado corto', () => {
    expect(validarFormulario(datosValidos({ numeroTarjeta: '1234' }), AHORA).numeroTarjeta).toBeDefined();
  });

  it('rechaza una tarjeta vencida (año pasado)', () => {
    expect(validarFormulario(datosValidos({ mesExpiracion: '12', anioExpiracion: '2025' }), AHORA).anioExpiracion).toBe('Tarjeta vencida');
  });

  it('rechaza una tarjeta vencida (mismo año, mes anterior)', () => {
    expect(validarFormulario(datosValidos({ mesExpiracion: '08', anioExpiracion: '2026' }), AHORA).anioExpiracion).toBe('Tarjeta vencida');
  });

  it('acepta el mes actual como vigente', () => {
    expect(validarFormulario(datosValidos({ mesExpiracion: '09', anioExpiracion: '2026' }), AHORA).anioExpiracion).toBeUndefined();
  });

  it('acepta año de 2 dígitos', () => {
    expect(validarFormulario(datosValidos({ anioExpiracion: '29' }), AHORA).anioExpiracion).toBeUndefined();
  });

  it('rechaza mes fuera de rango', () => {
    expect(validarFormulario(datosValidos({ mesExpiracion: '13' }), AHORA).mesExpiracion).toBeDefined();
    expect(validarFormulario(datosValidos({ mesExpiracion: '0' }), AHORA).mesExpiracion).toBeDefined();
  });

  it('rechaza CVC inválido', () => {
    expect(validarFormulario(datosValidos({ cvc: '12' }), AHORA).cvc).toBeDefined();
    expect(validarFormulario(datosValidos({ cvc: 'abc' }), AHORA).cvc).toBeDefined();
  });

  it('exige aceptar términos y condiciones', () => {
    expect(validarFormulario(datosValidos({ aceptaTerminosYCondiciones: false }), AHORA).aceptaTerminosYCondiciones).toBeDefined();
  });

  it('exige nombre e identificación', () => {
    const errores = validarFormulario(datosValidos({ nombreEnTarjeta: 'Jo', numeroIdentificacion: '  ' }), AHORA);
    expect(errores.nombreEnTarjeta).toBeDefined();
    expect(errores.numeroIdentificacion).toBeDefined();
  });
});
