import { useCallback } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { EspacioView } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetOcupacionPorHoraFn = (espacioId: string, dia: string, hora: number) => any;

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

      const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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

        const cellWidth = (pageWidth - 30) / 7;
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
      const wb = XLSX.utils.book_new();
      const diasNombres = ['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const horasIntervalos = Array.from({ length: 15 }, (_, i) => `${i + 6}:00-${i + 7}:00`);
      const espaciosAExportar = espaciosToExport || filteredEspacios;

      espaciosAExportar.forEach((espacio) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[][] = [];
        data.push(diasNombres);

        horasIntervalos.forEach((intervalo, horaIdx) => {
          const hora = horaIdx + 6;
          const row = [intervalo];

          diasNombres.slice(1).forEach((dia) => {
            const horarioEnCelda = getOcupacionPorHora(espacio.id, dia, hora);

            if (horarioEnCelda) {
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

              row.push(cellText);
            } else {
              row.push('');
            }
          });

          data.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];

        const rowHeights = Array(data.length).fill({ hpt: 60 });
        rowHeights[0] = { hpt: 30 };
        ws['!rows'] = rowHeights;

        const sheetName = `${espacio.nombre} - ${espacio.tipo}`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, `cronograma_espacios_${new Date().getTime()}.xlsx`);
    },
    [filteredEspacios, getOcupacionPorHora]
  );

  return {
    exportarCronogramaPDF,
    exportarCronogramaExcel
  };
}
