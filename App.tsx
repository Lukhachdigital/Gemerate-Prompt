import React, { useState } from 'react';
import Header from './components/Header.tsx';
import InputSection from './components/InputSection.tsx';
import ScriptOutput from './components/ScriptOutput.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import { GeneratedContent, FilmStyle, PromptItem, DialogueOption, CharacterProfile } from './types.ts';
import { generateScriptFromList } from './services/geminiService.ts';

const App: React.FC = () => {
  // Initialize with an empty "New Project" state so the UI shows the Result area immediately
  const [content, setContent] = useState<GeneratedContent>({
    title: { vi: "Dự Án Mới", en: "New Project" },
    context: [],
    characters: [],
    script: [] // Empty script triggers the "Empty Scene 1" input in ScriptOutput
  });
  
  const [currentStyle, setCurrentStyle] = useState<FilmStyle>(FilmStyle.CINEMATIC);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueOption>(DialogueOption.NO_DIALOGUE);
  // NEW: State for Characters
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  
  // Track if current content came from a file
  const [isGeneratedFromFile, setIsGeneratedFromFile] = useState<boolean>(false);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle generating script from file lines (called when user clicks "Tạo Nội Dung")
  const handleGenerateFromLines = async (lines: string[]) => {
    setIsLoading(true);
    setError(null);
    setIsGeneratedFromFile(true); // Disable character management for file-based scripts

    try {
        // Pass characters to the service
        const result = await generateScriptFromList(lines, currentStyle, currentDialogue, characters);
        setContent(result);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi khi xử lý file. Vui lòng kiểm tra API Key trong Cài đặt.");
    } finally {
        setIsLoading(false);
    }
  };

  // Callback to allow ScriptOutput to modify the script (Add/Edit scenes)
  const handleUpdateScript = (newScript: PromptItem[]) => {
      setContent({
          ...content,
          script: newScript
      });
  };

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 selection:bg-amber-500 selection:text-black overflow-hidden font-sans">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Style & File Upload */}
        <aside className="w-[280px] flex-shrink-0 bg-[#0a0a0a] border-r border-gray-800 overflow-hidden z-10 shadow-xl flex flex-col">
          <div className="p-5 flex-1 flex flex-col h-full overflow-hidden">
             <div className="flex-1 min-h-0">
               <InputSection 
                  currentStyle={currentStyle} 
                  onStyleChange={setCurrentStyle}
                  currentDialogue={currentDialogue}
                  onDialogueChange={setCurrentDialogue}
                  isLoading={isLoading}
                  onFileUpload={handleGenerateFromLines}
               />
             </div>
          </div>
        </aside>

        {/* Right Panel - Always Result Area */}
        <main className="flex-1 bg-[#0f0f0f] overflow-y-auto custom-scrollbar relative flex flex-col">
          <div className="p-6 w-full min-h-full flex flex-col">
            
            {/* Error Message */}
            {error && (
              <div className="w-full p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-center mb-6 animate-pulse">
                {error}
              </div>
            )}

            {/* Loading State Overlay (Global) */}
            {isLoading && (
               <div className="absolute inset-0 bg-[#0f0f0f]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-amber-500 tracking-[0.2em] animate-pulse mb-2">ĐANG XỬ LÝ KỊCH BẢN</h3>
                  <p className="text-sm text-gray-500">AI đang phân tích trang phục và bối cảnh...</p>
               </div>
            )}

            {/* Always Render ScriptOutput */}
            <div className="animate-fade-in w-full">
                <ScriptOutput 
                    content={content} 
                    style={currentStyle}
                    dialogueOption={currentDialogue}
                    onUpdateScript={handleUpdateScript} 
                    characters={characters}
                    onUpdateCharacters={setCharacters}
                    disableCharacterManagement={isGeneratedFromFile}
                />
            </div>
            
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default App;