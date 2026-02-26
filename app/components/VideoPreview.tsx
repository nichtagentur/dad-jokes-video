'use client';

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Scene } from '../types';

interface Props {
  scenes: Scene[];
  audioBase64?: string;
}

export interface VideoPreviewHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getAudio: () => HTMLAudioElement | null;
  play: () => void;
  stop: () => void;
}

const VideoPreview = forwardRef<VideoPreviewHandle, Props>(({ scenes, audioBase64 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number>(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPunchline, setShowPunchline] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Load images and redraw when they load
  useEffect(() => {
    imagesRef.current = scenes.map((scene, i) => {
      const img = new Image();
      if (scene.imageBase64) {
        img.onload = () => {
          if (!isPlaying) drawFrame(i === 0 ? 0 : currentScene, false);
        };
        img.src = `data:image/png;base64,${scene.imageBase64}`;
      }
      return img;
    });
    // Redraw immediately with current images
    if (!isPlaying) drawFrame(currentScene, false);
  }, [scenes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set audio source
  useEffect(() => {
    if (audioBase64 && audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
    }
  }, [audioBase64]);

  const drawFrame = useCallback((sceneIdx: number, punchline: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const scene = scenes[sceneIdx];
    if (!scene) return;

    // Clear
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, W, H);

    // Draw image (top 60%)
    const imgH = H * 0.6;
    const img = imagesRef.current[sceneIdx];
    if (img && img.complete && img.naturalWidth) {
      const scale = Math.max(W / img.naturalWidth, imgH / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - sw) / 2, (imgH - sh) / 2, sw, sh);
    } else {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, 0, W, imgH);
      ctx.fillStyle = '#71717a';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading image...', W / 2, imgH / 2);
    }

    // Scene indicator dots
    const dotY = imgH + 16;
    scenes.forEach((_, i) => {
      ctx.beginPath();
      ctx.arc(W / 2 + (i - 1) * 24, dotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = i === sceneIdx ? '#f59e0b' : '#52525b';
      ctx.fill();
    });

    // Text area (bottom 40%)
    const textY = imgH + 36;
    const textH = H - textY;
    ctx.fillStyle = '#000000cc';
    ctx.fillRect(0, imgH, W, textH + 36);

    // Setup text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    wrapText(ctx, scene.setup, W / 2, textY + 16, W - 48, 32);

    // Punchline
    if (punchline) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px system-ui, sans-serif';
      wrapText(ctx, scene.punchline, W / 2, textY + textH / 2 + 10, W - 48, 36);
    }

    // Scene number
    ctx.fillStyle = '#71717a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Scene ${sceneIdx + 1}/${scenes.length}`, 16, H - 24);
  }, [scenes]);

  // Initial draw
  useEffect(() => {
    drawFrame(0, false);
  }, [drawFrame]);

  const play = useCallback(() => {
    if (scenes.length === 0) return;
    setIsPlaying(true);

    let sceneIdx = 0;
    let sceneStart = Date.now();
    let punchlineShown = false;

    setCurrentScene(0);
    setShowPunchline(false);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    const tick = () => {
      const elapsed = (Date.now() - sceneStart) / 1000;
      const scene = scenes[sceneIdx];
      const halfDur = scene.duration / 2;

      if (elapsed > halfDur && !punchlineShown) {
        punchlineShown = true;
        setShowPunchline(true);
      }

      drawFrame(sceneIdx, punchlineShown);

      if (elapsed >= scene.duration) {
        sceneIdx++;
        if (sceneIdx >= scenes.length) {
          setIsPlaying(false);
          return;
        }
        sceneStart = Date.now();
        punchlineShown = false;
        setCurrentScene(sceneIdx);
        setShowPunchline(false);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [scenes, drawFrame]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    drawFrame(0, false);
    setCurrentScene(0);
  }, [drawFrame]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getAudio: () => audioRef.current,
    play,
    stop,
  }));

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-zinc-800">
        <canvas ref={canvasRef} width={540} height={960} className="block" />
      </div>
      <audio ref={audioRef} />
      <div className="flex gap-3">
        <button
          onClick={isPlaying ? stop : play}
          className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
        >
          {isPlaying ? 'Stop' : 'Play Preview'}
        </button>
      </div>
      {isPlaying && (
        <p className="text-sm text-zinc-500">
          Scene {currentScene + 1}/{scenes.length} {showPunchline ? '-- Punchline!' : '-- Setup...'}
        </p>
      )}
    </div>
  );
});

VideoPreview.displayName = 'VideoPreview';
export default VideoPreview;

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let ly = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, ly);
      line = word + ' ';
      ly += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, ly);
}
