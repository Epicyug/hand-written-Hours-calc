
export interface GoogleCloudVisionResponse {
    fullTextAnnotation: {
        text: string;
        pages: Array<{
            blocks: Array<{
                paragraphs: Array<{
                    words: Array<{
                        symbols: Array<{
                            text: string;
                        }>;
                        boundingBox: {
                            vertices: Array<{ x?: number; y?: number }>;
                        };
                    }>;
                }>;
            }>;
        }>;
    };
}

export async function analyzeImage(base64Image: string, apiKey: string): Promise<GoogleCloudVisionResponse> {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    // Remove header if present (e.g. "data:image/jpeg;base64,")
    const content = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            requests: [
                {
                    image: {
                        content: content,
                    },
                    features: [
                        {
                            type: 'DOCUMENT_TEXT_DETECTION',
                        },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    return data.responses?.[0] || {};
}
