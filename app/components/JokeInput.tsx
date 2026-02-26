'use client';

import { useState } from 'react';

interface Props {
  onGenerate: (topic: string) => void;
  disabled: boolean;
}

const SUGGESTIONS = ['Programming', 'Coffee', 'Cats', 'Cooking', 'Fitness', 'Weather', 'Golf', 'Gardening'];

export default function JokeInput({ onGenerate, disabled }: Props) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onGenerate(topic.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-zinc-400 mb-2">
          What should the dad joke be about?
        </label>
        <div className="flex gap-3">
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Programming, Coffee, Cats..."
            disabled={disabled}
            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !topic.trim()}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {disabled ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setTopic(s); if (!disabled) onGenerate(s); }}
            disabled={disabled}
            className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full border border-zinc-700 disabled:opacity-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
