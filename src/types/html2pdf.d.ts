declare module 'html2pdf.js' {
  function html2pdf(): html2pdf.Html2PdfWrapper;
  namespace html2pdf {
    function from(element: HTMLElement | string): Html2PdfWrapper;
    interface Html2PdfWrapper {
      set(options: any): Html2PdfWrapper;
      save(filename?: string): Promise<void>;
      toPdf(): any;
      output(type: string, options?: any): any;
      outputPdf(type?: string, options?: any): any;
    }
  }
  export = html2pdf;
}
