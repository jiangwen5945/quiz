<template>
  <div class="question-card">
    <!-- 题目内容 -->
    <MarkdownRenderer
      :markdown-content="question.question"
      :question-number="question.global_index"
    />
    <!-- 选择题操作 -->
    <ChoiceQuestion
      v-if="question.type === 'single_choice' || question.type === 'multiple_choice'"
      :question="question"
      v-model="questionUserAnswer"
    />
    <!-- 简答题操作 -->
    <ShortAnswerQuestion
      v-else-if="question.type === 'short_answer'"
      v-model="questionUserAnswer"
    />
    <!-- 未知类型提示 -->
    <p v-else>未知题目类型。</p>
  </div>
</template>

<script>
import ChoiceQuestion from './ChoiceQuestion.vue'; // 选择题组件
import ShortAnswerQuestion from './ShortAnswerQuestion.vue'; // 简答题组件
import MarkdownRenderer from './MarkdownRenderer.vue'; // 题目内容组件

export default {
  name: 'TheQuestion',
  components: {
    ChoiceQuestion,
    ShortAnswerQuestion,
    MarkdownRenderer
  },
  props: {
    question: {
      type: Object,
      required: true
    },
    userAnswer: { // The user's answer for the current question.
      type: [String, Array, undefined, null],
      default: undefined
    }
  },
  computed: {
    // 新增计算属性，用于在 Question 组件中统一管理用户答案
    questionUserAnswer: {
      get() {
        return this.userAnswer;
      },
      set(value) {
        // 当 FillInTheBlank 组件通过 v-model 更新值时，触发父组件的更新
        this.$emit('update:user-answer', {
          questionId: this.question.id,
          answer: value
        });
      }
    }
  },
  methods: {
    emitUserAnswer(answer) {
      this.$emit('update:user-answer', {
        questionId: this.question.id,
        answer: answer
      });
    }
  }
};
</script>

<style scoped>
.question-card {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  text-align: left; /* Aligns question content to the left. */
}
</style>