import { store } from '../core/state.js';

/**
 * SurveyEditor Component
 * 設問の追加、編集、削除を行うUIモジュール
 */
export class SurveyEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Stateの変更を購読
    store.subscribe((state) => {
      this.render(state.survey);
    });

    this.initEventListeners();
  }

  /**
   * イベントリスナーの初期化（イベント委譲を活用）
   */
  initEventListeners() {
    this.container.addEventListener('click', (e) => {
      // 設問追加ボタン
      if (e.target.id === 'add-question-btn') {
        this.handleAddQuestion();
      }
      // 設問削除ボタン
      if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        this.handleDeleteQuestion(id);
      }
    });

    this.container.addEventListener('input', (e) => {
      // 設問内容のリアルタイム更新
      if (e.target.classList.contains('question-input')) {
        const id = e.target.dataset.id;
        const field = e.target.dataset.field; // 'text' | 'category' | 'type'
        this.handleUpdateQuestion(id, field, e.target.value);
      }
    });
  }

  // --- ハンドラ群 ---

  handleAddQuestion() {
    const { questions } = store.getState().survey;
    const newQuestion = {
      id: `q${Date.now()}`,
      type: 'rating',
      text: '',
      category: 'General'
    };
    store.update('survey.questions', [...questions, newQuestion]);
  }

  handleDeleteQuestion(id) {
    const { questions } = store.getState().survey;
    const filtered = questions.filter(q => q.id !== id);
    store.update('survey.questions', filtered);
  }

  handleUpdateQuestion(id, field, value) {
    const { questions } = store.getState().survey;
    const updated = questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    );
    store.update('survey.questions', updated);
  }

  /**
   * UIのレンダリング
   */
  render(survey) {
    this.container.innerHTML = `
      <div class="editor-container">
        <h2>${survey.title} エディタ</h2>
        <div class="question-list">
          ${survey.questions.map(q => this.createQuestionCard(q)).join('')}
        </div>
        <button id="add-question-btn" class="primary-btn">+ 設問を追加</button>
      </div>
    `;
  }

  createQuestionCard(q) {
    return `
      <div class="question-card" data-id="${q.id}">
        <div class="card-header">
          <input type="text" class="question-input" data-id="${q.id}" data-field="category" value="${q.category}" placeholder="カテゴリ">
          <select class="question-input" data-id="${q.id}" data-field="type">
            <option value="rating" ${q.type === 'rating' ? 'selected' : ''}>5段階評価</option>
            <option value="text" ${q.type === 'text' ? 'selected' : ''}>自由記述</option>
          </select>
          <button class="delete-btn" data-id="${q.id}">削除</button>
        </div>
        <div class="card-body">
          <textarea class="question-input" data-id="${q.id}" data-field="text" placeholder="設問文を入力してください">${q.text}</textarea>
        </div>
      </div>
    `;
  }
}