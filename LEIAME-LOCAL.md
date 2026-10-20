# Rodando o Aura3D localmente

1. **Supabase:** rode `supabase/001_creditos_e_seguranca.sql` no SQL Editor (Parte A).
   Dê créditos à sua conta de teste (última seção do arquivo).
2. **Variáveis:** copie `.env.example` para `.env.local` e preencha
   (Windows: `copy .env.example .env.local` | Mac/Linux: `cp .env.example .env.local`).
3. **Dependências e execução** (Node.js 20 ou superior):
   ```
   npm install
   npm run dev
   ```
4. Abra http://localhost:3000, faça login, envie uma imagem e gere.

Se o upload falhar com "violates row-level security", confira se a Parte A do SQL rodou inteira.
