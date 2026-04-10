/**
 * estatisticas.js
 * Gera estatísticas e gráficos baseados nas sessões de estudo.
 * Exibe:
 * - Matéria mais estudada
 * - Resumo geral (tempo total, dia mais produtivo, média diária)
 * - Gráfico de barras com tempo por matéria
 */

import { supabase } from './supabase.js';

/**
 * Formata segundos para exibição.
 * @param {number} seg - Segundos.
 * @param {boolean} curto - Se true, retorna "Xh Ymin"; senão "HH:MM:SS".
 */
function formatarTempo(seg, curto = false) {
  if (curto) return `${Math.floor(seg / 3600)}h ${Math.floor((seg % 3600) / 60)}min`;
  const h = String(Math.floor(seg / 3600)).padStart(2, '0');
  const m = String(Math.floor((seg % 3600) / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** Busca todas as sessões de estudo do usuário autenticado. */
async function buscarSessoes() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data } = await supabase.from('study_sessions').select('*').eq('user_id', userData.user.id);
  return data || [];
}

/** Exibe a matéria com maior tempo total acumulado. */
async function carregarTopMateria() {
  const sessoes = await buscarSessoes();
  const el = document.getElementById('topMateria');
  if (!el) return;
  if (!sessoes.length) return (el.innerText = 'Nenhuma sessão registrada');

  const acc = {};
  sessoes.forEach(s => {
    const materia = s.subject || 'Sem matéria';
    acc[materia] = (acc[materia] || 0) + s.duration;
  });

  const top = Object.entries(acc).sort((a, b) => b[1] - a[1])[0];
  el.innerText = `📚 ${top[0]} – ${formatarTempo(top[1], true)}`;
}

/** Exibe tempo total, dia mais produtivo e média diária. */
async function carregarResumoGeral() {
  const sessoes = await buscarSessoes();
  const elTempo = document.getElementById('tempoTotal');
  const elDia = document.getElementById('diaTop');
  const elMedia = document.getElementById('mediaDiaria');
  if (!elTempo || !elDia || !elMedia) return;

  if (!sessoes.length) {
    elTempo.innerText = 'Tempo total: 0h';
    elDia.innerText = 'Dia mais produtivo: -';
    elMedia.innerText = 'Média diária: 0h';
    return;
  }

  const total = sessoes.reduce((acc, s) => acc + s.duration, 0);
  elTempo.innerText = `⏱️ Tempo total: ${formatarTempo(total, true)}`;

  const porData = {};
  sessoes.forEach(s => {
    porData[s.date_local] = (porData[s.date_local] || 0) + s.duration;
  });

  const diaTop = Object.entries(porData).sort((a, b) => b[1] - a[1])[0];
  const dataFormatada = diaTop[0].split('-').reverse().join('/');
  elDia.innerText = `🔥 Dia mais produtivo: ${dataFormatada} (${formatarTempo(diaTop[1], true)})`;

  const media = Math.round(total / Object.keys(porData).length);
  elMedia.innerText = `📊 Média diária: ${formatarTempo(media, true)}`;
}

/** Renderiza gráfico de barras com tempo total por matéria (em minutos). */
async function carregarGraficoPorMateria() {
  const sessoes = await buscarSessoes();
  const canvas = document.getElementById('graficoTarefas');
  if (!canvas) return;

  if (!sessoes.length) {
    const ctx = canvas.getContext('2d');
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma sessão registrada', canvas.width / 2, canvas.height / 2);
    return;
  }

  const tempoPorMateria = {};
  sessoes.forEach(s => {
    const materia = s.subject || 'Sem matéria';
    tempoPorMateria[materia] = (tempoPorMateria[materia] || 0) + s.duration;
  });

  const labels = Object.keys(tempoPorMateria);
  const dados = labels.map(materia => Math.round(tempoPorMateria[materia] / 60));

  const existente = Chart.getChart('graficoTarefas');
  if (existente) existente.destroy();

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Minutos estudados',
        data: dados,
        backgroundColor: '#ffffff',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const horas = Math.floor(ctx.raw / 60);
              const minutos = ctx.raw % 60;
              return `${horas}h ${minutos}min`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: { color: '#aaa' },
          grid: { color: '#222' },
          title: { display: true, text: 'Minutos', color: '#aaa' }
        },
        x: {
          ticks: { color: '#aaa' },
          grid: { display: false }
        }
      }
    }
  });
}

// Inicialização
carregarTopMateria();
carregarResumoGeral();
carregarGraficoPorMateria();