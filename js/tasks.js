/**
 * tasks.js
 * Gerencia operações relacionadas a tarefas:
 * - Criar nova tarefa
 * - Carregar lista de tarefas com filtro por data
 * - Selecionar tarefa para o timer
 * - Atualizar status (checkbox) e deletar
 */

import { supabase } from './supabase.js';

/** Retorna a data atual no formato YYYY-MM-DD (compatível com input date). */
function getHoje() {
  return new Date().toLocaleDateString('en-CA');
}

/** Retorna a classe CSS correspondente ao nível de urgência. */
function getUrgencyClass(urgency) {
  if (urgency === 'alta') return 'badge-high';
  if (urgency === 'media') return 'badge-medium';
  return 'badge-low';
}

/**
 * Cria uma nova tarefa no banco de dados.
 * Os dados são coletados dos campos do formulário em nova-tarefa.html.
 */
window.criarTarefa = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return alert('Usuário não autenticado');

  const hoje = getHoje();
  const tarefa = {
    user_id: user.id,
    title: document.getElementById('titulo').value,
    subject: document.getElementById('materia').value,
    category: document.getElementById('categoria').value,
    urgency: document.getElementById('urgencia').value,
    notes: document.getElementById('notas').value,
    completed: false,
    date_local: hoje
  };

  const { error } = await supabase.from('tasks').insert([tarefa]);
  if (error) {
    console.error(error);
    return alert('Erro ao salvar tarefa');
  }
  window.location.href = 'dashboard.html';
};

/**
 * Carrega e renderiza a lista de tarefas do usuário.
 * @param {string|null} dataSelecionada - Data no formato YYYY-MM-DD para filtrar (opcional).
 */
export async function carregarTarefas(dataSelecionada = null) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (dataSelecionada) query = query.eq('date_local', dataSelecionada);

  const { data: tarefas, error } = await query;
  if (error) return console.error(error);

  container.innerHTML = '';
  tarefas.forEach(t => {
    const div = document.createElement('div');
    div.classList.add('task');
    if (t.completed) div.classList.add('completed');

    div.innerHTML = `
      <div class="task-header">
        <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''}>
        <div class="task-info">
          <span class="task-title">${t.title}</span>
          <div class="task-badges">
            <span class="badge badge-category">${t.category}</span>
            <span class="badge ${getUrgencyClass(t.urgency)}">${t.urgency}</span>
          </div>
        </div>
        <button class="delete-btn">🗑️</button>
      </div>
    `;

    const checkbox = div.querySelector('.task-checkbox');
    const deleteBtn = div.querySelector('.delete-btn');

    // Atualiza status da tarefa (concluída/não concluída)
    checkbox.addEventListener('click', async (e) => {
      e.stopPropagation();
      const novoStatus = checkbox.checked;
      const { error } = await supabase.from('tasks').update({ completed: novoStatus }).eq('id', t.id);
      if (error) {
        alert('Erro ao atualizar');
        checkbox.checked = !novoStatus;
        return;
      }
      div.classList.toggle('completed');
      document.dispatchEvent(new Event('tasksUpdated')); // notifica outros componentes
    });

    // Deleta a tarefa
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Deletar esta tarefa?')) return;
      await supabase.from('tasks').delete().eq('id', t.id);
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 200);
      document.dispatchEvent(new Event('tasksUpdated'));
    });

    // Seleciona a tarefa para o timer ao clicar no card
    div.addEventListener('click', () => {
      selecionarTask(t);
      document.querySelectorAll('.task').forEach(el => el.classList.remove('open'));
      div.classList.add('open');
    });

    container.appendChild(div);
  });
}

/**
 * Armazena a tarefa selecionada no localStorage e atualiza a UI do timer.
 * @param {Object} task - Objeto da tarefa selecionada.
 */
export function selecionarTask(task) {
  localStorage.setItem('taskSelecionada', JSON.stringify(task));
  const titulo = document.getElementById('taskTitulo');
  const badges = document.getElementById('taskBadges');
  const info = document.getElementById('taskInfo');
  const notas = document.getElementById('taskNotas');
  if (titulo) titulo.innerText = task.title;
  if (badges) badges.innerHTML = `<span class="badge badge-category">${task.category}</span><span class="badge ${getUrgencyClass(task.urgency)}">${task.urgency}</span>`;
  if (info) info.innerText = `📚 ${task.subject || 'Sem matéria'}`;
  if (notas) notas.innerText = task.notes || '';
}

/** Aplica o filtro de data manualmente (usado em algumas páginas). */
window.aplicarFiltro = () => {
  const input = document.getElementById('dataFiltro');
  if (input) carregarTarefas(input.value);
};

// Inicializa o input de data com o valor de hoje e escuta mudanças
const inputData = document.getElementById('dataFiltro');
if (inputData) {
  inputData.value = getHoje();
  inputData.addEventListener('change', () => {
    carregarTarefas(inputData.value);
    document.dispatchEvent(new CustomEvent('dataFiltroChanged', { detail: inputData.value }));
  });
}