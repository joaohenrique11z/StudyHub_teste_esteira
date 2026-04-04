import { supabase } from './supabase.js'

// CRIAR TAREFA
window.criarTarefa = async () => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  const tarefa = {
    user_id: user.id,
    title: document.getElementById('titulo').value,
    subject: document.getElementById('materia').value,
    category: document.getElementById('categoria').value,
    urgency: document.getElementById('urgencia').value,
    notes: document.getElementById('notas').value,
    completed: false
  }

  const { error } = await supabase.from('tasks').insert([tarefa])

  if (error) {
    alert("Erro ao salvar")
    return
  }

  window.location.href = "dashboard.html"
}

// 🔥 FUNÇÃO PRINCIPAL
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

  // 📅 FILTRO POR DATA
  if (dataSelecionada) {
    const inicio = new Date(dataSelecionada)
    inicio.setHours(0, 0, 0, 0)

    const fim = new Date(dataSelecionada)
    fim.setHours(23, 59, 59, 999)

    query = query
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
  }

  const { data: tarefas, error } = await query

  if (error) {
    console.log(error)
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
    </div>
    `

    const checkbox = div.querySelector(".task-checkbox")

    // marcar como concluída visualmente
    if (t.completed) {
      div.classList.add("completed")
    }

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

      if (novoStatus) {
        div.classList.add("completed")
      } else {
        div.classList.remove("completed")
      }

      // 🔥 AVISA O DASHBOARD
      document.dispatchEvent(new Event("tasksUpdated"))
    })
    
    // 🔥 CORREÇÃO 1: Faltava renderizar o elemento na tela
    container.appendChild(div) 
    
  }) // 🔥 CORREÇÃO 2: Faltava fechar o forEach
} // 🔥 CORREÇÃO 3: Faltava fechar a função carregarTarefas


// 👉 aplicar filtro
window.aplicarFiltro = () => {
  const input = document.getElementById("dataFiltro")
  if (!input || !input.value) return

  carregarTarefas(input.value)
}

// 👉 limpar filtro (mostrar tudo)
window.limparFiltro = () => {
  carregarTarefas()
}

function getUrgencyClass(urgency) {
  if (urgency === "alta") return "badge-high"
  if (urgency === "media") return "badge-medium"
  return "badge-low"
}

const inputData = document.getElementById("dataFiltro")

// Tratando a possibilidade de null caso a tag não exista na página
if (inputData) {
  inputData.addEventListener("change", () => {
    aplicarFiltro()
  })
}

export function selecionarTask(task) {
  localStorage.setItem("taskSelecionada", JSON.stringify(task))

  const el = document.getElementById("taskSelecionada")

  if (el) {
    el.innerText = task.title
  }
}