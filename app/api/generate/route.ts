import Replicate from 'replicate';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ConfigError, getAdminClient, getUserFromRequest } from '@/app/lib/server-auth';
import { buildEditPrompt, buildRenderPrompt, parseRenderParams } from '@/app/lib/prompt';
import { describeGeminiError, editImageWithGemini, GeminiNoImage } from '@/app/lib/gemini';

// Tempo máximo da função em hospedagens serverless (ex.: Vercel). Ignorado localmente.
export const maxDuration = 120;

const UPLOADS_BUCKET = 'images-uploads';
const RENDERS_BUCKET = 'renders'; // criado pelo supabase/002_bucket_renders.sql
const RENDER_COST = 1; // créditos por render

// Qual motor gera a imagem. Troque no .env.local: RENDER_PROVIDER=...
//  - gemini         : API do Google (Gemini). Mantém objetos, cores e composição. Exige faturamento no Google.
//  - replicate-nano : mesmo tipo de modelo do Google (Nano Banana) rodando no Replicate (cobrança pelo Replicate).
//  - replicate      : FLUX Depth. Mantém só a estrutura (profundidade); reinventa objetos e cores.
type Provider = 'gemini' | 'replicate-nano' | 'replicate';
const PROVIDER: Provider =
  process.env.RENDER_PROVIDER === 'replicate'
    ? 'replicate'
    : process.env.RENDER_PROVIDER === 'replicate-nano'
      ? 'replicate-nano'
      : 'gemini';
const usesReplicate = PROVIDER !== 'gemini';

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

const REPLICATE_MODEL = (process.env.REPLICATE_MODEL ||
  'black-forest-labs/flux-depth-pro') as `${string}/${string}`;
const REPLICATE_EDIT_MODEL = (process.env.REPLICATE_EDIT_MODEL ||
  'google/nano-banana-pro') as `${string}/${string}`;
const STEPS = 50; // 15 a 50: mais passos = mais qualidade e mais tempo
const GUIDANCE = 7; // 1 a 50: quanto o modelo obedece ao prompt

/** Falha reportada pelo próprio Replicate (guarda os logs para diagnóstico). */
class GenerationFailed extends Error {
  logs: string;
  constructor(message: string, logs: string) {
    super(message);
    this.logs = logs;
  }
}

/** O SDK do Replicate pode devolver string, array de strings ou objetos FileOutput. */
function extractUrl(output: unknown): string | null {
  const first = Array.isArray(output) ? output[0] : output;
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') {
    const candidate = first as { url?: unknown };
    if (typeof candidate.url === 'function') {
      const value = (first as { url: () => unknown }).url();
      return value ? String(value) : null;
    }
    if (typeof candidate.url === 'string') return candidate.url;
  }
  return null;
}

/** Guarda o render no Storage (privado) e devolve um link temporário de 1 hora. */
async function storeRender(
  admin: SupabaseClient,
  userId: string,
  base64: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(RENDERS_BUCKET)
    .upload(path, Buffer.from(base64, 'base64'), { contentType: mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: signError } = await admin.storage
    .from(RENDERS_BUCKET)
    .createSignedUrl(path, 3600);
  if (signError || !data?.signedUrl) throw signError ?? new Error('Link do render indisponível.');
  return data.signedUrl;
}

/** Baixa a imagem gerada no Replicate (o link expira) e guarda no Storage; se falhar, usa o link original. */
async function persistRemoteImage(admin: SupabaseClient, userId: string, url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const mime = res.headers.get('content-type')?.split(';')[0].trim() || 'image/jpeg';
    const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    return await storeRender(admin, userId, base64, mime);
  } catch (err) {
    console.error('Falha ao guardar o render no Storage (usando o link do Replicate):', err);
    return url;
  }
}

/** Traduz o erro do provedor em uma mensagem útil. */
function describeGenError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (PROVIDER === 'gemini') {
    if (err instanceof GeminiNoImage) {
      return 'O Gemini não devolveu uma imagem (possível bloqueio de segurança ou recusa). Reescreva o prompt de forma mais neutra ou tente outra imagem.';
    }
    return describeGeminiError(err, 'GEMINI_IMAGE_MODEL');
  }

  if (err instanceof GenerationFailed) {
    if (/nsfw|moderat|safety|flagged|content policy|blocked/i.test(`${err.message}\n${err.logs}`)) {
      return 'O filtro de segurança do modelo bloqueou a geração (imagem ou prompt). Reescreva o prompt de forma mais neutra e tente de novo.';
    }
    return 'A geração falhou no Replicate sem informar o motivo. Tente de novo; se persistir, veja o log dessa previsão no painel do Replicate.';
  }

  const fromResponse = (err as { response?: { status?: number } } | null)?.response?.status;
  const code = fromResponse ?? Number(/status (\d{3})/.exec(msg)?.[1] ?? 0);

  if (code === 401) return 'O Replicate recusou o token (REPLICATE_API_TOKEN inválido ou expirado).';
  if (code === 402) return 'A conta do Replicate está sem saldo ou sem cobrança configurada.';
  if (code === 404) return 'O modelo/versão do Replicate não foi encontrado.';
  if (code === 422) return 'O Replicate recusou a requisição (versão do modelo ou parâmetro inválido).';
  if (code === 429) return 'Limite de requisições do Replicate atingido. Aguarde um pouco e tente de novo.';
  return 'Não foi possível gerar o render.';
}

export async function POST(req: NextRequest) {
  try {
    // 1. Quem está chamando?
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    // 2. Valida a entrada
    const raw = await req.json().catch(() => null);
    const parsed = parseRenderParams(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const imagePath =
      raw && typeof (raw as { imagePath?: unknown }).imagePath === 'string'
        ? (raw as { imagePath: string }).imagePath
        : '';
    // O arquivo precisa estar na pasta do próprio usuário
    if (!imagePath.startsWith(`${user.id}/`) || imagePath.includes('..')) {
      return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
    }

    // 3. Chave do provedor escolhido
    const geminiKey = process.env.GEMINI_API_KEY;
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (PROVIDER === 'gemini' && !geminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada no servidor (.env.local).' },
        { status: 500 }
      );
    }
    if (usesReplicate && !replicateToken) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN não configurado no servidor (.env.local).' },
        { status: 500 }
      );
    }

    // 4. Prepara a imagem de entrada (antes de cobrar o crédito)
    const admin = getAdminClient();
    let signedUrl = '';
    let sourceBase64 = '';
    let sourceMime = 'image/png';

    if (usesReplicate) {
      const { data: signed, error: signError } = await admin.storage
        .from(UPLOADS_BUCKET)
        .createSignedUrl(imagePath, 600);
      if (signError || !signed?.signedUrl) {
        return NextResponse.json(
          { error: 'Não foi possível acessar a imagem enviada. Envie novamente.' },
          { status: 400 }
        );
      }
      signedUrl = signed.signedUrl;
    } else {
      const { data: blob, error: downloadError } = await admin.storage
        .from(UPLOADS_BUCKET)
        .download(imagePath);
      if (downloadError || !blob) {
        return NextResponse.json(
          { error: 'Não foi possível acessar a imagem enviada. Envie novamente.' },
          { status: 400 }
        );
      }
      sourceBase64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
      sourceMime = blob.type || (imagePath.endsWith('.jpg') ? 'image/jpeg' : 'image/png');
    }

    // 5. Desconta o crédito ANTES de gerar (atômico, no banco)
    const { data: balanceAfter, error: consumeError } = await admin.rpc('consume_credit', {
      p_user_id: user.id,
      p_amount: RENDER_COST,
      p_reason: 'render',
    });
    if (consumeError) {
      if (consumeError.message?.includes('INSUFFICIENT_CREDITS')) {
        return NextResponse.json({ error: 'Você não tem créditos suficientes.' }, { status: 402 });
      }
      console.error('Erro ao descontar crédito:', consumeError);
      return NextResponse.json({ error: 'Erro ao processar créditos.' }, { status: 500 });
    }

    // 6. Gera. Se falhar, estorna o crédito.
    try {
      let imageUrl: string;

      if (PROVIDER === 'gemini') {
        const result = await editImageWithGemini({
          apiKey: geminiKey as string,
          model: GEMINI_IMAGE_MODEL,
          prompt: buildEditPrompt(parsed.value),
          imageBase64: sourceBase64,
          mimeType: sourceMime,
        });
        try {
          imageUrl = await storeRender(admin, user.id, result.base64, result.mimeType);
        } catch (storeError) {
          // Não perde o render do cliente se o Storage falhar: devolve a imagem direto
          console.error('Falha ao salvar o render no Storage (devolvendo inline):', storeError);
          imageUrl = `data:${result.mimeType};base64,${result.base64}`;
        }
      } else {
        const replicate = new Replicate({ auth: replicateToken as string });
        const isNano = PROVIDER === 'replicate-nano';
        const prediction = await replicate.predictions.create({
          model: isNano ? REPLICATE_EDIT_MODEL : REPLICATE_MODEL,
          input: isNano
            ? {
                prompt: buildEditPrompt(parsed.value),
                image_input: [signedUrl],
                aspect_ratio: 'match_input_image',
              }
            : {
                control_image: signedUrl,
                prompt: buildRenderPrompt(parsed.value),
                steps: STEPS,
                guidance: GUIDANCE,
                output_format: 'jpg',
                prompt_upsampling: false,
                safety_tolerance: 2,
              },
        });
        const finished = await replicate.wait(prediction, { interval: 1500 });

        if (finished.status !== 'succeeded') {
          throw new GenerationFailed(
            finished.error ? String(finished.error) : '',
            typeof finished.logs === 'string' ? finished.logs : ''
          );
        }
        const url = extractUrl(finished.output);
        if (!url) throw new Error('A IA não retornou uma imagem.');
        imageUrl = await persistRemoteImage(admin, user.id, url);
      }

      return NextResponse.json({ output: [imageUrl], credits: balanceAfter as number });
    } catch (genError) {
      console.error(`Erro na geração (${PROVIDER}):`, genError);

      const { data: refunded, error: refundError } = await admin.rpc('refund_credit', {
        p_user_id: user.id,
        p_amount: RENDER_COST,
        p_reason: 'estorno: falha na geração',
      });
      if (refundError) console.error('FALHA AO ESTORNAR CRÉDITO:', user.id, refundError);

      const baseMsg = genError instanceof Error ? genError.message : String(genError);
      const msg =
        genError instanceof GenerationFailed
          ? `${baseMsg || 'sem mensagem de erro'} | logs: ${genError.logs.slice(-500) || '(vazio)'}`
          : baseMsg;
      // Em desenvolvimento mostra o detalhe técnico na tela; em produção, só no log do servidor
      const detail = process.env.NODE_ENV !== 'production' ? ` [detalhe técnico: ${msg}]` : '';
      return NextResponse.json(
        {
          error: `${describeGenError(genError)} Seu crédito foi devolvido.${detail}`,
          credits: typeof refunded === 'number' ? refunded : undefined,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Erro inesperado em /api/generate:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar o render.' }, { status: 500 });
  }
}
