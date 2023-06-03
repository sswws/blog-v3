<script setup>
import { ref, reactive, onMounted } from "vue";
import { isMobile } from "@/utils/tool";
import { addView, getAllPageHeader } from "@/api/config";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { staticData } from "@/store/index.js";

const router = useRouter();
const backTopProps = reactive({
  right: "",
  svgWidth: 0,
});
const showGoBack = ref(false);

const goBack = () => {
  router.go(-1);
};

const resize = () => {
  // 当前视口宽度
  let w = document.documentElement.clientWidth || document.body.clientWidth;
  if (w > "1280") {
    backTopProps.right = "5%";
    backTopProps.svgWidth = 5;
    showGoBack.value = false;
  } else if (w > "798" && w <= "1280") {
    backTopProps.right = "0";
    backTopProps.svgWidth = 4.5;
    showGoBack.value = false;
  } else {
    backTopProps.right = "0";
    backTopProps.svgWidth = 4;
    showGoBack.value = true;
  }
};
const getAllPageHeaderBg = async () => {
  const res = await getAllPageHeader();
  if (res.code == 0) {
    staticData().setPageHeaderLIst(res.result);
  } else {
    ElMessage.error(res.message);
  }
};

onMounted(async () => {
  if (window.name == "") {
    // 上传访问量
    await addView();
    // 获取背景图片
    getAllPageHeaderBg();
    window.name = "isReload"; // 在首次进入页面时我们可以给window.name设置一个固定值,判断用户是刷新还是首次进入
  }

  // 首次判断是手机还是pc
  backTopProps.right = isMobile() ? "0" : "5%";
  backTopProps.svgWidth = isMobile() ? 4 : 5;
  showGoBack.value = isMobile() ? true : false;
  // 全局增加窗口变化事件，对backTop的边距进行适配
  window.addEventListener("resize", resize);
});
</script>

<template>
  <div class="app">
    <layout> </layout>
    <BackTop :right="backTopProps.right" :svgWidth="backTopProps.svgWidth" />
    <i v-if="showGoBack" class="iconfont icon-fanhui" @click="goBack"></i>
  </div>
</template>

<style lang="scss">
.app {
  width: 100%;
  box-sizing: border-box;
  .icon-fanhui {
    position: fixed;
    left: 5px;
    bottom: 20px;
    font-size: 2rem;
    color: var(--font-color);
    z-index: 999;
  }
}
</style>
