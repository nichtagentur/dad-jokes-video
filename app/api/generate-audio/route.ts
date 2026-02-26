import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { scenes } = await req.json();
    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json({ error: 'Scenes array required' }, { status: 400 });
    }

    // Combine all scene text into one narration script
    const script = scenes
      .map((s: { setup: string; punchline: string }, i: number) => {
        const pause = i < scenes.length - 1 ? '...' : '';
        return `${s.setup} ... ${s.punchline}${pause}`;
      })
      .join(' ... ');

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: script,
      speed: 0.95,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioBase64 = buffer.toString('base64');

    return NextResponse.json({ audio: audioBase64 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
