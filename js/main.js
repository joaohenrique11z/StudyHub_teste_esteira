function verificarLogin() {
  const logado = localStorage.getItem("logado")

  if (!logado) {
    window.location.href = "index.html"
  }
}

function irNovaTarefa() {
  window.location.href = "nova-tarefa.html"
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