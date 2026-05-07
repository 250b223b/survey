import { store } from '../core/state.js';

export class SurveyResponder {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    store.subscribe((state) => {
      this.render(state.survey);
    });
  }

  /**
   * 送信処理
   */
  handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = {
      id: `r${Date.now()}`,
      timestamp: new Date().toISOString(),
      // 便宜上、今はランダムな属性（部署など）を付与
      department: ['Sales', 'R&D', 'HR'][Math.floor(Math.random() * 3)],
      tenure: ['1-3y', '3-5y', '5y+'][Math.floor(Math.random() * 3)],
    };

    // 各設問の回答を取得
    formData.forEach((value, key) => {
      response[key] = Number(value) || value;
    });

    // Stateのresponsesに追加
    const { responses } = store.getState();
    store.update('responses', [...responses, response]);

    alert('回答を送信しました！ダッシュボードを確認してください。');
    e.target.reset();
  }

  render(survey) {
    this.container.innerHTML = `
      <div class="responder-container" style="max-width: 600px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #2c3e50;">${survey.title}</h1>
        <form id="survey-form">
          ${survey.questions.map(q => this.createField(q)).join('')}
          <button type="submit" class="primary-btn" style="width: 100%; margin-top: 2rem; height: 50px; font-size: 1.1rem;">回答を送信する</button>
        </form>
      </div>
    `;

    const form = this.container.querySelector('#survey-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  createField(q) {
    if (q.type === 'rating') {
      return `
        <div class="field-group" style="margin-bottom: 2rem;">
          <p style="font-weight: bold; margin-bottom: 0.5rem;">${q.text}</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>不満</span>
            ${[1, 2, 3, 4, 5].map(v => `
              <label><input type="radio" name="${q.id}" value="${v}" required><br>${v}</label>
            `).join('')}
            <span>満足</span>
          </div>
        </div>
      `;
    }
    return `
      <div class="field-group" style="margin-bottom: 2rem;">
        <label style="font-weight: bold; display: block; margin-bottom: 0.5rem;">${q.text}</label>
        <textarea name="${q.id}" class="question-input" style="height: 100px;"></textarea>
      </div>
    `;
  }
}