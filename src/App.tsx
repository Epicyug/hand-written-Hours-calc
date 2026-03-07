import { useState, useEffect } from 'react';
import { ImageUpload } from './components/ImageUpload';
import type { WeekSheet } from './components/TimesheetForm';
import { TimesheetForm } from './components/TimesheetForm';
import { generatePDF } from './utils/pdfGenerator';
import { parseTimesheet } from './utils/ocrParser';
import { analyzeImage } from './utils/googleCloudOcr';
import { FileText, RefreshCw, Wand2, Key, HelpCircle } from 'lucide-react';
import { convertPdfToImage } from './utils/pdfToImage';
import { HelpModal } from './components/HelpModal';
import { TemplateModal } from './components/TemplateModal';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

const createEmptyWeek = (): WeekSheet => ({
  employeeName: '',
  weekOf: '',
  days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
    day,
    morningIn: '', morningOut: '',
    afternoonIn: '', afternoonOut: '',
    overtimeIn: '', overtimeOut: ''
  }))
});

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [data, setData] = useState({ week1: createEmptyWeek(), week2: createEmptyWeek() });
  const [ocrStatus, setOcrStatus] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    setToasts(prev => [...prev, { id: Date.now(), type, message }]);
  };

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      try {
        const decoded = JSON.parse(atob(dataParam));
        if (decoded.week1 && decoded.week2) {
          setData(decoded);
          setManualMode(true);
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.error("Failed to parse deep link data", e);
      }
    }
  }, []);

  const runOCR = async (imageUrl?: string) => {
    const targetImage = imageUrl ?? image;
    if (!targetImage) return;
    if (!apiKey) {
      addToast('error', 'Please enter a Google Cloud Vision API Key first.');
      return;
    }

    setIsProcessing(true);
    setOcrStatus('Preparing image...');

    try {
      const response = await fetch(targetImage);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setOcrStatus('Sending to Google Cloud...');
      const googleResponse = await analyzeImage(base64, apiKey);

      setOcrStatus('Processing structure...');
      const parsedData = parseTimesheet(googleResponse);

      setData(parsedData);
      console.log('Parsed Data:', parsedData);
      setOcrStatus('Done!');
    } catch (e: any) {
      console.error(e);
      setOcrStatus(e.message || 'Failed to analyze text.');
      addToast('error', e.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    let finalFile = file;

    if (file.type === 'application/pdf') {
      setIsProcessing(true);
      setOcrStatus('Converting PDF...');
      const imageBlob = await convertPdfToImage(file);
      setIsProcessing(false);
      if (!imageBlob) {
        addToast('error', 'Failed to convert PDF. Please upload an image.');
        return;
      }
      const pdfFileName = file.name.replace(/\.pdf$/i, '.png');
      finalFile = new File([imageBlob], pdfFileName, { type: 'image/png' });
    }

    const url = URL.createObjectURL(finalFile);
    setImage(url);
    setFileName(finalFile.name);

    if (apiKey) {
      runOCR(url);
    }
  };

  const handleStartOver = () => {
    if (!confirm('Are you sure you want to start over? All entered data will be lost.')) return;
    setImage(null);
    setFileName('');
    setManualMode(false);
    setData({ week1: createEmptyWeek(), week2: createEmptyWeek() });
    setOcrStatus('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Hours Counter
          </h1>
          <p className="text-gray-400 text-sm">Digitize your handwritten timesheets instantly.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            How to Use
          </button>

          {(image || manualMode) && (
            <div className="flex items-center gap-4">
              {image && (
                <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 px-3 py-1">
                  <Key className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="password"
                    placeholder="Google Vision API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white w-48 placeholder-gray-500"
                  />
                </div>
              )}
              <button
                onClick={handleStartOver}
                className="text-sm text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto mb-6 text-right">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 inline-flex text-white"
        >
          <FileText className="w-4 h-4" /> Download Blank Template
        </button>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Image / Upload */}
        <div className="space-y-6">
          {!image ? (
            <ImageUpload onImageUpload={handleImageUpload} />
          ) : (
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 h-[50vh] lg:h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <FileImage className="w-4 h-4" /> Original Image
                  </h3>
                  {fileName && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]" title={fileName}>{fileName}</p>
                  )}
                </div>
                <button
                  onClick={() => runOCR()}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {isProcessing ? ocrStatus : 'Auto-Fill (AI)'}
                </button>
              </div>

              {!apiKey && !isProcessing && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-300 text-xs px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 flex-shrink-0" />
                  Enter your API key in the header, then click "Auto-Fill (AI)"
                </div>
              )}

              <div className="flex-1 overflow-auto bg-black/40 rounded-lg p-2 flex items-center justify-center">
                <img src={image} alt="Timesheet" className="max-w-full h-auto object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Form */}
        <div className="space-y-6">
          {(image || manualMode) ? (
            <div className="bg-white rounded-xl shadow-2xl h-[80vh] overflow-y-auto">
              <div className="p-6">
                <TimesheetForm
                  initialData={data}
                  onSave={(currentData) => {
                    generatePDF(currentData);
                    addToast('success', 'PDF downloaded successfully!');
                  }}
                />
                <div className="h-20" />
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>Upload a timesheet to begin editing</p>
              <button
                onClick={() => setManualMode(true)}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
              >
                Fill in manually
              </button>
            </div>
          )}
        </div>
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showTemplateModal && <TemplateModal onClose={() => setShowTemplateModal(false)} />}
    </div>
  );
}

// Minimal icons fix
function FileImage(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="21.17" y1="8" x2="12" y2="8" /><line x1="3.95" y1="6.06" x2="8.54" y2="14" /><line x1="10.88" y1="21.94" x2="15.46" y2="14" /></svg> }

export default App;
