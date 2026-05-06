import { store } from './core/state.js';
import { ApiService } from './services/api.js';
import { SurveyEditor } from './components/SurveyEditor.js';
import { Dashboard } from './components/Dashboard.js';

/**
 * Application Orchestrator
 */
async function initApp() {
  console.log('📊 Tableau-like Survey Platform Loading...');

  // 1. データの復元
  const savedData = await ApiService.loadState();
  store.hydrate(savedData);

  // 2. コンポーネントの初期化
  // HTML側のコンテナIDに紐付け
  new SurveyEditor('editor-view');
  new Dashboard('dashboard-view');

  // 3. サービスの起動
  ApiService.initAutoSave(store);

  // 4. グローバルなイベントバインド
  setupAppEvents();

  // 5. 初期表示のレンダリング
  syncUIWithState(store.getState());
}

/**
 * アプリケーション全体のイベント（ナビゲーションやモード切替）
 */
function setupAppEvents() {
  // タブ切り替え
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.update('ui.currentView', btn.dataset.view);
    });
  });

  // 編集モード切り替え（Dashboard内のボタンやヘッダーから呼ばれる想定）
  // ここでは簡略化のため、特定のキー操作やグローバルボタンで切り替え可能に
  window.addEventListener('keydown', (e) => {
    if (e.key === 'e' && e.ctrlKey) { // Ctrl + E で編集モードトグル
      const currentMode = store.getState().ui.isEditMode;
      store.update('ui.isEditMode', !currentMode);
      console.log(`[UI] Edit Mode: ${!currentMode}`);
    }
  });

  // Stateの変化を常に監視し、UIの「ガワ」を同期させる
  store.subscribe((state) => {
    syncUIWithState(state);
  });
}

/**
 * StateとDOMの状態（表示・非表示・クラス）を同期
 */
function syncUIWithState(state) {
  const { ui } = state;

  // ビューの切り替え
  const views = {
    editor: document.getElementById('editor-view'),
    dashboard: document.getElementById('dashboard-view')
  };

  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].style.display = (ui.currentView === key) ? 'block' : 'none';
    }
  });

  // ナビゲーションボタンの活性化
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === ui.currentView);
  });

  // 編集モードに応じたBodyクラスの付与（CSSでの制御用）
  document.body.classList.toggle('is-editing', ui.isEditMode);
}

document.addEventListener('DOMContentLoaded', initApp);