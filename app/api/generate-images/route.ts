import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { scenes } = await req.json();
    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json({ error: 'Scenes array required' }, { status: 400 });
    }

    // Generate all 3 images in parallel
    const imagePromises = scenes.map((scene: { imagePrompt: string }) =>
      openai.images.generate({
        model: 'gpt-image-1',
        prompt: `${scene.imagePrompt}. Style: bright colorful cartoon, meme-worthy, exaggerated expressions, no text in image.`,
        n: 1,
        size: '1024x1024',
        quality: 'low',
      })
    );

    const results = await Promise.all(imagePromises);
    const images = results.map((r) => r.data?.[0]?.b64_json);

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const maxDuration = 60;
