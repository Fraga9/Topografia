import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFService {
  constructor() {
    this.doc = null;
    this.currentY = 0;
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.pageWidth = 210; // A4 width in mm
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.logoDataUrl = null;
  }

  // Cargar el logo CEMEX como base64
  async loadLogo() {
    try {
      const response = await fetch('/CemexLogo.webp');
      if (!response.ok) {
        throw new Error('Logo no encontrado');
      }
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.logoDataUrl = reader.result;
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.warn('Error leyendo el logo');
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('No se pudo cargar el logo CEMEX:', error);
      return null;
    }
  }

  initDocument() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.currentY = this.margin;
    
    // Verificar que autoTable esté disponible
    if (typeof this.doc.autoTable !== 'function') {
      console.error('autoTable no está disponible en jsPDF');
    }
  }

  // Colores corporativos
  colors = {
    primary: '#1e40af',      // Azul principal
    secondary: '#64748b',    // Gris secundario
    accent: '#059669',       // Verde para éxito
    warning: '#dc2626',      // Rojo para alertas
    light: '#f8fafc',        // Fondo claro
    text: '#374151'          // Texto principal
  };

  // Configurar fuentes y colores
  setupFonts() {
    this.doc.setFont('helvetica');
  }

  // Verificar si necesitamos nueva página
  checkPageBreak(requiredHeight = 20) {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.addPage();
      return true;
    }
    return false;
  }

  // Agregar nueva página
  addPage() {
    this.doc.addPage();
    this.currentY = this.margin;
    this.addWatermark();
  }

  // Agregar marca de agua
  addWatermark() {
    this.doc.setTextColor(200, 200, 200);
    this.doc.setFontSize(50);
    this.doc.text('CEMEX', this.pageWidth / 2, this.pageHeight / 2, {
      angle: 45,
      align: 'center'
    });
  }

  // Header del documento
  addHeader(titulo, proyecto) {
    // Fondo del header
    this.doc.setFillColor(30, 64, 175); // Azul CEMEX
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    // Logo CEMEX si está disponible
    if (this.logoDataUrl) {
      try {
        // Agregar logo en la esquina superior izquierda
        this.doc.addImage(this.logoDataUrl, 'WEBP', this.margin, 8, 40, 12);
      } catch (error) {
        console.warn('Error agregando logo al PDF:', error);
        // Fallback al texto
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(24);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('CEMEX', this.margin, 20);
      }
    } else {
      // Fallback al texto si no hay logo
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(24);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CEMEX', this.margin, 20);
    }

    // Subtítulo del reporte (alineado a la derecha del logo)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    const logoWidth = this.logoDataUrl ? 45 : 35;
    this.doc.text(titulo, this.margin + logoWidth, 18);

    // Línea decorativa
    this.doc.setDrawColor(255, 255, 255);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);

    // Información del proyecto
    this.currentY = 50;
    this.addProjectInfo(proyecto);
  }

  // Información del proyecto
  addProjectInfo(proyecto) {
    const formatearKM = (km) => {
      if (!km) return 'N/A';
      const kmNum = parseFloat(km);
      const kilometro = Math.floor(kmNum / 1000);
      const metro = kmNum % 1000;
      return `${kilometro}+${String(metro).padStart(3, '0')}`;
    };

    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 25, 'F');

    this.doc.setTextColor(55, 65, 81);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INFORMACIÓN DEL PROYECTO', this.margin + 5, this.currentY + 8);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const info = [
      [`Proyecto: ${proyecto.nombre}`, `Fecha: ${new Date().toLocaleDateString('es-ES')}`],
      [`Tramo: ${proyecto.tramo || 'N/A'}`, `Cuerpo: ${proyecto.cuerpo || 'N/A'}`],
      [`Rango: KM ${formatearKM(proyecto.km_inicial)} - ${formatearKM(proyecto.km_final)}`, `Estado: ${proyecto.estado}`]
    ];

    let yPos = this.currentY + 12;
    info.forEach(([left, right]) => {
      this.doc.text(left, this.margin + 5, yPos);
      this.doc.text(right, this.margin + 100, yPos);
      yPos += 4;
    });

    this.currentY += 30;
  }

  // Agregar título de sección
  addSectionTitle(titulo, bgColor = this.colors.primary) {
    this.checkPageBreak(15);
    
    // Convertir color hex a RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [30, 64, 175];
    };

    const [r, g, b] = hexToRgb(bgColor);
    this.doc.setFillColor(r, g, b);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 12, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(titulo, this.margin + 5, this.currentY + 8);

    this.currentY += 17;
  }

  // Agregar métricas con iconos
  addMetricsGrid(metricas) {
    this.checkPageBreak(30);
    
    const cols = 4;
    const colWidth = this.contentWidth / cols;
    
    metricas.forEach((metrica, index) => {
      if (index > 0 && index % cols === 0) {
        this.currentY += 25;
        this.checkPageBreak(25);
      }
      
      const x = this.margin + (index % cols) * colWidth;
      
      // Fondo de la métrica
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(x + 1, this.currentY, colWidth - 2, 20, 'F');
      
      // Borde
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.5);
      this.doc.rect(x + 1, this.currentY, colWidth - 2, 20);
      
      // Valor principal
      this.doc.setTextColor(30, 64, 175);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metrica.valor, x + colWidth/2, this.currentY + 8, { align: 'center' });
      
      // Etiqueta
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(metrica.etiqueta, x + colWidth/2, this.currentY + 15, { align: 'center' });
    });
    
    this.currentY += 30;
  }

  // Agregar tabla avanzada con implementación manual como principal
  addAdvancedTable(headers, data, options = {}) {
    // Usar implementación manual para mayor compatibilidad
    this.addManualTable(headers, data, options);
  }

  // Implementación con autoTable
  addAutoTable(headers, data, options = {}) {
    const startY = this.currentY;
    
    this.doc.autoTable({
      head: [headers],
      body: data,
      startY: startY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [55, 65, 81],
        lineColor: [209, 213, 219]
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: options.columnStyles || {},
      didParseCell: (data) => {
        // Colorear celdas según valor
        if (options.colorByValue && data.section === 'body') {
          const cellValue = data.cell.text[0];
          if (cellValue && options.colorByValue[data.column.index]) {
            const colorConfig = options.colorByValue[data.column.index];
            Object.keys(colorConfig).forEach(condition => {
              if (this.evaluateCondition(cellValue, condition)) {
                data.cell.styles.textColor = colorConfig[condition];
                data.cell.styles.fontStyle = 'bold';
              }
            });
          }
        }
      },
      didDrawPage: () => {
        this.addWatermark();
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  // Implementación manual de tabla mejorada
  addManualTable(headers, data, options = {}) {
    const rowHeight = 8;
    const headerHeight = 10;
    
    // Calcular anchos de columna proporcionalmente
    const colWidths = this.calculateColumnWidths(headers, data);
    
    // Verificar espacio disponible para al menos el header y una fila
    let requiredHeight = headerHeight + rowHeight + 10;
    this.checkPageBreak(requiredHeight);
    
    let currentRowY = this.currentY;
    const startY = currentRowY;
    
    // Dibujar header
    this.drawTableHeader(headers, colWidths, currentRowY, headerHeight);
    currentRowY += headerHeight;
    
    // Dibujar filas de datos
    data.forEach((row, rowIndex) => {
      // Verificar si necesitamos nueva página
      if (currentRowY + rowHeight > this.pageHeight - this.margin) {
        this.addPage();
        currentRowY = this.currentY;
        // Redibujar header en nueva página
        this.drawTableHeader(headers, colWidths, currentRowY, headerHeight);
        currentRowY += headerHeight;
      }
      
      this.drawTableRow(row, colWidths, currentRowY, rowHeight, rowIndex, options);
      currentRowY += rowHeight;
    });
    
    // Dibujar bordes de la tabla
    this.drawTableBorders(colWidths, startY, currentRowY, headers.length, data.length, headerHeight, rowHeight);
    
    this.currentY = currentRowY + 10;
  }

  // Calcular anchos de columna
  calculateColumnWidths(headers, data) {
    const numCols = headers.length;
    const baseWidth = this.contentWidth / numCols;
    
    // Para simplicidad, usar ancho uniforme
    // En implementación avanzada, podrías analizar contenido para optimizar
    return Array(numCols).fill(baseWidth);
  }

  // Dibujar header de tabla
  drawTableHeader(headers, colWidths, y, height) {
    let x = this.margin;
    
    // Fondo del header
    this.doc.setFillColor(30, 64, 175);
    this.doc.rect(this.margin, y, this.contentWidth, height, 'F');
    
    // Texto del header
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      const centerX = x + (colWidths[index] / 2);
      this.doc.text(String(header), centerX, y + 6, { align: 'center' });
      x += colWidths[index];
    });
  }

  // Dibujar fila de datos
  drawTableRow(row, colWidths, y, height, rowIndex, options) {
    let x = this.margin;
    
    // Fondo alternado de fila
    if (rowIndex % 2 === 0) {
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(this.margin, y, this.contentWidth, height, 'F');
    }
    
    // Datos de la fila
    this.doc.setFontSize(8);
    
    row.forEach((cell, colIndex) => {
      const centerX = x + (colWidths[colIndex] / 2);
      
      // Resetear formato por defecto
      this.doc.setTextColor(55, 65, 81);
      this.doc.setFont('helvetica', 'normal');
      
      // Aplicar colores específicos si están definidos
      if (options.colorByValue && options.colorByValue[colIndex]) {
        const colorConfig = options.colorByValue[colIndex];
        Object.keys(colorConfig).forEach(condition => {
          if (this.evaluateCondition(cell, condition)) {
            const color = colorConfig[condition];
            this.doc.setTextColor(color[0], color[1], color[2]);
            this.doc.setFont('helvetica', 'bold');
          }
        });
      }
      
      // Texto centrado
      const cellText = String(cell);
      this.doc.text(cellText, centerX, y + 5, { align: 'center' });
      
      x += colWidths[colIndex];
    });
  }

  // Dibujar bordes de tabla
  drawTableBorders(colWidths, startY, endY, numCols, numRows, headerHeight, rowHeight) {
    this.doc.setDrawColor(209, 213, 219);
    this.doc.setLineWidth(0.1);
    
    // Bordes horizontales
    let y = startY;
    for (let i = 0; i <= numRows + 1; i++) {
      this.doc.line(this.margin, y, this.margin + this.contentWidth, y);
      y += (i === 0) ? headerHeight : rowHeight;
    }
    
    // Bordes verticales
    let x = this.margin;
    for (let i = 0; i <= numCols; i++) {
      this.doc.line(x, startY, x, endY);
      if (i < numCols) {
        x += colWidths[i];
      }
    }
  }

  // Evaluar condiciones para coloreado
  evaluateCondition(value, condition) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    if (condition.includes('>=')) {
      return numValue >= parseFloat(condition.replace('>=', ''));
    } else if (condition.includes('<=')) {
      return numValue <= parseFloat(condition.replace('<=', ''));
    } else if (condition.includes('>')) {
      return numValue > parseFloat(condition.replace('>', ''));
    } else if (condition.includes('<')) {
      return numValue < parseFloat(condition.replace('<', ''));
    } else if (condition === 'positive') {
      return numValue > 0;
    } else if (condition === 'negative') {
      return numValue < 0;
    }
    return false;
  }

  // Generar reporte de estaciones
  async generateEstacionesReport(proyecto, estaciones, mediciones, lecturas) {
    // Cargar logo primero
    await this.loadLogo();
    
    this.initDocument();
    this.setupFonts();
    this.addWatermark();
    this.addHeader('REPORTE DE RESULTADOS POR ESTACIÓN', proyecto);

    // Métricas principales
    const metricas = [
      { valor: mediciones.length.toString(), etiqueta: 'Estaciones Medidas' },
      { valor: lecturas.length.toString(), etiqueta: 'Total Lecturas' },
      { 
        valor: `${lecturas.length > 0 ? ((lecturas.filter(l => l.cumple_tolerancia).length / lecturas.length) * 100).toFixed(1) : 0}%`, 
        etiqueta: 'Cumplimiento SCT' 
      },
      { valor: lecturas.filter(l => l.calidad === 'REVISAR').length.toString(), etiqueta: 'Para Revisar' }
    ];

    this.addSectionTitle('RESUMEN EJECUTIVO');
    this.addMetricsGrid(metricas);

    // Agrupar lecturas por medición
    const lecturasAgrupadas = {};
    mediciones.forEach(medicion => {
      const lecturasEstacion = lecturas.filter(l => l.medicion_id === medicion.id);
      if (lecturasEstacion.length > 0) {
        lecturasAgrupadas[medicion.id] = {
          medicion,
          lecturas: lecturasEstacion.sort((a, b) => 
            parseFloat(a.division_transversal) - parseFloat(b.division_transversal)
          )
        };
      }
    });

    // Generar tabla por cada estación
    Object.entries(lecturasAgrupadas).forEach(([medicionId, grupo]) => {
      this.addSectionTitle(`ESTACIÓN KM ${this.formatearKM(grupo.medicion.estacion_km)}`);
      
      // Información de la medición
      this.doc.setTextColor(55, 65, 81);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Altura BN: ${parseFloat(grupo.medicion.bn_altura).toFixed(3)}m | Lectura BN: ${parseFloat(grupo.medicion.bn_lectura).toFixed(3)}m | Altura Aparato: ${parseFloat(grupo.medicion.altura_aparato).toFixed(3)}m`, 
        this.margin, this.currentY);
      this.currentY += 8;

      const headers = [
        'División (m)', 'Lectura Mira (m)', 'Elv. Base Real (m)', 
        'Elv. Base Proy. (m)', 'Elv. Concreto Proy. (m)', 'Diferencia (m)', 'Clasificación'
      ];

      const data = grupo.lecturas.map(lectura => {
        const diferencia = lectura.elv_base_real && lectura.elv_base_proyecto 
          ? (parseFloat(lectura.elv_base_real) - parseFloat(lectura.elv_base_proyecto)).toFixed(6)
          : '-';
        
        return [
          this.formatDivision(lectura.division_transversal),
          parseFloat(lectura.lectura_mira).toFixed(3),
          lectura.elv_base_real ? parseFloat(lectura.elv_base_real).toFixed(3) : '-',
          lectura.elv_base_proyecto ? parseFloat(lectura.elv_base_proyecto).toFixed(3) : '-',
          lectura.elv_concreto_proyecto ? parseFloat(lectura.elv_concreto_proyecto).toFixed(3) : '-',
          diferencia,
          lectura.clasificacion || 'N/A'
        ];
      });

      this.addAdvancedTable(headers, data, {
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold' },
          6: { halign: 'center' }
        },
        colorByValue: {
          5: { // Columna de diferencia
            'positive': [220, 38, 38], // Rojo para positivo
            'negative': [251, 146, 60], // Naranja para negativo
            '<=0.005': [34, 197, 94] // Verde para dentro de tolerancia
          },
          6: { // Columna de clasificación
            'CUMPLE': [34, 197, 94],
            'CORTE': [220, 38, 38],
            'TERRAPLEN': [251, 146, 60]
          }
        }
      });
    });

    // Footer
    this.addFooter();
    
    return this.doc;
  }

  // Generar reporte de avance
  async generateAvanceReport(proyecto, estaciones, mediciones, lecturas, estadisticasProgreso) {
    // Cargar logo primero
    await this.loadLogo();
    
    this.initDocument();
    this.setupFonts();
    this.addWatermark();
    this.addHeader('REPORTE DE AVANCE DEL PROYECTO', proyecto);

    // Métricas principales de progreso
    const metricas = [
      { valor: `${estadisticasProgreso.progresoGeneral.toFixed(1)}%`, etiqueta: 'Progreso General' },
      { valor: `${estadisticasProgreso.porcentajeCumplimiento.toFixed(1)}%`, etiqueta: 'Calidad de Datos' },
      { valor: estadisticasProgreso.estacionesPorDia.toFixed(1), etiqueta: 'Est./Día Promedio' },
      { valor: estadisticasProgreso.diasTranscurridos.toString(), etiqueta: 'Días Trabajados' }
    ];

    this.addSectionTitle('MÉTRICAS DE PROGRESO');
    this.addMetricsGrid(metricas);

    // Progreso por etapas
    this.addSectionTitle('PROGRESO POR ETAPAS');
    
    const etapasHeaders = ['Etapa', 'Completado', 'Total', 'Porcentaje'];
    const etapasData = [
      ['Definición de Estaciones', estadisticasProgreso.estacionesDefinidas, estadisticasProgreso.estacionesTotales, `${estadisticasProgreso.progresoDefinicion.toFixed(1)}%`],
      ['Mediciones en Campo', estadisticasProgreso.estacionesConMediciones, estadisticasProgreso.estacionesDefinidas, `${estadisticasProgreso.progresoMedicion.toFixed(1)}%`],
      ['Lecturas Capturadas', estadisticasProgreso.totalLecturas, `${estadisticasProgreso.estacionesConMediciones * 10}*`, `${(estadisticasProgreso.totalLecturas / (estadisticasProgreso.estacionesConMediciones * 10) * 100).toFixed(1)}%`]
    ];

    this.addAdvancedTable(etapasHeaders, etapasData, {
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' }
      }
    });

    // Distribución de calidad
    this.addSectionTitle('DISTRIBUCIÓN DE CALIDAD');
    
    const calidadHeaders = ['Categoría', 'Cantidad', 'Porcentaje', 'Estado'];
    const calidadData = [
      ['Excelente', estadisticasProgreso.lecturasExcelente, `${((estadisticasProgreso.lecturasExcelente / estadisticasProgreso.totalLecturas) * 100).toFixed(1)}%`, '✓'],
      ['Buena', estadisticasProgreso.lecturasBuena, `${((estadisticasProgreso.lecturasBuena / estadisticasProgreso.totalLecturas) * 100).toFixed(1)}%`, '✓'],
      ['Regular', estadisticasProgreso.lecturasRegular, `${((estadisticasProgreso.lecturasRegular / estadisticasProgreso.totalLecturas) * 100).toFixed(1)}%`, '⚠'],
      ['Para Revisar', estadisticasProgreso.lecturasRevisar, `${((estadisticasProgreso.lecturasRevisar / estadisticasProgreso.totalLecturas) * 100).toFixed(1)}%`, '✗']
    ];

    this.addAdvancedTable(calidadHeaders, calidadData, {
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' }
      }
    });

    this.addFooter();
    
    return this.doc;
  }

  // Generar reporte de diseño
  async generateDisenoReport(proyecto, estaciones, especificacionesTecnicas) {
    // Cargar logo primero
    await this.loadLogo();
    
    this.initDocument();
    this.setupFonts();
    this.addWatermark();
    this.addHeader('REPORTE DE DISEÑO Y ESPECIFICACIONES', proyecto);

    // Métricas principales
    const metricas = [
      { valor: `${especificacionesTecnicas.longitudTotal.toFixed(0)}m`, etiqueta: 'Longitud Total' },
      { valor: especificacionesTecnicas.estacionesTotales.toString(), etiqueta: 'Estaciones Totales' },
      { valor: `${proyecto.espesor}m`, etiqueta: 'Espesor Diseño' },
      { valor: `${especificacionesTecnicas.volumenEstimado.toFixed(0)}m³`, etiqueta: 'Volumen Estimado' }
    ];

    this.addSectionTitle('ESPECIFICACIONES PRINCIPALES');
    this.addMetricsGrid(metricas);

    // Parámetros técnicos
    this.addSectionTitle('PARÁMETROS TÉCNICOS');
    
    const parametrosHeaders = ['Parámetro', 'Valor', 'Unidad', 'Observaciones'];
    const parametrosData = [
      ['Intervalo de Estaciones', proyecto.intervalo, 'm', 'Distancia entre estaciones'],
      ['Tolerancia SCT', (proyecto.tolerancia_sct * 1000).toFixed(1), 'mm', 'Tolerancia permitida'],
      ['Pendiente Máxima', (especificacionesTecnicas.pendienteMaxima * 100).toFixed(2), '%', 'Mayor pendiente del tramo'],
      ['Pendiente Mínima', (especificacionesTecnicas.pendienteMinima * 100).toFixed(2), '%', 'Menor pendiente del tramo'],
      ['Pendiente Promedio', (especificacionesTecnicas.pendientePromedio * 100).toFixed(2), '%', 'Pendiente media del proyecto']
    ];

    this.addAdvancedTable(parametrosHeaders, parametrosData, {
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { fontStyle: 'italic' }
      }
    });

    // Tabla de estaciones teóricas (primeras 10)
    if (estaciones && estaciones.length > 0) {
      this.addSectionTitle('ESTACIONES TEÓRICAS DEFINIDAS');
      
      const estacionesHeaders = ['KM', 'Pendiente (%)', 'Base CL (m)', 'Elv. Eje (m)', 'Elv. +6m (m)', 'Elv. -6m (m)'];
      const estacionesData = estaciones.slice(0, 10).map(estacion => [
        this.formatearKM(estacion.km),
        (estacion.pendiente_derecha * 100).toFixed(2),
        parseFloat(estacion.base_cl).toFixed(3),
        parseFloat(estacion.base_cl).toFixed(3), // Eje = base_cl
        (estacion.base_cl + (6 * estacion.pendiente_derecha)).toFixed(3),
        (estacion.base_cl + (-6 * estacion.pendiente_derecha)).toFixed(3)
      ]);

      this.addAdvancedTable(estacionesHeaders, estacionesData, {
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        }
      });

      if (estaciones.length > 10) {
        this.doc.setTextColor(107, 114, 128);
        this.doc.setFontSize(8);
        this.doc.text(`... y ${estaciones.length - 10} estaciones más definidas en el proyecto`, 
          this.margin, this.currentY);
        this.currentY += 10;
      }
    }

    this.addFooter();
    
    return this.doc;
  }

  // Utilidades
  formatearKM(km) {
    if (!km) return 'N/A';
    const kmNum = parseFloat(km);
    const kilometro = Math.floor(kmNum / 1000);
    const metro = kmNum % 1000;
    return `${kilometro}+${String(metro).padStart(3, '0')}`;
  }

  formatDivision(division) {
    const div = parseFloat(division);
    if (div === 0) return '0.00 (EJE)';
    if (div < 0) return `${Math.abs(div).toFixed(2)} (I)`;
    return `${div.toFixed(2)} (D)`;
  }

  // Footer del documento
  addFooter() {
    const totalPages = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Línea del footer
      this.doc.setDrawColor(209, 213, 219);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Texto del footer
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      
      this.doc.text('Sistema de Topografía CEMEX', this.margin, this.pageHeight - 8);
      this.doc.text(`Página ${i} de ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 8, { align: 'right' });
      this.doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 
        this.pageWidth / 2, this.pageHeight - 8, { align: 'center' });
    }
  }

  // Generar reporte de liberación de topografía (TOP-FM-05)
  async generateLiberacionTopografiaReport(proyecto, datosReporte) {
    // Validar parámetros de entrada
    if (!proyecto) {
      throw new Error('Proyecto es requerido para generar el reporte');
    }
    if (!datosReporte) {
      throw new Error('Datos del reporte son requeridos para generar el PDF');
    }
    
    // Cargar logo primero
    await this.loadLogo();
    
    this.initDocument();
    this.setupFonts();
    this.addWatermark();
    this.addLiberacionHeader(proyecto);

    // Información del proyecto específica para liberación
    this.addLiberacionProjectInfo(proyecto);

    // Tabla principal con estructura del TOP-FM-05
    this.addMainTopografiaTable(datosReporte);

    // Footer
    this.addFooter();
    
    return this.doc;
  }

  // Header específico para liberación topográfica
  addLiberacionHeader(proyecto) {
    // Rectángulo del header con borde
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, this.margin, this.contentWidth, 25);

    // Logo CEMEX en la esquina izquierda
    if (this.logoDataUrl) {
      try {
        this.doc.addImage(this.logoDataUrl, 'WEBP', this.margin + 5, this.margin + 5, 30, 10);
      } catch (error) {
        console.warn('Error agregando logo al PDF:', error);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('CEMEX', this.margin + 5, this.margin + 12);
      }
    } else {
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CEMEX', this.margin + 5, this.margin + 12);
    }

    // Título del reporte centrado
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LIBERACIÓN DE PAVIMENTACIÓN POR TOPOGRAFÍA', 
      this.pageWidth / 2, this.margin + 12, { align: 'center' });

    // Información del código en la esquina derecha
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const rightX = this.pageWidth - this.margin - 5;
    this.doc.text('CÓDIGO: TOP-FM-05', rightX, this.margin + 8, { align: 'right' });
    this.doc.text('VERSIÓN: 0.1', rightX, this.margin + 13, { align: 'right' });
    this.doc.text(`FECHA: ${new Date().toLocaleDateString('es-ES')}`, rightX, this.margin + 18, { align: 'right' });

    this.currentY = this.margin + 35;
  }

  // Información del proyecto para liberación
  addLiberacionProjectInfo(proyecto) {
    const formatearKM = (km) => {
      if (!km) return 'N/A';
      const kmNum = parseFloat(km);
      const kilometro = Math.floor(kmNum / 1000);
      const metro = kmNum % 1000;
      return `${kilometro}+${String(metro).padStart(3, '0')}`;
    };

    // Título "DATOS GENERALES" con fondo gris claro
    this.doc.setFillColor(200, 200, 200); // Gris claro
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 8, 'F');
    this.doc.setDrawColor(0, 0, 0);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 8);
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DATOS GENERALES', this.margin + 5, this.currentY + 6);

    this.currentY += 8;

    // Crear tabla de datos generales
    const tableData = [
      // Primera fila
      [
        { text: 'Proyecto:', width: 20 },
        { text: proyecto.nombre || 'Sin nombre', width: 50 },
        { text: 'Tramo:', width: 20 },
        { text: proyecto.tramo || `${formatearKM(proyecto.km_inicial)} AL ${formatearKM(proyecto.km_final)}`, width: 50 },
        { text: 'Folio:', width: 15 },
        { text: `LIB-${proyecto.id || 'N/A'}`, width: 25 }
      ],
      // Segunda fila
      [
        { text: 'Patio:', width: 20 },
        { text: proyecto.cuerpo || 'N/A', width: 50 },
        { text: 'Cadenamiento inicial:', width: 30 },
        { text: formatearKM(proyecto.km_inicial), width: 20 },
        { text: 'Cadenamiento final:', width: 30 },
        { text: formatearKM(proyecto.km_final), width: 20 },
        { text: 'Contrato:', width: 20 },
        { text: proyecto.contrato || 'N/A', width: 30 },
        { text: 'Fecha:', width: 15 },
        { text: new Date().toLocaleDateString('es-ES'), width: 25 }
      ]
    ];

    // Dibujar tabla de datos generales
    let currentY = this.currentY;
    tableData.forEach((row, rowIndex) => {
      let currentX = this.margin;
      
      row.forEach((cell, cellIndex) => {
        const cellWidth = cell.width;
        const cellHeight = 8;
        
        // Dibujar borde de celda
        this.doc.setDrawColor(0, 0, 0);
        this.doc.setLineWidth(0.5);
        this.doc.rect(currentX, currentY, cellWidth, cellHeight);
        
        // Escribir texto
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', cellIndex % 2 === 0 ? 'bold' : 'normal');
        this.doc.text(cell.text, currentX + 2, currentY + 5);
        
        currentX += cellWidth;
      });
      
      currentY += 8;
    });

    this.currentY = currentY + 5;
  }

  // Tabla principal con estructura del TOP-FM-05
  addMainTopografiaTable(datosReporte) {
    this.checkPageBreak(100);
    
    // Crear tabla manualmente para control exacto del formato
    this.createExactTopografiaTable(datosReporte);
  }

  // Crear tabla exacta según el formato esperado
  createExactTopografiaTable(datosReporte) {
    const startY = this.currentY;
    const tableWidth = this.contentWidth;
    
    // Definir anchos de columnas exactos según el reporte esperado
    const columnWidths = [
      20, // ESTACIÓN
      20, // CAMPO
      20, // PROYECTO  
      20, // CORTE
      20, // TERR
      20, // RT. PROYECTO
      20, // CAMPO
      20, // ESP. PROM
      20, // ÁREA
      20, // PARCIAL
      20, // ACUMULADO
      20, // PARCIAL
      20  // ACUMULADO
    ];
    
    // Headers principales
    this.createTableHeaders(startY, columnWidths);
    
    // Datos de la tabla
    let currentRowY = startY + 24; // Altura de los headers
    const estacionesData = datosReporte.estacionesData || [];
    
    estacionesData.forEach((estacion, index) => {
      currentRowY = this.createStationRow(estacion, currentRowY, columnWidths);
    });
    
    this.currentY = currentRowY + 10;
  }

  // Crear headers de la tabla
  createTableHeaders(startY, columnWidths) {
    const headerHeight = 8;
    let currentX = this.margin;
    
    // Fila 1 de headers - títulos principales
    const mainHeaders = [
      { text: 'ESTACIÓN', colspan: 1, rowspan: 3 },
      { text: 'NIVELACIÓN DE CAPA DE BASE', colspan: 4, rowspan: 1 },
      { text: 'DETERMINACIÓN VOL. RTE. BASE REAL A RTE. PROY.', colspan: 5, rowspan: 1 },
      { text: 'VOLUMEN PROYECTO m³', colspan: 2, rowspan: 1 }
    ];
    
    // Fila 2 de headers - subtítulos
    const subHeaders = [
      { text: '', colspan: 1 }, // ESTACIÓN (ya ocupado)
      { text: 'ELEVACIONES', colspan: 2, rowspan: 1 },
      { text: 'DIFERENCIA', colspan: 2, rowspan: 1 },
      { text: 'ESPESORES', colspan: 2, rowspan: 1 },
      { text: 'ÁREA', colspan: 1, rowspan: 2 },
      { text: 'VOLUMEN (m³)', colspan: 2, rowspan: 1 },
      { text: 'PARCIAL', colspan: 1, rowspan: 2 },
      { text: 'ACUMULADO', colspan: 1, rowspan: 2 }
    ];
    
    // Fila 3 de headers - detalles específicos
    const detailHeaders = [
      'ESTACIÓN',
      'CAMPO',
      'PROYECTO',
      'CORTE',
      'TERR',
      'RT. PROYECTO',
      'CAMPO',
      'ESP. PROM',
      'ÁREA',
      'PARCIAL',
      'ACUMULADO',
      'PARCIAL',
      'ACUMULADO'
    ];
    
    // Dibujar headers con color de fondo gris claro
    this.doc.setFillColor(128, 128, 128);
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    
    let currentY = startY;
    currentX = this.margin;
    
    // Dibujar la tercera fila (más específica) directamente
    detailHeaders.forEach((header, index) => {
      const cellWidth = columnWidths[index];
      
      // Fondo gris para headers
      this.doc.setFillColor(200, 200, 200);
      this.doc.rect(currentX, currentY, cellWidth, headerHeight * 3, 'F');
      
      // Borde
      this.doc.setDrawColor(0, 0, 0);
      this.doc.rect(currentX, currentY, cellWidth, headerHeight * 3);
      
      // Texto del header
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'bold');
      
      // Dividir texto largo en múltiples líneas
      const lines = this.splitText(header, cellWidth - 2);
      lines.forEach((line, lineIndex) => {
        this.doc.text(line, currentX + cellWidth/2, currentY + headerHeight + 2 + (lineIndex * 3), { align: 'center' });
      });
      
      currentX += cellWidth;
    });
  }

  // Crear fila de estación
  createStationRow(estacion, startY, columnWidths) {
    const rowHeight = 6;
    let currentX = this.margin;
    
    // Datos de la fila principal
    const mainRowData = [
      estacion.estacion || 'N/A',
      this.safeNumber(estacion.campoElevacion).toFixed(3),
      this.safeNumber(estacion.proyectoElevacion).toFixed(3),
      this.safeNumber(estacion.diferencia).toFixed(3),
      '', // TERR
      this.safeNumber(estacion.campoElevacion).toFixed(3), // RT. PROYECTO
      this.safeNumber(estacion.campoElevacion).toFixed(3), // CAMPO
      this.safeNumber(estacion.espesorPromedio).toFixed(3),
      this.safeNumber(estacion.area).toFixed(1) + ' m²',
      this.safeNumber(estacion.volumenParcial).toFixed(2) + ' m³',
      this.safeNumber(estacion.volumenAcumulado).toFixed(2) + ' m³',
      this.safeNumber(estacion.volumenProyectoParcial).toFixed(2) + ' m³',
      this.safeNumber(estacion.volumenProyectoAcumulado).toFixed(2) + ' m³'
    ];
    
    // Dibujar fila principal
    let currentY = startY;
    currentX = this.margin;
    
    mainRowData.forEach((cellData, index) => {
      const cellWidth = columnWidths[index];
      
      // Fondo blanco para datos
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(currentX, currentY, cellWidth, rowHeight, 'F');
      
      // Borde
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.5);
      this.doc.rect(currentX, currentY, cellWidth, rowHeight);
      
      // Texto
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
      this.doc.text(String(cellData), currentX + cellWidth/2, currentY + 4, { align: 'center' });
      
      currentX += cellWidth;
    });
    
    currentY += rowHeight;
    
    // Dibujar filas de divisiones si existen
    if (estacion.divisiones && estacion.divisiones.length > 0) {
      estacion.divisiones.forEach(division => {
        currentY = this.createDivisionRow(division, currentY, columnWidths);
      });
    }
    
    return currentY;
  }

  // Crear fila de división
  createDivisionRow(division, startY, columnWidths) {
    const rowHeight = 6;
    let currentX = this.margin;
    
    const divisionData = [
      division.posicion || '',
      this.safeNumber(division.elevacionCampo).toFixed(3),
      this.safeNumber(division.elevacionProyecto).toFixed(3),
      this.safeNumber(division.diferencia).toFixed(3),
      '', // TERR
      '', // RT. PROYECTO
      '', // CAMPO
      '', // ESP. PROM
      '', // ÁREA
      '', // PARCIAL
      '', // ACUMULADO
      '', // PARCIAL
      ''  // ACUMULADO
    ];
    
    divisionData.forEach((cellData, index) => {
      const cellWidth = columnWidths[index];
      
      // Fondo blanco
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(currentX, startY, cellWidth, rowHeight, 'F');
      
      // Borde
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.5);
      this.doc.rect(currentX, startY, cellWidth, rowHeight);
      
      // Texto
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(String(cellData), currentX + cellWidth/2, startY + 4, { align: 'center' });
      
      currentX += cellWidth;
    });
    
    return startY + rowHeight;
  }

  // Método auxiliar para dividir texto largo
  splitText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (testLine.length * 2 <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Método removido - ahora usamos createExactTopografiaTable

  // Información sobre nivelación
  addNivelacionInfo() {
    this.checkPageBreak(30);
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('EL TIEMPO EN QUE SE HIZO EL REVESTIMIENTO ES DIRECTAMENTE PROPORCIONAL AL ESPESOR DE LA LOSA, A MENOR ESPESOR, MENOR VIDA ÚTIL DEL PAVIMENTO.', 
      this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text('EL PAVIMENTAR ESPESORES MENORES AL 98 % DEL ESPESOR DE PROYECTO (19.6 CENTÍMETROS), COMPROMÉTESE EL TIEMPO DE VIDA ÚTIL DEL PAVIMENTO.', 
      this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text('DE ELLA ESTAN DEBAJO DEL 98 % DEL ESPESOR DE PROYECTO.', 
      this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text('LOS ESPESORES OBTENIDOS EN ESTA LIBERACIÓN DE BASE SON TOTALMENTE ACEPTADOS Y RESPONSABILIDAD POR MURALLA.', 
      this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text('LOS VOLÚMENES EXCEDENTES SERÁN RESPONSABILIDAD Y CARGO DE LA EMPRESA MURALLA.', 
      this.margin, this.currentY);
    this.currentY += 15;
  }

  // Estadísticas consolidadas
  addEstadisticasConsolidadas(datosReporte) {
    this.checkPageBreak(50);
    
    // Crear tabla de estadísticas como en el PDF de referencia
    const estadisticasData = [
      ['DATO MÁXIMO', (datosReporte.estadisticas?.datoMaximo || 0).toFixed(3), (datosReporte.estadisticas?.datoMaximo || 0).toFixed(3)],
      ['DATO MÍNIMO', (datosReporte.estadisticas?.datoMinimo || 0).toFixed(3), (datosReporte.estadisticas?.datoMinimo || 0).toFixed(3)],
      ['DATO PROMEDIO', (datosReporte.estadisticas?.datoPromedio || 0).toFixed(3), (datosReporte.estadisticas?.datoPromedio || 0).toFixed(3)]
    ];

    this.doc.autoTable({
      head: [['', '-0.001', '0.052', '0.252']],
      body: estadisticasData,
      startY: this.currentY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        halign: 'center'
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  // Especificaciones técnicas
  addEspecificacionesTecnicas(datosReporte) {
    this.checkPageBreak(60);
    
    // Tabla de especificaciones como en el PDF de referencia
    const especData = [
      ['N‑CTR‑CAR‑1‑04‑009/20', 'ē =', '20.00 cms'],
      ['ē = ESPESOR DE PROYECTO EN CM', 'ē =', '20.050', '20.050', '19.600', 'CUMPLE CON ESPECIFICACIÓN'],
      ['ē = ESPESOR PROMEDIO CORRESPONDIENTE A', 'ē =', '20.050'],
      ['TODAS LAS DETERMINACIONES', 'n =', '320.00'],
      ['n = NÚMERO DE DETERMINACIONES HECHAS EN', 's =', '0.845'],
      ['EL TRAMO'],
      ['s = DESVIACIÓN ESTÁNDAR'],
      ['NÚMERO DE DETERMINACIONES MENORES AL 98%', '', '99']
    ];

    this.doc.autoTable({
      body: especData,
      startY: this.currentY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  // Evaluación general en volúmenes
  addEvaluacionVolumenes(datosReporte) {
    this.checkPageBreak(40);
    
    // Título de sección
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('EVALUACIÓN GENERAL EN VOLÚMENES', this.margin, this.currentY);
    this.currentY += 10;

    // Tabla de volúmenes
    const volumenData = [
      ['VOLUMEN DE PROYECTO', (datosReporte.volumenProyecto || 0).toFixed(2) + ' m³'],
      ['VOLUMEN DE RTE. BASE REAL - RTE. PROYECTO', (datosReporte.volumenRealBase || 0).toFixed(2) + ' m³'],
      ['VOLUMEN EXCEDENTE', (datosReporte.volumenExcedente || 0).toFixed(2) + ' m³']
    ];

    this.doc.autoTable({
      body: volumenData,
      startY: this.currentY,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'center' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  // Sección de firmas múltiples
  addMultipleSignatures(proyecto) {
    this.checkPageBreak(100);
    
    // Crear dos filas de firmas como en el PDF de referencia
    const firmasData = [
      { cargo: 'Ing. José Ruiz Castellanos', subcargo: 'Jefe de topografía Cemex', tipo: 'Elaboró' },
      { cargo: 'Ing. Ranulfo Martínez Torres', subcargo: 'Residente De Obra Cemex', tipo: 'Revisó' },
      { cargo: 'Ing. Jorge Alvarado Huitrón', subcargo: 'Super intendente de Obra Cemex', tipo: 'Aprobó' }
    ];

    const firmasData2 = [
      { cargo: 'Ing. Nahum Méndez Pérez', subcargo: 'Topografía Muralla', tipo: 'Revisó' },
      { cargo: 'Ing. Armando Andrade Balzabal', subcargo: 'Jefe de topografía Muralla', tipo: 'Revisó' },
      { cargo: 'Ing. Valente Alcaraz Anaya', subcargo: 'Sub Director', tipo: 'Aprobó' }
    ];

    // Primera fila de firmas
    this.addSignatureRow(firmasData);
    this.currentY += 50;

    // Segunda fila de firmas
    this.addSignatureRow(firmasData2);
    this.currentY += 20;
  }

  // Agregar fila de firmas
  addSignatureRow(firmasData) {
    const firmaWidth = this.contentWidth / 3;
    let yPos = this.currentY;

    firmasData.forEach((firma, index) => {
      const xPos = this.margin + (index * firmaWidth);
      
      // Línea para firma
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.5);
      this.doc.line(xPos + 10, yPos + 20, xPos + firmaWidth - 10, yPos + 20);
      
      // Nombre y cargo
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      
      const nombreFirma = firma.cargo || 'Sin nombre';
      this.doc.text(String(nombreFirma), xPos + (firmaWidth / 2), yPos + 30, { align: 'center' });
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      const cargoFirma = firma.subcargo || 'Sin cargo';
      this.doc.text(String(cargoFirma), xPos + (firmaWidth / 2), yPos + 38, { align: 'center' });
      
      // Tipo de firma
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      const tipoFirma = firma.tipo || 'Sin tipo';
      this.doc.text(String(tipoFirma), xPos + (firmaWidth / 2), yPos + 50, { align: 'center' });
    });
  }

  // Sección de firmas para liberación (método legacy mantenido para compatibilidad)
  addLiberacionSignatures(proyecto) {
    this.addMultipleSignatures(proyecto);
  }

  // Método auxiliar para manejar números de forma segura
  safeNumber(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  // Descargar PDF
  downloadPDF(filename) {
    this.doc.save(filename);
  }
}

export default PDFService;