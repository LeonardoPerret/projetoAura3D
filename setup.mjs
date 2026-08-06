/**
 * AURA3D — Setup Script
 * Cria todo o projeto Next.js com FAL.ai pronto para deploy no Vercel.
 *
 * Como usar:
 *   1. Crie uma pasta nova (ex: aura3d) e abra no VS Code
 *   2. Abra o terminal integrado (Ctrl+` ou View → Terminal)
 *   3. Copie este arquivo para dentro da pasta
 *   4. Execute: node setup.mjs
 *   5. Execute: npm install
 *   6. Crie o arquivo .env.local com suas chaves (instruções no final)
 *   7. Execute: npm run dev
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();

function write(filePath, content) {
  const full = path.join(root, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('  ✓', filePath);
}

console.log('\n🏗  Criando projeto Aura3D...\n');

// ─────────────────────────────────────────────
// package.json
// ─────────────────────────────────────────────
write('package.json', JSON.stringify({
  name: 'aura3d',
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'eslint',
  },
  dependencies: {
    '@supabase/supabase-js': '^2.108.0',
    'lucide-react': '^0.577.0',
    next: '15.3.3',
    react: '19.0.0',
    'react-dom': '19.0.0',
  },
  devDependencies: {
    '@tailwindcss/postcss': '^4.3.0',
    '@types/node': '^20.19.42',
    '@types/react': '^19.2.17',
    '@types/react-dom': '^19.2.3',
    eslint: '^9.39.4',
    'eslint-config-next': '15.3.3',
    tailwindcss: '^4.3.0',
    typescript: '^5.9.3',
  },
}, null, 2));

// ─────────────────────────────────────────────
// next.config.ts
// ─────────────────────────────────────────────
write('next.config.ts', `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
`);

// ─────────────────────────────────────────────
// tsconfig.json
// ─────────────────────────────────────────────
write('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2017',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'react-jsx',
    incremental: true,
    plugins: [{ name: 'next' }],
    paths: { '@/*': ['./*'] },
  },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules'],
}, null, 2));

// ─────────────────────────────────────────────
// postcss.config.mjs
// ─────────────────────────────────────────────
write('postcss.config.mjs', `const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
`);

// ─────────────────────────────────────────────
// .gitignore
// ─────────────────────────────────────────────
write('.gitignore', `.env*.local
.next/
node_modules/
out/
`);

// ─────────────────────────────────────────────
// .env.example  (copiar para .env.local e preencher)
// ─────────────────────────────────────────────
write('.env.example', `# FAL.ai — https://fal.ai → Dashboard → API Keys
FAL_KEY=sua_chave_fal_aqui

# OpenAI — https://platform.openai.com → API Keys
OPENAI_API_KEY=sua_chave_openai_aqui

# Supabase — https://app.supabase.com → Projeto → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_supabase_aqui
`);

// ─────────────────────────────────────────────
// app/globals.css
// ─────────────────────────────────────────────
write('app/globals.css', `@import "tailwindcss";

@theme {
  --color-aura-bg: #000000;
  --color-aura-card: #161617;
  --color-aura-text: #F5F5F7;
  --color-aura-sub: #86868B;
  --color-aura-border: #2C2C2E;
  --color-aura-accent: #0066CC;
}
`);

// ─────────────────────────────────────────────
// app/layout.tsx
// ─────────────────────────────────────────────
write('app/layout.tsx', `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aura3D — Renders Arquitetônicos com IA",
  description: "Converta seus croquis em renders fotorrealistas com inteligência artificial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={\`\${geistSans.variable} \${geistMono.variable} h-full antialiased\`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
`);

// ─────────────────────────────────────────────
// app/utils/supabase.ts
// ─────────────────────────────────────────────
write('app/utils/supabase.ts', `'use client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
`);

// ─────────────────────────────────────────────
// app/components/Auth.tsx
// ─────────────────────────────────────────────
write('app/components/Auth.tsx', `'use client';
import { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail ou faça login.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro na autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-bg flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-aura-card border border-aura-border rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Aura3D" className="h-8 w-auto" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2 text-white">
          {isSignUp ? 'Criar sua conta' : 'Acesse a plataforma'}
        </h2>
        <p className="text-xs text-aura-sub text-center mb-6">
          {isSignUp ? 'Gere renders fotorrealistas dos seus projetos.' : 'Entre com suas credenciais.'}
        </p>
        {message && (
          <div className={\`p-3 rounded-lg text-xs mb-4 text-center border \${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }\`}>{message.text}</div>
        )}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-aura-sub block mb-1">E-mail</label>
            <input type="email" required placeholder="arquiteto@escritorio.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-neutral-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-aura-sub block mb-1">Senha</label>
            <input type="password" required placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full mt-2 cursor-pointer font-medium text-sm text-white py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">
            {loading ? 'Processando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-xs text-aura-sub hover:text-white transition-colors underline underline-offset-4">
            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────
// app/api/generate/route.ts  (FAL.ai)
// ─────────────────────────────────────────────
write('app/api/generate/route.ts', `import { NextRequest, NextResponse } from "next/server";

// FAL.ai flux-dev-controlnet-canny
// Usa Canny edge detection no croqui para preservar geometria exata do projeto
// e gera materiais e iluminação fotorrealistas conforme o prompt.
const FAL_MODEL = "fal-ai/flux-dev-controlnet-canny";

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageUrl } = await req.json();

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "FAL_KEY não configurado. Adicione nas variáveis de ambiente do Vercel." },
        { status: 500 }
      );
    }

    // 1. Submete para a fila do FAL.ai
    const submitRes = await fetch(\`https://queue.fal.run/\${FAL_MODEL}\`, {
      method: "POST",
      headers: {
        Authorization: \`Key \${falKey}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        control_image_url: imageUrl,
        controlnet_conditioning_scale: 0.7,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        image_size: "landscape_16_9",
      }),
    });

    if (!submitRes.ok) {
      const errBody = await submitRes.text();
      throw new Error(\`FAL submit \${submitRes.status}: \${errBody}\`);
    }

    const { request_id } = await submitRes.json();

    // 2. Polling até concluir (máx 2 min)
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(
        \`https://queue.fal.run/\${FAL_MODEL}/requests/\${request_id}\`,
        { headers: { Authorization: \`Key \${falKey}\` } }
      );
      const status = await statusRes.json();
      if (status.status === "COMPLETED") {
        const url = status.output?.images?.[0]?.url ?? "";
        return NextResponse.json({ output: [url] });
      }
      if (status.status === "FAILED") {
        throw new Error(status.error ?? "FAL generation failed.");
      }
    }

    throw new Error("Timeout. Tente novamente.");
  } catch (error: any) {
    console.error("Erro na geração via FAL.ai:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// ─────────────────────────────────────────────
// app/api/optimize/route.ts  (OpenAI GPT-4o)
// ─────────────────────────────────────────────
write('app/api/optimize/route.ts', `import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, ambient, style, lighting } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurado." }, { status: 500 });
    }

    const systemInstruction =
      "Você é um arquiteto e designer 3D de nível internacional, especialista em engenharia de prompts para renderização fotorealista de arquitetura e interiores.\\n" +
      "Sua tarefa é receber um prompt simples e os parâmetros físicos fornecidos como contexto, e otimizá-lo para criar um prompt extremamente rico, detalhado e profissional em INGLÊS.\\n" +
      "Foque no realismo dos materiais (madeira, concreto, mármore, vidro), iluminação global avançada, profundidade de campo (DoF), renderizadores de ponta (Octane, Corona, V-Ray, Lumen), e composição fotográfica sofisticada.\\n" +
      "Retorne APENAS o prompt otimizado final em inglês. Não inclua observações, sugestões, explicações, nem aspas redundantes.";

    const userContent = \`Otimize o seguinte prompt para geração de imagem realista de arquitetura:
Prompt base: "\${prompt}"
Contexto físico:
- Tipo de cena: \${ambient} (pode ser interna ou externa)
- Estilo arquitetônico: \${style}
- Tipo de iluminação: \${lighting}

Gere o prompt otimizado final em inglês.\`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(\`OpenAI \${res.status}: \${await res.text()}\`);
    const data = await res.json();
    const optimizedPrompt = data.choices?.[0]?.message?.content?.trim() || prompt;

    return NextResponse.json({ text: optimizedPrompt });
  } catch (error: any) {
    console.error("Erro na otimização de prompt:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// ─────────────────────────────────────────────
// app/page.tsx
// ─────────────────────────────────────────────
write('app/page.tsx', `'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from './utils/supabase';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';
import {
  Sun, Moon, Clock, Home as HomeIcon, Trees, Waves,
  Upload, Wand2, PlusSquare, Image as ImageIcon,
} from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [ambientType, setAmbientType] = useState<'interna' | 'externa'>('externa');
  const [styleType, setStyleType] = useState('moderna');
  const [lighting, setLighting] = useState<'diurna' | 'noturna' | 'hora'>('diurna');
  const [customTime, setCustomTime] = useState('12:00');
  const [background, setBackground] = useState('residencial');

  const [promptText, setPromptText] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState('');

  const fetchCredits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles').select('credits').eq('id', userId).single();
      if (error) throw error;
      if (data) setCredits(data.credits);
    } catch (err) {
      console.error('Erro ao buscar créditos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => { if (mounted) setLoading(false); }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) fetchCredits(session.user.id);
      else setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setSession(session);
      if (session) fetchCredits(session.user.id);
      else { setCredits(null); setLoading(false); }
    });

    return () => { mounted = false; clearTimeout(timer); subscription.unsubscribe(); };
  }, [fetchCredits]);

  const handleOptimize = async () => {
    if (!promptText) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, ambient: ambientType, style: styleType, lighting }),
      });
      const data = await res.json();
      if (data.text) setPromptText(data.text);
    } catch (err) {
      console.error('Erro na otimização:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setGeneratedImageUrl('');
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!session) return;
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = \`\${session.user.id}_\${Date.now()}.\${ext}\`;
      const { error } = await supabase.storage.from('renders-uploads').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('renders-uploads').getPublicUrl(fileName);
      setUploadedImageUrl(data.publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar imagem. Verifique o bucket no Supabase.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl || !promptText || !session) return;
    if (credits !== null && credits < 1) { alert('Créditos insuficientes!'); return; }

    setIsGenerating(true);
    setGeneratedImageUrl('');
    setGenerateStatus('Enviando para FAL.ai...');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, imageUrl: uploadedImageUrl }),
      });

      setGenerateStatus('Aguardando render (10–20s)...');
      const data = await res.json();

      if (data.output?.[0]) {
        setGeneratedImageUrl(data.output[0]);
        // Decrementa crédito
        await supabase
          .from('profiles')
          .update({ credits: (credits ?? 1) - 1 })
          .eq('id', session.user.id);
        fetchCredits(session.user.id);
      } else {
        alert(data.error || 'Erro na geração. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro na geração:', err);
      alert('Erro ao gerar render.');
    } finally {
      setIsGenerating(false);
      setGenerateStatus('');
    }
  };

  if (loading && !session) return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center text-aura-sub text-xs">
      Carregando Aura3D...
    </div>
  );
  if (!session) return <Auth />;

  return (
    <main className="min-h-screen bg-aura-bg text-aura-text flex flex-col antialiased">

      {/* HEADER */}
      <header className="h-16 border-b border-aura-border bg-aura-card/50 flex items-center justify-between px-6 backdrop-blur-md z-10 sticky top-0">
        <img src="/logo.svg" alt="Aura3D" className="h-6 w-auto" />
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-aura-sub text-xs">Créditos:</span>
            <span className="font-bold bg-aura-border px-3 py-0.5 rounded-full text-white text-xs">{credits ?? 0}</span>
          </div>
          <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-medium px-4 py-1.5 rounded-xl text-xs cursor-pointer">
            Comprar Créditos
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-aura-sub hover:text-white text-xs cursor-pointer">
            Sair
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-64 border-r border-aura-border bg-aura-card/10 p-4 flex flex-col gap-2 shrink-0 hidden md:flex z-[5] sticky top-16 h-[calc(100vh-64px)]">
          <button className="w-full text-left bg-aura-card border border-aura-border text-white px-4 py-3 rounded-2xl text-xs font-medium cursor-pointer flex items-center gap-2.5">
            <PlusSquare size={16} className="text-indigo-400" /> ✨ Gerar Renders
          </button>
          <button className="w-full text-left text-aura-sub hover:text-white hover:bg-aura-card/20 px-4 py-3 rounded-2xl text-xs cursor-pointer">🔍 Upscale 4K/8K</button>
          <button className="w-full text-left text-aura-sub hover:text-white hover:bg-aura-card/20 px-4 py-3 rounded-2xl text-xs cursor-pointer">🎬 Animar Vídeo</button>
        </aside>

        <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 p-6 gap-6 overflow-y-auto content-start">

          {/* PAINEL 1: CONFIGURAÇÃO */}
          <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase mb-1">Configurar Render</h2>
              <p className="text-xs text-aura-sub">Ajuste os parâmetros para a IA.</p>
            </div>
            <hr className="border-aura-border" />

            {/* UPLOAD */}
            <div className="flex flex-col gap-2">
              <label htmlFor="upload" className="text-xs font-medium text-aura-sub">Croqui (SketchUp, Revit, Archicad...)</label>
              <input id="upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()}
                className={\`w-full aspect-[16/10] bg-aura-bg/60 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 gap-3 cursor-pointer transition-all \${
                  isUploading ? 'border-purple-600' : selectedFile ? 'border-indigo-500 bg-indigo-950/20' : 'border-aura-border hover:border-aura-sub/60'
                }\`}>
                {selectedFile ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Croqui" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload size={28} className="text-aura-sub/80" />
                    <p className="text-xs text-aura-sub text-center max-w-[200px]">Exporte do SketchUp como PNG/JPG e importe aqui</p>
                    <span className="text-purple-400 text-[11px] bg-purple-950/40 px-3 py-1 rounded-full">
                      {isUploading ? '📤 Enviando...' : '+ Adicionar croqui'}
                    </span>
                  </>
                )}
              </div>
              {uploadedImageUrl && !isUploading && <p className="text-[10px] text-emerald-400">✓ Croqui pronto para render</p>}
            </div>

            {/* AMBIENTE */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-aura-sub">Tipo de Ambiente</span>
              <div className="grid grid-cols-2 gap-2 bg-aura-bg p-1.5 rounded-2xl border border-aura-border">
                {(['interna', 'externa'] as const).map((v) => (
                  <button key={v} onClick={() => setAmbientType(v)}
                    className={\`py-3 rounded-xl text-xs font-medium transition-all cursor-pointer \${ambientType === v ? 'bg-aura-card border border-aura-border text-white' : 'text-aura-sub hover:text-white'}\`}>
                    {v === 'interna' ? 'Cena Interna' : 'Cena Externa'}
                  </button>
                ))}
              </div>
            </div>

            {/* ILUMINAÇÃO */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-aura-sub">Iluminação</span>
              <div className="grid grid-cols-3 gap-2">
                {([{ v: 'diurna', l: 'Diurna', I: Sun }, { v: 'noturna', l: 'Noturna', I: Moon }, { v: 'hora', l: 'Definir Hora', I: Clock }] as const).map(({ v, l, I }) => (
                  <button key={v} onClick={() => setLighting(v)}
                    className={\`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-xs cursor-pointer transition-all \${lighting === v ? 'border-purple-500 bg-purple-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}\`}>
                    <I size={16} /><span>{l}</span>
                  </button>
                ))}
              </div>
              {lighting === 'hora' && (
                <div className="flex items-center gap-3 bg-aura-bg border border-aura-border rounded-xl px-4 py-2.5">
                  <label htmlFor="time" className="text-xs text-aura-sub">Horário:</label>
                  <input id="time" type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)}
                    className="bg-aura-card border border-aura-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500" />
                </div>
              )}
            </div>

            {/* ENTORNO */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-aura-sub">Entorno (Fundo da Cena)</span>
              <div className="grid grid-cols-3 gap-2">
                {([{ v: 'residencial', l: 'Residencial', I: HomeIcon }, { v: 'vegetacao', l: 'Vegetação', I: Trees }, { v: 'litoral', l: 'Mar/Praia', I: Waves }] as const).map(({ v, l, I }) => (
                  <button key={v} onClick={() => setBackground(v)}
                    className={\`flex items-center gap-2 p-3.5 rounded-xl border text-xs cursor-pointer transition-all \${background === v ? 'border-indigo-500 bg-indigo-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}\`}>
                    <I size={14} /><span>{l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PAINEL 2: PROMPT E RESULTADO */}
          <div className="flex flex-col gap-6">

            {/* ESTILO */}
            <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex flex-col gap-4">
              <span className="text-xs font-medium text-aura-sub">Estilo Arquitetônico</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['moderna', 'rústica', 'industrial', 'minimalista', 'clássica'].map((s) => (
                  <button key={s} onClick={() => setStyleType(s)}
                    className={\`py-3 px-2 rounded-xl border text-[11px] font-medium capitalize cursor-pointer text-center transition-all \${styleType === s ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}\`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* PROMPT */}
            <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <label htmlFor="prompt" className="text-xs font-medium text-white block mb-1">Prompt Simples</label>
                <p className="text-[11px] text-aura-sub">Descreva materiais, acabamentos, clima e detalhes.</p>
              </div>
              <textarea id="prompt" value={promptText} onChange={(e) => setPromptText(e.target.value)}
                placeholder="Fachada em concreto ripado, esquadrias em madeira de lei, jardim com bambus, piscina infinita..."
                className="w-full h-32 bg-aura-bg border border-aura-border rounded-2xl p-4 text-xs text-white placeholder:text-neutral-700 focus:outline-none focus:border-purple-500 resize-none" />
              <button onClick={handleOptimize} disabled={isOptimizing || !promptText}
                className="w-full bg-aura-card border border-aura-border hover:border-aura-sub/60 transition-all text-white font-medium text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50">
                <Wand2 size={16} className="text-purple-400" />
                {isOptimizing ? '✨ Otimizando com GPT-4o...' : '✨ Otimizar Prompt com IA'}
              </button>
            </div>

            {/* RESULTADO */}
            <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex-1 flex flex-col gap-4">
              <div>
                <span className="text-xs font-medium text-white block">Render Fotorrealista</span>
                <p className="text-[11px] text-aura-sub">FAL.ai preserva a estrutura do croqui e aplica materiais reais.</p>
              </div>

              {generatedImageUrl ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-aura-sub font-medium uppercase tracking-wide">Croqui</span>
                      <div className="bg-aura-bg border border-aura-border rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                        {selectedFile && <img src={URL.createObjectURL(selectedFile)} alt="Croqui" className="w-full h-full object-contain" />}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-aura-sub font-medium uppercase tracking-wide">Render FAL.ai</span>
                      <div className="bg-aura-bg border border-aura-border rounded-xl overflow-hidden aspect-[4/3]">
                        <img src={generatedImageUrl} alt="Render" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>
                  <a href={generatedImageUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 text-center">
                    ↗ Abrir render em tamanho completo
                  </a>
                </div>
              ) : (
                <div className="w-full flex-1 bg-aura-bg border border-aura-border rounded-2xl flex flex-col items-center justify-center p-6 gap-2 text-center text-aura-sub min-h-[160px]">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs animate-pulse">{generateStatus || 'Gerando render...'}</p>
                    </div>
                  ) : (
                    <><ImageIcon size={28} className="text-aura-sub/40" /><p className="text-xs">O render aparecerá aqui.</p></>
                  )}
                </div>
              )}

              {credits !== null && credits < 1 ? (
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-3 rounded-xl cursor-pointer">
                  💸 Comprar Créditos
                </button>
              ) : (
                <button onClick={handleGenerate}
                  disabled={isGenerating || isUploading || isOptimizing || !uploadedImageUrl || !promptText}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:opacity-90 disabled:opacity-50 text-white font-medium text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]">
                  <ImageIcon size={16} />
                  {isGenerating ? \`🖌️ \${generateStatus || 'Gerando...'}\` : '📸 Gerar Render Real (-1 Crédito)'}
                </button>
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
`);

// ─────────────────────────────────────────────
// public/logo.svg
// ─────────────────────────────────────────────
write('public/logo.svg', `<svg width="654" height="137" viewBox="0 0 654 137" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M410.821 1.64999L464.671 132.9H445.021L405.121 36.15L404.821 35.1V35.25V35.1V35.25L404.671 35.1L404.371 36.15L364.621 132.9H344.971L398.821 1.64999H410.821Z" fill="#F5F5F5"/>
<path d="M290.788 78.75C305.638 78.75 317.938 66.15 317.938 48.3C317.938 30.6 305.638 17.85 290.788 17.85H240.088V1.64999H259.438H290.938C316.738 1.95 337.288 21.9 337.288 48.3C337.288 68.25 325.738 84.3 309.088 91.35L337.288 132.9H315.838L290.038 94.8H259.438V132.9H240.088V78.75H290.788Z" fill="#F5F5F5"/>
<path d="M232.595 52.8V79.8C232.595 100.95 224.195 132.9 180.095 132.9C135.995 132.9 127.295 100.95 127.295 79.8V0H146.645V79.8C146.645 87.6 148.445 116.85 180.095 116.85C211.745 116.85 213.095 87.6 213.095 79.8V52.8H232.595Z" fill="#F5F5F5"/>
<path d="M65.85 1.64999L119.7 132.9H100.05L60.15 36.15L59.85 35.1V35.25V35.1V35.25L59.7 35.1L59.4 36.15L19.65 132.9H0L53.85 1.64999H65.85Z" fill="#F5F5F5"/>
<path d="M590.698 1.64999C625.498 1.95 653.698 31.35 653.698 67.35C653.698 103.5 625.498 132.75 590.698 132.9H562.048V116.85H590.398C601.948 116.85 612.898 111.9 621.148 102.75C629.548 93.3 634.198 80.85 634.198 67.35C634.198 54 629.548 41.4 621.148 32.1C612.898 22.95 601.948 17.85 590.398 17.85H562.048V1.64999H590.698Z" fill="url(#paint0_linear_130_56)"/>
<path d="M541.385 55.44C547.385 59.4 552.125 64.62 555.605 71.1C559.205 77.46 561.005 84.48 561.005 92.16C561.005 98.28 559.865 104.04 557.585 109.44C555.305 114.72 552.185 119.34 548.225 123.3C544.265 127.26 539.585 130.38 534.185 132.66C528.905 134.94 523.205 136.08 517.085 136.08C508.805 136.08 501.125 133.92 494.045 129.6C488.405 126.12 483.725 121.56 480.005 115.92C476.405 110.28 474.185 103.98 473.345 97.02H490.265H490.805C490.805 98.46 490.985 99.78 491.345 100.98C492.305 103.86 493.685 106.5 495.485 108.9C497.405 111.3 499.625 113.34 502.145 115.02C506.705 117.9 511.685 119.34 517.085 119.34C520.805 119.34 524.345 118.62 527.705 117.18C531.065 115.74 533.945 113.82 536.345 111.42C538.865 109.02 540.845 106.2 542.285 102.96C543.725 99.6 544.445 96 544.445 92.16C544.445 88.44 543.725 84.9 542.285 81.54C540.845 78.18 538.865 75.3 536.345 72.9C533.945 70.38 531.065 68.4 527.705 66.96C524.345 65.52 520.805 64.8 517.085 64.8C513.005 64.8 508.925 65.76 504.845 67.68L511.865 51.84L513.485 48.24L526.085 19.62H480.545V3.96001H552.005L530.945 50.4C534.785 51.72 538.265 53.4 541.385 55.44Z" fill="url(#paint1_linear_130_56)"/>
<defs>
<linearGradient id="paint0_linear_130_56" x1="611.633" y1="12.9" x2="611.633" y2="162.9" gradientUnits="userSpaceOnUse">
<stop stop-color="#6366F1"/><stop offset="1" stop-color="#A855F7"/>
</linearGradient>
<linearGradient id="paint1_linear_130_56" x1="517.133" y1="0.900014" x2="517.133" y2="116.9" gradientUnits="userSpaceOnUse">
<stop stop-color="#6366F1"/><stop offset="1" stop-color="#A855F7"/>
</linearGradient>
</defs>
</svg>`);

// ─────────────────────────────────────────────
// Done!
// ─────────────────────────────────────────────
console.log(`
✅ Projeto criado com sucesso!

Próximos passos:
  1. npm install
  2. Copie .env.example para .env.local e preencha com suas chaves:
       FAL_KEY          → fal.ai → Dashboard → API Keys
       OPENAI_API_KEY   → platform.openai.com → API Keys
       NEXT_PUBLIC_SUPABASE_URL e ANON_KEY → app.supabase.com → Settings → API
  3. No Supabase, crie o bucket público "renders-uploads" em Storage
  4. npm run dev   → abre em http://localhost:3000
  5. Para deploy: npx vercel (adicione as mesmas env vars lá)

Supabase SQL (rode no SQL Editor do Supabase):
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    credits INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);
