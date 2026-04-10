/**
 * supabase.js
 * Configuração e exportação do cliente Supabase.
 * 
 * O Supabase é utilizado como backend (autenticação e banco de dados).
 * As credenciais abaixo são públicas (chave anônima) e seguras para uso no front-end.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://sklhhrlcstwrkxcokxup.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PikgliQgLHyM4sIPlQflcA_waQt-dAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);