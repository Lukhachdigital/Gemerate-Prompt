import React, { useState, useCallback, useEffect } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  ArrowDownTrayIcon, 
  MapIcon, 
  UserGroupIcon, 
  FilmIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  UserIcon,
  UserPlusIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { GeneratedContent, PromptItem, FilmStyle, DialogueOption, CharacterProfile } from '../types';
import { generateSingleScene } from '../services/geminiService';

interface ScriptOutputProps {
  content: GeneratedContent;
  style: FilmStyle;
  dialogueOption: DialogueOption;
  onUpdateScript: (newScript: PromptItem[]) => void;
  characters: CharacterProfile[];
  onUpdateCharacters: (chars: CharacterProfile[]) => void;
  disableCharacterManagement?: boolean; // New prop to disable UI
}

type Language = 'vi' | 'en';

// --- ISOLATED COMPONENT TO FIX INPUT LAG/IME ISSUES ---
const SceneInputForm = ({ 
  initialText = '', 
  placeholder, 
  submitLabel, 
  onCancel, 
  onSubmit, 
  isProcessing,
  autoFocus = true
}: { 
  initialText?: string, 
  placeholder: string, 
  submitLabel: string, 
  onCancel: () => void, 
  onSubmit: (text: string) => void, 
  isProcessing: boolean,
  autoFocus?: boolean
}) => {
  const [text, setText] = useState(initialText);

  return (
    <div className="relative z-50 animate-fade-in my-3 bg-[#121212] border border-amber-500/50 rounded-lg p-3 shadow-2xl">
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={`w-full h-28 bg-[#1e1e1e] text-gray-100 p-3 rounded border focus:outline-none text-sm mb-3 z-50 relative resize-none leading-relaxed
           ${isProcessing ? 'border-amber-500/50 opacity-70 cursor-not-allowed' : 'border-gray-700 focus:border-amber-500'}
        `}
        placeholder={placeholder}
        disabled={isProcessing}
        autoFocus={autoFocus && !isProcessing}
      />
      <div className="flex justify-end gap-2">
        {!isProcessing && (
          <button 
            onClick={(e) => { e.stopPropagation(); onCancel(); }} 
            className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white uppercase transition-colors" 
          >
            Hủy
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onSubmit(text); }}
          disabled={isProcessing || !text.trim()}
          className={`px-4 py-1.5 rounded flex items-center gap-2 transition-transform text-xs font-bold uppercase
             ${isProcessing 
               ? 'bg-amber-900/50 text-amber-200 cursor-wait' 
               : 'bg-amber-600 hover:bg-amber-500 text-black active:scale-95'}
          `}
        >
          {isProcessing ? (
            <>
               <ArrowPathIcon className="w-3 h-3 animate-spin" />
               <span>Đang viết...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  );
};

// --- CHARACTER CARD WITH EDIT/CONFIRM MODE ---
const CharacterCard = React.memo(({ 
  char, 
  onUpdate,
  onRemove, 
  isNew = false
}: { 
  char: CharacterProfile;
  onUpdate: (id: string, name: string, image: string | null) => void;
  onRemove: (id: string) => void;
  isNew?: boolean;
}) => {
  // If it's a new character (empty name), start in editing mode
  const [isEditing, setIsEditing] = useState(isNew || !char.name);
  
  // Local state for editing to prevent re-renders and allow confirmation
  const [draftName, setDraftName] = useState(char.name);
  const [draftImage, setDraftImage] = useState<string | null>(char.image);

  // Sync props to state if props change externally (rare in this flow but good practice)
  useEffect(() => {
    if (!isEditing) {
        setDraftName(char.name);
        setDraftImage(char.image);
    }
  }, [char, isEditing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         setDraftImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
      if (!draftName.trim()) {
          alert("Vui lòng nhập tên nhân vật!");
          return;
      }
      onUpdate(char.id, draftName, draftImage);
      setIsEditing(false);
  };

  const handleCancel = () => {
      if (isNew && !char.name) {
          onRemove(char.id); // Cancel creation of new char
      } else {
          // Revert changes
          setDraftName(char.name);
          setDraftImage(char.image);
          setIsEditing(false);
      }
  };

  // --- EDIT MODE ---
  if (isEditing) {
      return (
        <div className="shrink-0 w-48 bg-[#1a1a1a] border border-amber-500/50 rounded-lg p-3 flex flex-col gap-3 relative shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <div className="text-[10px] text-amber-500 font-bold uppercase text-center mb-1">
                {isNew ? 'Thêm Nhân Vật Mới' : 'Chỉnh Sửa'}
            </div>

            {/* Image Upload */}
            <div 
                className="w-full aspect-square bg-black border-2 border-dashed border-gray-700 hover:border-amber-500 rounded flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group/img transition-colors"
                onClick={() => document.getElementById(`file-${char.id}`)?.click()}
            >
                {draftImage ? (
                    <img src={draftImage} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" />
                ) : (
                    <>
                        <PhotoIcon className="w-8 h-8 text-gray-500 mb-1" />
                        <span className="text-[9px] text-gray-500 uppercase">Chọn Ảnh</span>
                    </>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <PencilSquareIcon className="w-6 h-6 text-white" />
                </div>
                <input 
                    type="file" 
                    id={`file-${char.id}`} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            {/* Name Input */}
            <input 
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Nhập tên nhân vật..."
                className="bg-black border border-gray-700 rounded px-2 py-2 text-xs text-white focus:border-amber-500 focus:outline-none w-full text-center font-bold"
                autoFocus
            />

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                <button 
                    onClick={handleCancel}
                    className="flex-1 py-1.5 rounded border border-gray-700 hover:bg-gray-800 text-gray-400 text-xs font-bold uppercase transition-colors"
                >
                    Hủy
                </button>
                <button 
                    onClick={handleConfirm}
                    className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1"
                >
                    <CheckIcon className="w-3 h-3" /> Lưu
                </button>
            </div>
        </div>
      );
  }

  // --- VIEW MODE ---
  return (
     <div className="shrink-0 w-48 bg-[#151515] border border-gray-800 rounded-lg p-3 flex flex-col gap-2 relative group hover:border-gray-600 transition-colors">
       {/* Image Display */}
       <div className="w-full aspect-square bg-black border border-gray-800 rounded overflow-hidden relative">
          {char.image ? (
            <img src={char.image} alt="Char" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-700">
                <UserIcon className="w-10 h-10" />
                <span className="text-[9px] uppercase mt-1">No Image</span>
            </div>
          )}
          {/* Edit Overlay */}
          <button 
             onClick={() => setIsEditing(true)}
             className="absolute top-2 right-2 bg-black/60 hover:bg-amber-600 hover:text-black text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
             title="Chỉnh sửa"
          >
             <PencilSquareIcon className="w-4 h-4" />
          </button>
       </div>

       {/* Name Display */}
       <div className="text-center py-1">
          <div className="text-sm font-bold text-gray-200 truncate px-1" title={char.name}>
             {char.name}
          </div>
       </div>

       {/* Delete Button */}
       <button 
          onClick={() => onRemove(char.id)}
          className="absolute -top-2 -right-2 bg-gray-900 border border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
          title="Xóa nhân vật"
       >
          <XMarkIcon className="w-4 h-4" />
       </button>
    </div>
  );
}, (prev, next) => {
    // Optimization: Only re-render if data changes
    return prev.char.name === next.char.name && prev.char.image === next.char.image;
});

const ScriptOutput: React.FC<ScriptOutputProps> = ({ 
    content, 
    style, 
    dialogueOption, 
    onUpdateScript,
    characters,
    onUpdateCharacters,
    disableCharacterManagement = false
}) => {
  const [activeLang, setActiveLang] = useState<Language>('vi');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  
  // State for Editing/Regenerating Logic
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessingItem, setIsProcessingItem] = useState<boolean>(false);

  // State for Adding Logic
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null); // Index to insert AFTER

  // --- CHARACTER MANAGERS ---
  const handleAddCharacter = () => {
    const newChar: CharacterProfile = {
      id: `${Date.now()}`,
      name: '', // Empty name triggers edit mode
      image: null
    };
    onUpdateCharacters([...characters, newChar]);
  };

  const handleRemoveCharacter = useCallback((id: string) => {
    (onUpdateCharacters as any)((prev: CharacterProfile[]) => prev.filter(c => c.id !== id));
  }, [onUpdateCharacters]);

  const handleUpdateCharacter = useCallback((id: string, name: string, image: string | null) => {
    (onUpdateCharacters as any)((prev: CharacterProfile[]) => 
        prev.map(c => c.id === id ? { ...c, name, image } : c)
    );
  }, [onUpdateCharacters]);


  // Helper to copy single item and update state
  const handleCopyOne = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIds(prev => new Set(prev).add(id));
  };

  // Helper to copy all in a category
  const handleCopyAll = (items: PromptItem[], lang: Language) => {
    const text = items.map(item => item[lang]).join('\n\n');
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép toàn bộ (${lang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})!`);
  };

  // --- REGENERATE / EDIT LOGIC ---
  const startEdit = (index: number) => {
    if (isProcessingItem) return;
    setEditingIndex(index);
    setAddingAtIndex(null);
  };

  const handleRegenerateScene = async (instruction: string, index: number) => {
    if (!instruction.trim()) return;
    setIsProcessingItem(true);
    try {
        // Pass current characters to service
        const newItem = await generateSingleScene(instruction, style, dialogueOption, content, characters);
        const newScript = [...content.script];
        newScript[index] = newItem;
        onUpdateScript(newScript);
        setEditingIndex(null);
    } catch (error) {
        alert("Lỗi khi tạo lại cảnh. Vui lòng thử lại.");
        console.error(error);
    } finally {
        setIsProcessingItem(false);
    }
  };

  // --- ADD SCENE LOGIC ---
  const startAdd = (index: number) => {
      if (isProcessingItem) return;
      setAddingAtIndex(index); 
      setEditingIndex(null);
  };

  const handleAddScene = async (instruction: string, indexToInsertAfter: number) => {
      if (!instruction.trim()) return;
      setIsProcessingItem(true);
      try {
          // Pass current characters to service
          const newItem = await generateSingleScene(instruction, style, dialogueOption, content, characters);
          const newScript = [...content.script];
          // Insert at index + 1
          newScript.splice(indexToInsertAfter + 1, 0, newItem);
          onUpdateScript(newScript);
          setAddingAtIndex(null);
      } catch (error) {
          alert("Lỗi khi thêm cảnh mới.");
          console.error(error);
      } finally {
          setIsProcessingItem(false);
      }
    };

  const handleDownloadScriptOnly = () => {
    if (content.script.length === 0) return;
    const scriptText = content.script
        .map((item, index) => `Scene ${index + 1}: ${item[activeLang]}`) 
        .join('\n\n'); 

    let safeTitle = content.title.vi
      .replace(/[^a-zA-Z0-9\u00C0-\u1EF9\s]/g, '') 
      .trim();
      
    if (safeTitle.length > 100) {
      safeTitle = safeTitle.substring(0, 100).trim();
    }
    if (!safeTitle) safeTitle = "CineScript_Output";

    const element = document.createElement("a");
    const file = new Blob([scriptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${safeTitle}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const PromptSection = ({ 
    title, 
    icon: Icon, 
    items, 
    idPrefix,
    colorClass,
    borderColor,
    isScript = false
  }: { 
    title: string, 
    icon: any, 
    items: PromptItem[], 
    idPrefix: string,
    colorClass: string,
    borderColor: string,
    isScript?: boolean
  }) => {
    
    // If not script and empty, don't show. If Script and empty, we MUST show to allow adding Scene 1.
    if (!isScript && (!items || items.length === 0)) return null;

    const isCharacterSection = idPrefix === 'char';

    return (
      <div className="mb-10 w-full">
        <div className={`flex items-center gap-3 mb-6 pb-3 border-b ${borderColor}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
          <h2 className={`text-xl font-bold uppercase tracking-wider ${colorClass}`}>{title}</h2>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">
            {items ? items.length : 0} Prompt
          </span>
          
          {items && items.length > 0 && (
            <button
                onClick={() => handleCopyAll(items, activeLang)}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#222] hover:bg-[#333] border border-gray-700 hover:border-gray-500 rounded-md transition-all group shadow-sm"
                title="Sao chép toàn bộ prompt trong phần này"
            >
                <DocumentDuplicateIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <span className="text-xs font-bold uppercase text-gray-300 group-hover:text-white">Copy All</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
           {/* SPECIAL STATE: EMPTY SCRIPT -> SHOW INPUT FORM FOR SCENE 1 DIRECTLY */}
           {isScript && items.length === 0 && (
                <div className="w-full">
                    <div className="mb-2">
                         <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/40 border border-gray-700/50 ${colorClass}`}>
                            SCENE 1 (NEW)
                         </span>
                    </div>
                    <SceneInputForm 
                        placeholder="Nhập gợi ý cho Cảnh 1 (Ví dụ: Một chiến binh samurai đơn độc đi trong bão tuyết...)"
                        submitLabel="Tạo Prompt Đầu Tiên"
                        onCancel={() => {}} // Cannot cancel the first scene creation easily in this mode, or it just stays empty
                        onSubmit={(text) => handleAddScene(text, -1)}
                        isProcessing={isProcessingItem}
                        autoFocus={true}
                    />
                </div>
           )}

           {/* NORMAL STATE: ADD BUTTON AT START (Only if list not empty) */}
           {isScript && items.length > 0 && (
               <div className="relative group/divider py-2 flex flex-col items-center justify-center z-10">
                    <button 
                        onClick={() => startAdd(-1)}
                        disabled={isProcessingItem}
                        className={`opacity-0 group-hover/divider:opacity-100 flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded-full text-xs text-gray-300 hover:bg-amber-900/40 hover:text-amber-500 hover:border-amber-500 transition-all z-10 mb-2
                            ${isProcessingItem ? 'cursor-not-allowed opacity-50' : ''}
                        `}
                    >
                        <PlusCircleIcon className="w-4 h-4" /> Thêm cảnh đầu tiên
                    </button>
                    {addingAtIndex === -1 && (
                       <div className="w-full">
                           <SceneInputForm 
                              placeholder="Mô tả ý tưởng cho cảnh mới này..."
                              submitLabel="Tạo Prompt Mới"
                              onCancel={() => setAddingAtIndex(null)}
                              onSubmit={(text) => handleAddScene(text, -1)}
                              isProcessing={isProcessingItem}
                           />
                       </div>
                    )}
               </div>
           )}

          {items.map((item, idx) => {
            const uniqueId = `${idPrefix}-${idx}`;
            const text = item[activeLang];
            const isCopied = copiedIds.has(uniqueId);
            
            // Determine Label
            let label = `#${idx + 1}`;
            if (idPrefix === 'scene') label = `SCENE ${idx + 1}`;
            else if (idPrefix === 'char') label = `CHARACTER ${idx + 1}`;
            else if (idPrefix === 'ctx') label = `CONTEXT ${idx + 1}`;

            const isEditing = editingIndex === idx;

            // Character Splitting Logic
            let charName = '';
            let charDesc = text;
            if (isCharacterSection) {
                // Try split by Colon first (most common)
                // Also support hyphen "Name - Description"
                // Match the first occurrence of : or - followed by any char
                const match = text.match(/^([^:-]+)([:-])(.*)$/s);
                
                if (match && match.length >= 4) {
                    charName = match[1].trim();
                    charDesc = match[3].trim(); 
                } else {
                    // Fallback: Guess first 2 words if no delimiter found
                    const words = text.split(' ');
                    if (words.length > 1) {
                         charName = words.slice(0, 2).join(' ').replace(/:/g, '');
                         charDesc = words.slice(2).join(' ');
                    } else {
                         charName = text.replace(/:/g, '').trim();
                         charDesc = "";
                    }
                }
            }

            return (
              <React.Fragment key={idx}>
              <div className={`flex flex-col md:flex-row gap-4 p-5 bg-[#1a1a1a] border rounded-lg transition-colors group w-full relative ${isEditing ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-gray-800 hover:border-gray-600'}`}>
                {/* The Prompt Text or Edit Form */}
                <div className="flex-1 min-w-0">
                   <div className="mb-2 flex items-center justify-between">
                     <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/40 border border-gray-700/50 ${colorClass}`}>
                        {label}
                     </span>
                     {/* Edit Button (Only for script) */}
                     {isScript && !isEditing && (
                         <button 
                            onClick={() => startEdit(idx)}
                            disabled={isProcessingItem}
                            className={`flex items-center gap-1 text-gray-600 hover:text-amber-500 transition-colors px-2 ${isProcessingItem ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Sửa cảnh này"
                         >
                             <PencilSquareIcon className="w-4 h-4" />
                             <span className="text-[10px] uppercase font-bold">Sửa</span>
                         </button>
                     )}
                   </div>

                   {isEditing ? (
                       <SceneInputForm 
                          initialText="" 
                          placeholder={`Nhập gợi ý để viết lại cảnh ${idx + 1}...`}
                          submitLabel="Viết Lại Prompt"
                          onCancel={() => setEditingIndex(null)}
                          onSubmit={(text) => handleRegenerateScene(text, idx)}
                          isProcessing={isProcessingItem}
                       />
                   ) : (
                       <div>
                            {/* Special Layout for Character: Name on top, description below */}
                            {isCharacterSection && charName ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="text-amber-500 font-bold text-lg bg-amber-900/10 px-3 py-1 rounded border border-amber-900/30">
                                            {charName}
                                        </div>
                                        {/* Copy Name Only Button */}
                                        <button 
                                            onClick={() => handleCopyOne(charName, uniqueId + '-name')}
                                            className="text-[10px] font-bold uppercase bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 flex items-center gap-1 transition-colors"
                                            title="Chỉ sao chép tên nhân vật"
                                        >
                                            {copiedIds.has(uniqueId + '-name') ? <CheckIcon className="w-3 h-3 text-green-500" /> : <UserIcon className="w-3 h-3" />}
                                            Copy Name
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-800 pl-3">
                                        {charDesc || text}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap font-medium break-words">
                                    {text}
                                </p>
                            )}
                       </div>
                   )}
                </div>

                {/* The Main Copy Button (Copy Full Prompt) */}
                {!isEditing && (
                    <button
                    onClick={() => {
                        // CUSTOM COPY LOGIC FOR CHARACTERS: Combine Name + Description naturally
                        const textToCopy = (isCharacterSection && charName) 
                           ? `${charName}, ${charDesc}` 
                           : text;
                        handleCopyOne(textToCopy, uniqueId);
                    }}
                    className={`
                        shrink-0 w-full md:w-36 flex flex-row md:flex-col items-center justify-center gap-2 px-6 py-3 md:px-2 md:py-2 rounded-md border transition-all select-none
                        ${isCopied 
                            ? 'bg-green-900/20 border-green-600/50 text-green-500' 
                            : 'bg-black border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-900'}
                    `}
                    >
                    {isCopied ? (
                        <>
                        <CheckIcon className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase">Đã Chép</span>
                        </>
                    ) : (
                        <>
                        <ClipboardDocumentCheckIcon className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase">
                            {isCharacterSection ? 'Copy Prompt' : 'Sao Chép'}
                        </span>
                        </>
                    )}
                    </button>
                )}
              </div>
              
              {/* Insert Button Between Scenes */}
              {isScript && (
                   <div className="relative group/divider py-2 flex flex-col items-center justify-center z-10">
                       {/* The Plus Button */}
                       <button 
                            onClick={() => startAdd(idx)}
                            disabled={isProcessingItem}
                            className={`opacity-0 group-hover/divider:opacity-100 flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded-full text-xs text-gray-300 hover:bg-amber-900/40 hover:text-amber-500 hover:border-amber-500 transition-all z-10 transform hover:scale-105 mb-2
                                ${isProcessingItem ? 'cursor-not-allowed opacity-50' : ''}
                            `}
                        >
                            <PlusCircleIcon className="w-4 h-4" /> Thêm cảnh
                        </button>
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-800 -z-0 opacity-0 group-hover/divider:opacity-50 transition-opacity"></div>

                        {/* Add Input Form */}
                        {addingAtIndex === idx && (
                            <div className="w-full relative z-50">
                                <SceneInputForm 
                                    placeholder={`Mô tả ý tưởng cho cảnh mới (sẽ chèn vào sau cảnh ${idx + 1})...`}
                                    submitLabel="Tạo Prompt Mới"
                                    onCancel={() => setAddingAtIndex(null)}
                                    onSubmit={(text) => handleAddScene(text, idx)}
                                    isProcessing={isProcessingItem}
                                />
                            </div>
                        )}
                   </div>
              )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-20 animate-fade-in">
      
      {/* Top Controls: Language & Download */}
      <div className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur py-4 mb-8 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Language Tabs */}
        <div className="flex bg-black p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveLang('vi')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
              activeLang === 'vi' 
                ? 'bg-amber-600 text-black shadow' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            VIETNAMESE
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
              activeLang === 'en' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            ENGLISH
          </button>
        </div>

        {/* Script Download Button */}
        <button
          onClick={handleDownloadScriptOnly}
          disabled={content.script.length === 0}
          className={`flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 text-sm font-bold uppercase tracking-wide transition-colors shadow-lg ${content.script.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Chỉ tải về danh sách prompt kịch bản"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Tải Prompt Kịch Bản
        </button>
      </div>

      {/* NEW: VISUAL REFERENCE / CHARACTER MANAGEMENT SECTION */}
      <div className={`mb-10 w-full bg-[#111] p-5 rounded-lg border border-gray-800 relative transition-opacity ${disableCharacterManagement ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          {disableCharacterManagement && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                  <span className="bg-black/80 text-amber-500 px-3 py-1 rounded text-xs font-bold uppercase border border-amber-900">
                      Tính năng bị vô hiệu hóa trong chế độ File
                  </span>
              </div>
          )}
          <div className="flex items-center gap-3 mb-4">
              <UserPlusIcon className="w-6 h-6 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                  Visual References & Characters
              </h2>
          </div>
          <p className="text-[10px] text-gray-500 mb-4 italic">
             *Thêm nhân vật tại đây để AI nhận diện khuôn mặt và trang phục khi bạn tạo cảnh mới hoặc tạo từ file.
             <br/>
             <span className="text-amber-500 font-bold">Lưu ý:</span> Tên nhân vật nhập tại đây phải trùng với tên trong kịch bản (VD: Tấm, Cám) để AI tự động thay thế.
          </p>

          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
              
              {/* Character List */}
              {characters.map((char) => (
                  <CharacterCard 
                      key={char.id}
                      char={char}
                      onUpdate={handleUpdateCharacter}
                      onRemove={handleRemoveCharacter}
                      isNew={!char.name && !char.image}
                  />
              ))}

              {/* Add Button (Moved to End) */}
              <button 
                  onClick={handleAddCharacter}
                  className="shrink-0 w-32 h-40 border border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-amber-500 hover:border-amber-500 hover:bg-amber-900/10 transition-all"
              >
                  <PlusCircleIcon className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase">Thêm NV</span>
              </button>
          </div>
      </div>

      {/* Generated Title Display with Copy Button */}
      {content.title && content.script.length > 0 && (
        <div className="mb-10 text-center relative group">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-500 tracking-wider font-cinzel mb-2 uppercase drop-shadow-md inline-block relative">
            {content.title[activeLang]}
             <button 
                onClick={() => handleCopyOne(content.title[activeLang], 'title-main')}
                className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-white"
                title="Sao chép tiêu đề"
             >
                {copiedIds.has('title-main') ? (
                    <CheckIcon className="w-6 h-6 text-green-500" />
                ) : (
                    <ClipboardDocumentCheckIcon className="w-6 h-6" />
                )}
             </button>
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-700 to-transparent mx-auto rounded-full mt-2"></div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-12 w-full">
        
        {/* Context */}
        <PromptSection 
            title="Bối Cảnh (Set Design)" 
            icon={MapIcon} 
            items={content.context} 
            idPrefix="ctx"
            colorClass="text-blue-400"
            borderColor="border-blue-900/30"
        />

        {/* AI Generated Characters Descriptions (Read Only) */}
        <PromptSection 
            title="Mô Tả Nhân Vật (AI Generated Prompts)" 
            icon={UserGroupIcon} 
            items={content.characters} 
            idPrefix="char"
            colorClass="text-green-400"
            borderColor="border-green-900/30"
        />

        {/* Script */}
        <PromptSection 
            title="Kịch Bản Phân Cảnh (Storyboard Prompts)" 
            icon={FilmIcon} 
            items={content.script} 
            idPrefix="scene"
            colorClass="text-amber-500"
            borderColor="border-amber-900/30"
            isScript={true}
        />
      </div>
    </div>
  );
};

export default ScriptOutput;