// ... 前半省略 ...
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
    { id: "r3", q1: 2, q2: 2, department: "HR", tenure: "5y+" },
    { id: "r4", q1: 4, q2: 4, department: "Marketing", tenure: "3-5y" }
  ],
  dashboard: {
    widgets: [
      { id: "w1", type: "radar", title: "部門別エンゲージメント", x: "department", y: "q1", layout: { x: 0, y: 0, w: 6, h: 4 } },
      { id: "w2", type: "pie", title: "回答者の部署構成", x: "department", y: "q1", aggregation: "count", layout: { x: 6, y: 0, w: 6, h: 4 } }
    ],
    filters: { department: "All", tenure: "All" }
  },
  ui: { currentView: "dashboard", isEditMode: true }
};
// ... 後半（クラス定義）は以前と同じ ...