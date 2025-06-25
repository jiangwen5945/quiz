<template>
  <div class="short-answer-input">
    <textarea
      :value="modelValue"
      @input="updateAnswer($event.target.value)"
      placeholder="请输入你的答案..."
      rows="6"
    ></textarea>
  </div>
</template>

<script>
export default {
  name: 'ShortAnswerQuestion',
  props: {
    modelValue: { // 对应 v-model 的值，这里是用户输入
      type: [String, undefined, null],
      default: ''
    }
  },
  methods: {
    updateAnswer(value) {
      // 触发 'update:modelValue' 事件，支持 v-model 双向绑定
      this.$emit('update:modelValue', value);
    }
  }
};
</script>

<style scoped>
.short-answer-input {
  margin-top: 15px;
}

.short-answer-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box; /* 确保padding和border包含在width内 */
  resize: vertical; /* 允许垂直拖动调整大小 */
}
</style>