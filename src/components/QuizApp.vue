<template>
  <div class="quiz-container" v-if="!isLoading">
    <h1>QuizApp</h1>
    <transition name="fade" mode="out-in">
      <!-- 准备测验 -->
      <div v-if="!quizStarted" class="start-screen">
        <div class="category-selection">
          <label for="category-select">选择题目分类:</label>
          <select id="category-select" v-model="selectedCategory">
            <option value="all">所有分类</option>
            <option v-for="category in uniqueCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <button @click="startQuiz">开始测验</button>
      </div>

      <!-- 进行测验 -->
      <div v-else-if="currentQuestionIndex < filteredQuestions.length" class="question-screen">
        <!-- 计时器 -->
        <div class="timer">
          剩余时间: <span :class="{ 'time-warning': timer <= 60 }">{{ formattedTime }}</span>
        </div>

        <!-- 进度条 -->
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <p class="progress-text">{{ currentQuestionIndex + 1 }} / {{ filteredQuestions.length }} 题</p>

        <!-- 问题组件 -->
        <Question :question="currentQuestion" :user-answer="userAnswers[currentQuestion.id]"
          @update:user-answer="handleUserAnswer" />

        <!-- 提交按钮 -->
        <div class="navigation-buttons">
          <button @click="prevQuestion" :disabled="currentQuestionIndex === 0">上一题</button>
          <button @click="nextQuestion">
            {{ currentQuestionIndex === filteredQuestions.length - 1 ? '提交测验' : '下一题' }}
          </button>
        </div>
        <p v-if="showWarning" class="warning-message">请选择一个选项或输入答案！</p>
      </div>

      <!-- 结束测验 -->
      <div v-else class="results-screen">
        <h2>测验完成！</h2>
        <p>你的得分：{{ score }} / {{ totalScore }}</p>
        <div class="result-actions">
          <button @click="resetQuiz">重新开始</button>
          <button @click="resetQuiz">返回首页</button>
        </div>

        <div class="explanation-summary-grid-section">
          <h3>答案解析概览</h3>
          <div class="question-boxes-grid">
            <div v-for="(question, index) in filteredQuestions" :key="question.id" :class="{
              'question-box': true,
              'box-correct': isAnswerCorrect(question),
              'box-incorrect': !isAnswerCorrect(question) && userAnswers[question.id] !== undefined,
              'box-unanswered': userAnswers[question.id] === undefined,
              'box-selected': selectedQuestionId === question.id
            }" @click="selectQuestionForExplanation(question.id)">
              {{ index + 1 }}
            </div>
          </div>

          <div v-if="selectedQuestion" class="detailed-explanation-area">
            <h4>第 {{ getQuestionNumber(selectedQuestion.id) }} 题解析</h4>
            <QuestionResult 
              :question="selectedQuestion" 
              :user-answer="userAnswers[selectedQuestion.id]"
              :is-correct="isAnswerCorrect(selectedQuestion)"
              :question-number="getQuestionNumber(selectedQuestion.id)" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Question from './Question.vue';
import QuestionResult from './QuestionResult.vue';
import { useQuizData } from '../composables/useQuizData'; // 导入 useQuizData

// 使用 useQuizData 可组合函数，解构出需要的数据和状态
const { allQuestions, uniqueCategories, isLoading } = useQuizData();

// 定义响应式数据
const quizStarted = ref(false);
const filteredQuestions = ref([]);
const currentQuestionIndex = ref(0);
const userAnswers = ref({});
const score = ref(0);
const totalScore = ref(0);
const showWarning = ref(false);
const selectedQuestionId = ref(null);
const selectedCategory = ref('all');
const timer = ref(0);
const timerIntervalId = ref(null);
const quizDuration = ref(300);

// 启动测验的逻辑
const startQuiz = () => {
  if (selectedCategory.value === 'all') {
    filteredQuestions.value = [...allQuestions.value];
  } else {
    filteredQuestions.value = allQuestions.value.filter(q => q.category === selectedCategory.value);
  }

  if (filteredQuestions.value.length === 0) {
    alert('该分类下没有题目，请选择其他分类！');
    return;
  }

  quizStarted.value = true;
  currentQuestionIndex.value = 0;
  userAnswers.value = {};
  score.value = 0;
  calculateTotalScore();

  timer.value = quizDuration.value;
  if (timerIntervalId.value) {
    clearInterval(timerIntervalId.value);
  }
  timerIntervalId.value = setInterval(() => {
    if (timer.value > 0) {
      timer.value--;
    } else {
      clearInterval(timerIntervalId.value);
      timerIntervalId.value = null;
      submitQuiz();
      alert('时间到，测验已自动提交！');
    }
  }, 1000);

  calculateTotalScore();
};

// 计算当前测验的总分数
const calculateTotalScore = () => {
  totalScore.value = filteredQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0);
};

// 处理子组件发出的用户答案更新事件
const handleUserAnswer = ({ questionId, answer }) => {
  userAnswers.value = {
    ...userAnswers.value,
    [questionId]: answer
  };
  showWarning.value = false;
};

// 导航到上一道题目
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    showWarning.value = false;
  }
};

// 导航到下一道题目或提交测验
const nextQuestion = () => {
  const currentQuestionId = currentQuestion.value.id;
  const currentUserAnswer = userAnswers.value[currentQuestionId];

  if (currentQuestion.value.type === 'single_choice') {
    if (!currentUserAnswer) {
      showWarning.value = true;
      return;
    }
  } else if (currentQuestion.value.type === 'multiple_choice') {
    if (!currentUserAnswer || currentUserAnswer.length === 0) {
      showWarning.value = true;
      return;
    }
  } else if (currentQuestion.value.type === 'short_answer') {
    if (currentUserAnswer === undefined || currentUserAnswer === null) {
      showWarning.value = true;
      return;
    }
  }

  showWarning.value = false;

  if (currentQuestionIndex.value < filteredQuestions.value.length - 1) {
    currentQuestionIndex.value++;
  } else {
    submitQuiz();
  }
};

// 提交测验，计算最终分数并显示结果
const submitQuiz = () => {
  score.value = 0;
  filteredQuestions.value.forEach(question => {
    const userAnswer = userAnswers.value[question.id];

    if (userAnswer === undefined && question.type !== 'short_answer') return;

    if (question.type === 'single_choice') {
      if (userAnswer === question.correct_answer) {
        score.value += question.score || 0;
      }
    } else if (question.type === 'multiple_choice') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
      const sortedUserAnswer = [...userAnswerArray].sort();
      const sortedCorrectAnswer = [...question.correct_answer].sort();
      if (JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)) {
        score.value += question.score || 0;
      }
    } else if (question.type === 'short_answer') {
      if (typeof userAnswer === 'string') {
        let processedUserAnswer = question.trim_whitespace !== false ? userAnswer.trim() : userAnswer;
        if (question.case_sensitive === false) {
          processedUserAnswer = processedUserAnswer.toLowerCase();
        }

        let currentAnswerIsCorrect = false;
        if (Array.isArray(question.correct_answer)) {
          const correctAnswers = question.correct_answer.map(ans =>
            question.case_sensitive === false ? ans.toLowerCase() : ans
          );
          currentAnswerIsCorrect = correctAnswers.includes(processedUserAnswer);
        } else {
          let processedCorrectAnswer = question.correct_answer;
          if (question.case_sensitive === false) {
            processedCorrectAnswer = processedCorrectAnswer.toLowerCase();
          }
          currentAnswerIsCorrect = (processedUserAnswer === processedCorrectAnswer);
        }

        if (!currentAnswerIsCorrect && question.alternatives) {
          const processedAlternatives = question.alternatives.map(alt => {
            let p_alt = question.trim_whitespace !== false ? alt.trim() : alt;
            return question.case_sensitive === false ? p_alt.toLowerCase() : p_alt;
          });
          currentAnswerIsCorrect = processedAlternatives.includes(processedUserAnswer);
        }

        if (currentAnswerIsCorrect) {
          score.value += question.score || 0;
        }
      }
    }
  });
  currentQuestionIndex.value = filteredQuestions.value.length;
  if (timerIntervalId.value) {
    clearInterval(timerIntervalId.value);
    timerIntervalId.value = null;
  }
};

// 重置测验到初始状态
const resetQuiz = () => {
  quizStarted.value = false;
  currentQuestionIndex.value = 0;
  userAnswers.value = {};
  score.value = 0;
  showWarning.value = false;
  selectedQuestionId.value = null;
  selectedCategory.value = 'all';
  filteredQuestions.value = [];
  if (timerIntervalId.value) {
    clearInterval(timerIntervalId.value);
    timerIntervalId.value = null;
  }
  timer.value = 0;
};

// 辅助函数：判断一道题用户是否回答正确
const isAnswerCorrect = (question) => {
  const userAnswer = userAnswers.value[question.id];
  if (userAnswer === undefined && question.type !== 'short_answer') return false;

  if (question.type === 'single_choice') {
    return userAnswer === question.correct_answer;
  } else if (question.type === 'multiple_choice') {
    const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
    const sortedUserAnswer = [...userAnswerArray].sort();
    const sortedCorrectAnswer = [...question.correct_answer].sort();
    return JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
  } else if (question.type === 'short_answer') {
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
};

// 在结果页中点击题目方格，选择要查看详细解析的题目
const selectQuestionForExplanation = (questionId) => {
  if (selectedQuestionId.value === questionId) {
    selectedQuestionId.value = null;
  } else {
    selectedQuestionId.value = questionId;
  }
};

// 辅助函数：根据题目 ID 获取题目序号，用于在解析中显示
const getQuestionNumber = (questionId) => {
  const index = filteredQuestions.value.findIndex(q => q.id === questionId);
  return index !== -1 ? index + 1 : '';
};

// 计算属性
const currentQuestion = computed(() => {
  return filteredQuestions.value[currentQuestionIndex.value];
});

const selectedQuestion = computed(() => {
  return filteredQuestions.value.find(q => q.id === selectedQuestionId.value);
});

const formattedTime = computed(() => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const progressPercentage = computed(() => {
  if (filteredQuestions.value.length === 0) return 0;
  return ((currentQuestionIndex.value + 1) / filteredQuestions.value.length) * 100;
});

onMounted(() => {
});

// 组件卸载时清除计时器
onUnmounted(() => {
  if (timerIntervalId.value) {
    clearInterval(timerIntervalId.value);
  }
});
</script>

<style scoped>
/* 整个测验容器的样式 */
.quiz-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  text-align: center;
}

/* 标题样式 */
h1 {
  font-size: 2.5em;
  color: #34495e;
  margin-bottom: 30px;
}

/* 各个屏幕（开始、题目、结果）的通用内边距 */
.start-screen,
.question-screen,
.results-screen {
  padding: 20px;
}

/* 分类选择区域的样式 */
.category-selection {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-direction: row;
  /* 默认水平排列 */
  flex-wrap: wrap;
  /* 允许换行 */
}

.category-selection label {
  font-size: 1.1em;
  color: #555;
  font-weight: bold;
}

.category-selection select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  min-width: 150px;
  /* 确保选择框有足够的宽度 */
  max-width: 90%;
  /* 防止在大屏幕上过宽，同时允许小屏幕自适应 */
  appearance: none;
  /* 移除系统默认的下拉箭头 */
  background-color: #f8f8f8;
  cursor: pointer;
  outline: none;
  /* 移除聚焦时的默认轮廓 */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.category-selection select:hover {
  border-color: #888;
}

.category-selection select:focus {
  border-color: #42b983;
  /* Vue 绿色 */
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
  /* 聚焦时的阴影效果 */
}

/* 按钮通用样式 */
button {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  padding: 12px 25px;
  font-size: 1.1em;
  margin: 8px;
  min-width: 120px;
}

/* 按钮悬停和禁用状态 */
button:hover:not(:disabled) {
  background-color: #368a68;
  /* 悬停时颜色变深 */
}

button:hover:not(:disabled) {
  background-color: #368a68;
}

/* 按钮点击时的反馈 */
button:active:not(:disabled) {
  transform: scale(0.98);
  /* 点击时稍微缩小 */
  background-color: #2e775a;
  /* 点击时颜色再深一点 */
}

button:disabled {
  background-color: #cccccc;
  /* 禁用时变灰 */
  cursor: not-allowed;
  /* 禁用时光标 */
}

/* 导航按钮容器 */
.navigation-buttons {
  display: flex;
  /* 使用 Flexbox */
  justify-content: center;
  /* 居中对齐 */
  flex-wrap: wrap;
  /* 允许按钮在小屏幕上换行 */
  gap: 15px;
  /* 按钮之间的间距 */
  margin-top: 30px;
  /* 增加与题目内容的间距 */
}

/* 未作答警告消息 */
.warning-message {
  color: #e74c3c;
  /* 红色 */
  margin-top: 10px;
  font-size: 0.9em;
}

/* 次要按钮样式（用于“返回首页”等） */
.secondary-button {
  background-color: #6c757d;
  /* 不同的颜色，表示次要操作 */
}

.secondary-button:hover:not(:disabled) {
  background-color: #5a6268;
}

/* 结果页按钮容器样式 */
.result-actions {
  margin-top: 20px;
  margin-bottom: 30px;
  /* 在按钮下方添加一些空间 */
}

/* --- 答案解析概览部分的样式 --- */
.explanation-summary-grid-section {
  margin-top: 40px;
  border-top: 1px solid #eee;
  /* 分隔线 */
  padding-top: 30px;
  text-align: center;
  /* 解析标题和方格居中 */
}

.explanation-summary-grid-section h3 {
  color: #34495e;
  margin-bottom: 20px;
}

.question-boxes-grid {
  display: flex;
  flex-wrap: wrap;
  /* 允许方格换行 */
  justify-content: center;
  gap: 8px;
  /* 调整间距，以便小屏幕可以显示更多方格 */
  padding: 10px 0
}

.question-box {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2em;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.question-box:hover {
  transform: translateY(-2px);
  /* 鼠标悬停时轻微上浮效果 */
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  /* 阴影加深 */
}

/* 方格颜色：正确、错误、未作答 */
.box-correct {
  background-color: #e6ffe6;
  /* 浅绿色背景 */
  color: #28a745;
  /* 深绿色文字 */
  border: 1px solid #28a745;
}

.box-incorrect {
  background-color: #ffe6e6;
  /* 浅红色背景 */
  color: #dc3545;
  /* 深红色文字 */
  border: 1px solid #dc3545;
}

.box-unanswered {
  background-color: #f0f0f0;
  /* 浅灰色背景 */
  color: #888;
  /* 灰色文字 */
  border: 1px solid #aaa;
}

/* 选中方格的样式 */
.box-selected {
  border: 2px solid #007bff;
  /* 选中时蓝色边框 */
  transform: scale(1.05);
  /* 选中时轻微放大 */
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  /* 蓝色光晕效果 */
}

/* --- 详细答案解析区域的样式 --- */
.detailed-explanation-area {
  margin-top: 30px;
  padding: 25px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fefefe;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  text-align: left;
  /* 文本左对齐 */
}

.detailed-explanation-area h4 {
  color: #34495e;
  margin-bottom: 20px;
  text-align: center;
  /* 标题居中 */
}

/* 计时器样式 */
.timer {
  font-size: 1.3em;
  font-weight: bold;
  color: #34495e;
  margin-bottom: 20px;
  background-color: #f0f8ff;
  /* 浅蓝色背景 */
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #cceeff;
  display: inline-block;
  /* 让其内容宽度自适应 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.time-warning {
  color: #e74c3c;
  /* 警告色：红色 */
  animation: pulse 1s infinite;
  /* 时间少于 60 秒时，闪烁提醒 */
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  height: 15px;
  /* 进度条高度 */
  margin: 15px auto;
  overflow: hidden;
  /* 确保进度条内部不会溢出圆角 */
}

/* 实际进度条 */
.progress-bar {
  height: 100%;
  background-color: #42b983;
  /* Vue 绿色 */
  width: 0%;
  /* 初始宽度为0 */
  border-radius: 5px;
  transition: width 0.4s ease-out;
  /* 宽度变化时平滑过渡 */
}

/* 进度文本 */
.progress-text {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
  margin-bottom: 20px;
  /* 与题目内容保持距离 */
}

/* 页面切换过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* --- 媒体查询（Media Queries） --- */

/* 当屏幕宽度小于或等于 768px (例如平板设备) */
@media (max-width: 768px) {
  .quiz-container {
    padding: 15px;
    /* 减小内边距 */
  }

  h1 {
    font-size: 2em;
    /* 减小标题字体大小 */
  }

  .question-screen,
  .results-screen {
    padding: 15px;
  }

  .timer {
    font-size: 1.2em;
    padding: 8px 12px;
  }

  .progress-bar-container {
    height: 12px;
    /* 进度条高度减小 */
  }

  button {
    padding: 10px 20px;
    font-size: 1em;
    margin: 5px;
    min-width: 100px;
  }

  .question-box {
    width: 40px;
    /* 适当减小方格大小 */
    height: 40px;
    font-size: 1.1em;
    gap: 6px;
    /* 减小方格间距 */
  }
}

/* 当屏幕宽度小于或等于 480px (例如手机设备) */
@media (max-width: 480px) {
  .quiz-container {
    padding: 10px;
    /* 进一步减小内边距 */
    border-radius: 0;
    /* 手机上可能不需要圆角边框，使其更像原生应用 */
    box-shadow: none;
    /* 移除阴影 */
    border: none;
    /* 移除边框 */
  }

  h1 {
    font-size: 1.8em;
    /* 标题更小 */
    margin-bottom: 20px;
  }

  .question-screen,
  .results-screen {
    padding: 10px;
  }

  .timer {
    font-size: 1.1em;
    padding: 6px 10px;
  }

  .progress-bar-container {
    height: 10px;
    /* 进度条更窄 */
  }

  button {
    width: 100%;
    /* 按钮独占一行 */
    margin: 5px 0;
    /* 垂直间距 */
    padding: 12px;
    /* 增加垂直内边距，方便点击 */
  }

  /* 导航按钮组在小屏幕上竖直排列 */
  .navigation-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .category-selection {
    flex-direction: column;
    /* 分类选择在小屏幕上竖直排列 */
    align-items: center;
    /* 居中对齐 */
    gap: 10px;
  }

  .category-selection select {
    width: 100%;
    /* 宽度占满 */
    max-width: 250px;
    /* 防止在极窄屏幕上过宽 */
  }

  .question-box {
    width: 35px;
    /* 进一步减小方格大小 */
    height: 35px;
    font-size: 1em;
    border-radius: 4px;
    gap: 4px;
  }

  /* 调整详细解析区域的内边距 */
  .detailed-explanation-area {
    padding: 15px;
  }
}
</style>