/**
 * Analysis Engine (Professional Edition)
 */
export class AnalysisEngine {
  static aggregate(responses, widgetConfig, globalFilters) {
    const filteredData = this._applyFilters(responses, globalFilters);
    const groups = this._groupBy(filteredData, widgetConfig.x);

    return Object.keys(groups).map(key => {
      const groupData = groups[key];
      // 集計方法(aggregation)を動的に切り替え
      const value = this._calculate(
        groupData, 
        widgetConfig.y, 
        widgetConfig.aggregation || 'avg'
      );
      
      return {
        label: key,
        value: parseFloat(value.toFixed(2))
      };
    });
  }

  static _applyFilters(data, filters) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === 'All') return true;
        return item[key] === value;
      });
    });
  }

  static _groupBy(data, key) {
    return data.reduce((acc, item) => {
      const groupValue = item[key] || '未分類';
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {});
  }

  /**
   * 統計計算ロジックの拡張
   */
  static _calculate(groupData, targetKey, method) {
    if (groupData.length === 0) return 0;
    const values = groupData.map(d => Number(d[targetKey])).filter(v => !isNaN(v));
    if (values.length === 0) return 0;

    switch (method) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'count':
        return values.length;
      case 'median': // 中央値
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      case 'stdDev': // 標準偏差（データのバラつき）
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
      case 'topBox': // 肯定的回答率 (4点以上の割合 %)
        const topCount = values.filter(v => v >= 4).length;
        return (topCount / values.length) * 100;
      case 'avg':
      default:
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
}