import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, ambient, style, lighting } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = 
      "Você é um arquiteto e designer 3D de nível internacional, especialista em engenharia de prompts para renderização fotorealista de arquitetura e interiores.\n" +
      "Sua tarefa é receber um prompt simples e os parâmetros físicos fornecidos como contexto, e otimizá-lo para criar um prompt extremamente rico, detalhado e profissional em INGLÊS.\n" +
      "Foque no realismo dos materiais (madeira, concreto, mármore, vidro), iluminação global avançada, profundidade de campo (DoF), renderizadores de ponta (Octane, Corona, V-Ray, Lumen), e composição fotográfica sofisticada.\n" +
      "Retorne APENAS o prompt otimizado final em inglês. Não inclua observações, sugestões, explicações, nem aspas redundantes.";

    const content = `Otimize o seguinte prompt para geração de imagem realista de arquitetura:
Prompt base: "${prompt}"
Contexto físico:
- Tipo de cena: ${ambient} (pode ser interna ou externa)
- Estilo arquitetônico: ${style}
- Tipo de iluminação: ${lighting}

Gere o prompt otimizado final em inglês.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: content,
      config: {
        systemInstruction,
      }
    });

    const optimizedPrompt = response.text?.trim() || prompt;

    return NextResponse.json({ text: optimizedPrompt });
  } catch (error: any) {
    console.error("Erro na otimização de prompt:", error);
    return NextResponse.json({ error: error.message || "Erro interno na otimização" }, { status: 500 });
  }
}
