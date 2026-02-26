import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        messages: [
          {
            role: 'system',
            content: `You are a dad joke writer. Create cringe-worthy dad jokes that are family-friendly and groan-inducing. Output ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Create a 3-scene dad joke video script about "${topic}". Each scene has a setup line, a punchline, and a visual description for image generation. The joke should build up across scenes with the biggest groan at the end.

Return this exact JSON structure:
{
  "topic": "${topic}",
  "title": "short catchy title",
  "scenes": [
    {
      "setup": "setup text shown on screen",
      "punchline": "punchline text",
      "imagePrompt": "detailed image description, cartoon style, bright colors, funny",
      "duration": 5
    },
    {
      "setup": "setup text",
      "punchline": "punchline text",
      "imagePrompt": "detailed image description, cartoon style, bright colors, funny",
      "duration": 5
    },
    {
      "setup": "setup text",
      "punchline": "final biggest punchline",
      "imagePrompt": "detailed image description, cartoon style, bright colors, funny",
      "duration": 7
    }
  ]
}`,
          },
        ],
        temperature: 0.9,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response (handle potential markdown wrapping)
    let joke;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      joke = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse joke JSON', raw: content }, { status: 500 });
    }

    return NextResponse.json(joke);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
