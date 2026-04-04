import { supabase } from './supabase.js'

// LOGIN
window.login = async () => {
  const email = document.getElementById('email').value
  const senha = document.getElementById('senha').value
  const erroEl = document.getElementById('erro')

  erroEl.innerText = ""

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })

  if (error) {
    erroEl.innerText = "Email ou senha inválidos"
    return
  }

  window.location.href = "dashboard.html"
}

// REDIRECIONAR
window.irCadastro = () => {
  window.location.href = "cadastro.html"
}

// CADASTRO
window.cadastrar = async () => {
  const email = document.getElementById('email').value
  const senha = document.getElementById('senha').value
  const erroEl = document.getElementById('erro')

  erroEl.innerText = ""

  const { error } = await supabase.auth.signUp({
    email,
    password: senha
  })

  if (error) {
    erroEl.innerText = error.message
    return
  }

  alert("Conta criada!")
  window.location.href = "index.html"
}

// VOLTAR LOGIN
window.irLogin = () => {
  window.location.href = "index.html"
}