import { supabase } from './supabase.js'

/* ========================= */
/* 📅 DATA */
/* ========================= */
function getHoje() {
  return new Date().toLocaleDateString("en-CA")
}

/* ========================= */
/* 🆕 CRIAR TAREFA */
/* ========================= */
window.criarTarefa = async () => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    alert("Usuário não autenticado")
    return
  }

  const hoje = getHoje()

  const tarefa = {
    user_id: user.id,
    title: document.getElementById('titulo').value,
    subject: document.getElementById('materia').value,
    category: document.getElementById('categoria').value,
    urgency: document.getElementById('urgencia').value,
    notes: document.getElementById('notas').value,
    completed: false,
    date_local: hoje
  }

  const { error } = await supabase.from('tasks').insert([tarefa])

  if (error) {
    console.error(error)
    alert("Erro ao salvar")
    return
  }

  window.location.href = "dashboard.html"
}

/* ========================= */
/* 🔥 CARREGAR TAREFAS */
/* ========================= */
export async function carregarTarefas(dataSelecionada = null) {
  const container = document.getElementById("listaTarefas")
  if (!container) return

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // ✅ filtro simples (sem timezone)
  if (dataSelecionada) {
    query = query.eq("date_local", dataSelecionada)
  }

  const { data: tarefas, error } = await query

  if (error) {
    console.error(error)
    return
  }

  container.innerHTML = ""

  tarefas.forEach(t => {
    const div = document.createElement('div')
    div.classList.add('task')

    div.innerHTML = `
      <div class="task-header">

        <input type="checkbox" class="task-checkbox" ${t.completed ? "checked" : ""}>

        <div class="task-info">
          <span class="task-title">${t.title}</span>

          <div class="task-badges">
            <span class="badge badge-category">${t.category}</span>
            <span class="badge ${getUrgencyClass(t.urgency)}">${t.urgency}</span>
          </div>
        </div>

        <button class="delete-btn">🗑️</button>

      </div>
    `

    const checkbox = div.querySelector(".task-checkbox")
    const deleteBtn = div.querySelector(".delete-btn")

    // estado inicial
    if (t.completed) {
      div.classList.add("completed")
    }

    /* ========================= */
    /* ✅ CHECKBOX */
    /* ========================= */
    checkbox.addEventListener("click", async (e) => {
      e.stopPropagation()

      const novoStatus = checkbox.checked

      const { error } = await supabase
        .from("tasks")
        .update({ completed: novoStatus })
        .eq("id", t.id)

      if (error) {
        console.error(error)
        alert("Erro ao atualizar tarefa")
        checkbox.checked = !novoStatus
        return
      }

      div.classList.toggle("completed")

      document.dispatchEvent(new Event("tasksUpdated"))
    })

    /* ========================= */
    /* 🗑️ DELETE */
    /* ========================= */
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation()

      const confirmar = confirm("Deseja deletar esta tarefa?")
      if (!confirmar) return

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", t.id)

      if (error) {
        console.error(error)
        alert("Erro ao deletar tarefa")
        return
      }

      // animação
      div.style.opacity = "0"
      div.style.transform = "translateX(-10px)"

      setTimeout(() => div.remove(), 200)

      document.dispatchEvent(new Event("tasksUpdated"))
    })

    /* ========================= */
    /* 🎯 SELEÇÃO + EXPANSÃO */
    /* ========================= */
    div.addEventListener("click", () => {
      div.classList.toggle('open')
      selecionarTask(t)
    })

    container.appendChild(div)
  })
}

/* ========================= */
/* 📅 FILTRO */
/* ========================= */
window.aplicarFiltro = () => {
  const input = document.getElementById("dataFiltro")
  if (!input || !input.value) return

  carregarTarefas(input.value)
}

window.limparFiltro = () => {
  carregarTarefas(getHoje())
}

/* ========================= */
/* 🎨 BADGE */
/* ========================= */
function getUrgencyClass(urgency) {
  if (urgency === "alta") return "badge-high"
  if (urgency === "media") return "badge-medium"
  return "badge-low"
}

/* ========================= */
/* 📅 AUTO FILTRO */
/* ========================= */
const inputData = document.getElementById("dataFiltro")

if (inputData) {
  inputData.addEventListener("change", () => {
    aplicarFiltro()
  })
}

/* ========================= */
/* 🎯 TASK SELECIONADA */
/* ========================= */
export function selecionarTask(task) {
  localStorage.setItem("taskSelecionada", JSON.stringify(task))

  document.getElementById("taskTitulo").innerText = task.title

  // badges
  document.getElementById("taskBadges").innerHTML = `
    <span class="badge badge-category">${task.category}</span>
    <span class="badge ${getUrgencyClass(task.urgency)}">${task.urgency}</span>
  `

  // info
  document.getElementById("taskInfo").innerText = `📚 ${task.subject}`

  // notas
  document.getElementById("taskNotas").innerText = task.notes || ""
}