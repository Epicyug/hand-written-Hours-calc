import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
    onImageUpload: (file: File) => void;
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                onImageUpload(file);
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`
        relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
        ${isDragging
                    ? 'border-blue-500 bg-blue-50/10 scale-[1.02] shadow-xl'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/5'
                }
      `}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
            />

            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/20">
                <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'}`} />
            </div>

            <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-500 transition-colors">
                {isDragging ? 'Drop it here!' : 'Click or Drag Image/PDF'}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
                Supports JPG, PNG, PDF (Max 10MB)
            </p>
        </div>
    );
}
