'use client';

import { useState, useRef } from 'react';
import { Scene, JokeScript } from './types';
import JokeInput from './components/JokeInput';
import VideoPreview, { VideoPreviewHandle } from './components/VideoPreview';
import SceneEditor from './components/SceneEditor';
import ExportButton from './components/ExportButton';

type Status = 'idle' | 'generating-joke' | 'generating-images' | 'generating-audio' | 'preview';

const STATUS_MESSAGES: Record<Status, string> = {
  idle: '',
  'generating-joke': 'Writing the cringiest dad joke...',
  'generating-images': 'Generating meme-worthy images...',
  'generating-audio': 'Recording dad voice narration...',
  preview: '',
};

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [joke, setJoke] = useState<JokeScript | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [audioBase64, setAudioBase64] = useState<string>();
  const [error, setError] = useState<string>();
  const videoRef = useRef<VideoPreviewHandle>(null);

  const generate = async (topic: string) => {
    setError(undefined);
    setStatus('generating-joke');

    try {
      // Step 1: Generate joke script
      const jokeRes = await fetch('/api/generate-joke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      if (!jokeRes.ok) throw new Error(`Joke generation failed: ${(await jokeRes.json()).error}`);
      const jokeData: JokeScript = await jokeRes.json();
      setJoke(jokeData);
      setScenes(jokeData.scenes);

      // Step 2: Generate images
      setStatus('generating-images');
      const imgRes = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: jokeData.scenes }),
      });
      if (!imgRes.ok) throw new Error(`Image generation failed: ${(await imgRes.json()).error}`);
      const imgData = await imgRes.json();

      const scenesWithImages = jokeData.scenes.map((s: Scene, i: number) => ({
        ...s,
        imageBase64: imgData.images[i],
      }));
      setScenes(scenesWithImages);

      // Step 3: Generate audio
      setStatus('generating-audio');
      const audioRes = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: jokeData.scenes }),
      });
      if (!audioRes.ok) throw new Error(`Audio generation failed: ${(await audioRes.json()).error}`);
      const audioData = await audioRes.json();
      setAudioBase64(audioData.audio);

      setStatus('preview');
    } catch (err) {
      setError(String(err));
      setStatus('idle');
    }
  };

  const reset = () => {
    setStatus('idle');
    setJoke(null);
    setScenes([]);
    setAudioBase64(undefined);
    setError(undefined);
  };

  const isGenerating = status !== 'idle' && status !== 'preview';

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-amber-500 mb-2">
            Dad Jokes Video Generator
          </h1>
          <p className="text-zinc-400 text-lg">
            Type a topic. Get a cringe-worthy dad joke video. Share the pain.
          </p>
        </div>

        {/* Input */}
        {(status === 'idle' || isGenerating) && (
          <div className="flex justify-center mb-8">
            <JokeInput onGenerate={generate} disabled={isGenerating} />
          </div>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="flex flex-col items-center gap-4 my-12">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg text-zinc-300">{STATUS_MESSAGES[status]}</p>
            <div className="flex gap-2">
              {(['generating-joke', 'generating-images', 'generating-audio'] as const).map((step, i) => (
                <div
                  key={step}
                  className={`w-24 h-1 rounded-full ${
                    status === step
                      ? 'bg-amber-500 animate-pulse'
                      : (['generating-joke', 'generating-images', 'generating-audio'] as const).indexOf(status as typeof step) > i
                      ? 'bg-amber-500'
                      : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            <p className="font-medium">Something went wrong:</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Preview */}
        {status === 'preview' && joke && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">{joke.title}</h2>
              <p className="text-zinc-500">Topic: {joke.topic}</p>
              <button
                onClick={reset}
                className="mt-3 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
              >
                Generate New Joke
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
              {/* Video Preview */}
              <div className="flex-shrink-0">
                <VideoPreview
                  ref={videoRef}
                  scenes={scenes}
                  audioBase64={audioBase64}
                />
                <div className="mt-4 flex justify-center">
                  <ExportButton
                    videoRef={videoRef}
                    scenes={scenes}
                    title={joke.title}
                  />
                </div>
              </div>

              {/* Scene Editor */}
              <SceneEditor scenes={scenes} onChange={setScenes} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
