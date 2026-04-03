function login() {
  const email = document.getElementById("email").value
  const senha = document.getElementById("senha").value

  const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"))

  if (!usuarioSalvo) {
    alert("Usuário não encontrado!")
    return
  }

  if (email === usuarioSalvo.email && senha === usuarioSalvo.senha) {
    localStorage.setItem("logado", "true")
    window.location.href = "dashboard.html"
  } else {
    alert("Email ou senha incorretos!")
  }
}

function irCadastro() {
  window.location.href = "cadastro.html"
}

function cadastrar() {
  const email = document.getElementById("email").value
  const senha = document.getElementById("senha").value

  const usuario = { email, senha }

  localStorage.setItem("usuario", JSON.stringify(usuario))

  alert("Conta criada!")
  window.location.href = "index.html"
}

function verificarLogin() {
  const logado = localStorage.getItem("logado")

  if (!logado) {
    window.location.href = "index.html"
  }
}

function irNovaTarefa() {
  window.location.href = "nova-tarefa.html"
}

// LISTAR TAREFAS
function carregarTarefas() {
  const lista = document.getElementById("listaTarefas")
  if (!lista) return

  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || []

  lista.innerHTML = ""

  tarefas.forEach((tarefa, index) => {
    const div = document.createElement("div")
    div.className = "card"

    div.innerHTML = `
      <p><strong>${tarefa.nome}</strong></p>
      <p>${tarefa.categoria}</p>
      <button onclick="removerTarefa(${index})">Excluir</button>
    `

    lista.appendChild(div)
  })
}

function removerTarefa(index) {
  let tarefas = JSON.parse(localStorage.getItem("tarefas")) || []

  tarefas.splice(index, 1)

  localStorage.setItem("tarefas", JSON.stringify(tarefas))

  carregarTarefas()
}

function salvarTarefa() {
  const nome = document.getElementById("nome").value
  const categoria = document.getElementById("categoria").value

  const nova = { nome, categoria }

  let tarefas = JSON.parse(localStorage.getItem("tarefas")) || []

  tarefas.push(nova)

  localStorage.setItem("tarefas", JSON.stringify(tarefas))

  window.location.href = "dashboard.html"
}

// TIMER
let segundos = 0
let intervalo = null

function formatarTempo(seg) {
  const h = String(Math.floor(seg / 3600)).padStart(2, '0')
  const m = String(Math.floor((seg % 3600) / 60)).padStart(2, '0')
  const s = String(seg % 60).padStart(2, '0')

  return `${h}:${m}:${s}`
}

function iniciarTimer() {
  if (intervalo) return

  intervalo = setInterval(() => {
    segundos++
    document.getElementById("tempo").innerText = formatarTempo(segundos)
  }, 1000)
}

function pararTimer() {
  clearInterval(intervalo)
  intervalo = null

  salvarSessao()
}

function carregarSelectTarefas() {
  const select = document.getElementById("tarefasSelect")
  if (!select) return

  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || []

  tarefas.forEach((tarefa, index) => {
    const option = document.createElement("option")
    option.value = index
    option.textContent = tarefa.nome
    select.appendChild(option)
  })
}

function salvarSessao() {
  const select = document.getElementById("tarefasSelect")
  const tarefaIndex = select.value

  let sessoes = JSON.parse(localStorage.getItem("sessoes")) || []

  const novaSessao = {
    tarefaIndex: tarefaIndex,
    tempo: segundos,
    data: new Date().toLocaleDateString()
  }

  sessoes.push(novaSessao)

  localStorage.setItem("sessoes", JSON.stringify(sessoes))

  alert("Tempo salvo!")

  segundos = 0
  document.getElementById("tempo").innerText = "00:00:00"
}


function carregarGrafico() {
  const canvas = document.getElementById("graficoTarefas")
  if (!canvas) return

  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || []
  const sessoes = JSON.parse(localStorage.getItem("sessoes")) || []

  const tempoPorTarefa = {}

  sessoes.forEach(sessao => {
    const tarefa = tarefas[sessao.tarefaIndex]

    if (!tarefa) return

    const nome = tarefa.nome

    tempoPorTarefa[nome] = (tempoPorTarefa[nome] || 0) + sessao.tempo
  })

  const labels = Object.keys(tempoPorTarefa)
  const dados = Object.values(tempoPorTarefa)

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tempo (segundos)',
        data: dados
      }]
    }
  })
}

function mostrarTop() {
  const elemento = document.getElementById("topMateria")
  if (!elemento) return // 🔥 impede de rodar em outras páginas

  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || []
  const sessoes = JSON.parse(localStorage.getItem("sessoes")) || []

  const tempoPorCategoria = {}

  sessoes.forEach(sessao => {
    const tarefa = tarefas[sessao.tarefaIndex]
    if (!tarefa) return

    const categoria = tarefa.categoria

    tempoPorCategoria[categoria] = (tempoPorCategoria[categoria] || 0) + sessao.tempo
  })

  let maior = 0
  let top = "Nenhuma ainda"

  for (let cat in tempoPorCategoria) {
    if (tempoPorCategoria[cat] > maior) {
      maior = tempoPorCategoria[cat]
      top = cat
    }
  }

  elemento.innerHTML = `<strong>Matéria mais estudada:</strong> ${top}`
}

// tempo total
function calcularTempoTotal() {
  const el = document.getElementById("tempoTotal")
  if (!el) return

  const sessoes = JSON.parse(localStorage.getItem("sessoes")) || []

  const total = sessoes.reduce((acc, s) => acc + s.tempo, 0)

  el.innerHTML = `<strong>Tempo total:</strong> ${formatarTempo(total)}`
}

//dia mais produtivo
function calcularDiaTop() {
  const el = document.getElementById("diaTop")
  if (!el) return

  const sessoes = JSON.parse(localStorage.getItem("sessoes")) || []

  const tempoPorDia = {}

  sessoes.forEach(s => {
    tempoPorDia[s.data] = (tempoPorDia[s.data] || 0) + s.tempo
  })

  let maior = 0
  let melhorDia = "Nenhum"

  for (let dia in tempoPorDia) {
    if (tempoPorDia[dia] > maior) {
      maior = tempoPorDia[dia]
      melhorDia = dia
    }
  }

  el.innerHTML = `<strong>Dia mais produtivo:</strong> ${melhorDia}`
}

//média diária
function calcularMediaDiaria() {
  const el = document.getElementById("mediaDiaria")
  if (!el) return

  const sessoes = JSON.parse(localStorage.getItem("sessoes")) || []

  const tempoPorDia = {}

  sessoes.forEach(s => {
    tempoPorDia[s.data] = (tempoPorDia[s.data] || 0) + s.tempo
  })

  const dias = Object.keys(tempoPorDia).length

  if (dias === 0) {
    el.innerText = "Média diária: 0"
    return
  }

  const total = Object.values(tempoPorDia).reduce((a, b) => a + b, 0)

  const media = total / dias

  el.innerHTML = `<strong>Média diária:</strong> ${formatarTempo(Math.floor(media))}`
}

function carregarPerfil() {
  const el = document.getElementById("emailUsuario")
  if (!el) return

  const usuario = JSON.parse(localStorage.getItem("usuario"))

  if (usuario) {
    el.innerHTML = `<strong>Email:</strong> ${usuario.email}`
  }
}



// RODAR AUTOMÁTICO
verificarLogin()
carregarTarefas()
carregarSelectTarefas()
carregarGrafico()
mostrarTop()
calcularTempoTotal()
calcularDiaTop()
calcularMediaDiaria()
carregarPerfil()