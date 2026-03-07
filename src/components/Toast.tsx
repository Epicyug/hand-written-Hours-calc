import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: number) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-64 animate-fade-in-up ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
            {toast.type === 'success'
                ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                : <XCircle className="w-5 h-5 flex-shrink-0" />
            }
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
