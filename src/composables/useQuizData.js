import { ref, onMounted } from 'vue';

/**
 * 可组合函数：用于加载测验题目数据（仅加载原始 Markdown 字符串）
 */
export function useQuizData() {
  const allQuestions = ref([]);
  const uniqueCategories = ref([]);
  const isLoading = ref(true);

  /**
   * 异步加载题目数据和原始 Markdown 内容
   */
  const loadQuestions = async () => {
    isLoading.value = true;
    try {
      const questionsResponse = await fetch('/questions.json'); // 路径是相对于 public 文件夹的根路径
      if (!questionsResponse.ok) {
        throw new Error(`Failed to load questions.json: ${questionsResponse.statusText}`);
      }
      const questionsData = await questionsResponse.json();

      const loaded = await Promise.all(
        questionsData.map(async (q, index) => {
          let questionContent = '';
          let explanationContent = '';

          if (q.content_md_path) {
            try {
              // 获取单个 Markdown 内容文件
              const response = await fetch(`/content/${q.content_md_path}`); // 同样是相对于 public 文件夹的路径
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const fullMarkdownContent = await response.text();

              const parts = fullMarkdownContent.split('--- Explanation ---', 2);
              questionContent = parts[0].trim(); // 存储原始 Markdown 字符串
              explanationContent = parts.length > 1 ? parts[1].trim() : "未提供解释或分隔符缺失。"; // 存储原始 Markdown 字符串

            } catch (error) {
              console.error(`加载题目 ID 为 ${q.id} 的内容时出错:`, error);
              questionContent = "### 加载题目内容出错。"; // 仍然是 Markdown
              explanationContent = "### 加载解释内容出错。"; // 仍然是 Markdown
            }
          }

          return {
            ...q,
            global_index: index + 1,
            question: questionContent,
            explanation: explanationContent
          };
        })
      );
      allQuestions.value = loaded;
      uniqueCategories.value = [...new Set(loaded.map(q => q.category))];

    } catch (error) {
      console.error("加载所有题目时发生错误:", error);
      // 你可以在这里设置一个错误状态，以便在 QuizApp.vue 中显示错误消息
      // 例如：hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  // 在使用此组合函数的组件挂载后自动加载题目
  onMounted(() => {
    loadQuestions();
  });

  return {
    allQuestions,
    uniqueCategories,
    isLoading,
    loadQuestions // 可以选择性地暴露此方法，以供需要时手动重新加载
  };
}