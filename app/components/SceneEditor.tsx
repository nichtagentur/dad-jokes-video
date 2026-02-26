'use client';

import { Scene } from '../types';

interface Props {
  scenes: Scene[];
  onChange: (scenes: Scene[]) => void;
}

export default function SceneEditor({ scenes, onChange }: Props) {
  const updateScene = (index: number, field: keyof Scene, value: string | number) => {
    const updated = scenes.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange(updated);
  };

  const moveScene = (from: number, to: number) => {
    if (to < 0 || to >= scenes.length) return;
    const updated = [...scenes];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <h3 className="text-lg font-bold text-white">Edit Scenes</h3>
      {scenes.map((scene, i) => (
        <div key={i} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-500">Scene {i + 1}</span>
            <div className="flex gap-1">
              <button
                onClick={() => moveScene(i, i - 1)}
                disabled={i === 0}
                className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-30 text-zinc-300"
              >
                Up
              </button>
              <button
                onClick={() => moveScene(i, i + 1)}
                disabled={i === scenes.length - 1}
                className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-30 text-zinc-300"
              >
                Down
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Setup</label>
            <input
              type="text"
              value={scene.setup}
              onChange={(e) => updateScene(i, 'setup', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Punchline</label>
            <input
              type="text"
              value={scene.punchline}
              onChange={(e) => updateScene(i, 'punchline', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Duration: {scene.duration}s
            </label>
            <input
              type="range"
              min={3}
              max={12}
              step={0.5}
              value={scene.duration}
              onChange={(e) => updateScene(i, 'duration', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
