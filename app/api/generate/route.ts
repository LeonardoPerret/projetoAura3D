import Replicate from "replicate";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageUrl } = await req.json();

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.warn("REPLICATE_API_TOKEN não está configurada nas variáveis de ambiente.");
      
      // Galeria de renderizações realistas contemporâneas para demonstração de alto nível estética
      const demoImages = [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", // Exterior de luxo moderna
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80", // Interior living room moderno
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80", // Cozy interior contemporâneo
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"  // Casa na praia estilo leve
      ];

      // Inteligência de seleção baseada no prompt recebido
      let chosenImage = demoImages[0];
      const promptLower = (prompt || "").toLowerCase();
      
      if (promptLower.includes("interna") || promptLower.includes("interior") || promptLower.includes("sala") || promptLower.includes("living") || promptLower.includes("cozinha")) {
        chosenImage = demoImages[1];
      } else if (promptLower.includes("quarto") || promptLower.includes("bedroom") || promptLower.includes("cozy")) {
        chosenImage = demoImages[2];
      } else if (promptLower.includes("praia") || promptLower.includes("beach") || promptLower.includes("litoral")) {
        chosenImage = demoImages[3];
      }

      // Simular delay realista de processamento de rede neural (2 segundos de imersão)
      await new Promise(resolve => setTimeout(resolve, 2000));

      return NextResponse.json({
        output: [chosenImage],
        info: "Modo demonstração (Para gerar renders reais integrados, configure a REPLICATE_API_TOKEN nas Configurações da plataforma)."
      });
    }

    const replicate = new Replicate({
      auth: token,
    });

    console.log("Simulando execução do Replicate com imagem base e prompt:", prompt);

    // Usa um modelo excelente de desenho arquitetônico/transformação de fachada
    const output = await replicate.run(
      "merve/architectural-designs:0e8790f918e9d300f81d1dc4db4b6cb9c379ea0199fe7184a5b4819d20c57c50",
      {
        input: {
          image: imageUrl,
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 7.5,
          prompt_strength: 0.8,
          negative_prompt: "lowres, bad anatomy, bad hands, cropped, worst quality, low quality",
        }
      }
    );

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("Erro na geração de render Replicate:", error);
    return NextResponse.json({ error: error.message || "Erro interno na rota do Replicate" }, { status: 500 });
  }
}
