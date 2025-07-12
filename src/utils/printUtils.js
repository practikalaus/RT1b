export const printHTMLContent = (html, title = 'document', styles = '') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Unable to open print window. Please allow pop-ups for this site.');
    return;
  }

  // Ensure printing happens only after content is fully loaded
  const handleLoad = () => {
    printWindow.focus();
    printWindow.print();
  };
  printWindow.addEventListener('load', handleLoad, { once: true });
  printWindow.addEventListener('afterprint', () => printWindow.close(), {
    once: true
  });

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@media print{body{-webkit-print-color-adjust:exact;}}</style><style>${styles}</style></head><body>${html}</body></html>`);
  printWindow.document.close();
};
