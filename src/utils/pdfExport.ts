import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/** Temporarily undo CSS that breaks html2canvas (hidden ancestors, scale transforms). */
function prepareElementForCapture(element: HTMLElement): () => void {
  const restores: Array<() => void> = [];

  // Temporarily clear placeholders so html2canvas never renders any placeholder text on PDF
  const placeholderInputs = element.querySelectorAll('input[placeholder], textarea[placeholder]');
  placeholderInputs.forEach((input) => {
    const el = input as HTMLInputElement | HTMLTextAreaElement;
    const ph = el.getAttribute('placeholder');
    if (ph) {
      el.setAttribute('placeholder', '');
      restores.push(() => {
        el.setAttribute('placeholder', ph);
      });
    }
  });

  let node: HTMLElement | null = element;
  while (node) {
    const computed = window.getComputedStyle(node);
    const inlineDisplay = node.style.display;
    const inlineVisibility = node.style.visibility;
    const inlineTransform = node.style.transform;
    const inlineMarginBottom = node.style.marginBottom;

    if (computed.display === 'none') {
      const n = node;
      n.style.display = n.classList.contains('flex') || computed.flexDirection ? 'flex' : 'block';
      n.style.visibility = 'visible';
      restores.push(() => {
        n.style.display = inlineDisplay;
        n.style.visibility = inlineVisibility;
      });
    }

    if (inlineTransform && inlineTransform !== 'none') {
      const n = node;
      n.style.transform = 'none';
      n.style.marginBottom = '0';
      restores.push(() => {
        n.style.transform = inlineTransform;
        n.style.marginBottom = inlineMarginBottom;
      });
    }

    node = node.parentElement;
  }

  return () => {
    for (const restore of restores.reverse()) restore();
  };
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function downloadPdfDirectly(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Invoice element not found:', elementId);
    return false;
  }

  // Blur any active input to remove focus rings
  if (typeof document !== 'undefined' && document.activeElement && 'blur' in document.activeElement) {
    (document.activeElement as HTMLElement).blur();
  }

  const restore = prepareElementForCapture(element);
  await waitForLayout();

  try {
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.offsetWidth,
      windowHeight: element.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      ignoreElements: (el) => el.classList?.contains('no-print') || el.classList?.contains('print:hidden'),
    });

    element.style.boxShadow = originalShadow;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(297, pdfHeight));

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
    window.print();
    return false;
  } finally {
    restore();
  }
}
