// DEFAULT_STATE に snapshots を追加
const DEFAULT_STATE = {
  // ... 他のプロパティは維持 ...
  dashboard: {
    widgets: [],
    filters: { department: "All", tenure: "All" },
    snapshots: [] // ← 追加：スナップショットの保存先
  },
  // ...
};

// Stateクラスに以下のメソッドを追加
class State {
  // ... 既存メソッド ...

  /**
   * 現在のダッシュボードの状態を保存
   */
  saveSnapshot(name) {
    if (!name) return;
    const newSnapshot = {
      name: name,
      timestamp: new Date().toISOString(),
      widgets: JSON.parse(JSON.stringify(this.state.dashboard.widgets))
    };
    
    // 同名のスナップショットがあれば上書き、なければ追加
    const index = this.state.dashboard.snapshots.findIndex(s => s.name === name);
    if (index !== -1) {
      this.state.dashboard.snapshots[index] = newSnapshot;
    } else {
      this.state.dashboard.snapshots.push(newSnapshot);
    }
    this._notify();
  }

  /**
   * スナップショットを適用してダッシュボードを復元
   */
  applySnapshot(name) {
    const snapshot = this.state.dashboard.snapshots.find(s => s.name === name);
    if (snapshot) {
      this.state.dashboard.widgets = JSON.parse(JSON.stringify(snapshot.widgets));
      this._notify();
    }
  }

  /**
   * スナップショットを削除
   */
  deleteSnapshot(name) {
    this.state.dashboard.snapshots = this.state.dashboard.snapshots.filter(s => s.name !== name);
    this._notify();
  }
}