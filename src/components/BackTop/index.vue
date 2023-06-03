<template>
  <div class="back-top" :style="`bottom: ${backTopProps.bottom};right:${backTopProps.right};height: ${backTopProps.width};width:${backTopProps.width};`">
    <svg-icon :class="[backTopShow ? 'back-top-show' : 'back-top-hidden']" :name="svgName" :width="svgWidth" @click="scrollToTop"></svg-icon>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const props = defineProps({
  bottom: {
    type: [String, Number],
    default: "100px",
  },
  right: {
    type: [String, Number],
    default: "0px",
  },
  // 图标
  svgName: {
    type: String,
    default: "rocket",
  },
  svgWidth: {
    type: Number,
    default: 5,
  },
  animation: {
    type: Boolean,
    default: true,
  },
});

const backTopProps = reactive({
  bottom: "",
  right: "",
  width: "",
});

watch(
  () => props,
  (newV) => {
    backTopProps.bottom = /^[\d|.]*$/g.test(props.bottom) ? props.bottom + "rem" : props.bottom;
    backTopProps.right = /^[\d|.]*$/g.test(props.right) ? props.right + "rem" : props.right;
  },
  {
    immediate: true,
    deep: true,
  }
);

onMounted(() => {
  // 注册滚动
  window.addEventListener("scroll", scroll);
});
const backTopShow = ref(false);
const scroll = () => {
  let scrollTop = ref(0);
  scrollTop.value = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  if (scrollTop.value > 200) {
    // 大于200显示
    backTopShow.value = true;
  } else {
    backTopShow.value = false;
  }
};

const scrollToTop = () => {
  const c = document.documentElement.scrollTop || document.body.scrollTop;
  if (c > 0) {
    const duration = 600;
    const startTime = Date.now();
    // 图片页面不适合动画滚动
    if (route.path != "/photos") {
      return new Promise((res) => {
        const fnc = () => {
          const timestamp = Date.now();
          const time = timestamp - startTime;
          const nextScrollTop = easeInOut(Math.min(time, duration), c, 0, duration);
          window.scrollTo(0, nextScrollTop);
          if (time < duration) {
            window.requestAnimationFrame(fnc); // 动画函数
          } else {
            // 由于上面步骤设置了scrollTop, 滚动事件可能未触发完毕
            // 此时应该在下一帧再执行res
            window.requestAnimationFrame(res);
          }
        };
        window.requestAnimationFrame(fnc);
      });
    } else {
      const fnc = () => {
        window.scrollTo(0, 0);
      };
      window.requestAnimationFrame(fnc);
    }
  }
};
const easeInOut = (current, start, end, duration) => {
  const change = (end - start) / 2;
  let time = current / (duration / 2);
  if (time < 1) {
    return change * time * time * time + start;
  }
  time -= 2;
  return change * (time * time * time + 2) + start;
};
</script>
<style lang="scss" scoped>
.back-top {
  position: fixed;
  overflow: hidden;
  transition: all ease-in-out 0.3s;
  &-show {
    visibility: visible;
  }
  &-hidden {
    visibility: hidden;
  }
}
</style>
