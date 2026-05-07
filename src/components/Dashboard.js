// render メソッド内のヘッダー部分を拡張
render(state) {
  const { dashboard, ui } = state;
  
  this.container.innerHTML = `
    <div class="dashboard-wrapper ${ui.isEditMode ? 'mode-edit' : 'mode-view'}">
      <header class="dashboard-header" style="background: #fff; padding: 1rem; border-bottom: 2px solid #34495e;">
        
        <div class="snapshot-bar" style="display: flex; gap: 10px; margin-bottom: 1rem; align-items: center; background: #f9f9f9; padding: 8px; border-radius: 4px;">
          <span style="font-size: 0.75rem; font-weight: bold; color: #7f8c8d;">SNAPSHOTS:</span>
          <select id="snapshot-select" style="font-size: 0.8rem; padding: 4px;">
            <option value="">-- 保存済みビューを選択 --</option>
            ${dashboard.snapshots.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
          </select>
          
          ${ui.isEditMode ? `
            <input type="text" id="snapshot-name-input" placeholder="ビュー名を入力" style="font-size: 0.8rem; padding: 4px; width: 120px;">
            <button id="save-snapshot-btn" class="secondary-btn" style="padding: 4px 12px; font-size: 0.8rem;">保存</button>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin:0;">Analytics Dashboard</h2>
          ${ui.isEditMode ? '<button id="add-widget-btn" class="primary-btn">＋ グラフ追加</button>' : ''}
        </div>
      </header>
      
      <div class="widget-grid">
        </div>
    </div>
  `;
}

// initEventListeners にスナップショット用の処理を追加
initEventListeners() {
  this.container.addEventListener('click', (e) => {
    // スナップショット保存
    if (e.target.id === 'save-snapshot-btn') {
      const name = document.getElementById('snapshot-name-input').value;
      if (name) {
        store.saveSnapshot(name);
        document.getElementById('snapshot-name-input').value = '';
      }
    }
  });

  this.container.addEventListener('change', (e) => {
    // スナップショット切り替え
    if (e.target.id === 'snapshot-select' && e.target.value) {
      store.applySnapshot(e.target.value);
    }
  });
  
  // ... 他のリスナー ...
}