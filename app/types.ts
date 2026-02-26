export interface Scene {
  setup: string;
  punchline: string;
  imagePrompt: string;
  duration: number; // seconds
  imageBase64?: string;
}

export interface JokeScript {
  topic: string;
  title: string;
  scenes: Scene[];
}

export interface GeneratedVideo {
  joke: JokeScript;
  audioBase64?: string;
  status: 'idle' | 'generating-joke' | 'generating-images' | 'generating-audio' | 'preview' | 'exporting';
  error?: string;
}
