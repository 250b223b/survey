/**
 * Application State Manager (完全版)
 * 設問データ、回答データ、ダッシュボード構成を一元管理し、永続化に対応します。
 */

// 初期状態のテンプレート（保存データがない場合に使用）[cite: 7]
const DEFAULT_STATE = {
  survey: {
    title: "新規エンゲージメント調査",
    questions: [
      { id: "q1", type: "rating", text: "仕事にやりがいを感じる", category: "Engagement" }
    ]
  },
  responses: [
    { id: "r1", q1: 5, department: "Sales", tenure: "3-5y" },
    { id: "r2", q1: 3, department: "R&D", tenure: "1-3y" },
    { id: "r3", q1: 4, department: "Sales", tenure: "1-3y" }
  ],
  dashboard: {
    widgets: [
      { 
        id: "w1", 
        type: "bar", 
        title: "部署別スコア",
        x: "department", 
        y: "q1", 
        layout: { x: 0, y: 0, w: 6, h: 4 } 
      }
    ],
    filters: { department: "All", tenure: "All" }
  },
  ui: {
    currentView: "dashboard",
    isEditMode: true
  }
};

class State {
  constructor() {
    // デフォルト値で初期化[cite: 7]
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.listeners = [];
  }

  /**
   * 外部から保存された状態を注入する（Hydration）[cite: 7]
   */
  hydrate(savedState) {
    if (savedState) {
      // 既存の構造を維持しつつ、保存データをマージ[cite: 7]
      this.state = {
        ...this.state,
        ...savedState,
        ui: { ...this.state.ui, ...savedState.ui }
      };
      console.log('[State] Hydrated from saved data');
    }
    this._notify();
  }

  /**
   * 状態を取得する（イミュータブルなコピーを返す）[cite: 7]
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * 汎用的な状態更新メソッド
   */
  update(path, value) {
    const keys = path.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this._notify();
  }

  // --- ウィジェット操作メソッド (Tableau風の動的編集用) ---

  /**
   * 新しいウィジェットを追加
   */
  addWidget(type = 'bar') {
    const newWidget = {
      id: `w${Date.now()}`,
      type: type,
      title: "新規グラフ",
      x: "department",
      y: "q1",
      layout: { x: 0, y: 100, w: 6, h: 4 }
    };
    this.state.dashboard.widgets.push(newWidget);
    this._notify();
  }

  /**
   * ウィジェットを削除
   */
  removeWidget(id) {
    this.state.dashboard.widgets = this.state.dashboard.widgets.filter(w => w.id !== id);
    this._notify();
  }

  /**
   * ウィジェットの配置（座標・サイズ）を更新
   */
  updateWidgetLayout(id, newLayout) {
    const widget = this.state.dashboard.widgets.find(w => w.id === id);
    if (widget) {
      widget.layout = { ...widget.layout, ...newLayout };
      this._notify();
    }
  }

  /**
   * ウィジェットの内部設定（集計軸やタイトル）を更新
   */
  updateWidgetConfig(id, config) {
    const index = this.state.dashboard.widgets.findIndex(w => w.id === id);
    if (index !== -1) {
      this.state.dashboard.widgets[index] = { ...this.state.dashboard.widgets[index], ...config };
      this._notify();
    }
  }

  // --- オブザーバーパターン実装 ---

  /**
   * 状態変更を購読
   */
  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * 全リスナーに通知
   */
  _notify() {
    const currentState = this.getState();
    this.listeners.forEach(callback => callback(currentState));
  }
}

// シングルトンとしてエクスポート[cite: 7]
export const store = new State();