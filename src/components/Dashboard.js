import { store } from '../core/state.js';
import { AnalysisEngine } from '../core/engine.js';

export class Dashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.activeHandler = null; // 'drag' | 'resize'
    this.activeWidgetId = null;
    this.initialMousePos = { x: 0, y: 0 };
    this.initialLayout = { x: 0, y: 0, w: 0, h: 0 };

    store.subscribe((state) => this.render(state));
    this.initEventListeners();
  }

  initEventListeners() {
    // クリック系イベント
    this.container.addEventListener('click', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (e.target.id === 'add-widget-btn') store.addWidget('bar');
      if (widgetId && e.target.classList.contains('delete-widget-btn')) store.removeWidget(widgetId);
    });

    // ドラッグ＆リサイズの開始
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
        card.classList.add('is-active-action');
        
        // 移動中のイベントをバインド
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
      }
    });

    // 軸変更などのセレクトボックス
    this.container.addEventListener('change', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (widgetId && e.target.classList.contains('config-select')) {
        const field = e.target.dataset.field;
        store.updateWidgetConfig(widgetId, { [field]: e.target.value });
      }
    });
  }

  // マウス移動時の計算ロジック（アロー関数でthisを固定）
  handleMouseMove = (e) => {
    if (!this.activeWidgetId) return;

    const deltaX = e.clientX - this.initialMousePos.x;
    const deltaY = e.clientY - this.initialMousePos.y;

    // グリッド幅の概算 (12カラム想定)
    const gridWidth = this.container.offsetWidth / 12;
    const gridHeight = 110; // CSSの grid-auto-rows + gap に近似

    if (this.activeHandler === 'drag') {
      const moveX = Math.round(deltaX / gridWidth);
      const moveY = Math.round(deltaY / gridHeight);
      
      const newX = Math.max(0, Math.min(12 - this.initialLayout.w, this.initialLayout.x + moveX));
      const newY = Math.max(0, this.initialLayout.y + moveY);

      this.updateVisualPreview(this.activeWidgetId, { x: newX, y: newY });
    } else if (this.activeHandler === 'resize') {
      const moveW = Math.round(deltaX / gridWidth);
      const moveH = Math.round(deltaY / gridHeight);

      const newW = Math.max(2, Math.min(12 - this.initialLayout.x, this.initialLayout.w + moveW));
      const newH = Math.max(2, this.initialLayout.h + moveH);

      this.updateVisualPreview(this.activeWidgetId, { w: newW, h: newH });
    }
  }

  handleMouseUp = () => {
    const card = this.container.querySelector(`[data-id="${this.activeWidgetId}"]`);
    if (card) {
      card.classList.remove('is-active-action');
      // 最終的な数値をStoreに反映して永続化
      const x = parseInt(card.style.gridColumnStart) - 1;
      const y = parseInt(card.style.gridRowStart) - 1;
      const w = card.style.gridColumn.split('span ')[1];
      const h = card.style.gridRow.split('span ')[1];
      
      store.updateWidgetLayout(this.activeWidgetId, { 
        x: isNaN(x) ? this.initialLayout.x : x, 
        y: isNaN(y) ? this.initialLayout.y : y, 
        w: parseInt(w) || this.initialLayout.w, 
        h: parseInt(h) || this.initialLayout.h 
      });
    }

    this.activeWidgetId = null;
    this.activeHandler = null;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  updateVisualPreview(id, layoutUpdate) {
    const card = this.container.querySelector(`[data-id="${id}"]`);
    if (!card) return;

    if (layoutUpdate.x !== undefined) card.style.gridColumnStart = layoutUpdate.x + 1;
    if (layoutUpdate.y !== undefined) card.style.gridRowStart = layoutUpdate.y + 1;
    if (layoutUpdate.w !== undefined) card.style.gridColumn = `span ${layoutUpdate.w}`;
    if (layoutUpdate.h !== undefined) card.style.gridRow = `span ${layoutUpdate.h}`;
  }

  render(state) {
    const { dashboard, responses, ui } = state;
    this.container.innerHTML = `
      <div class="dashboard-wrapper ${ui.isEditMode ? 'mode-edit' : 'mode-view'}">
        <header class="dashboard-header" style="margin-bottom: 20px;">
           <div style="display:flex; justify-content: space-between; align-items: center;">
            <h2 style="margin:0;">Analytics Dashboard</h2>
            ${ui.isEditMode ? '<button id="add-widget-btn" class="primary-btn">Add Widget</button>' : ''}
          </div>
        </header>
        <div class="widget-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 100px; gap: 10px; position: relative;">
          ${dashboard.widgets.map(w => this.renderWidget(w, responses, dashboard.filters, ui.isEditMode)).join('')}
        </div>
      </div>
    `;
  }

  renderWidget(widget, responses, filters, isEditMode) {
    const chartData = AnalysisEngine.aggregate(responses, widget, filters);
    const { x, y, w, h } = widget.layout;

    return `
      <div class="widget-card" data-id="${widget.id}" 
           style="grid-column: ${x + 1} / span ${w}; grid-row: ${y + 1} / span ${h}; position: relative;">
        <div class="widget-header" style="cursor: ${isEditMode ? 'move' : 'default'};">
          <span style="font-weight:bold; font-size: 0.8rem;">${widget.title}</span>
          ${isEditMode ? '<button class="delete-widget-btn">×</button>' : ''}
        </div>
        <div class="widget-body">
           ${this.createSimpleBarChart(chartData)}
        </div>
        ${isEditMode ? '<div class="resize-handle" style="position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, #3498db 50%);"></div>' : ''}
      </div>
    `;
  }

  createSimpleBarChart(data) {
    if (!data.length) return '<p style="font-size:0.7rem; color:#999;">No data</p>';
    const max = Math.max(...data.map(d => d.value), 1);
    return data.map(d => `
      <div style="margin-bottom: 5px;">
        <div style="display:flex; justify-content:space-between; font-size:0.6rem;"><span>${d.label}</span><span>${d.value}</span></div>
        <div style="background:#eee; height:4px; border-radius:2px;"><div style="width:${(d.value/max)*100}%; background:#3498db; height:100%;"></div></div>
      </div>
    `).join('');
  }
}