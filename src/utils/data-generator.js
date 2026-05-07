import { store } from '../core/state.js';

/**
 * Mock Data Generator
 * 大規模な分析テスト用にランダムな回答データを生成します。
 */
export const DataGenerator = {
  /**
   * ランダムな回答データを生成してストアを更新する
   * @param {number} count - 生成する件数
   */
  generateResponses(count = 100) {
    const departments = ['Sales', 'R&D', 'HR', 'Marketing', 'Customer Success'];
    const tenures = ['1-3y', '3-5y', '5y+', 'Under 1y'];
    
    // 現在の設問IDを取得
    const questions = store.getState().survey.questions;
    
    const newResponses = Array.from({ length: count }, (_, i) => {
      const response = {
        id: `gen-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        department: departments[Math.floor(Math.random() * departments.length)],
        tenure: tenures[Math.floor(Math.random() * tenures.length)],
      };

      // 各設問に対してランダムなスコア(1-5)を割り当て
      questions.forEach(q => {
        if (q.type === 'rating') {
          // 少しリアリティを出すため、部署ごとに傾向を微調整（例: Salesはq1が高いなど）
          let baseScore = Math.floor(Math.random() * 5) + 1;
          response[q.id] = baseScore;
        } else {
          response[q.id] = "サンプルテキスト回答";
        }
      });

      return response;
    });

    // 既存のデータは残しつつ、新しいデータを結合して更新
    const currentResponses = store.getState().responses;
    store.update('responses', [...currentResponses, ...newResponses]);
    
    console.log(`[Generator] ${count}件のデータを生成しました。合計: ${store.getState().responses.length}件`);
  }
};