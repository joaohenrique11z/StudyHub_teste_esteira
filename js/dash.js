/**
 * dash.js
 * Controla a lógica do dashboard:
 * - Atualização do horário em tempo real
 * - Cronômetro (iniciar/pausar/salvar sessão)
 * - Métricas de tempo de foco e progresso de tarefas
 * - Sincronização com o filtro de data
 */

import { supabase } from './supabase.js';
import { carregarTarefas } from './tasks.js';

let dataAtual = new Date().toLocaleDateString('en-CA');
const inputData = document.getElementById('dataFiltro');
const displayTimer = document.getElementById('timer');
const btnIniciar = document.getElementById('btnIniciar');
const btnSalvar = document.getElementById('btnSalvar');

let tempo = 0;            // segundos do cronômetro
let intervalo = null;     // referência do setInterval
let rodando = false;      // estado do cronômetro

/** Formata segundos para HH:MM:SS. */
function formatarTempo(seg) {
  const h = String(Math.floor(seg / 3600)).padStart(2, '0');
  const m = String(Math.floor((seg % 3600) / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** Atualiza o card de horário atual a cada segundo. */
function atualizarHorario() {
  const el = document.getElementById('horarioAtual');
  if (!el) return;
  const agora = new Date();
  el.innerText = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;
}
setInterval(atualizarHorario, 1000);

/** Controla o botão de iniciar/pausar do cronômetro. */
btnIniciar?.addEventListener('click', () => {
  if (!rodando) {
    intervalo = setInterval(() => {
      tempo++;
      if (displayTimer) displayTimer.innerText = formatarTempo(tempo);
    }, 1000);
    rodando = true;
    btnIniciar.innerText = 'Pausar';
  } else {
    clearInterval(intervalo);
    rodando = false;
    btnIniciar.innerText = 'Continuar';
  }
});

/** Salva a sessão de estudo no banco de dados. */
btnSalvar?.addEventListener('click', async () => {
  const task = JSON.parse(localStorage.getItem('taskSelecionada'));
  if (!task) return alert('Selecione uma tarefa');
  if (tempo === 0) return alert('Tempo inválido');

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const user = userData.user;

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    task_id: task.id,
    subject: task.subject,
    category: task.category,
    duration: tempo,
    date_local: dataAtual
  });
  if (error) return alert('Erro ao salvar');

  tempo = 0;
  if (displayTimer) displayTimer.innerText = '00:00:00';
  carregarTempoFoco();
  carregarProgressoTasks();
  alert('Sessão salva!');
});

/** Carrega e exibe o tempo total de foco no dia selecionado. */
async function carregarTempoFoco() {
  const el = document.getElementById('tempoFoco');
  if (!el) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { data } = await supabase
    .from('study_sessions')
    .select('duration')
    .eq('user_id', userData.user.id)
    .eq('date_local', dataAtual);
  const total = data?.reduce((acc, s) => acc + s.duration, 0) || 0;
  el.innerText = formatarTempo(total);
}

/** Carrega e exibe o progresso das tarefas do dia (concluídas/total). */
async function carregarProgressoTasks() {
  const el = document.getElementById('tasksProgresso');
  if (!el) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { data } = await supabase
    .from('tasks')
    .select('completed')
    .eq('user_id', userData.user.id)
    .eq('date_local', dataAtual);
  const total = data.length;
  const concluidas = data.filter(t => t.completed).length;
  el.innerText = `${concluidas}/${total} (${total ? Math.round((concluidas / total) * 100) : 0}%)`;
}

/** Limpa a tarefa selecionada quando a data é alterada. */
function limparTaskSelecionada() {
  localStorage.removeItem('taskSelecionada');
  const titulo = document.getElementById('taskTitulo');
  if (titulo) titulo.innerText = 'Selecione uma tarefa';
  const badges = document.getElementById('taskBadges');
  if (badges) badges.innerHTML = '';
  const info = document.getElementById('taskInfo');
  if (info) info.innerText = '';
  const notas = document.getElementById('taskNotas');
  if (notas) notas.innerText = '';
}

// Configura o filtro de data
if (inputData) {
  inputData.value = dataAtual;
  inputData.addEventListener('change', () => {
    dataAtual = inputData.value;
    carregarTarefas(dataAtual);
    carregarTempoFoco();
    carregarProgressoTasks();
    limparTaskSelecionada();
  });
}

// Inicialização
carregarTarefas(dataAtual);
carregarTempoFoco();
carregarProgressoTasks();
atualizarHorario();

// Escuta eventos de atualização de tarefas (ex.: quando checkbox é clicado)
document.addEventListener('tasksUpdated', carregarProgressoTasks);
document.addEventListener('dataFiltroChanged', e => {
  dataAtual = e.detail;
  carregarTempoFoco();
  carregarProgressoTasks();
});