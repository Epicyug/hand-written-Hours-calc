import * as pdfjsLib from 'pdfjs-dist';

// Define the worker source. 
// In Vite, new URL(..., import.meta.url) is the standard way to reference assets/workers so they get bundled/copied correctly.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function convertPdfToImage(file: File): Promise<Blob | null> {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (pdf.numPages === 0) return null;

        // Get the first page
        const page = await pdf.getPage(1);

        // Determine scale (aim for decent OCR quality, e.g. 2.0 or 3.0 scale)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Create a canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render
        const renderContext: any = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Convert to Blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    } catch (error) {
        console.error("Error converting PDF to image:", error);
        return null;
    }
}
