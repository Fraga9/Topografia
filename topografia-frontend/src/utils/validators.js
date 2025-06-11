// utils/validators.js - Validadores específicos para topografía
import { LIMITES_VALIDACION, CALIDADES_LECTURA, ESTADOS_PROYECTO } from './constants';

/**
 * Validadores para datos topográficos
 */
export const validators = {
  /**
   * Validar datos de proyecto
   */
  proyecto: {
    nombre: (value) => {
      if (!value || typeof value !== 'string') {
        return { valid: false, message: 'El nombre es requerido' };
      }
      if (value.trim().length < 3) {
        return { valid: false, message: 'El nombre debe tener al menos 3 caracteres' };
      }
      if (value.length > 100) {
        return { valid: false, message: 'El nombre no puede exceder 100 caracteres' };
      }
      return { valid: true };
    },

    descripcion: (value) => {
      if (!value || typeof value !== 'string') {
        return { valid: false, message: 'La descripción es requerida' };
      }
      if (value.trim().length < 10) {
        return { valid: false, message: 'La descripción debe tener al menos 10 caracteres' };
      }
      return { valid: true };
    },

    kilometros: (kmInicial, kmFinal) => {
      if (kmInicial === null || kmInicial === undefined || kmFinal === null || kmFinal === undefined) {
        return { valid: false, message: 'Los kilómetros inicial y final son requeridos' };
      }

      if (kmInicial < LIMITES_VALIDACION.KM_MIN || kmInicial > LIMITES_VALIDACION.KM_MAX) {
        return { valid: false, message: `KM inicial debe estar entre ${LIMITES_VALIDACION.KM_MIN} y ${LIMITES_VALIDACION.KM_MAX}` };
      }

      if (kmFinal < LIMITES_VALIDACION.KM_MIN || kmFinal > LIMITES_VALIDACION.KM_MAX) {
        return { valid: false, message: `KM final debe estar entre ${LIMITES_VALIDACION.KM_MIN} y ${LIMITES_VALIDACION.KM_MAX}` };
      }

      if (kmFinal <= kmInicial) {
        return { valid: false, message: 'El kilómetro final debe ser mayor al inicial' };
      }

      return { valid: true };
    },

    estado: (value) => {
      if (!Object.values(ESTADOS_PROYECTO).includes(value)) {
        return { valid: false, message: 'Estado de proyecto no válido' };
      }
      return { valid: true };
    }
  },

  /**
   * Validar datos de estación
   */
  estacion: {
    nombre: (value) => {
      if (!value || typeof value !== 'string') {
        return { valid: false, message: 'El nombre de la estación es requerido' };
      }
      if (value.trim().length < 2) {
        return { valid: false, message: 'El nombre debe tener al menos 2 caracteres' };
      }
      return { valid: true };
    },

    km: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'El kilómetro es requerido' };
      }
      if (value < LIMITES_VALIDACION.KM_MIN || value > LIMITES_VALIDACION.KM_MAX) {
        return { valid: false, message: `Debe estar entre ${LIMITES_VALIDACION.KM_MIN} y ${LIMITES_VALIDACION.KM_MAX}` };
      }
      return { valid: true };
    },

    coordenadas: (x, y) => {
      // Validación básica para coordenadas UTM
      if (x !== null && x !== undefined) {
        if (x < 100000 || x > 900000) {
          return { valid: false, message: 'Coordenada X fuera de rango válido para UTM' };
        }
      }
      if (y !== null && y !== undefined) {
        if (y < 0 || y > 10000000) {
          return { valid: false, message: 'Coordenada Y fuera de rango válido para UTM' };
        }
      }
      return { valid: true };
    }
  },

  /**
   * Validar datos de medición
   */
  medicion: {
    numeroMedicion: (value) => {
      if (!value || typeof value !== 'string') {
        return { valid: false, message: 'El número de medición es requerido' };
      }
      if (value.trim().length < 1) {
        return { valid: false, message: 'El número de medición no puede estar vacío' };
      }
      return { valid: true };
    },

    fechaMedicion: (value) => {
      if (!value) {
        return { valid: false, message: 'La fecha de medición es requerida' };
      }
      const fecha = new Date(value);
      if (isNaN(fecha.getTime())) {
        return { valid: false, message: 'Fecha de medición no válida' };
      }
      if (fecha > new Date()) {
        return { valid: false, message: 'La fecha no puede ser futura' };
      }
      return { valid: true };
    },

    elevacionInstrumento: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'La elevación del instrumento es requerida' };
      }
      if (value < -1000 || value > 10000) {
        return { valid: false, message: 'Elevación fuera de rango (-1000 a 10000 m)' };
      }
      return { valid: true };
    }
  },

  /**
   * Validar datos de lectura
   */
  lectura: {
    posicion: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'La posición es requerida' };
      }
      if (value < -50 || value > 50) {
        return { valid: false, message: 'Posición fuera de rango (-50 a 50 m)' };
      }
      return { valid: true };
    },

    lecturaMira: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'La lectura de mira es requerida' };
      }
      if (value < LIMITES_VALIDACION.LECTURA_MIRA_MIN || value > LIMITES_VALIDACION.LECTURA_MIRA_MAX) {
        return { 
          valid: false, 
          message: `Debe estar entre ${LIMITES_VALIDACION.LECTURA_MIRA_MIN} y ${LIMITES_VALIDACION.LECTURA_MIRA_MAX} m` 
        };
      }
      return { valid: true };
    },

    calidad: (value) => {
      if (!Object.values(CALIDADES_LECTURA).includes(value)) {
        return { valid: false, message: 'Calidad de lectura no válida' };
      }
      return { valid: true };
    }
  },

  /**
   * Validar datos de configuración
   */
  configuracion: {
    intervalo: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'El intervalo es requerido' };
      }
      if (value < LIMITES_VALIDACION.INTERVALO_MIN || value > LIMITES_VALIDACION.INTERVALO_MAX) {
        return { 
          valid: false, 
          message: `Debe estar entre ${LIMITES_VALIDACION.INTERVALO_MIN} y ${LIMITES_VALIDACION.INTERVALO_MAX} m` 
        };
      }
      return { valid: true };
    },

    espesor: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'El espesor es requerido' };
      }
      if (value < LIMITES_VALIDACION.ESPESOR_MIN || value > LIMITES_VALIDACION.ESPESOR_MAX) {
        return { 
          valid: false, 
          message: `Debe estar entre ${LIMITES_VALIDACION.ESPESOR_MIN} y ${LIMITES_VALIDACION.ESPESOR_MAX} m` 
        };
      }
      return { valid: true };
    },

    toleranciaSCT: (value) => {
      if (value === null || value === undefined) {
        return { valid: false, message: 'La tolerancia SCT es requerida' };
      }
      if (value < LIMITES_VALIDACION.TOLERANCIA_MIN || value > LIMITES_VALIDACION.TOLERANCIA_MAX) {
        return { 
          valid: false, 
          message: `Debe estar entre ${LIMITES_VALIDACION.TOLERANCIA_MIN} y ${LIMITES_VALIDACION.TOLERANCIA_MAX} m` 
        };
      }
      return { valid: true };
    }
  },

  /**
   * Validador de formularios completos
   */
  formulario: (data, esquema) => {
    const errores = {};
    
    Object.keys(esquema).forEach(campo => {
      const validador = esquema[campo];
      const valor = data[campo];
      
      if (typeof validador === 'function') {
        const resultado = validador(valor);
        if (!resultado.valid) {
          errores[campo] = resultado.message;
        }
      } else if (Array.isArray(validador)) {
        // Múltiples validadores para un campo
        for (const v of validador) {
          const resultado = v(valor);
          if (!resultado.valid) {
            errores[campo] = resultado.message;
            break;
          }
        }
      }
    });

    return {
      valid: Object.keys(errores).length === 0,
      errores
    };
  },

  /**
   * Validadores de archivos
   */
  archivo: {
    csv: (archivo) => {
      if (!archivo) {
        return { valid: false, message: 'Archivo requerido' };
      }
      if (!archivo.type.includes('csv') && !archivo.name.endsWith('.csv')) {
        return { valid: false, message: 'El archivo debe ser CSV' };
      }
      if (archivo.size > 10 * 1024 * 1024) { // 10MB
        return { valid: false, message: 'El archivo no puede exceder 10MB' };
      }
      return { valid: true };
    },

    excel: (archivo) => {
      if (!archivo) {
        return { valid: false, message: 'Archivo requerido' };
      }
      const tiposValidos = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!tiposValidos.includes(archivo.type) && 
          !archivo.name.endsWith('.xls') && 
          !archivo.name.endsWith('.xlsx')) {
        return { valid: false, message: 'El archivo debe ser Excel (.xls o .xlsx)' };
      }
      if (archivo.size > 25 * 1024 * 1024) { // 25MB
        return { valid: false, message: 'El archivo no puede exceder 25MB' };
      }
      return { valid: true };
    }
  },

  /**
   * Validadores de coherencia entre datos
   */
  coherencia: {
    estacionEnProyecto: (estacion, proyecto) => {
      if (estacion.km < proyecto.km_inicial || estacion.km > proyecto.km_final) {
        return { 
          valid: false, 
          message: `La estación debe estar entre km ${proyecto.km_inicial} y ${proyecto.km_final}` 
        };
      }
      return { valid: true };
    },

    lecturasConsecutivas: (lecturas) => {
      if (!lecturas || lecturas.length < 2) return { valid: true };

      const lecturasOrdenadas = [...lecturas].sort((a, b) => a.posicion - b.posicion);
      
      for (let i = 1; i < lecturasOrdenadas.length; i++) {
        const diferencia = Math.abs(lecturasOrdenadas[i].posicion - lecturasOrdenadas[i-1].posicion);
        if (diferencia < 0.1) { // Mínimo 10cm entre lecturas
          return { 
            valid: false, 
            message: `Lecturas muy cercanas en posiciones ${lecturasOrdenadas[i-1].posicion} y ${lecturasOrdenadas[i].posicion}` 
          };
        }
      }
      return { valid: true };
    }
  }
};
