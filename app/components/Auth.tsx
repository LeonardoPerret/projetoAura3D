'use client';

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
        // Fluxo de Cadastro
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Redireciona de volta para o app após confirmar e-mail (se ativado)
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar (se ativo no Supabase) ou tente fazer login.' });
      } else {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro na autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-bg flex flex-col items-center justify-center p-4 antialiased">
      {/* Container do Card */}
      <div className="w-full max-w-md bg-aura-card border border-aura-border rounded-2xl p-8 shadow-2xl">
        
        {/* Logo Centralizada */}
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Aura3D Logo" className="h-8 w-auto" />
        </div>

        <h2 className="text-xl font-semibold text-center mb-2 text-white">
          {isSignUp ? 'Criar sua conta' : 'Acesse a plataforma'}
        </h2>
        <p className="text-xs text-aura-sub text-center mb-6">
          {isSignUp ? 'Comece a gerar renders fotorealistas hoje mesmo.' : 'Entre com suas credenciais para gerenciar seus projetos.'}
        </p>

        {/* Mensagens de Feedback */}
        {message && (
          <div className={`p-3 rounded-lg text-xs mb-4 text-center border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-aura-sub block mb-1">E-mail profissional</label>
            <input
              type="email"
              required
              placeholder="exemplo@arquiteto.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-neutral-700"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-aura-sub block mb-1">Sua senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-neutral-700"
            />
          </div>

          {/* Botão com o degradê Ultravioleta estilizado via Tailwind v4 inline */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 cursor-pointer font-medium text-sm text-white py-2.5 rounded-lg transition-transform active:scale-98 disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-purple-950/20"
          >
            {loading ? 'Processando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        {/* Alternador de Modo */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="text-xs text-aura-sub hover:text-white transition-colors underline decoration-aura-border underline-offset-4"
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>

      </div>
    </div>
  );
}