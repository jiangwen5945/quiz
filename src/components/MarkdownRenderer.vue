<template>
  <div class="markdown-content">
    <div class="markdown-text" v-html="renderedMarkdown"></div>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // 确保你的主题路径正确
import DOMPurify from 'dompurify';

// 初始化 Markdown 解析器和代码高亮
const md = new MarkdownIt({
  html: true, // 启用 HTML 标签解析
  linkify: true, // 自动将 URL 转换为链接
  typographer: true, // 启用一些排版替换，如破折号等
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlightedCode = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        // 使用 <pre class="hljs"><code> 包装以保持高亮样式
        return '<pre class="hljs"><code>' + highlightedCode + '</code></pre>';
      } catch (__) {
        // 如果高亮失败，回退到默认转义
      }
    }
    // 如果没有指定语言或高亮失败，则进行基本的 HTML 转义
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

export default {
  name: 'MarkdownRenderer',
  props: {
    // 原始的 Markdown 格式的问题文本
    markdownContent: {
      type: String,
      required: true
    },
  },
  computed: {
    // 计算属性用于渲染 Markdown 并进行安全净化
    renderedMarkdown() {
      // 先将 Markdown 渲染成 HTML
      const rawHtml = md.render(this.markdownContent || '');
      // 再通过 DOMPurify 进行安全净化，防止 XSS 攻击
      return DOMPurify.sanitize(rawHtml);
    }
  }
};
</script>

<style scoped>
.markdown-content {
  text-align: left; /* 问题文本通常左对齐 */
  margin-bottom: 25px; /* 与下方答案选项或输入框保持距离 */
}

.markdown-text {
  font-size: 1.4em;
  color: #34495e;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* 确保 Markdown 渲染的元素样式正常，例如列表、代码块等 */
/* 替换 >>> 为 :deep() */
.markdown-content :deep(pre.hljs) {
  background-color: #282c34; /* 代码块背景色，与 atom-one-dark 保持一致 */
  color: #abb2bf; /* 代码字体颜色 */
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto; /* 超出部分可滚动 */
  font-family: 'Fira Code', 'JetBrains Mono', monospace; /* 程序员字体 */
  font-size: 0.95em;
  line-height: 1.4;
  margin-top: 15px;
  margin-bottom: 15px;
}

/* 替换 >>> 为 :deep() */
.markdown-content :deep(code) {
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
}

/* 替换 >>> 为 :deep() */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 25px;
  margin-bottom: 15px;
}

/* 替换 >>> 为 :deep() */
.markdown-content :deep(p) {
  margin-bottom: 10px;
}

/* 针对手机屏幕调整字体大小 */
@media (max-width: 480px) {
  .markdown-text {
    font-size: 1.2em;
  }
  /* 替换 >>> 为 :deep() */
  .markdown-content :deep(pre.hljs) {
    padding: 10px;
    font-size: 0.85em;
  }
}
</style>