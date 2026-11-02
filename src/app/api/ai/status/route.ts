import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Check tags
    const tagsRes = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(2500),
      cache: 'no-store',
    });

    if (!tagsRes.ok) {
      return NextResponse.json({
        online: false,
        models: [],
        message: 'Ollama svarade inte med 200 OK',
      });
    }

    const tagsData = await tagsRes.json();
    const models: string[] = Array.isArray(tagsData.models)
      ? tagsData.models.map((m: any) => m.name || m.model)
      : [];

    // 2. Check running models in VRAM via /api/ps
    let runningModel: string | null = null;
    let vramUsed = '';
    try {
      const psRes = await fetch('http://127.0.0.1:11434/api/ps', {
        signal: AbortSignal.timeout(1500),
        cache: 'no-store',
      });
      if (psRes.ok) {
        const psData = await psRes.json();
        if (Array.isArray(psData.models) && psData.models.length > 0) {
          const m = psData.models[0];
          runningModel = m.name || m.model;
          if (m.size_vram) {
            vramUsed = `${(m.size_vram / (1024 * 1024 * 1024)).toFixed(1)} GB VRAM`;
          }
        }
      }
    } catch {
      // ignore ps check error
    }

    return NextResponse.json({
      online: true,
      models,
      activeModel: runningModel || (models.includes('qwen2.5:7b') ? 'qwen2.5:7b' : models[0] || 'qwen2.5:7b'),
      vramUsed,
      message: 'Ollama är aktiv och ansluten',
    });
  } catch (err: any) {
    return NextResponse.json({
      online: false,
      models: [],
      message: 'Ollama är inte igång på port 11434',
    });
  }
}
