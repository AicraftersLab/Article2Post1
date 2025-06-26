import React, { useState, useRef, useCallback } from 'react';

interface DragDropUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  className?: string;
  label?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number; // in MB
  buttonLabel?: string;
  showPreview?: boolean;
  children?: React.ReactNode;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFileSelected,
  accept = 'image/*',
  className = '',
  label = 'Drag and drop files here',
  multiple = false,
  disabled = false,
  maxSize = 10, // Default 10MB
  buttonLabel = 'Select Files',
  showPreview = true,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const validateFile = (file: File): boolean => {
    if (!file) return false;
    
    // Check file size
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize} MB limit.`);
      return false;
    }

    // Check file type
    if (accept && accept !== '*') {
      const fileType = file.type;
      const acceptTypes = accept.split(',').map(type => type.trim());
      
      // Handle wildcards like "image/*" or specific types
      const isAccepted = acceptTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });

      if (!isAccepted) {
        setError('File type not accepted.');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const processFile = (selectedFile: File) => {
    if (!validateFile(selectedFile)) {
      setFile(null);
      return;
    }
    setFile(selectedFile);
    onFileSelected(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
      
      // Clear the input value to ensure onChange fires if same file is selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [disabled, onFileSelected, multiple]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center
          ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
            'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200 ease-in-out
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        {file && children ? (
          children
        ) : (
          <>
            <svg 
              className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-600" 
              aria-hidden="true" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 20 16"
            >
              <path 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" 
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{label}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {accept === 'image/*' ? 'SVG, PNG, JPG or GIF' : accept}
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
              disabled={disabled}
            >
              {buttonLabel}
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
};

export default DragDropUpload; 