/**
 * Application State Manager (データ復元対応版)
 */

// 初期状態のテンプレート（保存データがない場合に使用）
const DEFAULT_STATE = {
  survey: {
    title: "新規エンゲージメント調査",
    questions: [
      { id: "q1", type: "rating", text: "仕事にやりがいを感じる", category: "Engagement" }
    ]
  },
  responses: [
    { id: "r1", q1: 5, department: "Sales", tenure: "3-5y" },
    { id: "r2", q1: 3, department: "R&D", tenure: "1-3y" }
  ],
  dashboard: {
    widgets: [],
    filters: { department: "All", tenure: "All" }
  },
  ui: {
    currentView: "dashboard",
    isEditMode: true
  }
};

class State {
  constructor() {
    // まずはデフォルト値で初期化
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.listeners = [];
  }

  /**
   * 外部から保存された状態を注入する（Hydration）
   * @param {Object} savedState - ApiServiceから取得したデータ
   */
  hydrate(savedState) {
    if (savedState) {
      // 保存データがある場合はマージ（構造の変化に備えて慎重に）
      this.state = {
        ...this.state,
        ...savedState,
        ui: { ...this.state.ui, ...savedState.ui } // UI状態も復元
      };
      console.log('[State] Hydrated from saved data');
    }
    this._notify(); // 初期化完了を通知
  }

  // --- 以下、既存メソッドのプレースホルダー ---

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  update(path, value) {
    // ... (以前の実装と同じ) ...
    const keys = path.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this._notify();
  }

  // ... addWidget, removeWidget, updateWidgetLayout 等 ...
  // ※これらは以前提示したコードをそのまま維持します。

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _notify() {
    const currentState = this.getState();
    this.listeners.forEach(callback => callback(currentState));
  }
}

export const store = new State();