// Dashboard.js 内の renderWidgetEditor メソッドを以下のように更新

renderWidgetEditor(widget) {
  const measures = [
    { id: 'avg', label: '平均値' },
    { id: 'median', label: '中央値' },
    { id: 'sum', label: '合計' },
    { id: 'count', label: '回答数' },
    { id: 'stdDev', label: 'バラつき(標準偏差)' },
    { id: 'topBox', label: '肯定的回答率(%)' }
  ];

  return `
    <div class="widget-controls" style="width:100%">
      <select class="config-select" data-field="aggregation" style="width: 100%; margin-bottom: 5px; background: #fffbe6; font-weight: bold;">
        ${measures.map(m => `<option value="${m.id}" ${widget.aggregation === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
      </select>
      
      <div style="display:flex; gap:5px;">
        <select class="config-select" data-field="x" style="flex:1">
            <option value="department" ${widget.x === 'department' ? 'selected' : ''}>部署別</option>
            <option value="tenure" ${widget.x === 'tenure' ? 'selected' : ''}>年数別</option>
        </select>
        <select class="config-select" data-field="y" style="flex:1">
            ${store.getState().survey.questions.map(q => `
                <option value="${q.id}" ${widget.y === q.id ? 'selected' : ''}>${q.id}</option>
            `).join('')}
        </select>
      </div>
    </div>
  `;
}