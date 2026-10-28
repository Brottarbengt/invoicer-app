import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function printInvoice(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

export async function downloadPdfDirectly(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Invoice element not found:', elementId);
    return false;
  }

  try {
    // Tillfälligt säkerställ optimal rendering
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    const canvas = await html2canvas(element, {
      scale: 2, // Hög DPI för skarp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    element.style.boxShadow = originalShadow;

    const imgData = canvas.toDataURL('image/png');
    // A4 mått i mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Om innehållet ryms på en sida
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(297, pdfHeight));
    
    // Om det spiller över en sida, lägg till nästa sida
    if (pdfHeight > 297) {
      let remainingHeight = pdfHeight - 297;
      let position = -297;
      while (remainingHeight > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        position -= 297;
        remainingHeight -= 297;
      }
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    // Fallback till window.print()
    window.print();
    return false;
  }
}
