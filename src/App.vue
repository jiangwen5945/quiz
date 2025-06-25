<template>
  <div id="app" class="page-cell">
    <QuizApp />
  </div>
</template>

<script>
import QuizApp from './components/QuizApp.vue';

export default {
  name: 'App',
  components: {
    QuizApp
  }
};
</script>

<style lang="scss" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  height: calc(100vh - 50px);
  padding-top: 50px;
}

.page-cell {
    --line: color-mix(in lch, canvasText 15%, hsl(0 0% 100% / 0.25));
    position: relative;
    background-image: linear-gradient(90deg, var(--line), transparent 3%),
        linear-gradient(360deg, var(--line), transparent 3%);
    background-size: 30px 30px;
    background-position: center center;
    width: 100%;
    min-height: calc(100% - 44px);
}


</style>