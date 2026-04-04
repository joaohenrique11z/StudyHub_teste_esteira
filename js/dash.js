import { supabase } from './supabase.js'
import { carregarTarefas } from './tasks.js'

// =========================
// 📅 DATA ATUAL GLOBAL
// =========================
let dataAtual = new Date().toLocaleDateString("en-CA")

const inputData = document.getElementById("dataFiltro")

if (inputData) {
  inputData.value = dataAtual

  inputData.addEventListener("change", () => {
    dataAtual = inputData.value

    carregarTarefas(dataAtual)
    carregarTempoFoco()
    carregarProgressoTasks()
    limparTaskSelecionada()
  })
}

// =========================
// ⏰ HORÁRIO
// =========================
function pegarHorarioAtual() {
  const agora = new Date()

  const horas = String(agora.getHours()).padStart(2, '0')
  const minutos = String(agora.getMinutes()).padStart(2, '0')
  const segundos = String(agora.getSeconds()).padStart(2, '0')

  return `${horas}:${minutos}:${segundos}`
}

function atualizarHorario() {
  const el = document.getElementById("horarioAtual")
  if (el) el.innerText = pegarHorarioAtual()
}

setInterval(atualizarHorario, 1000)

// =========================
// ⏱️ TIMER
// =========================
let tempo = 0
let intervalo = null
let rodando = false

function formatarTempo(segundos) {
  const h = String(Math.floor(segundos / 3600)).padStart(2, "0")
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0")
  const s = String(segundos % 60).padStart(2, "0")

  return `${h}:${m}:${s}`
}

const btnIniciar = document.getElementById("btnIniciar")
const display = document.getElementById("timer")

if (btnIniciar) {
  btnIniciar.addEventListener("click", () => {
    if (!rodando) {
      intervalo = setInterval(() => {
        tempo++
        display.innerText = formatarTempo(tempo)
      }, 1000)

      rodando = true
      btnIniciar.innerText = "Pausar"
    } else {
      clearInterval(intervalo)
      rodando = false
      btnIniciar.innerText = "Continuar"
    }
  })
}

// =========================
// 💾 SALVAR SESSÃO
// =========================
const btnSalvar = document.getElementById("btnSalvar")

if (btnSalvar) {
  btnSalvar.addEventListener("click", async () => {
    const task = JSON.parse(localStorage.getItem("taskSelecionada"))

    if (!task) {
      alert("Selecione uma tarefa primeiro!")
      return
    }

    if (tempo === 0) {
      alert("Tempo inválido!")
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const user = userData.user

    const { error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        task_id: task.id,
        subject: task.subject,
        category: task.category,
        duration: tempo,
        date_local: dataAtual
      })

    if (error) {
      console.error(error)
      alert("Erro ao salvar sessão")
      return
    }

    tempo = 0
    display.innerText = "00:00:00"

    await carregarTempoFoco()
  })
}

// =========================
// 🔥 TEMPO DE FOCO
// =========================
async function carregarTempoFoco() {
  const el = document.getElementById("tempoFoco")
  if (!el) return

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  const user = userData.user

  const { data, error } = await supabase
    .from("study_sessions")
    .select("duration")
    .eq("user_id", user.id)
    .eq("date_local", dataAtual)

  if (error) {
    console.error(error)
    return
  }

  const total = data.reduce((acc, s) => acc + s.duration, 0)
  el.innerText = formatarTempo(total)
}

// =========================
// 📊 PROGRESSO TASKS
// =========================
async function carregarProgressoTasks() {
  const el = document.getElementById("tasksProgresso")
  if (!el) return

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  const user = userData.user

  const { data, error } = await supabase
    .from("tasks")
    .select("completed")
    .eq("user_id", user.id)
    .eq("date_local", dataAtual)

  if (error) {
    console.error(error)
    return
  }

  const total = data.length
  const concluidas = data.filter(t => t.completed).length

  const porcentagem = total === 0
    ? 0
    : Math.round((concluidas / total) * 100)

  el.innerText = `${concluidas}/${total} (${porcentagem}%)`
}

// =========================
// 🎯 TASK SELECIONADA
// =========================
function limparTaskSelecionada() {
  localStorage.removeItem("taskSelecionada")

  const el = document.getElementById("taskSelecionada")
  if (el) {
    el.innerText = "Selecione uma Tarefa"
  }
}

// =========================
// 🔄 EVENTOS
// =========================
document.addEventListener("tasksUpdated", () => {
  carregarProgressoTasks()
})

function carregarTaskSelecionada() {
  const task = JSON.parse(localStorage.getItem("taskSelecionada"))
  const el = document.getElementById("taskSelecionada")

  if (!el) return

  if (!task) {
    el.innerHTML = `<div class="task-selected-empty">Selecione uma Tarefa</div>`
    return
  }

  el.innerHTML = `
    <div class="selected-title">${task.title}</div>

    <div class="selected-badges">
      <span class="badge badge-category">${task.category}</span>
      <span class="badge ${task.urgency === "alta" ? "badge-high" :
        task.urgency === "media" ? "badge-medium" : "badge-low"}">
        ${task.urgency}
      </span>
    </div>

    <div class="selected-info">
      <span>📚 ${task.subject || "Sem matéria"}</span>
    </div>

    ${task.notes ? `<div class="selected-notes">${task.notes}</div>` : ""}
  `
}

// =========================
// 🚀 INIT
// =========================
carregarTarefas(dataAtual)
carregarTempoFoco()
carregarProgressoTasks()
atualizarHorario()
carregarTaskSelecionada()