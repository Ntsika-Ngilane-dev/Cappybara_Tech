
// assets/script.js - mock API polling to update dashboard charts
let glucoseChart = null;
let hormoneChart = null;

async function fetchMockData() {
  try {
    const res = await fetch('./assets/mock-data.json?_=' + Date.now());
    if(!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Failed to fetch mock data', e);
    return null;
  }
}

function initCharts(initialData) {
  const ctxG = document.getElementById('glucoseChart').getContext('2d');
  const labels = initialData.glucose.history.map(p => new Date(p.t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
  const values = initialData.glucose.history.map(p => p.v);
  const predLabels = initialData.glucose.predicted.map(p => new Date(p.t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
  const predValues = initialData.glucose.predicted.map(p => p.v);

  glucoseChart = new Chart(ctxG, {
    type: 'line',
    data: {
      labels: labels.concat(predLabels),
      datasets: [
        { label: 'Measured (mmol/L)', data: values.concat(Array(predValues.length).fill(null)), borderColor:'#0f766e', backgroundColor:'rgba(15,118,110,0.06)', tension:0.25, pointRadius:2 },
        { label: 'Predicted', data: Array(values.length).fill(null).concat(predValues), borderColor:'#f59e0b', borderDash:[6,4], tension:0.25, pointRadius:0 }
      ]
    },
    options: { responsive:true, plugins:{legend:{display:true}}, scales:{ y:{ suggestedMin:3, suggestedMax:8 } } }
  });

  const ctxH = document.getElementById('hormoneChart').getContext('2d');
  const days = initialData.hormone.estradiol.map((p,i)=> i);
  const estr = initialData.hormone.estradiol.map(p => p.v);

  hormoneChart = new Chart(ctxH, {
    type: 'line',
    data: { labels: days, datasets:[{ label:'Estradiol (relative)', data: estr, borderColor:'#0369a1', backgroundColor:'rgba(3,105,161,0.06)', tension:0.3, pointRadius:2 }]},
    options: { responsive:true, plugins:{legend:{display:true}} }
  });
}

function updateFromMock(data) {
  if(!data) return;
  const hist = data.glucose.history.map(p=>p.v);
  const pred = data.glucose.predicted.map(p=>p.v);
  document.getElementById('glucoseCurrent').textContent = hist[hist.length-1].toFixed(2);
  document.getElementById('glucosePred').textContent = pred[pred.length-1].toFixed(2);

  if(glucoseChart) {
    const labels = data.glucose.history.map(p => new Date(p.t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    const predLabels = data.glucose.predicted.map(p => new Date(p.t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    const values = data.glucose.history.map(p => p.v);
    const predValues = data.glucose.predicted.map(p => p.v);

    glucoseChart.data.labels = labels.concat(predLabels);
    glucoseChart.data.datasets[0].data = values.concat(Array(predValues.length).fill(null));
    glucoseChart.data.datasets[1].data = Array(values.length).fill(null).concat(predValues);
    glucoseChart.update();
  }

  if(hormoneChart) {
    const estr = data.hormone.estradiol.map(p => p.v);
    hormoneChart.data.datasets[0].data = estr;
    hormoneChart.update();
  }

  document.getElementById('cyclePhase').textContent = data.cycle.phase;
  document.getElementById('fertilityPct').textContent = data.cycle.fertility_pct + '%';
  document.getElementById('moodLabel').textContent = data.cycle.mood;
  document.getElementById('modeLabel').textContent = data.controls.mode;
  document.getElementById('basalLabel').textContent = data.controls.basal;
  document.getElementById('dextReserve').textContent = data.controls.dextrose_reserve_g + ' g';
  document.getElementById('notificationsList').textContent = data.notifications.join(' • ');
}

async function pollMock() {
  const data = await fetchMockData();
  if(!glucoseChart || !hormoneChart) {
    initCharts(data);
  }
  updateFromMock(data);
}

document.addEventListener('DOMContentLoaded', ()=>{ pollMock(); setInterval(pollMock, 5000); });
