import { store } from '../core/state.js';
import { AnalysisEngine } from '../core/engine.js';

export class Dashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    store.subscribe((state) => this.render(state));
    this.initEventListeners();
  }

  initEventListeners() {
    this.container.addEventListener('click', (e) => {
      const widgetId = e.target.closest('.widget-card')?.dataset.id;
      if (e.target.id === 'add-widget-btn') store.addWidget('bar');
      if (widgetId && e.target.classList.contains('delete-widget-btn')) store.removeWidget(widgetId);
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
    this.container.innerHTML = `
      <div class="dashboard-wrapper ${ui.isEditMode ? 'mode-edit' : 'mode-view'}">
        <header class="dashboard-header" style="background: #fff; padding: 1.5rem; border-bottom: 1px solid #eee; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin:0; font-weight: 800; color: #2c3e50;">Organization Analytics</h2>
            ${ui.isEditMode ? '<button id="add-widget-btn" class="primary-btn">＋ ウィジェット追加</button>' : ''}
          </div>
          ${this.renderFilters(dashboard.filters)}
        </header>
        <div class="widget-grid">
          ${dashboard.widgets.map(w => this.renderWidget(w, responses, dashboard.filters, ui.isEditMode)).join('')}
        </div>
      </div>
    `;
  }

  renderFilters(filters) {
    // 複数のフィルタ（部署・勤続年数）を並列化
    const depts = ['All', 'Sales', 'R&D', 'HR', 'Marketing'];
    const tenures = ['All', '1-3y', '3-5y', '5y+'];

    return `
      <div class="filter-group" style="display: flex; gap: 20px; align-items: center;">
        <label style="font-size: 0.8rem; color: #7f8c8d;">DEPT: 
          <select class="filter-select" onchange="import('../core/state.js').then(m => m.store.update('dashboard.filters.department', this.value))">
            ${depts.map(d => `<option value="${d}" ${filters.department === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </label>
        <label style="font-size: 0.8rem; color: #7f8c8d;">TENURE: 
          <select class="filter-select" onchange="import('../core/state.js').then(m => m.store.update('dashboard.filters.tenure', this.value))">
            ${tenures.map(t => `<option value="${t}" ${filters.tenure === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </label>
      </div>
    `;
  }

  renderWidget(widget, responses, filters, isEditMode) {
    const chartData = AnalysisEngine.aggregate(responses, widget, filters);
    let chartHtml = '';

    // ウィジェットタイプに応じて描画ロジックを分岐（プロフェッショナルな多角分析）
    switch(widget.type) {
      case 'pie': chartHtml = this.createPieChart(chartData); break;
      case 'radar': chartHtml = this.createRadarChart(chartData); break;
      case 'bar':
      default: chartHtml = this.createSimpleBarChart(chartData);
    }

    return `
      <div class="widget-card" data-id="${widget.id}" style="grid-column: span ${widget.layout.w}; grid-row: span ${widget.layout.h};">
        <div class="widget-header">
          ${isEditMode ? this.renderWidgetEditor(widget) : `<h3 style="margin:0; font-size: 0.9rem;">${widget.title}</h3>`}
          ${isEditMode ? `<button class="delete-widget-btn">×</button>` : ''}
        </div>
        <div class="widget-body" style="display: flex; align-items: center; justify-content: center; height: 100%;">
          ${chartHtml}
        </div>
      </div>
    `;
  }

  /**
   * 円グラフ (SVG)
   */
  createPieChart(data) {
    if (!data.length) return 'No Data';
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c'];
    const paths = data.map((d, i) => {
      const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
      cumulativePercent += (d.value / total);
      const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
      const largeArcFlag = (d.value / total) > 0.5 ? 1 : 0;
      return `<path d="M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z" fill="${colors[i % colors.length]}"></path>`;
    }).join('');

    return `
      <div style="text-align: center;">
        <svg viewBox="-1 -1 2 2" style="width: 120px; transform: rotate(-90deg);">${paths}</svg>
        <div style="font-size: 0.6rem; margin-top: 5px;">${data.map((d, i) => `<span style="color:${colors[i % colors.length]}">●</span> ${d.label}`).join(' ')}</div>
      </div>
    `;
  }

  /**
   * レーダーチャート (SVG)
   */
  createRadarChart(data) {
    if (data.length < 3) return 'Need 3+ points';
    const size = 150;
    const center = size / 2;
    const radius = size * 0.4;
    const maxValue = Math.max(...data.map(d => d.value), 5);

    const points = data.map((d, i) => {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const r = (d.value / maxValue) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    const grid = [0.5, 1].map(f => {
      const p = data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const r = radius * f;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      }).join(' ');
      return `<polygon points="${p}" fill="none" stroke="#eee" />`;
    }).join('');

    return `
      <svg width="${size}" height="${size}">
        ${grid}
        <polygon points="${points}" fill="rgba(52, 152, 219, 0.4)" stroke="#3498db" stroke-width="2" />
      </svg>
    `;
  }

  createSimpleBarChart(data) {
    // 既存の棒グラフ (省略せず、洗練されたスタイルで維持)
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return `
      <div style="width: 100%; font-size: 0.7rem;">
        ${data.map(d => `
          <div style="margin-bottom: 4px;">
            <div style="display:flex; justify-content: space-between;"><span>${d.label}</span><b>${d.value}</b></div>
            <div style="background:#eee; height:6px; border-radius:3px;"><div style="width:${(d.value/maxValue)*100}%; background:#3498db; height:100%; border-radius:3px;"></div></div>
          </div>
        `).join('')}
      </div>`;
  }

  renderWidgetEditor(widget) {
    // グラフの種類を選択できるように拡張
    const types = ['bar', 'pie', 'radar'];
    return `
      <div class="widget-controls" style="width:100%">
        <select class="config-select" data-field="type" style="width: 100%; margin-bottom: 5px;">
          ${types.map(t => `<option value="${t}" ${widget.type === t ? 'selected' : ''}>${t.toUpperCase()} CHART</option>`).join('')}
        </select>
        <div style="display:flex; gap:5px;">
          <select class="config-select" data-field="x" style="flex:1">${['department', 'tenure'].map(opt => `<option value="${opt}" ${widget.x === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>
          <select class="config-select" data-field="y" style="flex:1">${['q1', 'q2'].map(opt => `<option value="${opt}" ${widget.y === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>
        </div>
      </div>
    `;
  }
}