<template>
  <div class="question-result-card">
    <MarkdownRenderer
      :markdown-content="question.question"
      :question-number="question.global_index"
    />

    <div :class="['answer-status', isCorrect ? 'correct' : 'incorrect']">
      <div class="answer-status__left">
        <strong>你的答案：</strong>
        <span v-if="question.type === 'single_choice'">
          {{ getOptionText(userAnswer) || 未作答}}
        </span>
        <span v-if="question.type === 'multiple_choice'">
          <ul v-if="userAnswer && userAnswer.length > 0" class="result-list">
            <li v-for="optId in userAnswer" :key="optId">
              {{ getOptionText(optId) }}
            </li>
          </ul>
          <span v-else>未作答</span>
        </span>
        <span v-else-if="question.type === 'short_answer'">
          {{ userAnswer || '未作答' }}
        </span>
        <span v-else-if="question.type === 'fill_in_the_blank'">
          {{ userAnswer || '未作答' }}
        </span>
        <span v-else-if="question.type === 'drag_and_drop_order'">
          <ul v-if="Array.isArray(userAnswer) && userAnswer.length > 0" class="result-list">
            <li v-for="itemId in userAnswer" :key="itemId">
              {{ getDraggableItemText(itemId) }}
            </li>
          </ul>
          <span v-else>未作答</span>
        </span>
      </div>

      <span class="status-indicator">
        {{ isCorrect ? '✅ 正确' : '❌ 错误' }}
      </span>
    </div>

    <div class="correct-answer-display">
      <strong>正确答案：</strong>
      <span v-if="question.type === 'single_choice'">
        {{ getOptionText(question.correct_answer) }}
      </span>
      <span v-else-if="question.type === 'multiple_choice'">
        <ul class="result-list">
          <li v-for="optId in question.correct_answer" :key="optId">
            {{ getOptionText(optId) }}
          </li>
        </ul>
      </span>
      <span v-else-if="question.type === 'short_answer'">
        {{ Array.isArray(question.correct_answer) ? question.correct_answer.join(' / ') : question.correct_answer }}
        <span v-if="question.alternatives && question.alternatives.length > 0">
          (或: {{ question.alternatives.join(' / ') }})
        </span>
      </span>
      <span v-else-if="question.type === 'fill_in_the_blank'">
        {{ Array.isArray(question.correct_answer) ? question.correct_answer.join(' / ') : question.correct_answer }}
        <span v-if="question.alternatives && question.alternatives.length > 0">
          (或: {{ question.alternatives.join(' / ') }})
        </span>
      </span>
      <span v-else-if="question.type === 'drag_and_drop_order'">
        <ol class="result-list">
          <li v-for="itemId in question.correct_order" :key="itemId">
            {{ getDraggableItemText(itemId) }}
          </li>
        </ol>
      </span>
    </div>

    <div v-if="question.explanation" class="explanation-display">
      <strong>解析：</strong>
      <MarkdownRenderer :markdown-content="question.explanation" />
    </div>
  </div>
</template>

<script>
import MarkdownRenderer from './MarkdownRenderer.vue'; // 导入 MarkdownRenderer 组件

export default {
  name: 'QuestionResult',
  components: {
    MarkdownRenderer // 注册 MarkdownRenderer 组件
  },
  props: {
    question: {
      type: Object,
      required: true
    },
    userAnswer: { // 用户答案可能是字符串（简答、填空）或数组（多选、拖拽）
      type: [String, Array, undefined, null],
      default: undefined
    }
  },
  computed: {
    // 判断用户答案是否正确
    isCorrect() {
      const { question, userAnswer } = this;
      if (userAnswer === undefined || userAnswer === null) {
        return false; // 未作答视为不正确
      }

      if (question.type === 'single_choice') {
        return userAnswer === question.correct_answer;
      } else if (question.type === 'multiple_choice' || question.type === 'drag_and_drop_order') {
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
        const sortedUserAnswer = question.type === 'multiple_choice' ? [...userAnswerArray].sort() : userAnswerArray;
        const sortedCorrectAnswer = question.type === 'multiple_choice' ? [...question.correct_answer].sort() : question.correct_order;
        return JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
      } else if (question.type === 'short_answer' || question.type === 'fill_in_the_blank') {
        if (typeof userAnswer !== 'string') return false;

        let processedUserAnswer = question.trim_whitespace !== false ? userAnswer.trim() : userAnswer;
        if (question.case_sensitive === false) {
          processedUserAnswer = processedUserAnswer.toLowerCase();
        }

        let correct = false;
        if (Array.isArray(question.correct_answer)) {
          const correctAnswers = question.correct_answer.map(ans =>
              question.case_sensitive === false ? ans.toLowerCase() : ans
          );
          correct = correctAnswers.includes(processedUserAnswer);
        } else {
          let processedCorrectAnswer = question.correct_answer;
          if (question.case_sensitive === false) {
              processedCorrectAnswer = processedCorrectAnswer.toLowerCase();
          }
          correct = (processedUserAnswer === processedCorrectAnswer);
        }

        if (!correct && question.alternatives) {
            const processedAlternatives = question.alternatives.map(alt => {
                let p_alt = question.trim_whitespace !== false ? alt.trim() : alt;
                return question.case_sensitive === false ? p_alt.toLowerCase() : p_alt;
            });
            correct = processedAlternatives.includes(processedUserAnswer);
        }
        return correct;
      }
      return false;
    }
  },
  methods: {
    // 辅助方法：根据选项ID获取文本
    getOptionText(optionId) {
      const option = this.question.options.find(opt => opt.id === optionId);
      return option ? option.text : '未知选项';
    },
    // 辅助方法：获取拖拽项的文本内容
    getDraggableItemText(itemId) {
      const item = this.question.items.find(i => i.id === itemId);
      return item ? item.text : '未知项';
    }
  }
};
</script>

<style scoped>
.question-result-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 25px;
  text-align: center;
}

.answer-status {
  margin-top: 25px;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 允许换行 */
}

.answer-status__left {
  flex: 1;
  display: flex;
  align-items: center;
}
  
.answer-status.correct {
  background-color: #e6ffe6;
  border: 1px solid #28a745;
  color: #28a745;
}

.answer-status.incorrect {
  background-color: #ffe6e6;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.status-indicator {
  margin-left: 20px;
  white-space: nowrap; /* 不换行 */
}

.correct-answer-display {
  display: flex;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background-color: #e6ffe6;
  border: 1px solid #28a745;
  border-radius: 8px;
  text-align: left;
  font-size: 1.1em;
  color: #28a745;
}

.explanation-display {
  margin-top: 25px;
  padding: 15px;
  background-color: #f9f9f9;
  border-left: 5px solid #42b983; /* 添加一个左边框作为区分 */
  border-radius: 4px;
  text-align: left;
}

/* 结果列表样式（用于多选和拖拽题的结果显示） */
.result-list {
  display: flex;
  gap: 10px;
  padding: 0;
  list-style-type: none; /* 使用数字列表 */
}

.result-list li {
  background-color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.95em;
  color: #333;
  font-weight: 400;
}

/* 媒体查询 */
@media (max-width: 768px) {
  .question-result-card {
    padding: 20px;
    margin-bottom: 20px;
  }

  .answer-status,
  .correct-answer-display,
  .explanation-display {
    padding: 12px;
    font-size: 1em;
  }

  .status-indicator {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
    text-align: right;
  }
}
</style>