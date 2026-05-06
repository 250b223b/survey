/**
 * Analysis Engine
 * 生データをダッシュボード設定に基づいて集計・加工するコアロジック
 */

export class AnalysisEngine {
  /**
   * ダッシュボードのウィジェット設定に基づいてデータを集計する
   * @param {Array} responses - store.state.responses
   * @param {Object} widgetConfig - ウィジェットの構成 (x軸, y軸, 集計方法等)
   * @param {Object} globalFilters - 現在適用されているフィルタ
   * @returns {Array} - { label: string, value: number } の配列
   */
  static aggregate(responses, widgetConfig, globalFilters) {
    // 1. フィルタリング
    const filteredData = this._applyFilters(responses, globalFilters);

    // 2. グルーピング (x軸の項目ごとに分ける)
    const groups = this._groupBy(filteredData, widgetConfig.x);

    // 3. 集計 (y軸の値を計算する)
    return Object.keys(groups).map(key => {
      const groupData = groups[key];
      const value = this._calculate(groupData, widgetConfig.y, widgetConfig.aggregation || 'avg');
      return {
        label: key,
        value: parseFloat(value.toFixed(2)) // 小数点第2位までに丸める
      };
    });
  }

  /**
   * フィルタの適用
   */
  static _applyFilters(data, filters) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === 'All') return true;
        return item[key] === value;
      });
    });
  }

  /**
   * データのグループ化 (Pivot操作の基礎)
   */
  static _groupBy(data, key) {
    return data.reduce((acc, item) => {
      const groupValue = item[key] || '未分類';
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {});
  }

  /**
   * 指定された方法で計算 (平均, 合計, カウント)
   */
  static _calculate(groupData, targetKey, method) {
    if (groupData.length === 0) return 0;

    const values = groupData.map(d => Number(d[targetKey])).filter(v => !isNaN(v));

    switch (method) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'count':
        return values.length;
      case 'avg':
      default:
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }
  }
}