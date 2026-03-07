import { X, Upload, Key, Wand2, FileText, Download } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">🎓</span>
                        How to use Hours Counter
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8">

                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">1. Upload Timesheet</h3>
                            <p className="text-gray-400">
                                Drag & drop your <strong>Image</strong> or <strong>PDF</strong> timesheet into the box on the left.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                            <Key className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">2. Enter API Key</h3>
                            <p className="text-gray-400">
                                Enter your <strong>Google Cloud Vision API Key</strong> in the top-right corner.
                                <br />
                                <span className="text-xs text-gray-500">(This is required for the AI to read your handwriting).</span>
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <Wand2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">3. Auto-Fill with AI</h3>
                            <p className="text-gray-400">
                                Click the <strong>Auto-Fill (AI)</strong> button above your image.
                                The AI will read the hours and fill the table for you.
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">4. Review & Edit</h3>
                            <p className="text-gray-400">
                                Check the table on the right. You can fix any mistakes or add missing details manually.
                                <br />
                                <span className="text-sm text-gray-500 italic">Tip: Use "Tab" to move quickly between boxes!</span>
                            </p>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center">
                            <Download className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">5. Download PDF</h3>
                            <p className="text-gray-400">
                                Click <strong>Download PDF</strong> at the bottom right to get your clean, calculated timesheet.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all"
                    >
                        Got it!
                    </button>
                </div>

            </div>
        </div>
    );
}
