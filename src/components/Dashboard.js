import { store } from '../core/state.js';
import { AnalysisEngine } from '../core/engine.js';

/**
 * Dashboard Component
 */
export class Dashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    store.subscribe((state) => {
      this.render(state);
    });

    this.initEventListeners();
  }

  initEventListeners() {
    this.container.addEventListener('click', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (e.target.id === 'add-widget-btn') {
        store.addWidget('bar');
      }
      if (!widgetId) return;
      if (e.target.classList.contains('delete-widget-btn')) {
        store.removeWidget(widgetId);
      }
    });

    this.container.addEventListener('change', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (!widgetId) return;
      if (e.target.classList.contains('config-select')) {
        const field = e.target.dataset.field;
        store.updateWidgetConfig(widgetId, { [field]: e.target.value });
      }
    });
  }

  render(state) {
    const { dashboard, responses, ui } = state;
    
    // ここで this.renderFilters を呼び出しています
    this.container.innerHTML = `
      <div class="dashboard-wrapper ${ui.isEditMode ? 'mode-edit' : 'mode-view'}">
        <header class="dashboard-header">
          <div class="header-main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">分析ダッシュボード ${ui.isEditMode ? '<span class="badge" style="font-size: 0.8rem; background: #e67e22; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 10px;">編集モード</span>' : ''}</h2>
            ${ui.isEditMode ? '<button id="add-widget-btn" class="secondary-btn">+ グラフを追加</button>' : ''}
          </div>
          ${this.renderFilters(dashboard.filters)}
        </header>
        <div class="widget-grid">
          ${dashboard.widgets.map(w => this.renderWidget(w, responses, dashboard.filters, ui.isEditMode)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * フィルターセクションの描画（このメソッドが欠けていたのが原因です）
   */
  renderFilters(filters) {
    return `
      <div class="filter-bar" style="background: #eee; padding: 10px; border-radius: 4px; margin-bottom: 1rem;">
        <label style="font-size: 0.9rem; font-weight: bold;">部署フィルタ: 
          <select class="filter-select" onchange="import('../core/state.js').then(m => m.store.update('dashboard.filters.department', this.value))">
            <option value="All" ${filters.department === 'All' ? 'selected' : ''}>すべて</option>
            <option value="Sales" ${filters.department === 'Sales' ? 'selected' : ''}>Sales</option>
            <option value="R&D" ${filters.department === 'R&D' ? 'selected' : ''}>R&D</option>
          </select>
        </label>
      </div>
    `;
  }

  renderWidget(widget, responses, filters, isEditMode) {
    const chartData = AnalysisEngine.aggregate(responses, widget, filters);
    return `
      <div class="widget-card" data-id="${widget.id}" style="grid-column: span ${widget.layout.w}; grid-row: span ${widget.layout.h};">
        <div class="widget-header">
          ${isEditMode ? this.renderWidgetEditor(widget) : `<h3 style="margin: 0; font-size: 1rem;">${widget.title}</h3>`}
          ${isEditMode ? `<button class="delete-widget-btn" title="削除" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-weight:bold;">×</button>` : ''}
        </div>
        <div class="widget-body">
          ${this.createSimpleBarChart(chartData)}
        </div>
      </div>
    `;
  }

  renderWidgetEditor(widget) {
    return `
      <div class="widget-controls" style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
        <input type="text" class="widget-title-input" value="${widget.title}" style="font-size: 0.9rem; padding: 2px;"
               onchange="import('../core/state.js').then(m => m.store.updateWidgetConfig('${widget.id}', {title: this.value}))">
        <div class="axis-config" style="display: flex; gap: 10px; font-size: 0.75rem;">
          <label>軸: 
            <select class="config-select" data-field="x">
              <option value="department" ${widget.x === 'department' ? 'selected' : ''}>部署</option>
              <option value="tenure" ${widget.x === 'tenure' ? 'selected' : ''}>勤続年数</option>
            </select>
          </label>
          <label>値: 
            <select class="config-select" data-field="y">
              <option value="q1" ${widget.y === 'q1' ? 'selected' : ''}>設問1</option>
              <option value="q2" ${widget.y === 'q2' ? 'selected' : ''}>設問2</option>
            </select>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * グラフ描画（ここも欠けやすい部分です）
   */
  createSimpleBarChart(data) {
    if (data.length === 0) return `<p style="font-size: 0.8rem; color: #999;">データなし</p>`;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return `
      <div class="simple-bar-chart">
        ${data.map(item => `
          <div class="bar-row" style="display: flex; align-items: center; margin-bottom: 4px;">
            <div style="width: 60px; font-size: 0.7rem; overflow: hidden; text-overflow: ellipsis;">${item.label}</div>
            <div style="flex: 1; background: #eee; height: 8px; border-radius: 4px; margin: 0 8px;">
              <div style="width: ${(item.value / maxValue) * 100}%; background: #3498db; height: 100%; border-radius: 4px;"></div>
            </div>
            <div style="width: 25px; font-size: 0.7rem;">${item.value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}