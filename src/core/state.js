/**
 * Application State Manager (Professional Edition)
 * 設問、回答、ダッシュボード、レイアウト、スナップショットを統合管理します。
 */

// 1. 初期状態のテンプレート（保存データがない場合、またはリセット時に使用）
const DEFAULT_STATE = {
  survey: {
    title: "Organization Health Check",
    questions: [
      { id: "q1", type: "rating", text: "チームの意思疎通は円滑である", category: "Teamwork" },
      { id: "q2", type: "rating", text: "自分の役割に満足している", category: "Growth" }
    ]
  },
  responses: [
    { id: "r1", q1: 5, q2: 4, department: "Sales", tenure: "3-5y" },
    { id: "r2", q1: 3, q2: 5, department: "R&D", tenure: "1-3y" },
    { id: "r3", q1: 2, q2: 2, department: "HR", tenure: "5y+" }
  ],
  dashboard: {
    widgets: [
      { 
        id: "w1", 
        type: "bar", 
        title: "部署別スコア (Q1)", 
        x: "department", 
        y: "q1", 
        aggregation: "avg", 
        layout: { x: 0, y: 0, w: 6, h: 4 } 
      }
    ],
    filters: { department: "All", tenure: "All" },
    snapshots: [] // 読み込みエラーを防ぐために必須の項目
  },
  ui: {
    currentView: "dashboard",
    isEditMode: true
  }
};

class State {
  constructor() {
    // デフォルト値で初期化
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.listeners = [];
  }

  /**
   * 外部（ApiService）から保存された状態を注入する（Hydration）
   * 古いデータ構造が混ざっても壊れないようにマージします。
   */
  hydrate(savedState) {
    if (savedState) {
      this.state = {
        ...this.state,
        ...savedState,
        // ネストされたオブジェクトの階層まで安全にマージ
        dashboard: { 
          ...this.state.dashboard, 
          ...savedState.dashboard,
          // スナップショットが保存データにない場合は空配列を保証
          snapshots: (savedState.dashboard && savedState.dashboard.snapshots) 
            ? savedState.dashboard.snapshots 
            : []
        },
        ui: { 
          ...this.state.ui, 
          ...savedState.ui 
        }
      };
      console.log('[State] Hydrated with safety checks');
    }
    this._notify();
  }

  /**
   * 状態を取得する（イミュータブルなコピー）
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * パス指定による状態更新（例: update('ui.currentView', 'editor')）
   */
  update(path, value) {
    const keys = path.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this._notify();
  }

  // --- ウィジェット操作メソッド ---

  addWidget(type = 'bar') {
    const newWidget = {
      id: `w${Date.now()}`,
      type: type,
      title: "新規分析グラフ",
      x: "department",
      y: "q1",
      aggregation: "avg",
      layout: { x: 0, y: 10, w: 6, h: 4 }
    };
    this.state.dashboard.widgets.push(newWidget);
    this._notify();
  }

  removeWidget(id) {
    this.state.dashboard.widgets = this.state.dashboard.widgets.filter(w => w.id !== id);
    this._notify();
  }

  updateWidgetLayout(id, newLayout) {
    const widget = this.state.dashboard.widgets.find(w => w.id === id);
    if (widget) {
      widget.layout = { ...widget.layout, ...newLayout };
      this._notify();
    }
  }

  updateWidgetConfig(id, config) {
    const index = this.state.dashboard.widgets.findIndex(w => w.id === id);
    if (index !== -1) {
      this.state.dashboard.widgets[index] = { ...this.state.dashboard.widgets[index], ...config };
      this._notify();
    }
  }

  // --- スナップショット（保存ビュー）操作 ---

  saveSnapshot(name) {
    if (!name) return;
    const newSnapshot = {
      name: name,
      timestamp: new Date().toISOString(),
      widgets: JSON.parse(JSON.stringify(this.state.dashboard.widgets))
    };
    
    const index = this.state.dashboard.snapshots.findIndex(s => s.name === name);
    if (index !== -1) {
      this.state.dashboard.snapshots[index] = newSnapshot;
    } else {
      this.state.dashboard.snapshots.push(newSnapshot);
    }
    this._notify();
  }

  applySnapshot(name) {
    const snapshot = this.state.dashboard.snapshots.find(s => s.name === name);
    if (snapshot) {
      this.state.dashboard.widgets = JSON.parse(JSON.stringify(snapshot.widgets));
      this._notify();
    }
  }

  deleteSnapshot(name) {
    this.state.dashboard.snapshots = this.state.dashboard.snapshots.filter(s => s.name !== name);
    this._notify();
  }

  // --- オブザーバーパターン実装 ---

  subscribe(callback) {
    this.listeners.push(callback);
    // 初回実行
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

// シングルトンとしてエクスポート
export const store = new State();