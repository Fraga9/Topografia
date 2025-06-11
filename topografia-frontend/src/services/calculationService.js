// services/calculationService.js - Servicio de cálculos topográficos
import { CLASIFICACIONES_TERRENO, DEFAULTS_PROYECTO } from '../utils/constants';

/**
 * Servicio especializado en cálculos topográficos y análisis de datos.
 * Contiene toda la lógica matemática específica del dominio.
 */
export const calculationService = {
  /**
   * Calcula la elevación de un punto basado en la lectura de mira
   */
  calculateElevation: (instrumentHeight, miraReading, benchmarkElevation = 0) => {
    return benchmarkElevation + instrumentHeight - miraReading;
  },

  /**
   * Calcula el volumen entre dos secciones usando el método de Simpson
   */
  calculateVolumeBySimpsons: (section1, section2, distance) => {
    if (!section1.areas || !section2.areas || !distance) {
      throw new Error('Datos insuficientes para calcular volumen');
    }

    const area1 = section1.areas.total || 0;
    const area2 = section2.areas.total || 0;
    const areaMedia = (area1 + area2) / 2;

    return {
      volumen_total: areaMedia * distance,
      area_inicial: area1,
      area_final: area2,
      distancia: distance,
      metodo: 'SIMPSON'
    };
  },

  /**
   * Calcula el área de una sección transversal
   */
  calculateSectionArea: (lecturas, configuracion = {}) => {
    if (!lecturas || lecturas.length < 2) {
      return { area_corte: 0, area_terraplen: 0, area_total: 0 };
    }

    const { 
      espesor = DEFAULTS_PROYECTO.ESPESOR,
      divisiones_izquierdas = DEFAULTS_PROYECTO.DIVISIONES_IZQUIERDAS,
      divisiones_derechas = DEFAULTS_PROYECTO.DIVISIONES_DERECHAS
    } = configuracion;

    // Ordenar lecturas por posición
    const lecturasOrdenadas = [...lecturas].sort((a, b) => a.posicion - b.posicion);

    let areaCorte = 0;
    let areaTerrapen = 0;

    // Calcular áreas usando el método de trapecios
    for (let i = 0; i < lecturasOrdenadas.length - 1; i++) {
      const lectura1 = lecturasOrdenadas[i];
      const lectura2 = lecturasOrdenadas[i + 1];

      const ancho = Math.abs(lectura2.posicion - lectura1.posicion);
      const altura1 = lectura1.elevacion_calculada || 0;
      const altura2 = lectura2.elevacion_calculada || 0;

      const areaTrapecio = ((altura1 + altura2) / 2) * ancho;

      // Determinar si es corte o terraplén basado en las elevaciones
      if (altura1 > 0 || altura2 > 0) {
        areaCorte += Math.max(0, areaTrapecio);
      } else {
        areaTerrapen += Math.abs(Math.min(0, areaTrapecio));
      }
    }

    return {
      area_corte: areaCorte,
      area_terraplen: areaTerrapen,
      area_total: areaCorte + areaTerrapen,
      espesor_utilizado: espesor
    };
  },

  /**
   * Clasifica el tipo de terreno basado en las áreas
   */
  classifyTerrain: (areas, umbralBalance = 0.1) => {
    const { area_corte, area_terraplen } = areas;
    const diferencia = Math.abs(area_corte - area_terraplen);
    const areaTotal = area_corte + area_terraplen;

    if (areaTotal === 0) {
      return CLASIFICACIONES_TERRENO.BALANCEADO;
    }

    const porcentajeDiferencia = diferencia / areaTotal;

    if (porcentajeDiferencia <= umbralBalance) {
      return CLASIFICACIONES_TERRENO.BALANCEADO;
    } else if (area_corte > area_terraplen) {
      return CLASIFICACIONES_TERRENO.CORTE;
    } else {
      return CLASIFICACIONES_TERRENO.TERRAPLEN;
    }
  },

  /**
   * Calcula estadísticas de una serie de lecturas
   */
  calculateReadingStats: (lecturas) => {
    if (!lecturas || lecturas.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        range: 0
      };
    }

    const valores = lecturas.map(l => l.lectura_mira).filter(v => v !== null && v !== undefined);
    
    if (valores.length === 0) return { count: 0 };

    valores.sort((a, b) => a - b);

    const count = valores.length;
    const min = valores[0];
    const max = valores[count - 1];
    const sum = valores.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    // Mediana
    const median = count % 2 === 0
      ? (valores[count / 2 - 1] + valores[count / 2]) / 2
      : valores[Math.floor(count / 2)];

    // Desviación estándar
    const variance = valores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      min,
      max,
      mean,
      median,
      stdDev,
      range: max - min,
      sum
    };
  },

  /**
   * Valida la calidad de una lectura basada en tolerancias
   */
  validateReadingQuality: (lectura, configuracion = {}) => {
    const {
      tolerancia_sct = DEFAULTS_PROYECTO.TOLERANCIA_SCT,
      lectura_min = 0.1,
      lectura_max = 5.0
    } = configuracion;

    const issues = [];
    const warnings = [];

    // Validar rango básico
    if (lectura.lectura_mira < lectura_min) {
      issues.push(`Lectura muy baja: ${lectura.lectura_mira}m (mínimo: ${lectura_min}m)`);
    }

    if (lectura.lectura_mira > lectura_max) {
      issues.push(`Lectura muy alta: ${lectura.lectura_mira}m (máximo: ${lectura_max}m)`);
    }

    // Validar calidad declarada vs valor
    if (lectura.calidad === 'BUENA' && lectura.lectura_mira > 3.0) {
      warnings.push('Lectura marcada como buena pero supera los 3m');
    }

    if (lectura.calidad === 'MALA' && lectura.lectura_mira < 2.0) {
      warnings.push('Lectura marcada como mala pero está dentro de rango normal');
    }

    return {
      isValid: issues.length === 0,
      quality: issues.length === 0 ? (warnings.length === 0 ? 'EXCELENTE' : 'BUENA') : 'MALA',
      issues,
      warnings
    };
  },

  /**
   * Calcula la precisión entre mediciones repetidas
   */
  calculatePrecision: (mediciones) => {
    if (!mediciones || mediciones.length < 2) {
      return { precision: 0, diferencia_maxima: 0, es_aceptable: false };
    }

    // Obtener todas las lecturas de las mediciones
    const todasLasLecturas = mediciones.flatMap(m => m.lecturas || []);
    
    // Agrupar por posición para comparar lecturas en la misma ubicación
    const lecturasPorPosicion = {};
    todasLasLecturas.forEach(lectura => {
      const posKey = lectura.posicion.toFixed(2);
      if (!lecturasPorPosicion[posKey]) {
        lecturasPorPosicion[posKey] = [];
      }
      lecturasPorPosicion[posKey].push(lectura.lectura_mira);
    });

    let diferenciasMaximas = [];

    // Calcular diferencias máximas por posición
    Object.values(lecturasPorPosicion).forEach(lecturas => {
      if (lecturas.length > 1) {
        const min = Math.min(...lecturas);
        const max = Math.max(...lecturas);
        diferenciasMaximas.push(max - min);
      }
    });

    if (diferenciasMaximas.length === 0) {
      return { precision: 0, diferencia_maxima: 0, es_aceptable: true };
    }

    const diferenciaMaxima = Math.max(...diferenciasMaximas);
    const precisionPromedio = diferenciasMaximas.reduce((sum, diff) => sum + diff, 0) / diferenciasMaximas.length;

    return {
      precision: precisionPromedio,
      diferencia_maxima: diferenciaMaxima,
      es_aceptable: diferenciaMaxima <= DEFAULTS_PROYECTO.TOLERANCIA_SCT,
      tolerancia_aplicada: DEFAULTS_PROYECTO.TOLERANCIA_SCT
    };
  },

  /**
   * Genera puntos para una curva de nivel
   */
  generateContourPoints: (lecturas, elevacionCurva, tolerancia = 0.01) => {
    const puntosCurva = [];

    for (let i = 0; i < lecturas.length - 1; i++) {
      const lectura1 = lecturas[i];
      const lectura2 = lecturas[i + 1];

      const elev1 = lectura1.elevacion_calculada;
      const elev2 = lectura2.elevacion_calculada;

      // Verificar si la curva pasa entre estos dos puntos
      if ((elev1 <= elevacionCurva && elev2 >= elevacionCurva) ||
          (elev1 >= elevacionCurva && elev2 <= elevacionCurva)) {
        
        // Interpolar la posición donde la curva cruza
        const factor = (elevacionCurva - elev1) / (elev2 - elev1);
        const posicionInterpolada = lectura1.posicion + factor * (lectura2.posicion - lectura1.posicion);

        puntosCurva.push({
          posicion: posicionInterpolada,
          elevacion: elevacionCurva,
          interpolado: true
        });
      }

      // Agregar puntos exactos si coinciden con la elevación
      if (Math.abs(elev1 - elevacionCurva) <= tolerancia) {
        puntosCurva.push({
          posicion: lectura1.posicion,
          elevacion: elev1,
          interpolado: false
        });
      }
    }

    return puntosCurva;
  },

  /**
   * Calcula el volumen acumulado a lo largo del proyecto
   */
  calculateCumulativeVolume: (mediciones) => {
    if (!mediciones || mediciones.length < 2) {
      return [];
    }

    const volumenesAcumulados = [];
    let volumenTotal = 0;

    // Ordenar mediciones por kilómetro
    const medicionesOrdenadas = [...mediciones].sort((a, b) => a.km - b.km);

    for (let i = 0; i < medicionesOrdenadas.length - 1; i++) {
      const medicion1 = medicionesOrdenadas[i];
      const medicion2 = medicionesOrdenadas[i + 1];

      const distancia = (medicion2.km - medicion1.km) * 1000; // Convertir a metros

      if (medicion1.areas && medicion2.areas) {
        const volumen = calculationService.calculateVolumeBySimpsons(
          medicion1,
          medicion2,
          distancia
        );

        volumenTotal += volumen.volumen_total;

        volumenesAcumulados.push({
          km_inicial: medicion1.km,
          km_final: medicion2.km,
          volumen_tramo: volumen.volumen_total,
          volumen_acumulado: volumenTotal,
          distancia: distancia
        });
      }
    }

    return volumenesAcumulados;
  },

  /**
   * Detecta anomalías en los datos de campo
   */
  detectAnomalies: (lecturas, configuracion = {}) => {
    const {
      desviacion_maxima = 2, // Múltiplos de desviación estándar
      salto_maximo = 1.0, // Metros
      lectura_maxima = 5.0 // Metros
    } = configuracion;

    const anomalias = [];
    const stats = calculationService.calculateReadingStats(lecturas);

    lecturas.forEach((lectura, index) => {
      // Detectar valores extremos
      if (Math.abs(lectura.lectura_mira - stats.mean) > (desviacion_maxima * stats.stdDev)) {
        anomalias.push({
          tipo: 'VALOR_EXTREMO',
          posicion: lectura.posicion,
          valor: lectura.lectura_mira,
          descripcion: `Lectura fuera de ${desviacion_maxima} desviaciones estándar`,
          severidad: 'ALTA'
        });
      }

      // Detectar saltos bruscos
      if (index > 0) {
        const lecturaAnterior = lecturas[index - 1];
        const diferencia = Math.abs(lectura.lectura_mira - lecturaAnterior.lectura_mira);
        
        if (diferencia > salto_maximo) {
          anomalias.push({
            tipo: 'SALTO_BRUSCO',
            posicion: lectura.posicion,
            valor: diferencia,
            descripcion: `Cambio brusco de ${diferencia.toFixed(3)}m entre lecturas consecutivas`,
            severidad: diferencia > salto_maximo * 2 ? 'ALTA' : 'MEDIA'
          });
        }
      }

      // Detectar lecturas imposibles
      if (lectura.lectura_mira > lectura_maxima) {
        anomalias.push({
          tipo: 'LECTURA_IMPOSIBLE',
          posicion: lectura.posicion,
          valor: lectura.lectura_mira,
          descripcion: `Lectura superior al máximo permitido (${lectura_maxima}m)`,
          severidad: 'CRITICA'
        });
      }
    });

    return anomalias;
  },
};
