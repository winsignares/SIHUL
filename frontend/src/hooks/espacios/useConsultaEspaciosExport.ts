import { useCallback } from 'react';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import type { EspacioView } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetOcupacionPorHoraFn = (espacioId: string, dia: string, hora: number) => any;

const descargarExcel = async (buffer: BlobPart, fileName: string) => {
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
};

export function useConsultaEspaciosExport({
  filteredEspacios,
  getOcupacionPorHora
}: {
  filteredEspacios: EspacioView[];
  getOcupacionPorHora: GetOcupacionPorHoraFn;
}) {
  const exportarCronogramaPDF = useCallback(
    (espaciosToExport?: EspacioView[]) => {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const horasIntervalos = Array.from({ length: 15 }, (_, i) => i + 6);
      const espaciosAExportar = espaciosToExport || filteredEspacios;

      const getTextLines = (text: string, maxWidth: number, fontSize: number): string[] => {
        doc.setFontSize(fontSize);
        return doc.splitTextToSize(text, maxWidth);
      };

      espaciosAExportar.forEach((espacio, espacioIndex) => {
        if (espacioIndex > 0) doc.addPage();

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${espacio.nombre} - ${espacio.tipo}`, pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Capacidad: ${espacio.capacidad} | Sede: ${espacio.sede} | Edificio: ${espacio.edificio}`,
          pageWidth / 2,
          22,
          { align: 'center' }
        );

        const cellWidth = (pageWidth - 30) / (diasNombres.length + 1);
        const startX = 15;
        const startY = 30;
        const headerHeight = 8;
        const minEmptyCellHeight = 4;
        const contentCellHeight = 12;

        doc.setFillColor(30, 41, 59);
        doc.rect(startX, startY, cellWidth, headerHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Hora', startX + cellWidth / 2, startY + headerHeight / 2 + 2, { align: 'center' });

        diasNombres.forEach((dia, idx) => {
          doc.setFillColor(30, 41, 59);
          doc.rect(startX + cellWidth * (idx + 1), startY, cellWidth, headerHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(dia, startX + cellWidth * (idx + 1) + cellWidth / 2, startY + headerHeight / 2 + 2, {
            align: 'center'
          });
        });

        const rowHeights: number[] = [];
        const pageAvailableHeight = pageHeight - startY - headerHeight - 10;

        horasIntervalos.forEach((hora) => {
          let hasContent = false;
          let maxLines = 0;

          diasNombres.forEach((dia) => {
            const horarioEnCelda = getOcupacionPorHora(espacio.id, dia, hora);
            if (horarioEnCelda) {
              hasContent = true;
              const isPrestamo = horarioEnCelda.tipo === 'prestamo';
              let lines = 0;

              if (isPrestamo) lines += 1;

              if (horarioEnCelda.materia) {
                lines += getTextLines(horarioEnCelda.materia, cellWidth - 4, 5).length;
              }
              if (horarioEnCelda.docente) {
                lines += getTextLines(horarioEnCelda.docente.toUpperCase(), cellWidth - 4, 5).length;
              }
              if (horarioEnCelda.grupo) {
                lines += getTextLines(horarioEnCelda.grupo, cellWidth - 4, 5).length;
              }

              maxLines = Math.max(maxLines, lines);
            }
          });

          if (hasContent) {
            rowHeights.push(Math.max(contentCellHeight, maxLines * 2.5 + 3));
          } else {
            rowHeights.push(minEmptyCellHeight);
          }
        });

        const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
        if (totalHeight > pageAvailableHeight) {
          const scaleFactor = pageAvailableHeight / totalHeight;
          for (let i = 0; i < rowHeights.length; i++) {
            if (rowHeights[i] > minEmptyCellHeight) {
              rowHeights[i] = Math.max(minEmptyCellHeight, rowHeights[i] * scaleFactor);
            }
          }
        }

        let currentY = startY + headerHeight;

        horasIntervalos.forEach((hora, horaIdx) => {
          const cellHeight = rowHeights[horaIdx];

          doc.setFillColor(243, 244, 246);
          doc.rect(startX, currentY, cellWidth, cellHeight, 'FD');
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.text(`${hora}:00-${hora + 1}:00`, startX + cellWidth / 2, currentY + cellHeight / 2 + 1, {
            align: 'center'
          });

          diasNombres.forEach((dia, diaIdx) => {
            const x = startX + cellWidth * (diaIdx + 1);
            const horarioEnCelda = getOcupacionPorHora(espacio.id, dia, hora);

            if (horarioEnCelda) {
              const isPrestamo = horarioEnCelda.tipo === 'prestamo';
              const isPrestamoPendiente = isPrestamo && horarioEnCelda.prestamo?.estado === 'Pendiente';
              const isPrestamoAprobado = isPrestamo && horarioEnCelda.prestamo?.estado === 'Aprobado';
              const isOcupado = horarioEnCelda.estado === 'ocupado';
              const isMantenimiento = horarioEnCelda.estado === 'mantenimiento';

              if (isPrestamoPendiente) {
                doc.setFillColor(253, 224, 71);
                doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                doc.setTextColor(15, 23, 42);
              } else if (isPrestamoAprobado) {
                doc.setFillColor(34, 197, 94);
                doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                doc.setTextColor(255, 255, 255);
              } else if (isOcupado) {
                doc.setFillColor(239, 68, 68);
                doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                doc.setTextColor(255, 255, 255);
              } else if (isMantenimiento) {
                doc.setFillColor(234, 179, 8);
                doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                doc.setTextColor(255, 255, 255);
              } else {
                doc.setFillColor(219, 234, 254);
                doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                doc.setTextColor(0, 0, 0);
              }

              let textY = currentY + 2.5;
              const maxTextWidth = cellWidth - 4;

              if (isPrestamo) {
                const estadoLabel = isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO';
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5);
                doc.text(estadoLabel, x + cellWidth / 2, textY, { align: 'center' });
                textY += 2.2;
              }

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(5);

              const materia = horarioEnCelda.materia || '';
              const docente = horarioEnCelda.docente ? horarioEnCelda.docente.toUpperCase() : '';
              const grupo = horarioEnCelda.grupo || '';

              if (materia) {
                const lines = getTextLines(materia, maxTextWidth, 5);
                lines.forEach((line: string) => {
                  if (textY < currentY + cellHeight - 1) {
                    doc.text(line, x + cellWidth / 2, textY, { align: 'center' });
                    textY += 2.2;
                  }
                });
              }

              if (docente) {
                const lines = getTextLines(docente, maxTextWidth, 5);
                lines.forEach((line: string) => {
                  if (textY < currentY + cellHeight - 1) {
                    doc.text(line, x + cellWidth / 2, textY, { align: 'center' });
                    textY += 2.2;
                  }
                });
              }

              if (grupo) {
                const lines = getTextLines(grupo, maxTextWidth, 5);
                lines.forEach((line: string) => {
                  if (textY < currentY + cellHeight - 1) {
                    doc.text(line, x + cellWidth / 2, textY, { align: 'center' });
                    textY += 2.2;
                  }
                });
              }
            } else {
              doc.rect(x, currentY, cellWidth, cellHeight, 'D');
            }
          });

          currentY += cellHeight;
        });
      });

      doc.save(`cronograma_espacios_${new Date().getTime()}.pdf`);
    },
    [filteredEspacios, getOcupacionPorHora]
  );

  const exportarCronogramaExcel = useCallback(
    (espaciosToExport?: EspacioView[]) => {
      const diasNombres = ['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const horasIntervalos = Array.from({ length: 15 }, (_, i) => `${i + 6}:00-${i + 7}:00`);
      const espaciosAExportar = espaciosToExport || filteredEspacios;
      // Mismos colores usados en la exportación a PDF, para que ambos formatos luzcan consistentes.
      const COLOR_HEADER = 'FF1E293B';
      const COLOR_TEXTO_BLANCO = 'FFFFFFFF';
      const COLOR_TEXTO_OSCURO = 'FF0F172A';
      const COLOR_HORA = 'FFF3F4F6';
      const COLOR_PENDIENTE = 'FFFDE047';
      const COLOR_APROBADO = 'FF22C55E';
      const COLOR_OCUPADO = 'FFEF4444';
      const COLOR_MANTENIMIENTO = 'FFEAB308';
      const COLOR_CLASE = 'FFDBEAFE';
      const COLOR_BORDE = 'FFD1D5DB';

      const fill = (color: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color } });
      const bordeFino = { style: 'thin' as const, color: { argb: COLOR_BORDE } };
      const bordeCompleto = { top: bordeFino, left: bordeFino, bottom: bordeFino, right: bordeFino };

      void (async () => {
        const workbook = new ExcelJS.Workbook();

        espaciosAExportar.forEach((espacio) => {
          const sheetName = `${espacio.nombre} - ${espacio.tipo}`.substring(0, 31);
          const worksheet = workbook.addWorksheet(sheetName);

          worksheet.columns = [
            { header: 'Hora', key: 'hora', width: 14 },
            { header: 'Lunes', key: 'lunes', width: 25 },
            { header: 'Martes', key: 'martes', width: 25 },
            { header: 'Miércoles', key: 'miercoles', width: 25 },
            { header: 'Jueves', key: 'jueves', width: 25 },
            { header: 'Viernes', key: 'viernes', width: 25 },
            { header: 'Sábado', key: 'sabado', width: 25 },
            { header: 'Domingo', key: 'domingo', width: 25 },
          ];

          const headerRow = worksheet.getRow(1);
          headerRow.height = 30;
          headerRow.eachCell((cell) => {
            cell.fill = fill(COLOR_HEADER);
            cell.font = { bold: true, color: { argb: COLOR_TEXTO_BLANCO } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = bordeCompleto;
          });

          horasIntervalos.forEach((intervalo, horaIdx) => {
            const hora = horaIdx + 6;
            const row: Record<string, string> = { hora: intervalo };

            diasNombres.slice(1).forEach((dia) => {
              const horarioEnCelda = getOcupacionPorHora(espacio.id, dia, hora);
              const key = dia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

              if (!horarioEnCelda) {
                row[key] = '';
                return;
              }

              const isPrestamo = horarioEnCelda.tipo === 'prestamo';
              const isPrestamoPendiente = isPrestamo && horarioEnCelda.prestamo?.estado === 'Pendiente';
              const materia = horarioEnCelda.materia || '';
              const docente = horarioEnCelda.docente ? horarioEnCelda.docente.toUpperCase() : '';
              const grupo = horarioEnCelda.grupo || '';

              let cellText = '';
              if (isPrestamo) {
                cellText = `[${isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO'}] `;
              }

              cellText += materia;
              if (docente) cellText += ` / ${docente}`;
              if (grupo) cellText += `\n${grupo}`;
              row[key] = cellText;
            });

            const addedRow = worksheet.addRow(row);
            addedRow.height = 60;
            addedRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            const horaCell = addedRow.getCell('hora');
            horaCell.fill = fill(COLOR_HORA);
            horaCell.font = { bold: true, color: { argb: COLOR_TEXTO_OSCURO } };
            horaCell.border = bordeCompleto;

            diasNombres.slice(1).forEach((dia) => {
              const horarioEnCelda = getOcupacionPorHora(espacio.id, dia, hora);
              const key = dia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              const cell = addedRow.getCell(key);
              cell.border = bordeCompleto;

              if (!horarioEnCelda) return;

              const isPrestamo = horarioEnCelda.tipo === 'prestamo';
              const isPrestamoPendiente = isPrestamo && horarioEnCelda.prestamo?.estado === 'Pendiente';
              const isPrestamoAprobado = isPrestamo && horarioEnCelda.prestamo?.estado === 'Aprobado';
              const isOcupado = horarioEnCelda.estado === 'ocupado';
              const isMantenimiento = horarioEnCelda.estado === 'mantenimiento';

              if (isPrestamoPendiente) {
                cell.fill = fill(COLOR_PENDIENTE);
                cell.font = { color: { argb: COLOR_TEXTO_OSCURO } };
              } else if (isPrestamoAprobado) {
                cell.fill = fill(COLOR_APROBADO);
                cell.font = { color: { argb: COLOR_TEXTO_BLANCO } };
              } else if (isOcupado) {
                cell.fill = fill(COLOR_OCUPADO);
                cell.font = { color: { argb: COLOR_TEXTO_BLANCO } };
              } else if (isMantenimiento) {
                cell.fill = fill(COLOR_MANTENIMIENTO);
                cell.font = { color: { argb: COLOR_TEXTO_BLANCO } };
              } else {
                cell.fill = fill(COLOR_CLASE);
                cell.font = { color: { argb: COLOR_TEXTO_OSCURO } };
              }
            });
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        await descargarExcel(
          buffer as BlobPart,
          `cronograma_espacios_${new Date().getTime()}.xlsx`
        );
      })().catch(() => {
        // Mantener el hook resiliente si falla la exportación
      });
    },
    [filteredEspacios, getOcupacionPorHora]
  );

  return {
    exportarCronogramaPDF,
    exportarCronogramaExcel
  };
}
