export enum FilmStyle {
  CINEMATIC = 'Điện ảnh (Cinematic)',
  ANIMATION = 'Hoạt hình (Animation)'
}

export enum DialogueOption {
  NO_DIALOGUE = 'no_dialogue',
  WITH_DIALOGUE = 'with_dialogue'
}

export interface CharacterProfile {
  id: string;
  name: string;
  image: string | null; // Data URL (base64)
}

export interface ScriptRequest {
  idea: string;
  style: FilmStyle;
}

export interface PromptItem {
  vi: string;
  en: string;
}

export interface GeneratedContent {
  title: PromptItem;
  context: PromptItem[];
  characters: PromptItem[];
  script: PromptItem[];
}