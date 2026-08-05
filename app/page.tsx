'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from './utils/supabase';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js'; // IMPORTAÇÃO DO TIPO OFICIAL
import { Sun, Moon, Clock, Home as HomeIcon, Trees, Waves, Upload, Wand2, PlusSquare, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS DO CONFIGURADOR DE RENDER
  const [ambientType, setAmbientType] = useState<'interna' | 'externa'>('externa');
  const [styleType, setStyleType] = useState<string>('moderna');
  const [lighting, setLighting] = useState<'diurna' | 'noturna' | 'hora'>('diurna');
  const [customTime, setCustomTime] = useState<string>('12:00');
  const [background, setBackground] = useState<string>('residencial');

  // ESTADOS DO PROMPT E IMAGEM
  const [promptText, setPromptText] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // CORREÇÃO: Declarada ANTES do useEffect e com useCallback para evitar loops de render
  const fetchCredits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) setCredits(data.credits);
    } catch (error) {
      console.error('Erro ao buscar créditos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: stop loading spinner if Supabase connection hangs
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        if (session) {
          fetchCredits(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao conectar ao Supabase:', err);
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        fetchCredits(session.user.id);
      } else {
        setCredits(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [fetchCredits]);

  const handleOptimize = async () => {
    if (!promptText) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptText, 
          ambient: ambientType, 
          style: styleType, 
          lighting: lighting 
        }),
      });
      
      const data = await res.json();
      if (data && data.text) setPromptText(data.text);
    } catch (error) { 
      console.error("Erro na otimização do frontend:", error); 
    } finally { 
      setIsOptimizing(false); 
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      handleUploadToSupabase(file);
    }
  };

  const handleUploadToSupabase = async (file: File) => {
    if (!file || !session) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('images-uploads')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('images-uploads')
        .getPublicUrl(filePath);

      setUploadedImageUrl(publicData.publicUrl);
    } catch (error) { 
      console.error("Erro no upload do arquivo:", error); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl || !promptText || !session) return;
    if (credits === null || credits < 1) { alert("Você não tem créditos suficientes!"); return; }

    setIsGenerating(true);
    setGeneratedImageUrl('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: promptText, imageUrl: uploadedImageUrl }),
      });

      const data = await res.json();
      if (data.output && data.output[0]) {
        setGeneratedImageUrl(data.output[0]);
      } else { 
        alert("Erro na geração da imagem. Tente novamente."); 
      }
    } catch (error) { 
      console.error("Erro na geração de imagem:", error); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  if (loading && !session) return <div className="min-h-screen bg-aura-bg flex items-center justify-center text-aura-sub text-xs">Carregando Aura3D...</div>;
  if (!session) return <Auth />;

  return (
    <main className="min-h-screen bg-aura-bg text-aura-text flex flex-col antialiased">
      
      {/* HEADER */}
      <header className="h-16 border-b border-aura-border bg-aura-card/50 flex items-center justify-between px-6 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Aura3D Logo" className="h-6 w-auto" />
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-aura-sub text-xs">Seus Créditos:</span>
            <span className="font-bold bg-aura-border px-3 py-0.5 rounded-full text-white text-xs">{credits ?? 0}</span>
          </div>
          <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-medium px-4 py-1.5 rounded-xl text-xs cursor-pointer transition-all active:scale-99">Comprar mais Créditos</button>
          <button onClick={() => supabase.auth.signOut()} className="text-aura-sub hover:text-white transition-colors text-xs cursor-pointer">Sair</button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* NAV LATERAL ESQUERDA */}
        <aside className="w-64 border-r border-aura-border bg-aura-card/10 p-4 flex flex-col gap-2 shrink-0 hidden md:flex z-5 sticky top-16 h-[calc(100vh-64px)]">
          <button className="w-full text-left bg-aura-card border border-aura-border text-white px-4 py-3 rounded-2xl text-xs font-medium cursor-pointer flex items-center gap-2.5">
            <PlusSquare size={16} className="text-indigo-400" />✨ Gerar Renders
          </button>
          <button className="w-full text-left text-aura-sub hover:text-white hover:bg-aura-card/20 px-4 py-3 rounded-2xl text-xs transition-colors cursor-pointer">🔍 Upscale 4K/8K</button>
          <button className="w-full text-left text-aura-sub hover:text-white hover:bg-aura-card/20 px-4 py-3 rounded-2xl text-xs transition-colors cursor-pointer">🎬 Animar Vídeo</button>
        </aside>

        {/* DASHBOARD GRID */}
        <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 p-6 gap-6 overflow-y-auto">
          
          {/* PAINEL 1: CONFIGURAR E UPLOAD */}
          <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase mb-1">Configurar Render</h2>
              <p className="text-xs text-aura-sub">Ajuste os parâmetros físicos e geográficos para a IA.</p>
            </div>

            <hr className="border-aura-border" />

            {/* A. ÁREA DE UPLOAD */}
            <div className="flex flex-col gap-2">
              <label htmlFor="preview-upload" className="text-xs font-medium text-aura-sub">Importar prévia</label>
              <input id="preview-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-[16/10] bg-aura-bg/60 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 gap-3 cursor-pointer transition-all ${
                  isUploading ? 'border-purple-600' : selectedFile ? 'border-indigo-500 bg-indigo-950/20' : 'border-aura-border hover:border-aura-sub/60 hover:bg-aura-card/30'
                }`}
              >
                {selectedFile ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Prévia do Upload" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload size={28} className="text-aura-sub/80" />
                    <p className="text-xs text-aura-sub text-center max-w-[200px]">Clique ou arraste o print do seu projeto 3D (PNG ou JPG)</p>
                    <span className="text-purple-400 font-medium text-[11px] bg-purple-950/40 px-3 py-1 rounded-full">{isUploading ? '📤 Enviando...' : '+ Adicionar'}</span>
                  </>
                )}
              </div>
            </div>

            {/* B. TIPO DE AMBIENTE */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-aura-sub">Tipo de Ambiente</span>
              <div className="grid grid-cols-2 gap-2 bg-aura-bg p-1.5 rounded-2xl border border-aura-border">
                <button onClick={() => setAmbientType('interna')} className={`py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${ambientType === 'interna' ? 'bg-aura-card border border-aura-border text-white shadow-md' : 'text-aura-sub hover:text-white'}`}>Cena Interna</button>
                <button onClick={() => setAmbientType('externa')} className={`py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${ambientType === 'externa' ? 'bg-aura-card border border-aura-border text-white shadow-md' : 'text-aura-sub hover:text-white'}`}>Cena Externa</button>
              </div>
            </div>

            {/* C. ILUMINAÇÃO */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-aura-sub">Iluminação</span>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setLighting('diurna')} className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${lighting === 'diurna' ? 'border-purple-500 bg-purple-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}><Sun size={16} /><span>Diurna</span></button>
                <button onClick={() => setLighting('noturna')} className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${lighting === 'noturna' ? 'border-purple-500 bg-purple-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}><Moon size={16} /><span>Noturna</span></button>
                <button onClick={() => setLighting('hora')} className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${lighting === 'hora' ? 'border-purple-500 bg-purple-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}><Clock size={16} /><span>Definir Hora</span></button>
              </div>
              {lighting === 'hora' && (
                <div className="mt-2 flex items-center gap-3 bg-aura-bg border border-aura-border rounded-xl px-4 py-2.5 animate-fade-in">
                  <label htmlFor="time-picker" className="text-xs text-aura-sub">Escolha o horário:</label>
                  <input id="time-picker" type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="bg-aura-card border border-aura-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500" />
                </div>
              )}
            </div>

            {/* D. ENTORNO / BACKGROUND */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-aura-sub">Entorno (Fundo da Janela/Cena)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => setBackground('residencial')} className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${background === 'residencial' ? 'border-indigo-500 bg-indigo-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}><HomeIcon size={14} /><span>Residencial</span></button>
                <button onClick={() => setBackground('vegetacao')} className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${background === 'vegetacao' ? 'border-indigo-500 bg-indigo-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}><Trees size={14} /><span>Árvores/Matas</span></button>
                <button onClick={() => setBackground('litoral')} className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${background === 'litoral' ? 'border-indigo-500 bg-indigo-500/5 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}><Waves size={14} /><span>Mar/Praia</span></button>
              </div>
            </div>
          </div>

          {/* PAINEL 2: ESTILOS, PROMPT E RESULTADO */}
          <div className="flex flex-col gap-6">
            
            {/* SELETOR DE ESTILO */}
            <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex flex-col gap-4">
              <div><span className="text-xs font-medium text-aura-sub">Seletor de Estilo Arquitetônico</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {['moderna', 'rústica', 'industrial', 'minimalista', 'clássica'].map((style) => (
                  <button key={style} onClick={() => setStyleType(style)} className={`py-3 px-3.5 rounded-xl border text-[11px] font-medium capitalize cursor-pointer text-center transition-all ${styleType === style ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-aura-border bg-aura-bg text-aura-sub hover:text-white'}`}>{style}</button>
                ))}
              </div>
            </div>

            {/* CAMPO DE PROMPT */}
            <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="prompt-textarea" className="text-xs font-medium text-white">Campo de Texto do Prompt Simples</label>
                <p className="text-[11px] text-aura-sub">Descreva detalhes adicionais (ex: materiais, móveis, clima).</p>
              </div>
              <textarea id="prompt-textarea" value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Casa de praia ao entardecer, iluminação quente, acaba em concreto ripado..." className="w-full h-32 bg-aura-bg border border-aura-border rounded-2xl p-4 text-xs text-white placeholder:text-neutral-700 focus:outline-none focus:border-purple-500 resize-none" />
              <button onClick={handleOptimize} disabled={isOptimizing || isUploading || isGenerating} className="w-full bg-aura-card border border-aura-border hover:border-aura-sub/60 hover:bg-aura-card/60 transition-all text-white font-medium text-xs py-3 rounded-xl shadow-lg shadow-purple-950/20 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50">
                <Wand2 size={16} className="text-purple-400" />
                {isOptimizing ? '✨ Otimizando...' : '✨ Otimizar Prompt com Gemini'}
              </button>
            </div>

            {/* PAINEL DE RESULTADO E BOTÃO GERAL */}
            <div className="bg-aura-card border border-aura-border rounded-2xl p-6 flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-white">Gerar render fotorealista</span>
                <p className="text-[11px] text-aura-sub">Clique abaixo para iniciar a geração da IA.</p>
              </div>

              {/* ÁREA DE VISUALIZAÇÃO DO RENDER FINAL */}
              <div className="w-full flex-1 bg-aura-bg border border-aura-border rounded-2xl flex flex-col items-center justify-center p-6 gap-2 text-center text-aura-sub">
                {generatedImageUrl ? (
                  <img src={generatedImageUrl} alt="Render Final Gerado" className="w-full h-full object-contain rounded-xl" />
                ) : isGenerating ? (
                  <p className="text-xs animate-pulse">🖌️ Pintando seu render arquitetônico... Aguarde (até 20s).</p>
                ) : (
                  <>
                    <ImageIcon size={28} className="text-aura-sub/40" />
                    <p className="text-xs">O resultado do seu render aparecerá aqui.</p>
                  </>
                )}
              </div>

              {/* BOTÃO PRINCIPAL GERAL */}
              {session && (credits === null || credits < 1) ? (
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-3 rounded-xl shadow-lg cursor-pointer transition-all active:scale-99">💸 Ver planos / Comprar mais Créditos</button>
              ) : (
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || isUploading || isOptimizing || !uploadedImageUrl || !promptText}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:opacity-90 disabled:opacity-50 text-white font-medium text-xs py-3 rounded-xl shadow-lg shadow-purple-950/20 cursor-pointer flex items-center justify-center gap-2.5 transition-all active:scale-99"
                >
                  <ImageIcon size={16} />
                  {isGenerating ? '🖌️ Gerando...' : '📸 Gerar Render Fotorealista (-1 Crédito)'}
                </button>
              )}
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}