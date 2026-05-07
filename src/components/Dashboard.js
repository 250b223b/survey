import { store } from '../core/state.js';
import { AnalysisEngine } from '../core/engine.js';

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
      if (!widgetId) return;

      // ウィジェット削除
      if (e.target.classList.contains('delete-widget-btn')) {
        store.removeWidget(widgetId);
      }

      // ウィジェット追加（ヘッダーにある想定）
      if (e.target.id === 'add-widget-btn') {
        store.addWidget('bar');
      }
    });

    this.container.addEventListener('change', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (!widgetId) return;

      // 軸の変更（Tableau的な次元/指標の切り替え）
      if (e.target.classList.contains('config-select')) {
        const field = e.target.dataset.field; // 'x' or 'y'
        store.updateWidgetConfig(widgetId, { [field]: e.target.value });
      }
    });
  }

  render(state) {
    const { dashboard, responses, ui } = state;
    
    this.container.innerHTML = `
      <div class="dashboard-wrapper ${ui.isEditMode ? 'mode-edit' : 'mode-view'}">
        <header class="dashboard-header">
          <div class="header-main">
            <h2>分析ダッシュボード ${ui.isEditMode ? '<span class="badge">編集モード</span>' : ''}</h2>
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

  // ... renderFilters メソッドは前回と同様のため省略 ...

  renderWidget(widget, responses, filters, isEditMode) {
    const chartData = AnalysisEngine.aggregate(responses, widget, filters);

    return `
      <div class="widget-card" data-id="${widget.id}" style="grid-column: span ${widget.layout.w}; grid-row: span ${widget.layout.h};">
        <div class="widget-header">
          ${isEditMode ? this.renderWidgetEditor(widget) : `<h3>${widget.title}</h3>`}
          ${isEditMode ? `<button class="delete-widget-btn" title="削除">×</button>` : ''}
        </div>
        <div class="widget-body">
          ${this.createSimpleBarChart(chartData)}
        </div>
      </div>
    `;
  }

  /**
   * ウィジェットの設定変更UI（Tableauの「行・列」ドロップダウンに相当）
   */
  renderWidgetEditor(widget) {
    return `
      <div class="widget-controls">
        <input type="text" class="widget-title-input" value="${widget.title}" 
               onchange="import('../core/state.js').then(m => m.store.updateWidgetConfig('${widget.id}', {title: this.value}))">
        <div class="axis-config">
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

  // ... createSimpleBarChart メソッドは前回と同様のため省略 ...
}