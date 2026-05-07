/**
 * Application State Manager (Professional Edition)
 */

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
    { id: "r2", q1: 3, q2: 5, department: "R&D", tenure: "1-3y" }
  ],
  dashboard: {
    widgets: [
      { id: "w1", type: "bar", title: "部署別スコア", x: "department", y: "q1", aggregation: "avg", layout: { x: 0, y: 0, w: 6, h: 4 } }
    ],
    filters: { department: "All", tenure: "All" },
    snapshots: [] // ← これが重要です！
  },
  ui: {
    currentView: "dashboard",
    isEditMode: true
  }
};

class State {
  constructor() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.listeners = [];
  }

  hydrate(savedState) {
    if (savedState) {
      this.state = {
        ...this.state,
        ...savedState,
        dashboard: { ...this.state.dashboard, ...savedState.dashboard },
        ui: { ...this.state.ui, ...savedState.ui }
      };
      // snapshotsが保存データにない場合の保険
      if (!this.state.dashboard.snapshots) this.state.dashboard.snapshots = [];
    }
    this._notify();
  }

  getState() { return JSON.parse(JSON.stringify(this.state)); }

  update(path, value) {
    const keys = path.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this._notify();
  }

  // --- ウィジェット・レイアウト操作 ---
  addWidget(type = 'bar') {
    const newWidget = {
      id: `w${Date.now()}`,
      type: type,
      title: "新規グラフ",
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

  // --- スナップショット操作 ---
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

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getState());
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  _notify() {
    const currentState = this.getState();
    this.listeners.forEach(callback => callback(currentState));
  }
}

export const store = new State();