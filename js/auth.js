/**
 * auth.js
 * Gerencia autenticação de usuários: login, cadastro e logout.
 * Todas as funções são expostas globalmente para serem chamadas nos eventos onclick.
 */

import { supabase } from './supabase.js';

/**
 * Realiza o login do usuário com email e senha.
 * Em caso de sucesso, redireciona para o dashboard.
 */
window.login = async () => {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const erroEl = document.getElementById('erro');
  erroEl.innerText = '';

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    erroEl.innerText = 'Email ou senha inválidos';
    return;
  }
  window.location.href = 'dashboard.html';
};

/** Redireciona para a página de cadastro. */
window.irCadastro = () => window.location.href = 'cadastro.html';

/**
 * Cria uma nova conta de usuário.
 * Após o cadastro, exibe mensagem de sucesso e redireciona para o login.
 */
window.cadastrar = async () => {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const erroEl = document.getElementById('erro');
  erroEl.innerText = '';

  const { error } = await supabase.auth.signUp({ email, password: senha });
  if (error) {
    erroEl.innerText = error.message;
    return;
  }
  alert('Conta criada! Faça login.');
  window.location.href = 'index.html';
};

/** Redireciona para a página de login. */
window.irLogin = () => window.location.href = 'index.html';

/** Realiza o logout do usuário. */
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
};