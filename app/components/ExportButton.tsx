'use client';

import { useState } from 'react';
import { Scene } from '../types';
import { VideoPreviewHandle } from './VideoPreview';

interface Props {
  videoRef: React.RefObject<VideoPreviewHandle | null>;
  scenes: Scene[];
  title: string;
}

export default function ExportButton({ videoRef, scenes, title }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');

  const handleExport = async () => {
    const preview = videoRef.current;
    if (!preview) return;

    const canvas = preview.getCanvas();
    const audio = preview.getAudio();
    if (!canvas) return;

    setExporting(true);
    setProgress('Preparing export...');

    try {
      // Create audio context and destination for mixing
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      // Connect audio if available
      if (audio && audio.src) {
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(dest);
        source.connect(audioCtx.destination);
      }

      // Combine canvas stream + audio stream
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
      dest.stream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 4_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dad-joke-${title.replace(/\s+/g, '-').toLowerCase()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
        setProgress('');
        audioCtx.close();
      };

      recorder.start();
      setProgress('Recording video...');

      // Play the preview
      if (audio && audio.src) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      preview.play();

      // Stop recording after total duration + small buffer
      setTimeout(() => {
        recorder.stop();
        preview.stop();
        setProgress('Saving file...');
      }, (totalDuration + 0.5) * 1000);

    } catch (error) {
      console.error('Export error:', error);
      setExporting(false);
      setProgress('Export failed');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
      >
        {exporting ? 'Exporting...' : 'Export WebM Video'}
      </button>
      {progress && <p className="text-sm text-zinc-400">{progress}</p>}
    </div>
  );
}
