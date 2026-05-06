/**
 * Persistence Service
 * データの保存と読み込みを担当します。
 */

const STORAGE_KEY = 'SURVEY_BI_APP_DATA';

export class ApiService {
  /**
   * 現在のアプリケーション状態を保存する
   * @param {Object} state - store.getState() で取得したデータ
   */
  static async saveState(state) {
    return new Promise((resolve) => {
      // 大規模データの場合にメインスレッドを止めないよう、擬似的に非同期化
      setTimeout(() => {
        try {
          const data = JSON.stringify(state);
          localStorage.setItem(STORAGE_KEY, data);
          console.log('[API] State saved to LocalStorage');
          resolve(true);
        } catch (error) {
          console.error('[API] Failed to save state:', error);
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * 保存されている状態を読み込む
   * @returns {Object|null} - 保存されたデータ、または null
   */
  static async loadState() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          try {
            console.log('[API] State loaded from LocalStorage');
            resolve(JSON.parse(data));
          } catch (error) {
            console.error('[API] Failed to parse loaded data:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }, 100);
    });
  }

  /**
   * データをリセットする
   */
  static clearState() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload(); // 状態をクリアして初期化
  }

  /**
   * 状態の変更を自動的に監視して保存するプラグイン
   * @param {Object} store - core/state.js の store インスタンス
   */
  static initAutoSave(store) {
    // 状態が変化するたびに自動保存（デバウンス処理を入れるのが望ましい）
    let timeout;
    store.subscribe((state) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.saveState(state);
      }, 2000); // 2秒間操作がなければ保存
    });
  }
}