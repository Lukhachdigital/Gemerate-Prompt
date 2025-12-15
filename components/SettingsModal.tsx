import React, { useState, useEffect } from 'react';
import { XMarkIcon, KeyIcon, LinkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setOpenaiKey(localStorage.getItem('OPENAI_API_KEY') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }

    if (openaiKey.trim()) {
      localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
    } else {
      localStorage.removeItem('OPENAI_API_KEY');
    }
    onClose();
    // No need to reload, App and Service check localStorage on demand
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-gray-800 rounded-lg w-full max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#0a0a0a]">
          <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 font-cinzel">
            <KeyIcon className="w-5 h-5" />
            Cấu hình API Key
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          <div className="bg-amber-900/10 border border-amber-900/30 p-3 rounded text-[11px] text-amber-500/80 mb-2 flex items-start gap-2">
               <ShieldCheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
               <span>Key của bạn được lưu an toàn trong trình duyệt (LocalStorage). Chúng không bao giờ được gửi đi đâu khác ngoài server của Google/OpenAI.</span>
          </div>

          {/* Gemini Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                 <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider">Google Gemini API Key <span className="text-red-500">*</span></label>
                 <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 hover:underline transition-colors"
                    >
                    <LinkIcon className="w-3 h-3" /> LẤY KEY MIỄN PHÍ
                </a>
            </div>
            <input 
              type="password" 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Nhập khóa AIzaSy..."
              className="w-full bg-[#050505] border border-gray-700 rounded p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors font-mono text-sm"
            />
            <p className="text-[10px] text-gray-600">Dùng để tạo kịch bản, phân tích hình ảnh (Miễn phí & Nhanh).</p>
          </div>

          {/* OpenAI Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                 <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider">OpenAI API Key <span className="text-gray-600">(Tùy chọn)</span></label>
                 <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 hover:underline transition-colors"
                    >
                    <LinkIcon className="w-3 h-3" /> LẤY KEY OPENAI
                </a>
            </div>
            <input 
              type="password" 
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="Nhập khóa sk-..."
              className="w-full bg-[#050505] border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors font-mono text-sm"
            />
             <p className="text-[10px] text-gray-600">Dùng cho các tính năng nâng cao trong tương lai (Dalle-3, Sora...).</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 bg-[#0a0a0a] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold uppercase text-gray-400 hover:text-white transition-colors"
          >
            Đóng
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-black font-bold uppercase rounded transition-all shadow-lg shadow-amber-900/20 active:scale-95"
          >
            Lưu & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;