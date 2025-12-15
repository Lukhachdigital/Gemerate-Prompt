import React, { useRef, useState } from 'react';
import { FilmStyle, DialogueOption } from '../types';
import { 
  VideoCameraIcon, 
  SparklesIcon, 
  DocumentTextIcon, 
  XCircleIcon, 
  PlayCircleIcon, 
  ChatBubbleLeftRightIcon, 
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';

interface InputSectionProps {
  currentStyle: FilmStyle;
  onStyleChange: (style: FilmStyle) => void;
  currentDialogue: DialogueOption;
  onDialogueChange: (option: DialogueOption) => void;
  isLoading: boolean;
  onFileUpload: (lines: string[]) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  currentStyle, 
  onStyleChange, 
  currentDialogue,
  onDialogueChange,
  isLoading, 
  onFileUpload 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{name: string, lines: string[]} | null>(null);

  // --- FILE HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
        alert("Vui lòng chỉ chọn file .txt");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length > 0) {
            setSelectedFile({ name: file.name, lines });
        } else {
            alert("File không có nội dung!");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedFile(null);
  };

  const handleCreateContent = () => {
    if (selectedFile && selectedFile.lines.length > 0) {
        onFileUpload(selectedFile.lines);
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col pt-4 overflow-y-auto pr-2 custom-scrollbar">
      
      {/* 1. Style Selection */}
      <div>
          <label className="block text-amber-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
          1. Chọn Phong cách Phim
          </label>
          <div className="flex flex-col gap-3">
              <button
              onClick={() => onStyleChange(FilmStyle.CINEMATIC)}
              disabled={isLoading}
              className={`
                  flex flex-row items-center justify-start gap-3 p-3 rounded-md border text-left transition-all duration-300
                  ${currentStyle === FilmStyle.CINEMATIC 
                  ? 'bg-amber-600/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-[#151515] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
              `}
              >
              <VideoCameraIcon className="w-5 h-5" />
              <div>
                  <span className="text-xs font-bold uppercase block">Điện ảnh</span>
                  <span className="text-[10px] text-gray-500 block font-normal">Cinematic, 8K</span>
              </div>
              </button>

              <button
              onClick={() => onStyleChange(FilmStyle.ANIMATION)}
              disabled={isLoading}
              className={`
                  flex flex-row items-center justify-start gap-3 p-3 rounded-md border text-left transition-all duration-300
                  ${currentStyle === FilmStyle.ANIMATION 
                  ? 'bg-amber-600/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-[#151515] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
              `}
              >
              <SparklesIcon className="w-5 h-5" />
              <div>
                  <span className="text-xs font-bold uppercase block">Hoạt hình</span>
                  <span className="text-[10px] text-gray-500 block font-normal">3D, Pixar Style</span>
              </div>
              </button>
          </div>
      </div>

      {/* 2. Dialogue Selection */}
      <div>
          <label className="block text-amber-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
          2. Chế độ Thoại
          </label>
          <div className="grid grid-cols-2 gap-2">
              <button
                  onClick={() => onDialogueChange(DialogueOption.NO_DIALOGUE)}
                  disabled={isLoading}
                  className={`
                      flex flex-row items-center justify-center gap-2 py-2 px-1 rounded-md border text-center transition-all duration-300
                      ${currentDialogue === DialogueOption.NO_DIALOGUE 
                      ? 'bg-amber-600/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                      : 'bg-[#151515] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
                  `}
              >
                  <SpeakerXMarkIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Không Thoại</span>
              </button>

              <button
                  onClick={() => onDialogueChange(DialogueOption.WITH_DIALOGUE)}
                  disabled={isLoading}
                  className={`
                      flex flex-row items-center justify-center gap-2 py-2 px-1 rounded-md border text-center transition-all duration-300
                      ${currentDialogue === DialogueOption.WITH_DIALOGUE
                      ? 'bg-amber-600/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                      : 'bg-[#151515] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
                  `}
              >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Có Thoại</span>
              </button>
          </div>
      </div>

      {/* 3. File Upload Section (Renumbered to 3) */}
      <div className="pt-6 border-t border-gray-900 mt-auto">
          <label className="block text-amber-500 text-[10px] font-bold mb-4 uppercase tracking-wider">
              3. Nhập Kịch Bản (File .txt)
          </label>
          <div 
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`
                  border border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group relative overflow-hidden
                  ${selectedFile 
                      ? 'border-amber-500 bg-amber-900/10' 
                      : 'border-gray-700 hover:bg-[#151515] hover:border-gray-500'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
          >
              {selectedFile ? (
                  <div className="text-center w-full z-10">
                       <DocumentTextIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                       <span className="text-xs font-bold text-gray-200 break-words line-clamp-2 px-2">
                          {selectedFile.name}
                       </span>
                       <span className="text-[9px] text-amber-500 mt-1 block">
                          {selectedFile.lines.length} cảnh đã tìm thấy
                       </span>
                       <button 
                          onClick={clearFile}
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors"
                          title="Xóa file"
                       >
                           <XCircleIcon className="w-5 h-5" />
                       </button>
                  </div>
              ) : (
                  <>
                      <DocumentTextIcon className="w-8 h-8 text-gray-600 group-hover:text-amber-500 transition-colors" />
                      <div className="text-center">
                          <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 block">Tải lên file .txt</span>
                          <span className="text-[9px] text-gray-600 block mt-1">Mỗi dòng là 1 cảnh</span>
                      </div>
                  </>
              )}
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt" 
                  onChange={handleFileChange}
                  disabled={isLoading}
              />
          </div>

          {/* GENERATE BUTTON */}
          <button
              onClick={handleCreateContent}
              disabled={!selectedFile || isLoading}
              className={`
                  w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded font-bold uppercase text-xs tracking-wider transition-all
                  ${selectedFile && !isLoading
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-900/20 transform hover:-translate-y-0.5' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
              `}
          >
              {isLoading ? (
                  <>
                     <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                     <span>Đang Xử Lý...</span>
                  </>
              ) : (
                  <>
                     <PlayCircleIcon className="w-5 h-5" />
                     <span>Tạo Nội Dung</span>
                  </>
              )}
          </button>
      </div>
    </div>
  );
};

export default InputSection;