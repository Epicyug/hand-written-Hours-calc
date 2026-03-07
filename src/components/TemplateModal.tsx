import { X, FileText } from 'lucide-react';

interface TemplateModalProps {
    onClose: () => void;
}

export function TemplateModal({ onClose }: TemplateModalProps) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Select Template
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: Standard */}
                    <a
                        href="/TIME CARD Common.docx"
                        download
                        onClick={onClose}
                        className="group relative flex flex-col items-center p-6 bg-gray-700/30 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 rounded-xl transition-all cursor-pointer"
                    >
                        <div className="w-24 h-32 bg-white rounded-lg shadow-lg mb-4 flex flex-col items-center justify-center gap-1 border border-gray-600 opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-1 bg-gray-300 rounded-full" />
                            <div className="w-16 h-1 bg-gray-300 rounded-full" />
                            <div className="w-16 h-1 bg-gray-300 rounded-full" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Standard</h3>
                        <p className="text-sm text-gray-400 text-center">One timesheet per page.<br />(Full Size)</p>
                    </a>

                    {/* Option 2: 3-in-1 */}
                    <a
                        href="/TIME CARD by 3.docx"
                        download
                        onClick={onClose}
                        className="group relative flex flex-col items-center p-6 bg-gray-700/30 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 rounded-xl transition-all cursor-pointer"
                    >
                        <div className="w-24 h-32 bg-white rounded-lg shadow-lg mb-4 flex flex-col items-center justify-evenly py-2 border border-gray-600 opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-6 border-2 border-gray-200 rounded flex items-center justify-center bg-gray-50 text-[6px] text-gray-300">Sheet 1</div>
                            <div className="w-16 h-6 border-2 border-gray-200 rounded flex items-center justify-center bg-gray-50 text-[6px] text-gray-300">Sheet 2</div>
                            <div className="w-16 h-6 border-2 border-gray-200 rounded flex items-center justify-center bg-gray-50 text-[6px] text-gray-300">Sheet 3</div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Compact</h3>
                        <p className="text-sm text-gray-400 text-center">Three timesheets per page.<br />(Paper Saver)</p>
                    </a>
                </div>

                <div className="p-4 bg-gray-900/50 text-center border-t border-gray-700">
                    <span className="text-xs text-gray-500">Files are Word documents (.docx)</span>
                </div>
            </div>
        </div>
    );
}
