// services/projectService.js - Servicio de lógica de negocio para proyectos
import { ESTADOS_PROYECTO, DEFAULTS_PROYECTO, LIMITES_VALIDACION } from '../utils/constants';

/**
 * Servicio que encapsula la lógica de negocio específica
 * para la gestión de proyectos topográficos.
 */
export const projectService = {
  /**
   * Valida los datos de un proyecto antes de crearlo/actualizarlo
   */
  validateProjectData: (projectData) => {
    const errors = {};

    // Validar nombre
    if (!projectData.nombre || projectData.nombre.trim().length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar descripción
    if (!projectData.descripcion || projectData.descripcion.trim().length < 10) {
      errors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    // Validar kilómetros
    if (projectData.km_inicial !== undefined) {
      if (projectData.km_inicial < LIMITES_VALIDACION.KM_MIN || 
          projectData.km_inicial > LIMITES_VALIDACION.KM_MAX) {
        errors.km_inicial = `Debe estar entre ${LIMITES_VALIDACION.KM_MIN} y ${LIMITES_VALIDACION.KM_MAX}`;
      }
    }

    if (projectData.km_final !== undefined) {
      if (projectData.km_final < LIMITES_VALIDACION.KM_MIN || 
          projectData.km_final > LIMITES_VALIDACION.KM_MAX) {
        errors.km_final = `Debe estar entre ${LIMITES_VALIDACION.KM_MIN} y ${LIMITES_VALIDACION.KM_MAX}`;
      }

      if (projectData.km_inicial !== undefined && projectData.km_final <= projectData.km_inicial) {
        errors.km_final = 'El kilómetro final debe ser mayor al inicial';
      }
    }

    // Validar configuraciones específicas
    if (projectData.configuracion) {
      const config = projectData.configuracion;

      if (config.intervalo !== undefined) {
        if (config.intervalo < LIMITES_VALIDACION.INTERVALO_MIN || 
            config.intervalo > LIMITES_VALIDACION.INTERVALO_MAX) {
          errors.intervalo = `Debe estar entre ${LIMITES_VALIDACION.INTERVALO_MIN} y ${LIMITES_VALIDACION.INTERVALO_MAX}`;
        }
      }

      if (config.espesor !== undefined) {
        if (config.espesor < LIMITES_VALIDACION.ESPESOR_MIN || 
            config.espesor > LIMITES_VALIDACION.ESPESOR_MAX) {
          errors.espesor = `Debe estar entre ${LIMITES_VALIDACION.ESPESOR_MIN} y ${LIMITES_VALIDACION.ESPESOR_MAX}`;
        }
      }

      if (config.tolerancia_sct !== undefined) {
        if (config.tolerancia_sct < LIMITES_VALIDACION.TOLERANCIA_MIN || 
            config.tolerancia_sct > LIMITES_VALIDACION.TOLERANCIA_MAX) {
          errors.tolerancia_sct = `Debe estar entre ${LIMITES_VALIDACION.TOLERANCIA_MIN} y ${LIMITES_VALIDACION.TOLERANCIA_MAX}`;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Crea la configuración por defecto para un nuevo proyecto
   */
  createDefaultConfiguration: () => {
    return {
      ...DEFAULTS_PROYECTO,
      fecha_creacion: new Date().toISOString(),
    };
  },

  /**
   * Calcula estadísticas básicas de un proyecto
   */
  calculateProjectStats: (project) => {
    const stats = {
      longitud_total: 0,
      estaciones_estimadas: 0,
      progreso_porcentaje: 0,
      tiempo_estimado_horas: 0,
    };

    if (project.km_inicial !== undefined && project.km_final !== undefined) {
      stats.longitud_total = project.km_final - project.km_inicial;
      
      const intervalo = project.configuracion?.intervalo || DEFAULTS_PROYECTO.INTERVALO;
      stats.estaciones_estimadas = Math.ceil((stats.longitud_total * 1000) / intervalo);
      
      // Estimación básica: 30 minutos por estación
      stats.tiempo_estimado_horas = (stats.estaciones_estimadas * 0.5);
    }

    // Calcular progreso si hay estaciones creadas
    if (project.total_estaciones !== undefined) {
      stats.progreso_porcentaje = stats.estaciones_estimadas > 0 
        ? Math.round((project.total_estaciones / stats.estaciones_estimadas) * 100)
        : 0;
    }

    return stats;
  },

  /**
   * Determina el siguiente estado lógico de un proyecto
   */
  getNextValidStates: (currentState) => {
    const stateTransitions = {
      [ESTADOS_PROYECTO.CONFIGURACION]: [
        ESTADOS_PROYECTO.EN_PROGRESO,
        ESTADOS_PROYECTO.CANCELADO
      ],
      [ESTADOS_PROYECTO.EN_PROGRESO]: [
        ESTADOS_PROYECTO.COMPLETADO,
        ESTADOS_PROYECTO.PAUSADO,
        ESTADOS_PROYECTO.CANCELADO
      ],
      [ESTADOS_PROYECTO.PAUSADO]: [
        ESTADOS_PROYECTO.EN_PROGRESO,
        ESTADOS_PROYECTO.CANCELADO
      ],
      [ESTADOS_PROYECTO.COMPLETADO]: [],
      [ESTADOS_PROYECTO.CANCELADO]: []
    };

    return stateTransitions[currentState] || [];
  },

  /**
   * Verifica si un proyecto puede ser eliminado
   */
  canDeleteProject: (project) => {
    // No se puede eliminar si tiene datos de campo
    if (project.total_estaciones > 0 || project.total_mediciones > 0) {
      return {
        canDelete: false,
        reason: 'El proyecto contiene datos de campo y no puede ser eliminado'
      };
    }

    // No se puede eliminar si está en progreso
    if (project.estado === ESTADOS_PROYECTO.EN_PROGRESO) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un proyecto en progreso'
      };
    }

    return { canDelete: true };
  },

  /**
   * Genera un nombre único para proyecto duplicado
   */
  generateDuplicateName: (originalName, existingNames = []) => {
    let counter = 1;
    let newName = `${originalName} (Copia)`;

    while (existingNames.includes(newName)) {
      counter++;
      newName = `${originalName} (Copia ${counter})`;
    }

    return newName;
  },

  /**
   * Formatea los datos del proyecto para mostrar en UI
   */
  formatProjectForDisplay: (project) => {
    if (!project) return null;

    const stats = projectService.calculateProjectStats(project);

    return {
      ...project,
      stats,
      estado_label: projectService.getStateLabel(project.estado),
      fecha_creacion_formatted: new Date(project.fecha_creacion).toLocaleDateString('es-ES'),
      fecha_actualizacion_formatted: project.fecha_actualizacion 
        ? new Date(project.fecha_actualizacion).toLocaleDateString('es-ES')
        : null,
    };
  },

  /**
   * Obtiene la etiqueta legible para un estado
   */
  getStateLabel: (state) => {
    const labels = {
      [ESTADOS_PROYECTO.CONFIGURACION]: 'Configuración',
      [ESTADOS_PROYECTO.EN_PROGRESO]: 'En Progreso',
      [ESTADOS_PROYECTO.COMPLETADO]: 'Completado',
      [ESTADOS_PROYECTO.PAUSADO]: 'Pausado',
      [ESTADOS_PROYECTO.CANCELADO]: 'Cancelado',
    };

    return labels[state] || state;
  },

  /**
   * Obtiene el color asociado a un estado (para UI)
   */
  getStateColor: (state) => {
    const colors = {
      [ESTADOS_PROYECTO.CONFIGURACION]: 'blue',
      [ESTADOS_PROYECTO.EN_PROGRESO]: 'green',
      [ESTADOS_PROYECTO.COMPLETADO]: 'purple',
      [ESTADOS_PROYECTO.PAUSADO]: 'yellow',
      [ESTADOS_PROYECTO.CANCELADO]: 'red',
    };

    return colors[state] || 'gray';
  },

  /**
   * Valida si se puede cambiar de estado
   */
  canChangeState: (currentState, newState) => {
    const validStates = projectService.getNextValidStates(currentState);
    return validStates.includes(newState);
  },

  /**
   * Genera configuración de exportación por defecto
   */
  getDefaultExportConfig: () => {
    return {
      incluirEstaciones: true,
      incluirMediciones: true,
      incluirLecturas: true,
      formato: 'CSV',
      coordenadas: 'UTM',
      precision: 6,
      separador: ',',
      incluirEncabezados: true,
    };
  },

  /**
   * Calcula el tiempo estimado para completar el proyecto
   */
  estimateCompletionTime: (project) => {
    const stats = projectService.calculateProjectStats(project);
    const estacionesRestantes = Math.max(0, stats.estaciones_estimadas - (project.total_estaciones || 0));
    
    // Estimación: 30 minutos por estación + 20% de tiempo adicional
    const horasBase = estacionesRestantes * 0.5;
    const horasConBuffer = horasBase * 1.2;
    
    return {
      horas: Math.ceil(horasConBuffer),
      dias: Math.ceil(horasConBuffer / 8), // 8 horas de trabajo por día
      estaciones_restantes: estacionesRestantes,
    };
  },

  /**
   * Verifica la integridad de los datos del proyecto
   */
  validateProjectIntegrity: (project) => {
    const issues = [];

    // Verificar coherencia de kilómetros
    if (project.km_inicial >= project.km_final) {
      issues.push('El kilómetro inicial debe ser menor al final');
    }

    // Verificar configuración
    if (!project.configuracion) {
      issues.push('El proyecto no tiene configuración');
    } else {
      const config = project.configuracion;
      
      if (!config.intervalo || config.intervalo <= 0) {
        issues.push('Intervalo de medición no válido');
      }
      
      if (!config.tolerancia_sct || config.tolerancia_sct <= 0) {
        issues.push('Tolerancia SCT no válida');
      }
    }

    // Verificar estado vs datos
    if (project.estado === ESTADOS_PROYECTO.COMPLETADO && project.total_estaciones === 0) {
      issues.push('Proyecto marcado como completado sin estaciones');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  },
};
