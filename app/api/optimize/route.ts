import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { ConfigError, getUserFromRequest } from '@/app/lib/server-auth';
import { backgroundText, lightingText, parseRenderParams } from '@/app/lib/prompt';
import { describeGeminiError, withRetry } from '@/app/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = parseRenderParams(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const p = parsed.value;
    if (!p.prompt) {
      return NextResponse.json({ error: 'Escreva um prompt antes de otimizar.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada no servidor (.env.local).' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const systemInstruction =
      'Você é um arquiteto e designer 3D de nível internacional, especialista em engenharia de prompts para renderização fotorrealista de arquitetura e interiores.\n' +
      'Sua tarefa é receber um prompt simples e os parâmetros fornecidos como contexto, e otimizá-lo para criar um prompt rico, detalhado e profissional em INGLÊS.\n' +
      'Foque no realismo dos materiais (madeira, concreto, mármore, vidro), na luz natural e artificial, em profundidade de campo e em composição fotográfica de arquitetura. Preserve a geometria e o layout descritos pelo usuário. NÃO acrescente móveis, objetos, decoração, peças de roupa ou acabamentos que o usuário não mencionou: descreva apenas o que ele citou, melhorando a linguagem sobre materiais, luz e câmera.\n' +
      'Retorne APENAS o prompt otimizado final em inglês, em um único parágrafo. Não inclua observações, sugestões, explicações, nem aspas.';

    const content =
      `Otimize o seguinte prompt para geração de imagem realista de arquitetura:\n` +
      `Prompt base: "${p.prompt}"\n` +
      `Contexto físico:\n` +
      `- Tipo de cena: ${p.ambient === 'interna' ? 'interna' : 'externa'}\n` +
      `- Estilo arquitetônico: ${p.style}\n` +
      `- Iluminação: ${lightingText(p.lighting, p.customTime)}\n` +
      `- Entorno: ${backgroundText(p.background, p.ambient)}\n\n` +
      `Gere o prompt otimizado final em inglês.`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        contents: content,
        config: { systemInstruction },
      })
    );

    const optimized = response.text?.trim();
    if (!optimized) {
      return NextResponse.json(
        { error: 'O Gemini não retornou um prompt. Tente novamente.' },
        { status: 502 }
      );
    }
    return NextResponse.json({ text: optimized });
  } catch (error) {
    if (error instanceof ConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Erro na otimização de prompt:', error);
    // Em desenvolvimento mostra o detalhe técnico na tela; em produção, só no log do servidor
    const msg = error instanceof Error ? error.message : String(error);
    const detail = process.env.NODE_ENV !== 'production' ? ` [detalhe técnico: ${msg}]` : '';
    return NextResponse.json({ error: `${describeGeminiError(error)}${detail}` }, { status: 500 });
  }
}
