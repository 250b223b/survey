import { store } from './core/state.js';
import { ApiService } from './services/api.js';
import { SurveyEditor } from './components/SurveyEditor.js';
import { Dashboard } from './components/Dashboard.js';
import { SurveyResponder } from './components/SurveyResponder.js';

/**
 * Application Orchestrator
 * 全てのコンポーネントとサービスを初期化し、統合します。
 */
async function initApp() {
  console.log('📊 Survey & BI Studio: System Starting...');

  // 1. ローカルストレージから以前の状態を読み込む
  const savedData = await ApiService.loadState();
  
  // 2. 読み込んだデータをStateに反映（データがない場合は初期値が使われる）
  store.hydrate(savedData);

  // 3. 各コンポーネントの初期化
  // HTML側の各コンテナID（index.htmlに定義が必要）に紐付けます
  new SurveyEditor('editor-view');
  new Dashboard('dashboard-view');
  new SurveyResponder('responder-view');

  // 4. 状態変更時のオートセーブ機能を有効化
  ApiService.initAutoSave(store);

  // 5. グローバルなUI制御（ナビゲーション等）の設定
  setupGlobalEvents();

  // 6. 初期状態に基づいた画面表示の同期
  const initialState = store.getState();
  syncUIWithState(initialState);
  
  console.log('🚀 Survey & BI Studio: Ready');
}

/**
 * タブ切り替えやキーボードショートカットなどのグローバルイベントを設定
 */
function setupGlobalEvents() {
  // ナビゲーションボタンのクリックイベント
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view; // 'dashboard' | 'editor' | 'responder'
      store.update('ui.currentView', targetView);
    });
  });

  // 編集モード切替のショートカット (Ctrl + E)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'e' && e.ctrlKey) {
      e.preventDefault();
      const currentMode = store.getState().ui.isEditMode;
      store.update('ui.isEditMode', !currentMode);
      console.log(`[UI] Edit Mode: ${!currentMode ? 'ON' : 'OFF'}`);
    }
  });

  // Stateの変化を常に監視し、UIの外観（タブの活性状態など）を同期
  store.subscribe((state) => {
    syncUIWithState(state);
  });
}

/**
 * Stateの状態を実際のDOM表示（表示・非表示・クラス付与）に反映
 */
function syncUIWithState(state) {
  const { ui } = state;

  // 1. ビュー（画面セクション）の切り替え
  const views = {
    editor: document.getElementById('editor-view'),
    dashboard: document.getElementById('dashboard-view'),
    responder: document.getElementById('responder-view')
  };

  Object.keys(views).forEach(key => {
    const el = views[key];
    if (el) {
      el.style.display = (ui.currentView === key) ? 'block' : 'none';
    }
  });

  // 2. ナビゲーションボタンのアクティブ状態の同期
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.dataset.view === ui.currentView;
    btn.classList.toggle('active', isActive);
    
    // スタイル調整（layout.cssに定義がない場合の補完）
    if (isActive) {
      btn.style.borderBottom = '3px solid #3498db';
      btn.style.color = 'white';
    } else {
      btn.style.borderBottom = '3px solid transparent';
      btn.style.color = '#bdc3c7';
    }
  });

  // 3. 編集モードに応じたBodyクラスの付与（CSSでの一括制御用）
  document.body.classList.toggle('is-editing', ui.isEditMode);
}

// DOMの読み込み完了時にアプリを起動
document.addEventListener('DOMContentLoaded', initApp);