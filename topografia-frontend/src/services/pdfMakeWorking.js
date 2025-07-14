// Servicio PDF que funciona sin VFS - Versión que funciona
class PDFMakeWorking {
  constructor() {
    this.logoDataUrl = null;
    this.pdfMake = null;
    this.initialized = false;
  }

  // Cargar logo PNG
  async loadLogo() {
    try {
      const response = await fetch('/Cemex.png');
      if (!response.ok) throw new Error('Logo PNG no encontrado');
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.logoDataUrl = reader.result;
          resolve(reader.result);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('No se pudo cargar el logo PNG:', error);
      return null;
    }
  }

  // Inicializar pdfMake de forma correcta
  async initializePdfMake() {
    if (this.initialized) return;

    try {
      // Importar pdfMake y VFS de forma estática
      const pdfMake = await import('pdfmake/build/pdfmake');
      const vfsFonts = await import('pdfmake/build/vfs_fonts');

      // Configurar correctamente
      this.pdfMake = pdfMake.default;
      this.pdfMake.vfs = vfsFonts.default;

      this.initialized = true;
      console.log('pdfMake inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando pdfMake:', error);
      throw new Error('No se pudo inicializar pdfMake');
    }
  }

  // Generar reporte completo
  async generateLiberacionTopografiaReport(proyecto, datosReporte) {
    try {
      console.log('Iniciando generación de reporte...');

      if (!proyecto || !datosReporte) {
        throw new Error('Proyecto y datos del reporte son requeridos');
      }

      // Inicializar pdfMake
      await this.initializePdfMake();
      
      // Cargar logo
      await this.loadLogo();

      console.log('Creando documento PDF...');

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape', // Cambiar a horizontal para acomodar todas las columnas
        pageMargins: [15, 15, 15, 15],
        
        content: [
          // Header principal
          this.createHeader(proyecto),
          
          // Sección DATOS GENERALES
          this.createDatosGenerales(proyecto),
          
          // Tabla principal
          this.createMainTable(datosReporte),
          
          // Información adicional y resumen
          this.createAdditionalInfo(datosReporte),
          
          // Firmas
          this.createFirmas(proyecto)
        ],
        
        styles: {
          header: {
            fontSize: 14,
            bold: true,
            alignment: 'center'
          },
          subheader: {
            fontSize: 10,
            bold: true,
            alignment: 'center',
            fillColor: '#E8E8E8'
          },
          tableHeader: {
            fontSize: 7,
            bold: true,
            alignment: 'center',
            fillColor: '#E8E8E8'
          },
          tableCell: {
            fontSize: 7,
            alignment: 'center'
          },
          tableCellLeft: {
            fontSize: 7,
            alignment: 'left'
          },
          tableCellRight: {
            fontSize: 7,
            alignment: 'right'
          }
        },
        
        defaultStyle: {
          fontSize: 8,
          font: 'Roboto'
        }
      };

      console.log('Generando PDF...');
      const pdfDoc = this.pdfMake.createPdf(docDefinition);
      this.lastGeneratedPdf = pdfDoc;
      
      console.log('PDF generado exitosamente');
      return pdfDoc;

    } catch (error) {
      console.error('Error en generateLiberacionTopografiaReport:', error);
      throw error;
    }
  }

  // Crear header completo TOP-FM-05
  createHeader(proyecto) {
    return {
      table: {
        widths: [80, '*', 80],
        body: [
          [
            // Logo CEMEX
            this.logoDataUrl ? {
              image: this.logoDataUrl,
              width: 60,
              height: 30,
              alignment: 'center'
            } : {
              text: 'CEMEX',
              fontSize: 16,
              bold: true,
              alignment: 'center',
              color: '#C8102E'
            },
            
            // Título central
            {
              text: 'LIBERACIÓN DE PAVIMENTACIÓN POR TOPOGRAFÍA',
              fontSize: 14,
              bold: true,
              alignment: 'center',
              margin: [0, 5, 0, 5]
            },
            
            // Información del código y versión
            {
              stack: [
                { text: 'CÓDIGO:', fontSize: 8, bold: true, alignment: 'center' },
                { text: 'TOP-FM-05', fontSize: 10, bold: true, alignment: 'center' },
                { text: 'VERSIÓN: 0.1', fontSize: 8, alignment: 'center' },
                { text: 'FECHA CREACIÓN:', fontSize: 7, alignment: 'center' },
                { text: '17/07/2017', fontSize: 8, alignment: 'center' }
              ]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000'
      },
      margin: [0, 0, 0, 10]
    };
  }

  // Crear datos generales del proyecto
  createDatosGenerales(proyecto) {
    const formatearKM = (km) => {
      if (!km) return 'N/A';
      const kmNum = parseFloat(km);
      const kilometro = Math.floor(kmNum / 1000);
      const metro = kmNum % 1000;
      return `${kilometro}+${String(metro).padStart(3, '0')}.00`;
    };
    
    return {
      table: {
        widths: [25, 70, 25, 70, 20, 30, 20, 30],
        body: [
          [
            { text: 'PROYECTO:', fontSize: 8, bold: true, fillColor: '#E8E8E8' },
            { text: proyecto.nombre || 'CCR MEDLINE NUEVO NUEVO LAREDO', fontSize: 8 },
            { text: 'PATIO:', fontSize: 8, bold: true, fillColor: '#E8E8E8' },
            { text: proyecto.cuerpo || 'SOR-OESTE', fontSize: 8 },
            { text: 'CADENAMIENTO INICIAL:', fontSize: 7, bold: true, fillColor: '#E8E8E8' },
            { text: formatearKM(proyecto.km_inicial), fontSize: 8 },
            { text: 'CADENAMIENTO FINAL:', fontSize: 7, bold: true, fillColor: '#E8E8E8' },
            { text: formatearKM(proyecto.km_final), fontSize: 8 }
          ],
          [
            { text: 'CONTRATO:', fontSize: 8, bold: true, fillColor: '#E8E8E8' },
            { text: proyecto.contrato || 'XXXXX-XXXX-XXX', fontSize: 8 },
            { text: 'FECHA DEL REPORTE:', fontSize: 7, bold: true, fillColor: '#E8E8E8' },
            { text: new Date().toLocaleDateString('es-ES'), fontSize: 8 },
            { text: 'TRAMO:', fontSize: 8, bold: true, fillColor: '#E8E8E8' },
            { text: proyecto.tramo || `OFF DEL ${formatearKM(proyecto.km_inicial)} AL ${formatearKM(proyecto.km_final)}`, fontSize: 8 },
            { text: 'FOLIO:', fontSize: 8, bold: true, fillColor: '#E8E8E8' },
            { text: `LIB-${proyecto.id || '16'}`, fontSize: 8 }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000'
      },
      margin: [0, 0, 0, 10]
    };
  }

  // Crear tabla principal de nivelación y determinación de volúmenes
  createMainTable(datosReporte) {
    const formatNumber = (num, decimales = 3) => {
      if (num === null || num === undefined || num === '') return '';
      return parseFloat(num).toFixed(decimales);
    };
    
    // Headers simplificados para evitar errores de pdfMake
    const headers = [
      [
        { text: 'ESTACIÓN', style: 'tableHeader' },
        { text: 'ELEVACIÓN CAMPO', style: 'tableHeader' },
        { text: 'ELEVACIÓN PROYECTO', style: 'tableHeader' },
        { text: 'DIFERENCIA TERR', style: 'tableHeader' },
        { text: 'RT PROYECTO', style: 'tableHeader' },
        { text: 'CAMPO RTE', style: 'tableHeader' },
        { text: 'ESPESOR PROM', style: 'tableHeader' },
        { text: 'ÁREA (m²)', style: 'tableHeader' },
        { text: 'VOL. PARCIAL', style: 'tableHeader' },
        { text: 'VOL. ACUMULADO', style: 'tableHeader' },
        { text: 'PROY. PARCIAL', style: 'tableHeader' },
        { text: 'PROY. ACUMULADO', style: 'tableHeader' }
      ]
    ];
    
    // Datos de las estaciones - simplificado sin rowSpan
    const dataRows = [];
    
    if (datosReporte && datosReporte.estacionesData) {
      datosReporte.estacionesData.forEach((estacion, index) => {
        // Agregar una fila por estación con datos promedio
        dataRows.push([
          { text: estacion.estacion, style: 'tableCell' },
          { text: formatNumber(estacion.campoElevacion, 3), style: 'tableCell' },
          { text: formatNumber(estacion.proyectoElevacion, 3), style: 'tableCell' },
          { text: formatNumber(estacion.diferenciaTerr, 3), style: 'tableCell' },
          { text: formatNumber(estacion.rtProyecto, 3), style: 'tableCell' },
          { text: formatNumber(estacion.campoElevacion, 3), style: 'tableCell' },
          { text: formatNumber(estacion.espesorPromedio, 3), style: 'tableCell' },
          { text: formatNumber(estacion.area, 1), style: 'tableCell' },
          { text: formatNumber(estacion.volumenParcial, 3), style: 'tableCell' },
          { text: formatNumber(estacion.volumenAcumulado, 3), style: 'tableCell' },
          { text: formatNumber(estacion.volumenProyectoParcial, 3), style: 'tableCell' },
          { text: formatNumber(estacion.volumenProyectoAcumulado, 3), style: 'tableCell' }
        ]);
        
        // Si hay divisiones adicionales, agregarlas como filas separadas
        if (estacion.divisiones && estacion.divisiones.length > 1) {
          estacion.divisiones.slice(1).forEach(division => {
            dataRows.push([
              { text: `  ${division.posicion}`, style: 'tableCell' },
              { text: formatNumber(division.elevacionCampo, 3), style: 'tableCell' },
              { text: formatNumber(division.elevacionProyecto, 3), style: 'tableCell' },
              { text: formatNumber(division.diferencia, 3), style: 'tableCell' },
              { text: formatNumber(division.rtProyecto, 3), style: 'tableCell' },
              { text: formatNumber(division.determinacionVolRte, 3), style: 'tableCell' },
              { text: '-', style: 'tableCell' },
              { text: '-', style: 'tableCell' },
              { text: '-', style: 'tableCell' },
              { text: '-', style: 'tableCell' },
              { text: '-', style: 'tableCell' },
              { text: '-', style: 'tableCell' }
            ]);
          });
        }
      });
    }
    
    return {
      table: {
        headerRows: 1,
        widths: [50, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
        body: [...headers, ...dataRows]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000'
      },
      margin: [0, 0, 0, 10]
    };
  }

  // Información adicional y resumen final
  createAdditionalInfo(datosReporte) {
    const formatNumber = (num, decimales = 3) => {
      if (num === null || num === undefined || num === '') return '0.000';
      return parseFloat(num).toFixed(decimales);
    };
    
    return {
      stack: [
        // Resumen de espesores
        {
          text: 'RESUMEN DE ESPESORES',
          fontSize: 10,
          bold: true,
          alignment: 'center',
          margin: [0, 10, 0, 5]
        },
        {
          table: {
            widths: [120, 60, 120, 60],
            body: [
              [
                { text: 'DATO MÁXIMO:', fontSize: 8, bold: true },
                { text: formatNumber(datosReporte?.estadisticas?.datoMaximo, 6) + ' m', fontSize: 8 },
                { text: 'DATO MÍNIMO:', fontSize: 8, bold: true },
                { text: formatNumber(datosReporte?.estadisticas?.datoMinimo, 6) + ' m', fontSize: 8 }
              ],
              [
                { text: 'DATO PROMEDIO (ē):', fontSize: 8, bold: true },
                { text: formatNumber(datosReporte?.estadisticas?.datoPromedio, 6) + ' m', fontSize: 8 },
                { text: 'DESVIACIÓN ESTÁNDAR (s):', fontSize: 8, bold: true },
                { text: formatNumber(datosReporte?.estadisticas?.desviacionEstandar, 6) + ' m', fontSize: 8 }
              ],
              [
                { text: 'NÚMERO DE DETERMINACIONES (n):', fontSize: 8, bold: true },
                { text: datosReporte?.estadisticas?.numeroDeterminaciones || '0', fontSize: 8 },
                { text: 'ESPESOR DE PROYECTO:', fontSize: 8, bold: true },
                { text: 'e = ' + formatNumber((datosReporte?.proyecto?.espesor || 0.20) * 100, 2) + ' cms', fontSize: 8 }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },
        
        // Especificaciones técnicas
        {
          text: 'ESPECIFICACIONES TÉCNICAS',
          fontSize: 10,
          bold: true,
          alignment: 'center',
          margin: [0, 15, 0, 5]
        },
        {
          text: 'N‑CTR‑CAR‑1‑04‑009/20',
          fontSize: 9,
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: 'N‑CTR‑CAR‑1‑04‑009/20‑H.4.6.',
          fontSize: 9,
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        
        // Verificación de cumplimiento
        {
          table: {
            widths: [180, 80],
            body: [
              [
                { text: 'ESPESOR PROMEDIO CORRESPONDIENTE A TODAS LAS DETERMINACIONES:', fontSize: 8, bold: true },
                { text: formatNumber(datosReporte?.estadisticas?.datoPromedio, 6) + ' m', fontSize: 8, alignment: 'center' }
              ],
              [
                { text: 'CUMPLE CON ESPECIFICACIÓN:', fontSize: 8, bold: true },
                { 
                  text: datosReporte?.evaluacionZonas?.estadoInspeccion || 'N/A', 
                  fontSize: 8, 
                  alignment: 'center',
                  bold: true,
                  color: (datosReporte?.evaluacionZonas?.estadoInspeccion === 'CONFORME') ? '#008000' : '#FF0000'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },
        
        // Evaluación en volúmenes
        {
          text: 'EVALUACIÓN GENERAL EN VOLÚMENES',
          fontSize: 10,
          bold: true,
          alignment: 'center',
          margin: [0, 15, 0, 5]
        },
        {
          table: {
            widths: [150, 80],
            body: [
              [
                { text: 'VOLUMEN DE PROYECTO', fontSize: 9, bold: true },
                { text: formatNumber(datosReporte?.volumenProyecto, 3) + ' m³', fontSize: 9, alignment: 'center' }
              ],
              [
                { text: 'VOLUMEN REAL', fontSize: 9, bold: true },
                { text: formatNumber(datosReporte?.volumenRealBase, 3) + ' m³', fontSize: 9, alignment: 'center' }
              ],
              [
                { text: 'VOLUMEN EXCEDENTE', fontSize: 9, bold: true },
                { text: formatNumber(datosReporte?.volumenExcedente, 3) + ' m³', fontSize: 9, alignment: 'center' }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },
        
        // Aceptación final
        {
          text: 'Los espesores obtenidos en la liberación de base son TOTALMENTE ACEPTADOS Y RESPONSABILIDAD POR MURALLA.',
          fontSize: 9,
          alignment: 'center',
          margin: [0, 10, 0, 5]
        },
        {
          text: 'Los volúmenes excedentes serán responsabilidad y cargo de la empresa Muralla.',
          fontSize: 9,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        }
      ],
      margin: [0, 0, 0, 20]
    };
  }

  // Crear firmas
  createFirmas(proyecto) {
    return {
      columns: [
        {
          stack: [
            { text: 'ELABORÓ', alignment: 'center', bold: true, fontSize: 9 },
            { text: '\n\n_________________________', alignment: 'center', fontSize: 9 },
            { text: 'Ing. José Ruiz Castellanos', alignment: 'center', bold: true, fontSize: 9 },
            { text: 'Jefe de topografía Cemex', alignment: 'center', fontSize: 8 }
          ]
        },
        {
          stack: [
            { text: 'REVISÓ', alignment: 'center', bold: true, fontSize: 9 },
            { text: '\n\n_________________________', alignment: 'center', fontSize: 9 },
            { text: 'Ing. Ranulfo Martínez Torres', alignment: 'center', bold: true, fontSize: 9 },
            { text: 'Residente De Obra Cemex', alignment: 'center', fontSize: 8 }
          ]
        },
        {
          stack: [
            { text: 'APROBÓ', alignment: 'center', bold: true, fontSize: 9 },
            { text: '\n\n_________________________', alignment: 'center', fontSize: 9 },
            { text: 'Ing. Jorge Alvarado Huitrón', alignment: 'center', bold: true, fontSize: 9 },
            { text: 'Super intendente de Obra Cemex', alignment: 'center', fontSize: 8 }
          ]
        }
      ],
      margin: [0, 20, 0, 20]
    };
  }

  // Descargar PDF
  downloadPDF(filename) {
    if (this.lastGeneratedPdf) {
      this.lastGeneratedPdf.download(filename);
    }
  }
}

export default PDFMakeWorking;