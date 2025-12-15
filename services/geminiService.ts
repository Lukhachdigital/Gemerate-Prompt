import { GoogleGenAI, Type } from "@google/genai";
import { ScriptRequest, GeneratedContent, PromptItem, FilmStyle, DialogueOption, CharacterProfile } from "../types";

// --- HELPER FOR IMAGE CONVERSION ---
const base64ToPart = (base64String: string) => {
    // Expected format: "data:image/png;base64,..."
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
        throw new Error("Invalid base64 image format");
    }
    return {
        inlineData: {
            mimeType: matches[1],
            data: matches[2]
        }
    };
};

// --- HELPER: PREPARE CHARACTER IMAGES & INSTRUCTIONS ---
const prepareCharacterData = (characters: CharacterProfile[]) => {
    const imageParts: any[] = [];
    let imageInstructions = "";
    const activeChars = characters.filter(c => c.name.trim() !== "");

    // Filter characters that actually have images
    const charsWithImages = activeChars.filter(c => c.image);
    const hasImages = charsWithImages.length > 0;
    
    if (activeChars.length > 0) {
        if (hasImages) {
            charsWithImages.forEach((char, index) => {
                if (char.image) {
                    try {
                        imageParts.push(base64ToPart(char.image));
                        imageInstructions += `   - REFERENCE IMAGE #${index + 1} IS CHARACTER: "${char.name}"\n`;
                    } catch (e) {
                        console.error("Error processing image for char", char.name, e);
                    }
                }
            });
        }
        
        // Construct the strict override instruction
        const charNamesList = activeChars.map(c => `"${c.name}"`).join(", ");

        imageInstructions = `
    DỮ LIỆU NHÂN VẬT NGƯỜI DÙNG CUNG CẤP (USER DEFINED CHARACTERS):
    Danh sách nhân vật: ${charNamesList}.
    ${hasImages ? `Tôi đã đính kèm ảnh tham chiếu cho các nhân vật trên.` : 'Người dùng KHÔNG tải lên ảnh tham chiếu nào.'}
    `;
    }

    return { imageParts, imageInstructions, hasImages };
};

// --- STYLE INSTRUCTIONS HELPER ---
const getStyleInstructions = (style: FilmStyle) => {
    if (style === FilmStyle.CINEMATIC) {
        return `
    YÊU CẦU VỀ PHONG CÁCH ĐIỆN ẢNH (NATURAL & CLEAN CINEMATIC LOOK):
    
    1. HÌNH ẢNH SẠCH & SẮC NÉT (CLEAN IMAGE - NO GRAIN):
       - TUYỆT ĐỐI KHÔNG DÙNG các từ khóa: "film grain", "grain", "noise", "bụi phim", "vhs effect", "gritty texture".
       - Yêu cầu hình ảnh kỹ thuật số hiện đại, trong trẻo, sắc nét (Crystal clear, Sharp focus, 8k Resolution).
       - Không thêm hiệu ứng giả cổ làm mờ chi tiết.

    2. MÔ TẢ TỰ NHIÊN (NATURAL NARRATIVE DESCRIPTION):
       - KHÔNG LIỆT KÊ TỪ KHÓA KỸ THUẬT (No Tag stacking).
       - Hãy lồng ghép tính chất điện ảnh vào câu mô tả một cách mượt mà.
       - Ví dụ ĐÚNG: "Ánh sáng chiều tà xuyên qua lớp sương mỏng, tạo nên những vệt nắng dài vàng óng trên mặt đất ẩm ướt."
       - Ví dụ SAI: "Cinematic lighting, volumetric fog, golden hour, wet ground, realistic."
       - Tập trung vào: Ánh sáng (Lighting), Bầu không khí (Atmosphere) và Cảm xúc (Mood) thông qua ngôn ngữ miêu tả.
    `;
    }
    return `
    YÊU CẦU VỀ PHONG CÁCH HOẠT HÌNH:
    - Tạo hình ảnh 3D chất lượng cao, phong cách Pixar/Disney.
    - Ánh sáng rực rỡ, chi tiết cách điệu nhưng sắc nét.
    `;
};

// --- SHARED PROMPT RULES ---
const getStrictRules = (dialogueOption: DialogueOption) => `
    NGUYÊN TẮC "TOÀN VẸN TUYỆT ĐỐI" (ABSOLUTE COMPLETENESS - NO OMISSION):
       - TRONG MỖI PROMPT, BẠN PHẢI MÔ TẢ LẠI TẤT CẢ MỌI THỨ TỪ ĐẦU.
       - KHÔNG ĐƯỢC ngầm hiểu. KHÔNG ĐƯỢC viết "vẫn mặc bộ đồ cũ".
       - PHẢI VIẾT RÕ: "Cô ấy mặc chiếc váy lụa màu đỏ thẫm với họa tiết rồng vàng, đeo vòng cổ ngọc trai..." ở CẢNH 1.
       - VÀ VIẾT LẠI Y HỆT: "Cô ấy (mặc chiếc váy lụa màu đỏ thẫm với họa tiết rồng vàng...) đang chạy..." ở CẢNH 2.

    QUY TẮC ĐẶT TÊN VÀ MÔ TẢ NHÂN VẬT (NO FACE DESCRIPTION):
       - TUYỆT ĐỐI KHÔNG MÔ TẢ KHUÔN MẶT. Không được viết về mắt, mũi, miệng.
       - CHỈ VIẾT TÊN NHÂN VẬT + MÔ TẢ TRANG PHỤC CHI TIẾT.
       - CẤM TUYỆT ĐỐI (FORBIDDEN PHRASES): "Face ID của [Tên]", "Reference Image [Tên]", "Nhân vật [Tên] từ ảnh".
       - ĐÚNG: "Tấm (mặc áo tứ thân màu nâu sờn, váy đụp đen) đang đứng..."

    TỪ KHÓA CẦM (NEGATIVE PROMPT):
       - Cấm: "film grain", "grain", "noise", "blur", "distorted".

    ÂM THANH & TIẾNG ĐỘNG (SFX):
       - Luôn kèm theo mô tả âm thanh chi tiết ở cuối prompt.
    
    MÔ TẢ DANH SÁCH NHÂN VẬT (CHARACTER PROFILES):
       - BẮT BUỘC FORMAT: "Tên Nhân Vật: Mô tả chi tiết toàn thân, quần áo... (KHÔNG MÔ TẢ MẶT)".
       - BẮT BUỘC GÓC MÁY: Full Body Shot (Toàn thân).
       - Bối cảnh: Trên nền trắng (Isolated on white background).

    QUY TẮC VỀ THOẠI:
       ${dialogueOption === DialogueOption.NO_DIALOGUE 
         ? '- NO DIALOGUE. Thêm từ khóa: "cinematic silence".' 
         : '- WITH DIALOGUE. Nhân vật đang giao tiếp.'}

    CẤU TRÚC BẮT BUỘC CHO MỖI PROMPT:
       [Mô tả tự nhiên về nhân vật và hành động + Trang phục chi tiết] + [Mô tả bối cảnh và ánh sáng theo phong cách điện ảnh] + [Góc máy] + [Âm thanh].
`;

// --- GEMINI IMPLEMENTATION (MULTIMODAL) ---
const callGemini = async (contentsParts: any[], responseSchema: any): Promise<any> => {
    // Guideline: API key must be obtained exclusively from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // gemini-2.5-flash is multimodal.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: contentsParts }],
        config: {
            temperature: 0.9,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    return JSON.parse(response.text || "{}");
};

// --- BATCH GENERATE FUNCTION ---
export const generateScriptFromList = async (
    lines: string[], 
    style: FilmStyle, 
    dialogueOption: DialogueOption,
    characters: CharacterProfile[] = []
): Promise<GeneratedContent> => {

    // 1. Prepare Image Parts (Multimodal)
    const { imageParts, imageInstructions, hasImages } = prepareCharacterData(characters);

    // Cinematic does NOT need forced keywords anymore, relying on natural description instructions.
    const styleKeywords = style === FilmStyle.CINEMATIC 
        ? "" 
        : `${style}, 3d render, pixar style, disney style, vivid colors, 8k, masterpiece`;

    // 2. Prepare Text Prompt
    const promptText = `
    Bạn là chuyên gia viết Prompt Video AI (Hollywood Screenwriter).
    
    INPUT - DANH SÁCH CẢNH:
    ${lines.map((line, i) => `[Cảnh ${i + 1}]: ${line}`).join('\n')}

    PHONG CÁCH: ${style}
    CHẾ ĐỘ THOẠI: ${dialogueOption === DialogueOption.NO_DIALOGUE ? 'KHÔNG THOẠI' : 'CÓ THOẠI'}

    ${imageInstructions}
    
    ${getStyleInstructions(style)}

    YÊU CẦU QUAN TRỌNG NHẤT (THE MOST IMPORTANT RULES):
    1. XỬ LÝ NHÂN VẬT:
       - KHÔNG MÔ TẢ KHUÔN MẶT (NO FACE DESCRIPTION).
       - Chỉ sử dụng TÊN NHÂN VẬT (để AI video tự xử lý LoRA/FaceID sau này).
       - OUTFIT: Tự thiết kế trang phục chi tiết hoặc dựa trên ảnh tham chiếu (chỉ lấy quần áo, không lấy mặt).
       
    2. CẤM TỪ KHÓA THỪA (NO META-REFERENCES):
       - KHÔNG ĐƯỢC viết: "Face ID của", "Ảnh tham chiếu", "Giống như ảnh".
       - Hãy viết tự nhiên: "Batman đang đứng trên mái nhà" (KHÔNG viết "Face ID của Batman đang đứng...").

    3. NO FILM GRAIN:
       - Đảm bảo prompt KHÔNG chứa từ "film grain" hay "noise". Ảnh phải sạch.

    ${getStrictRules(dialogueOption)}

    ${styleKeywords ? `STYLE KEYWORDS: "${styleKeywords}..."` : ''}

    TRẢ VỀ JSON:
    {
       "title": { "vi": "...", "en": "..." },
       "context": [ { "vi": "...", "en": "..." } ],
       "characters": [ { "vi": "Tên Nhân Vật: Mô tả toàn thân, quần áo (KHÔNG MÔ TẢ MẶT)...", "en": "Character Name: Detailed full body outfit (NO FACE DESCRIPTION)..." } ],
       "script": [ 
          { "vi": "Prompt chi tiết cảnh 1...", "en": "Detailed prompt scene 1..." },
          ...
       ]
    }
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] },
            context: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
            characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
            script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
        },
        required: ["title", "context", "characters", "script"],
    };

    try {
        const fullParts = [
            { text: promptText },
            ...imageParts
        ];
        
        return await callGemini(fullParts, responseSchema) as GeneratedContent;
    } catch (geminiError) {
        console.error("Gemini List Failed:", geminiError);
        throw geminiError;
    }
};

// --- SINGLE SCENE GENERATION ---
export const generateSingleScene = async (
    instruction: string, 
    style: FilmStyle, 
    dialogueOption: DialogueOption,
    contextData?: GeneratedContent,
    characters: CharacterProfile[] = []
): Promise<PromptItem> => {
    
    const { imageParts, imageInstructions, hasImages } = prepareCharacterData(characters);

    let contextPrompt = "";
    if (contextData) {
        const charDescriptions = contextData.characters.map(c => `- ${c.vi}`).join("\n");
        const contexts = contextData.context.map(c => `- ${c.vi}`).join("\n");
        contextPrompt = `
        THÔNG TIN NHẤT QUÁN (CONSISTENCY DATA):
        1. NHÂN VẬT (Characters):
        ${charDescriptions}
        (Lưu ý: Chỉ giữ lại TÊN và TRANG PHỤC. TUYỆT ĐỐI KHÔNG MÔ TẢ KHUÔN MẶT).
        
        2. BỐI CẢNH (Settings):
        ${contexts}
        (Mô tả lại chi tiết bối cảnh này).
        `;
    }

    const styleKeywords = style === FilmStyle.CINEMATIC 
        ? "" 
        : `${style}, 3d render, pixar style, 8k`;

    const promptText = `
      Bạn là chuyên gia viết Prompt Video AI.
      Nhiệm vụ: Viết MỘT PROMPT DUY NHẤT cho ý tưởng: "${instruction}".
      Phong cách: ${style}
      Chế độ: ${dialogueOption === DialogueOption.NO_DIALOGUE ? 'KHÔNG THOẠI' : 'CÓ THOẠI'}

      ${imageInstructions}

      ${contextPrompt}
      
      ${getStyleInstructions(style)}

      YÊU CẦU CHI TIẾT (DETAIL REQUIREMENTS):
      1. KHÔNG MÔ TẢ KHUÔN MẶT (NO FACE DESCRIPTION).
      2. KHÔNG DÙNG "film grain" hay "noise". Ảnh phải sạch sẽ, trong trẻo.
      3. VIẾT TỰ NHIÊN: Mô tả ánh sáng và không khí bằng câu văn, không liệt kê tags.
      4. THIẾT KẾ TRANG PHỤC MỚI (NEW OUTFIT) phù hợp với cảnh này. Mô tả chi tiết từng món đồ, màu sắc, chất liệu.
      5. MÔ TẢ TOÀN BỘ (NO OMISSION): Bối cảnh, ánh sáng, vật dụng cầm tay.
      
      ${getStrictRules(dialogueOption)}
      
      ${styleKeywords ? `STYLE KEYWORDS: "${styleKeywords}..."` : ''}
      
      Trả về JSON: { "vi": "...", "en": "..." }
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } },
        required: ["vi", "en"]
    };

    try {
        const fullParts = [
            { text: promptText },
            ...imageParts
        ];
        return await callGemini(fullParts, responseSchema) as PromptItem;
    } catch (err) {
        console.error("Gemini Single Scene Failed", err);
        throw err;
    }
};

export const generateScript = async (request: ScriptRequest): Promise<GeneratedContent> => {
    return generateScriptFromList([request.idea], request.style, DialogueOption.NO_DIALOGUE);
};
