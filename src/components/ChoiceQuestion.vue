<template>
  <div class="choice-options">
    <div v-for="option in question.options" :key="option.id" class="option-item">
      <label>
        <input
          :type="question.type === 'single_choice' ? 'radio' : 'checkbox'"
          :name="question.id"
          :value="option.id"
          v-model="internalUserAnswer"
          @change="emitAnswer"
        />
        <span>{{ option.text }}</span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChoiceQuestion',
  props: {
    question: {
      type: Object,
      required: true
    },
    modelValue: {
      type: [String, Array],
      default: () => null
    }
  },
  data() {
    return {
      // 内部维护用户的答案
      // 对于多选，确保初始化时是一个数组
      internalUserAnswer: this.question.type === 'multiple_choice' 
                          ? (this.modelValue ? [...this.modelValue] : []) // 复制数组以避免直接修改prop
                          : (this.modelValue || null)
    };
  },
  watch: {
    // 监听props的变化，同步到internalUserAnswer
    modelValue(newVal) {
      if (this.question.type === 'multiple_choice') {
        this.internalUserAnswer = newVal ? [...newVal] : []; // 确保每次更新都是新数组
        console.log('internalUserAnswer', this.internalUserAnswer);
      } else {
        this.internalUserAnswer = newVal || null;
      }
    }
  },
  methods: {
    emitAnswer() {
      // **核心修复：对于多选题，在向上发射之前，确保数组的唯一性**
      if (this.question.type === 'multiple_choice') {
        // 使用 Set 来去重，然后转回数组
        const uniqueAnswers = [...new Set(this.internalUserAnswer)];
        this.$emit('update:modelValue', uniqueAnswers);
      } else {
        this.$emit('update:modelValue', this.internalUserAnswer);
      }
    }
  }
};
</script>

<style scoped>
.choice-options {
  margin-top: 15px;
}

.option-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.option-item label {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 1em;
}

.option-item input[type="radio"],
.option-item input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>