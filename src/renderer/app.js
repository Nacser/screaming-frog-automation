const { ipcRenderer } = require('electron');
const path = require('path');

// Cargar opciones de exportación
const EXPORT_OPTIONS = require(path.resolve(__dirname, '..', 'main', 'constants', 'exportOptions.js'));

console.log('[app.js] Renderer iniciado');

// ============================================================
// ESTADO
// ============================================================
const state = {
  mode: 'url',
  configFile: null,
  crawlFile: null,
  outputPath: null,
  baseName: null,
  processing: false,
  scheduledJobs: []
};

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('[app.js] DOMContentLoaded, iniciando bindings...');
    bindTabs();
    bindMode();
    bindFileSelectors();
    bindScheduleToggle();
    bindButtons();
    bindModalClose();
    renderExportOptions();
    await loadConfig();
    await refreshScheduledList();
    console.log('[app.js] Inicialización completada');
  } catch (err) {
    console.error('[app.js] Error en inicialización:', err);
  }
});

// ============================================================
// MODAL
// ============================================================
function bindModalClose() {
  document.getElementById('modal-details').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeDetailsModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-details');
      if (!modal.classList.contains('hidden')) {
        closeDetailsModal();
      }
    }
  });
}

// ============================================================
// EXPORT OPTIONS - Renderizado y gestión
// ============================================================
function renderExportOptions() {
  // Renderizar Export Tabs
  const tabsContainer = document.getElementById('export-tabs-container');
  tabsContainer.innerHTML = '';

  for (const [groupKey, group] of Object.entries(EXPORT_OPTIONS.exportTabs)) {
    tabsContainer.appendChild(createExportGroup('tabs', groupKey, group.label, group.filters));
  }

  // Renderizar Bulk Exports
  const bulkContainer = document.getElementById('bulk-exports-container');
  bulkContainer.innerHTML = '';

  for (const [groupKey, group] of Object.entries(EXPORT_OPTIONS.bulkExports)) {
    bulkContainer.appendChild(createExportGroup('bulk', groupKey, group.label, group.items));
  }

  // Seleccionar principales por defecto
  selectPrimaryExports();
}

function createExportGroup(type, groupKey, label, items) {
  const groupId = `${type}-${groupKey}`;
  const itemCount = Object.keys(items).length;

  const group = document.createElement('div');
  group.className = 'export-group';
  group.id = groupId;

  // Header
  const header = document.createElement('div');
  header.className = 'export-group-header';
  header.innerHTML = `
    <div class="export-group-title">
      <svg class="chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      ${label}
    </div>
    <span class="export-group-count" id="${groupId}-count">0/${itemCount}</span>
  `;
  header.addEventListener('click', () => toggleExportGroup(groupId));

  // Content
  const content = document.createElement('div');
  content.className = 'export-group-content';

  const itemsDiv = document.createElement('div');
  itemsDiv.className = 'export-items';

  for (const [itemKey, item] of Object.entries(items)) {
    const itemId = `${groupId}-${itemKey}`;
    const isPrimary = item.primary === true;

    const itemLabel = document.createElement('label');
    itemLabel.className = `export-item${isPrimary ? ' primary' : ''}`;
    itemLabel.innerHTML = `
      <input type="checkbox"
             id="${itemId}"
             data-type="${type}"
             data-group="${groupKey}"
             data-item="${itemKey}"
             onchange="updateGroupCounter('${groupId}')">
      <span>${item.label}</span>
    `;
    itemsDiv.appendChild(itemLabel);
  }

  content.appendChild(itemsDiv);
  group.appendChild(header);
  group.appendChild(content);

  return group;
}

function toggleExportGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) {
    group.classList.toggle('open');
  }
}

function updateGroupCounter(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;

  const checkboxes = group.querySelectorAll('input[type="checkbox"]');
  const checked = group.querySelectorAll('input[type="checkbox"]:checked').length;
  const total = checkboxes.length;

  const counter = document.getElementById(`${groupId}-count`);
  if (counter) {
    counter.textContent = `${checked}/${total}`;
    counter.classList.toggle('has-selected', checked > 0);
  }
}

function updateAllCounters() {
  document.querySelectorAll('.export-group').forEach(group => {
    updateGroupCounter(group.id);
  });
}

// Funciones globales para botones de selección
window.selectAllExports = function() {
  document.querySelectorAll('.export-group input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
  });
  updateAllCounters();
};

window.deselectAllExports = function() {
  document.querySelectorAll('.export-group input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  updateAllCounters();
};

window.selectPrimaryExports = function() {
  // Primero deseleccionar todo
  document.querySelectorAll('.export-group input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  // Seleccionar solo los que están en items con primary: true
  // Export Tabs
  for (const [groupKey, group] of Object.entries(EXPORT_OPTIONS.exportTabs)) {
    for (const [itemKey, item] of Object.entries(group.filters)) {
      if (item.primary) {
        const cb = document.getElementById(`tabs-${groupKey}-${itemKey}`);
        if (cb) cb.checked = true;
      }
    }
  }

  // Bulk Exports
  for (const [groupKey, group] of Object.entries(EXPORT_OPTIONS.bulkExports)) {
    for (const [itemKey, item] of Object.entries(group.items)) {
      if (item.primary) {
        const cb = document.getElementById(`bulk-${groupKey}-${itemKey}`);
        if (cb) cb.checked = true;
      }
    }
  }

  updateAllCounters();
};

window.updateGroupCounter = updateGroupCounter;

// ============================================================
// TABS
// ============================================================
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${id}`).classList.add('active');
    });
  });
}

// ============================================================
// MODO URL / FILE
// ============================================================
function bindMode() {
  const btnUrl  = document.getElementById('btn-mode-url');
  const btnFile = document.getElementById('btn-mode-file');
  const grpUrl  = document.getElementById('group-url');
  const grpFile = document.getElementById('group-file');

  btnUrl.addEventListener('click', () => {
    state.mode = 'url';
    btnUrl.classList.add('active');
    btnFile.classList.remove('active');
    grpUrl.classList.remove('hidden');
    grpFile.classList.add('hidden');
  });

  btnFile.addEventListener('click', () => {
    state.mode = 'file';
    btnFile.classList.add('active');
    btnUrl.classList.remove('active');
    grpFile.classList.remove('hidden');
    grpUrl.classList.add('hidden');
  });
}

// ============================================================
// SELECTORES DE ARCHIVO
// ============================================================
function bindFileSelectors() {
  document.getElementById('btn-select-config').addEventListener('click', async () => {
    const res = await ipcRenderer.invoke('file:selectConfig');
    if (res.success && res.filePath) {
      state.configFile = res.filePath;
      document.getElementById('txt-config-file').textContent = res.filePath.split(/[\\\/]/).pop();
    }
  });

  document.getElementById('btn-select-crawl-file').addEventListener('click', async () => {
    const res = await ipcRenderer.invoke('file:selectCrawl');
    if (res.success && res.filePath) {
      state.crawlFile = res.filePath;
      document.getElementById('txt-crawl-file').textContent = res.filePath.split(/[\\\/]/).pop();
    }
  });
}

// ============================================================
// PROGRAMACIÓN TOGGLE
// ============================================================
function bindScheduleToggle() {
  const chk = document.getElementById('chk-schedule');
  const opts = document.getElementById('schedule-opts');
  const btnTxt = document.getElementById('txt-start-btn');

  chk.addEventListener('change', () => {
    if (chk.checked) {
      opts.classList.remove('hidden');
      btnTxt.textContent = 'Programar Rastreo';
      document.getElementById('input-sched-date').min = new Date().toISOString().split('T')[0];
    } else {
      opts.classList.add('hidden');
      btnTxt.textContent = 'Iniciar Rastreo';
    }
  });
}

// ============================================================
// BOTONES PRINCIPALES
// ============================================================
function bindButtons() {
  document.getElementById('btn-start').addEventListener('click', onStart);
  document.getElementById('btn-save-config').addEventListener('click', onSaveConfig);
  document.getElementById('btn-open-folder').addEventListener('click', () => {
    if (state.outputPath) ipcRenderer.invoke('file:openFolder', state.outputPath);
  });
  // El botón de PDF se configura dinámicamente en showResults
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
async function loadConfig() {
  const res = await ipcRenderer.invoke('config:get');
  if (res.success) {
    const c = res.config;
    document.getElementById('input-path-sf').value     = c.screamingFrogPath || '';
    document.getElementById('input-path-output').value = c.outputFolder     || '';
    document.getElementById('input-path-config').value = c.configFolder     || '';
    document.getElementById('input-path-temp').value   = c.tempFolder       || '';
  }
}

async function onSaveConfig() {
  const paths = {
    screamingFrogPath: document.getElementById('input-path-sf').value.trim(),
    outputFolder:      document.getElementById('input-path-output').value.trim(),
    configFolder:      document.getElementById('input-path-config').value.trim(),
    tempFolder:        document.getElementById('input-path-temp').value.trim()
  };

  const res = await ipcRenderer.invoke('config:savePaths', paths);
  toast(res.success ? 'Configuración guardada' : 'Error: ' + res.error, res.success ? 'success' : 'error');
}

// ============================================================
// INICIO / PROGRAMACIÓN
// ============================================================
async function onStart() {
  const isScheduled = document.getElementById('chk-schedule').checked;

  // Validaciones
  if (state.mode === 'url') {
    const url = document.getElementById('input-url').value.trim();
    if (!url) return toast('Introduce una URL', 'error');
    try { new URL(url); } catch { return toast('URL no válida. Incluye https://', 'error'); }
  } else {
    if (!state.crawlFile) return toast('Selecciona un archivo .seospider', 'error');
  }

  if (isScheduled) {
    const date = document.getElementById('input-sched-date').value;
    const time = document.getElementById('input-sched-time').value;
    if (!date || !time) return toast('Indica fecha y hora', 'error');

    const val = await ipcRenderer.invoke('schedule:validate', { date, time });
    if (val.success && !val.validation.valid) return toast(val.validation.error, 'error');

    const jobInfo = {
      id: Date.now(),
      name: document.getElementById('input-sched-name').value.trim() || null,
      date, time,
      frequency: document.getElementById('select-sched-freq').value,
      crawlConfig: buildCrawlPayload()
    };

    const res = await ipcRenderer.invoke('schedule:add', jobInfo);
    if (res.success) {
      toast('Rastreo programado correctamente', 'success');
      document.getElementById('chk-schedule').checked = false;
      document.getElementById('schedule-opts').classList.add('hidden');
      document.getElementById('txt-start-btn').textContent = 'Iniciar Rastreo';
      document.getElementById('input-sched-name').value = '';
      document.getElementById('input-sched-date').value = '';
      document.getElementById('input-sched-time').value = '';
      await refreshScheduledList();
    } else {
      toast('Error al programar: ' + res.error, 'error');
    }
    return;
  }

  await executeCrawl(buildCrawlPayload());
}

/** Construye el objeto que se envía al main process */
function buildCrawlPayload() {
  // Recopilar Export Tabs seleccionados
  const exportTabs = {};
  for (const groupKey of Object.keys(EXPORT_OPTIONS.exportTabs)) {
    exportTabs[groupKey] = {};
    for (const itemKey of Object.keys(EXPORT_OPTIONS.exportTabs[groupKey].filters)) {
      const cb = document.getElementById(`tabs-${groupKey}-${itemKey}`);
      exportTabs[groupKey][itemKey] = cb ? cb.checked : false;
    }
  }

  // Recopilar Bulk Exports seleccionados
  const bulkExports = {};
  for (const groupKey of Object.keys(EXPORT_OPTIONS.bulkExports)) {
    bulkExports[groupKey] = {};
    for (const itemKey of Object.keys(EXPORT_OPTIONS.bulkExports[groupKey].items)) {
      const cb = document.getElementById(`bulk-${groupKey}-${itemKey}`);
      bulkExports[groupKey][itemKey] = cb ? cb.checked : false;
    }
  }

  return {
    mode: state.mode,
    url:  document.getElementById('input-url').value.trim(),
    filePath: state.crawlFile,
    configFile: state.configFile,
    exportOptions: {
      exportTabs,
      bulkExports
    },
    processOptions: {
      internalAnalysis: document.getElementById('chk-analysis').checked,
      comparison: document.getElementById('chk-comparison').checked
    }
  };
}

/** Ejecuta un rastreo (inmediato o desde tarea programada) */
async function executeCrawl(crawlData) {
  showProcessing();
  state.processing = true;

  try {
    const res = await ipcRenderer.invoke('crawl:start', crawlData);

    if (res.success) {
      state.outputPath = res.outputPath;
      state.baseName   = res.baseName;
      hideProcessing();
      showResults(res);
    } else {
      hideProcessing();
      showInfo();
      toast('Error: ' + res.error, 'error');
    }
  } catch (e) {
    hideProcessing();
    showInfo();
    toast('Excepción: ' + e.message, 'error');
  } finally {
    state.processing = false;
  }
}

// ============================================================
// UI: ESTADOS
// ============================================================
function showProcessing() {
  document.getElementById('btn-start').disabled = true;
  document.getElementById('card-info').classList.add('hidden');
  document.getElementById('card-results').classList.add('hidden');
  document.getElementById('card-processing').classList.remove('hidden');
  setPhase('Iniciando...');
}

function hideProcessing() {
  document.getElementById('btn-start').disabled = false;
  document.getElementById('card-processing').classList.add('hidden');
}

function showInfo() {
  document.getElementById('card-results').classList.add('hidden');
  document.getElementById('card-info').classList.remove('hidden');
}

function setPhase(text) {
  document.getElementById('txt-phase').textContent = text;
}

// ============================================================
// UI: RESULTADOS
// ============================================================
function showResults(res) {
  document.getElementById('card-info').classList.add('hidden');
  document.getElementById('card-results').classList.remove('hidden');

  const dur = res.duration ? formatMs(res.duration) : '—';
  let html = `
    <div class="row"><span class="label">Carpeta</span><span class="value">${res.baseName}</span></div>
    <div class="row"><span class="label">Duración</span><span class="value">${dur}</span></div>
  `;
  if (res.stats) {
    html += `<div class="row"><span class="label">URLs analizadas</span><span class="value">${res.stats.total}</span></div>`;
  }
  document.getElementById('results-summary').innerHTML = html;

  const filesHtml = (res.files || []).map(f => `
    <div class="file-row">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      ${f}
    </div>
  `).join('');
  document.getElementById('results-files-list').innerHTML = filesHtml || '<p class="empty-msg">Sin archivos</p>';

  // Configurar botones de PDF dinámicamente
  const pdfFiles = (res.files || []).filter(f => f.toLowerCase().endsWith('.pdf'));
  const pdfContainer = document.getElementById('pdf-buttons-container');

  if (pdfContainer) {
    if (pdfFiles.length === 0) {
      pdfContainer.innerHTML = '';
    } else {
      pdfContainer.innerHTML = pdfFiles.map(pdfFile => {
        const label = pdfFile.includes('comparison') ? 'Ver Comparación PDF' :
                      pdfFile.includes('informe') ? 'Ver Informe PDF' : `Ver ${pdfFile}`;
        return `
          <button class="btn-secondary btn-pdf" data-pdf="${pdfFile}">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${label}
          </button>
        `;
      }).join('');

      // Bind click events
      pdfContainer.querySelectorAll('.btn-pdf').forEach(btn => {
        btn.addEventListener('click', () => {
          const pdfFile = btn.dataset.pdf;
          if (state.outputPath) {
            ipcRenderer.invoke('file:open', `${state.outputPath}\\${pdfFile}`);
          }
        });
      });
    }
  }
}

// ============================================================
// TAREAS PROGRAMADAS
// ============================================================
async function refreshScheduledList() {
  const res = await ipcRenderer.invoke('schedule:getAll');
  const list = document.getElementById('list-scheduled');

  if (!res.success || !res.jobs || res.jobs.length === 0) {
    state.scheduledJobs = [];
    list.innerHTML = '<p class="empty-msg">No hay rastreos programados</p>';
    return;
  }

  state.scheduledJobs = res.jobs;

  const freqLabels = { once:'Una vez', daily:'Diario', weekly:'Semanal', monthly:'Mensual' };

  list.innerHTML = res.jobs.map(job => {
    const url = (job.crawlConfig && job.crawlConfig.url) || 'Archivo .seospider';
    const next = job.nextRun ? new Date(job.nextRun).toLocaleString('es-ES') : '';
    const isActive = job.status === 'active';
    const jobName = job.name || '';

    const freqSelect = isActive ? `
      <select class="sched-freq-select" onchange="onChangeFrequency(${job.id}, this.value)" title="Cambiar frecuencia">
        <option value="once" ${job.frequency === 'once' ? 'selected' : ''}>Una vez</option>
        <option value="daily" ${job.frequency === 'daily' ? 'selected' : ''}>Diario</option>
        <option value="weekly" ${job.frequency === 'weekly' ? 'selected' : ''}>Semanal</option>
        <option value="monthly" ${job.frequency === 'monthly' ? 'selected' : ''}>Mensual</option>
      </select>
    ` : `<span class="sched-freq-label">${freqLabels[job.frequency] || job.frequency}</span>`;

    return `
      <div class="scheduled-item-full ${job.status === 'cancelled' ? 'cancelled' : ''}">
        <div class="sched-name-col">
          <input type="text" class="sched-name-input" value="${jobName}"
                 placeholder="Sin nombre"
                 onchange="onChangeName(${job.id}, this.value)"
                 title="Nombre del rastreo">
        </div>
        <div class="sched-url-col">
          <div class="sched-url">${url}</div>
        </div>
        <div class="sched-date-col">
          <div class="sched-detail">${job.date} ${job.time}</div>
          ${next ? `<div class="sched-next">${next}</div>` : ''}
        </div>
        <div class="sched-freq-col">
          ${freqSelect}
        </div>
        <div class="sched-actions-col">
          <button class="info" title="Ver detalles" onclick="showDetailsModal(${job.id})">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
          <button class="del" title="Eliminar" onclick="schedDelete(${job.id})">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

// Expuestas globalmente para onclick inline
window.schedDelete = async function(id) {
  if (!confirm('¿Eliminar esta tarea permanentemente?')) return;
  await ipcRenderer.invoke('schedule:delete', id);
  toast('Tarea eliminada', 'success');
  await refreshScheduledList();
};

window.onChangeFrequency = async function(id, newFrequency) {
  const res = await ipcRenderer.invoke('schedule:updateFrequency', { id, frequency: newFrequency });
  if (res.success) {
    toast('Frecuencia actualizada', 'success');
    await refreshScheduledList();
  } else {
    toast('Error: ' + res.error, 'error');
  }
};

window.onChangeName = async function(id, newName) {
  const res = await ipcRenderer.invoke('schedule:updateName', { id, name: newName.trim() });
  if (res.success) {
    toast('Nombre actualizado', 'success');
    // Actualizar en estado local sin refrescar toda la lista
    const job = state.scheduledJobs.find(j => j.id === id);
    if (job) job.name = newName.trim();
  } else {
    toast('Error: ' + res.error, 'error');
  }
};

window.showDetailsModal = function(id) {
  const job = state.scheduledJobs.find(j => j.id === id);
  if (!job) return;

  const freqLabels = { once:'Una vez', daily:'Diario', weekly:'Semanal', monthly:'Mensual' };
  const url = (job.crawlConfig && job.crawlConfig.url) || 'Archivo .seospider';
  const next = job.nextRun ? new Date(job.nextRun).toLocaleString('es-ES') : 'No programada';

  // Contar exportaciones seleccionadas
  let tabsCount = 0;
  let bulkCount = 0;

  const exportOpts = job.crawlConfig?.exportOptions || {};

  if (exportOpts.exportTabs) {
    for (const group of Object.values(exportOpts.exportTabs)) {
      for (const val of Object.values(group)) {
        if (val) tabsCount++;
      }
    }
  }

  if (exportOpts.bulkExports) {
    for (const group of Object.values(exportOpts.bulkExports)) {
      for (const val of Object.values(group)) {
        if (val) bulkCount++;
      }
    }
  }

  const processOpts = job.crawlConfig?.processOptions || {};

  const jobName = job.name || 'Sin nombre';

  let html = `
    <div class="detail-section">
      <div class="detail-section-title">Información General</div>
      <div class="detail-row"><span class="label">Nombre</span><span class="value">${jobName}</span></div>
      <div class="detail-row"><span class="label">URL / Archivo</span><span class="value">${url}</span></div>
      <div class="detail-row"><span class="label">Fecha</span><span class="value">${job.date}</span></div>
      <div class="detail-row"><span class="label">Hora</span><span class="value">${job.time}</span></div>
      <div class="detail-row"><span class="label">Frecuencia</span><span class="value">${freqLabels[job.frequency] || job.frequency}</span></div>
      <div class="detail-row"><span class="label">Próxima ejecución</span><span class="value">${next}</span></div>
      <div class="detail-row"><span class="label">Estado</span><span class="value">${job.status === 'active' ? 'Activo' : 'Cancelado'}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">Exportaciones</div>
      <div class="detail-row"><span class="label">Export Tabs</span><span class="value">${tabsCount} seleccionados</span></div>
      <div class="detail-row"><span class="label">Bulk Exports</span><span class="value">${bulkCount} seleccionados</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">Procesados</div>
      <div class="detail-row"><span class="label">Análisis URLs internas + PDF</span><span class="value ${processOpts.internalAnalysis ? 'enabled' : 'disabled'}">${processOpts.internalAnalysis ? 'Sí' : 'No'}</span></div>
      <div class="detail-row"><span class="label">Comparar con rastreo anterior</span><span class="value ${processOpts.comparison ? 'enabled' : 'disabled'}">${processOpts.comparison ? 'Sí' : 'No'}</span></div>
    </div>
  `;

  document.getElementById('modal-details-content').innerHTML = html;
  document.getElementById('modal-details').classList.remove('hidden');
};

window.closeDetailsModal = function() {
  document.getElementById('modal-details').classList.add('hidden');
};

// ============================================================
// IPC: EVENTOS DEL MAIN PROCESS
// ============================================================
ipcRenderer.on('crawl:phase', (_event, phase) => {
  setPhase(phase);
});

ipcRenderer.on('scheduled-crawl-start', async (_event, data) => {
  toast(`Iniciando rastreo programado: ${data.crawlConfig?.url || 'archivo'}`, 'success');
  document.querySelector('[data-tab="crawl"]').click();
  await executeCrawl(data.crawlConfig);
});

ipcRenderer.on('scheduled-job-deleted', async (_event, data) => {
  Logger.info && console.log('Tarea programada eliminada automáticamente', data);
  await refreshScheduledList();
});

// ============================================================
// TOAST (notificación)
// ============================================================
let toastTimer = null;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.className = 'toast ' + type;
  el.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ============================================================
// UTILIDADES
// ============================================================
function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}
