/**
 * guard.js
 * Middleware de proteção de rotas.
 * Verifica se o usuário está autenticado; caso contrário, redireciona para o login.
 */

import { supabase } from './supabase.js';

/**
 * Função assíncrona que protege páginas que exigem autenticação.
 * Deve ser chamada no início de cada página restrita.
 */
export async function protegerPagina() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    window.location.href = 'index.html';
  }
}