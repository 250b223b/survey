import { store } from '../core/state.js';
import { AnalysisEngine } from '../core/engine.js';

export class Dashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.activeHandler = null;
    this.activeWidgetId = null;
    this.initialMousePos = { x: 0, y: 0 };
    this.initialLayout = { x: 0, y: 0, w: 0, h: 0 };

    store.subscribe((state) => this.render(state));
    this.initEventListeners();
  }

  initEventListeners() {
    this.container.addEventListener('click', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (e.target.id === 'add-widget-btn') store.addWidget('bar');
      if (e.target.id === 'save-snapshot-btn') {
        const name = document.getElementById('snapshot-name-input').value;
        if (name) { store.saveSnapshot(name); document.getElementById('snapshot-name-input').value = ''; }
      }
      if (widgetId && e.target.classList.contains('delete-widget-btn')) store.removeWidget(widgetId);
    });

    this.container.addEventListener('mousedown', (e) => {
      const card = e.target.closest('.widget-card');
      if (!card || !store.getState().ui.isEditMode) return;
      
      const widgetId = card.dataset.id;
      this.activeWidgetId = widgetId;
      const widget = store.getState().dashboard.widgets.find(w => w.id === widgetId);

      if (e.target.classList.contains('resize-handle')) {
        this.activeHandler = 'resize';
      } else if (e.target.closest('.widget-header')) {
        this.activeHandler = 'drag';
      }

      if (this.activeHandler) {
        this.initialMousePos = { x: e.clientX, y: e.clientY };
        this.initialLayout = { ...widget.layout };
        card.style.zIndex = "1000";
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
      }
    });

    this.container.addEventListener('change', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (e.target.id === 'snapshot-select' && e.target.value) {
        store.applySnapshot(e.target.value);
      }
      if (widgetId && e.target.classList.contains('config-select')) {
        const field = e.target.dataset.field;
        store.updateWidgetConfig(widgetId, { [field]: e.target.value });
      }
    });
  }

  handleMouseMove = (e) => {
    const deltaX = e.clientX - this.initialMousePos.x;
    const deltaY = e.clientY - this.initialMousePos.y;
    const gridWidth = this.container.offsetWidth / 12;
    const gridHeight = 110;

    const card = this.container.querySelector(`[data-id="${this.activeWidgetId}"]`);
    if (!card) return;

    if (this.activeHandler === 'drag') {
      const moveX = Math.round(deltaX / gridWidth);
      const moveY = Math.round(deltaY / gridHeight);
      card.style.gridColumnStart = Math.max(1, this.initialLayout.x + moveX + 1);
      card.style.gridRowStart = Math.max(1, this.initialLayout.y + moveY + 1);
    } else if (this.activeHandler === 'resize') {
      const moveW = Math.round(deltaX / gridWidth);
      const moveH = Math.round(deltaY / gridHeight);
      card.style.gridColumn = `span ${Math.max(2, this.initialLayout.w + moveW)}`;
      card.style.gridRow = `span ${Math.max(2, this.initialLayout.h + moveH)}`;
    }
  }

  handleMouseUp = () => {
    const card = this.container.querySelector(`[data-id="${this.activeWidgetId}"]`);
    if (card) {
      const x = parseInt(card.style.gridColumnStart) - 1;
      const y = parseInt(card.style.gridRowStart) - 1;
      const w = parseInt(card.style.gridColumn.split('span ')[1]);
      const h = parseInt(card.style.gridRow.split('span ')[1]);
      store.updateWidgetLayout(this.activeWidgetId, { x, y, w, h });
    }
    this.activeWidgetId = null;
    this.activeHandler = null;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  render(state) {
    const { dashboard, responses, ui } = state;
    this.container.innerHTML = `
      <div class="dashboard-wrapper ${ui.isEditMode ? 'mode-edit' : 'mode-view'}">
        <header class="dashboard-header" style="background:#fff; padding:15px; border-bottom:1px solid #ddd; margin-bottom:15px;">
          <div class="snapshot-controls" style="display:flex; gap:10px; margin-bottom:10px; align-items:center; background:#f0f0f0; padding:5px; border-radius:4px;">
            <span style="font-size:0.7rem; font-weight:bold;">VIEWS:</span>
            <select id="snapshot-select" style="font-size:0.8rem;">
              <option value="">-- Select View --</option>
              ${dashboard.snapshots.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
            </select>
            ${ui.isEditMode ? `
              <input type="text" id="snapshot-name-input" placeholder="Name" style="width:80px; font-size:0.8rem;">
              <button id="save-snapshot-btn" class="secondary-btn" style="padding:2px 8px; font-size:0.7rem;">Save</button>
            `:''}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="margin:0;">Analytics</h2>
            ${ui.isEditMode ? '<button id="add-widget-btn" class="primary-btn">Add</button>':''}
          </div>
        </header>
        <div class="widget-grid" style="display:grid; grid-template-columns:repeat(12, 1fr); grid-auto-rows:100px; gap:10px;">
          ${dashboard.widgets.map(w => this.renderWidget(w, responses, dashboard.filters, ui.isEditMode)).join('')}
        </div>
      </div>
    `;
  }

  renderWidget(widget, responses, filters, isEditMode) {
    const chartData = AnalysisEngine.aggregate(responses, widget, filters);
    const { x, y, w, h } = widget.layout;
    return `
      <div class="widget-card" data-id="${widget.id}" style="grid-column:${x+1}/span ${w}; grid-row:${y+1}/span ${h}; position:relative; background:white; border:1px solid #eee; border-radius:4px; display:flex; flex-direction:column;">
        <div class="widget-header" style="padding:5px 10px; background:#f8f9fa; border-bottom:1px solid #eee; cursor:${isEditMode?'move':'default'}; display:flex; justify-content:space-between;">
          ${isEditMode ? this.renderWidgetEditor(widget) : `<span style="font-weight:bold; font-size:0.8rem;">${widget.title}</span>`}
          ${isEditMode ? '<button class="delete-widget-btn" style="color:red; border:none; background:none; cursor:pointer;">×</button>':''}
        </div>
        <div class="widget-body" style="flex:1; padding:10px; overflow:hidden;">
          ${this.createSimpleBarChart(chartData)}
        </div>
        ${isEditMode ? '<div class="resize-handle" style="position:absolute; bottom:0; right:0; width:12px; height:12px; cursor:nwse-resize; background:#ddd; clip-path:polygon(100% 0, 100% 100%, 0 100%);"></div>':''}
      </div>
    `;
  }

  renderWidgetEditor(widget) {
    const aggs = ['avg', 'median', 'sum', 'count', 'stdDev', 'topBox'];
    return `
      <div style="display:flex; flex-direction:column; width:100%; gap:2px;">
        <input type="text" class="widget-title-input" value="${widget.title}" onchange="import('../core/state.js').then(m => m.store.updateWidgetConfig('${widget.id}', {title:this.value}))" style="font-size:0.7rem;">
        <div style="display:flex; gap:2px;">
          <select class="config-select" data-field="aggregation" style="font-size:0.6rem;">
            ${aggs.map(a => `<option value="${a}" ${widget.aggregation===a?'selected':''}>${a.toUpperCase()}</option>`).join('')}
          </select>
          <select class="config-select" data-field="x" style="font-size:0.6rem;"><option value="department">Dept</option><option value="tenure">Tenure</option></select>
        </div>
      </div>
    `;
  }

  createSimpleBarChart(data) {
    if(!data.length) return '<p style="font-size:0.7rem; color:#999;">No Data</p>';
    const max = Math.max(...data.map(d => d.value), 1);
    return data.map(d => `
      <div style="margin-bottom:4px;">
        <div style="display:flex; justify-content:space-between; font-size:0.6rem;"><span>${d.label}</span><span>${d.value}</span></div>
        <div style="background:#eee; height:4px; border-radius:2px;"><div style="width:${(d.value/max)*100}%; background:#3498db; height:100%;"></div></div>
      </div>
    `).join('');
  }
}