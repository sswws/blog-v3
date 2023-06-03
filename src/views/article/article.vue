<script setup>
import { ref, watch, reactive } from "vue";
import { staticData } from "@/store/index.js";
import { storeToRefs } from "pinia";
import MdEditor from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { getArticleById, getRecommendArticleById, readingDuration, thumbsUpById } from "@/api/article";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import Comment from "@/components/Comment/Comment.vue";

const MdCatalog = MdEditor.MdCatalog;
let setUpTimes = null;
let lastArticleId = null;

const router = useRouter();
const route = useRoute();
// 初始化pinia
const staticStore = staticData();
const { codeTheme, previewTheme, mainTheme } = storeToRefs(staticStore);

const currentUrl = window.location.href;

// 模仿获取md文档信息
const mdState = reactive({
  text: "",
  id: "my-editor",
  switch: true,
});
const loading = ref(false);
const articleInfo = ref({});
const scrollElement = document.documentElement;
// 移动端目录是否可见
const drawerShow = ref(false);
// 推荐文章
const recommendList = ref([]);
const previousArticle = ref({});
const nextArticle = ref({});

const toggleDrawer = () => {
  drawerShow.value = !drawerShow.value;
};

const goToArticle = (article) => {
  router.push({ path: "/article", query: { id: article.id } });
};

// 文章点赞
const thumbsUp = async () => {
  let tRes = await thumbsUpById(route.query.id);
  if (tRes.code == 0) {
    let res = await getArticleById(route.query.id);
    if (res.code == 0) {
      articleInfo.value.thumbs_up_times = res.result.thumbs_up_times;
      ElMessage.success("点赞成功");
    }
  }
};
// 文章详情
const getArticleDetails = async (id) => {
  let res = await getArticleById(id);
  if (res.code == 0) {
    mdState.text = res.result.article_content;
    articleInfo.value = res.result;
  }
};

// 返回本次浏览时长
const addReadingDuration = async (id) => {
  const now = new Date();
  let duration = now - setUpTimes;
  await readingDuration(id, duration);
};

// 推荐文章
const getRecommendArticle = async (id) => {
  let res = await getRecommendArticleById(id);
  if (res.code == 0) {
    const { previous, next, recommend } = res.result;
    recommendList.value = recommend;
    previousArticle.value = previous;
    nextArticle.value = next;
  }
};

const init = async (id) => {
  loading.value = true;
  await getArticleDetails(id);
  await getRecommendArticle(id);
  loading.value = false;
};
watch(
  () => route,
  (newV) => {
    if (setUpTimes && lastArticleId) {
      addReadingDuration(lastArticleId); // 添加阅读时长
    }
    setUpTimes = new Date();
    lastArticleId = newV.query.id;

    if (newV.path == "/article" && newV.query.id) {
      init(newV.query.id);
    }
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>

<template>
  <PageHeader :article="articleInfo" :loading="loading" />
  <div class="article">
    <el-row class="article_box">
      <el-col :xs="24" :sm="18">
        <el-skeleton v-if="loading" :loading="loading" :rows="8" animated />
        <el-card v-else class="md-preview">
          <MdEditor class="md-preview-v3" v-model="mdState.text" :editorId="mdState.id" :previewOnly="true" :preview-theme="previewTheme" :code-theme="codeTheme" :theme="mainTheme ? 'dark' : 'light'"></MdEditor>
          <div class="article-info">
            <div class="article-info-inner">
              <div>
                <span>文章作者：</span>
                <a class="to_pointer" href="https://gitee.com/mrzym">{{ articleInfo.authorName }}</a>
              </div>
              <div>
                <span>类型：</span>
                <el-tag>{{ articleInfo.type == 1 ? "原创" : articleInfo.type == 2 ? "转载" : "翻译" }}</el-tag>
              </div>
              <div v-if="articleInfo.type != 1">
                <span>原文链接：</span>
                <a class="to_pointer" :href="articleInfo.origin_url">{{ articleInfo.origin_url }}</a>
              </div>
              <div v-else>
                <span>本文链接：</span>
                <a class="to_pointer" v-copy="currentUrl">{{ currentUrl }}</a>
              </div>
              <p>声明: 此文章版权归 Mr M 所有，如有转载，请注明来自原作者</p>
            </div>
          </div>
          <div class="thumbs-up" @click="thumbsUp">
            <i class="iconfont icon-icon1"></i>
          </div>
          <div class="recommend flex_r_between">
            <div class="recommend-box" @click="goToArticle(previousArticle)">
              <el-image class="recommend-box-img animate__animated animate__fadeInDown" fit="cover" :src="previousArticle.article_cover" />
              <span class="recommend-box-item prev">
                <span class="flex_r_around">
                  <i class="iconfont icon-arrowleft"></i>
                  <span>上一篇</span>
                </span>
                <tooltip width="60%" color="#fff" :name="previousArticle.article_title" align="left"></tooltip>
              </span>
            </div>
            <div class="recommend-box" @click="goToArticle(nextArticle)">
              <el-image class="recommend-box-img animate__animated animate__fadeInDown" fit="cover" :src="nextArticle.article_cover" />
              <span class="recommend-box-item next">
                <span class="flex_r_around">
                  <span>下一篇</span>
                  <i class="iconfont icon-arrowright"></i>
                </span>
                <tooltip width="60%" color="#fff" :name="nextArticle.article_title" align="right"></tooltip>
              </span>
            </div>
          </div>
          <!-- 移动端推荐文章 -->
          <div class="mobile-recommend">
            <el-row style="padding: 2rem">
              <div class="recommend-title">推荐文章</div>
              <el-col :span="12" v-for="(item, index) in recommendList" :key="index" @click="goToArticle(item)">
                <el-card class="card">
                  <template #header>
                    <span :title="item.article_title" class="title">{{ item.article_title }}</span>
                  </template>
                  <el-image class="image animate__animated animate__fadeInDown" fit="cover" :src="item.article_cover"></el-image>
                </el-card>
              </el-col>
            </el-row>
          </div>
          <div class="!p-[2rem]">
            <Comment class="w-[100%]" type="article" :id="route.query.id - 0" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="0" :sm="6">
        <el-skeleton v-if="loading" :loading="loading" :rows="3" animated />
        <el-card v-else class="command" header="推荐文章">
          <div class="command-box">
            <div class="command-box-item" v-for="(item, index) in recommendList" :key="index" @click="goToArticle(item)">
              <el-image class="command-box-item__img animate__animated animate__fadeInDown" fit="cover" width="50" :src="item.article_cover" />
              <tooltip width="35%" weight="600" size="1rem" :name="item.article_title" />
              <tooltip width="35%" size="0.8rem" :name="item.createdAt" />
            </div>
          </div>
        </el-card>
        <el-affix :offset="53" style="width: inherit">
          <el-skeleton v-if="loading" :loading="loading" :rows="5" animated />
          <el-card v-else class="catalogue-card" header="目录">
            <div class="catalogue-card__box">
              <MdCatalog :editorId="mdState.id" :scroll-element="scrollElement" />
            </div>
          </el-card>
        </el-affix>
      </el-col>
    </el-row>
    <div class="mobile-affix">
      <i class="iconfont icon-arrowright" @click="toggleDrawer"></i>
    </div>
    <!-- 移动端目录 -->
    <el-drawer title="目录" v-model="drawerShow" direction="ltr" :before-close="toggleDrawer" :append-to-body="true" size="60%" :z-index="9999">
      <MdCatalog v-if="!loading" :editorId="mdState.id" :scroll-element="scrollElement" />
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.article {
  &-info {
    padding: 2rem 2rem;

    &-inner {
      padding: 1rem;
      color: var(--font-color);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }
}

.catalogue-card {
  margin-top: 1rem;
  padding: 1rem 0.5rem;

  &__box {
    scrollbar-width: none;
    overflow: auto;
    max-height: calc(100vh - 23.1rem);
    cursor: pointer;
  }
}

.mobile-catalog {
  padding: 2rem;
  max-height: 400px;
  scrollbar-width: none;
  overflow-y: auto;
  cursor: pointer;
}

.md-preview-v3 {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.3);
}

.theme-card {
  padding: 1rem 0.5rem;
}

.command {
  padding: 1rem 0.5rem;

  &-box {
    max-height: 160px;
    scrollbar-width: none;
    overflow-y: auto;
    cursor: pointer;

    &::-webkit-scrollbar {
      display: none;
      /* Chrome Safari */
    }

    &-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 0.3rem;
      color: var(--font-color);

      &__img {
        margin-right: 1rem;
        width: 50px;
        height: 40px;
      }
    }
  }
}

.icon-sort {
  font-size: 1.8rem;
  color: var(--font-color);
}

.recommend {
  box-sizing: border-box;
  position: relative;
  padding: 2rem;

  &-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    width: 50%;
    height: 100%;
    overflow: hidden;
    color: #fff;

    &:hover {
      .recommend-box-img {
        transform: scale(1.2);
      }
      .recommend-box-item {
        background: rgba(0, 0, 0, 0);
      }
    }

    &-img {
      transition: all 0.5s;
      width: 100%;
      height: 100%;
    }

    &-item {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: center;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      font-size: 1.2rem;
      line-height: 1.8;
      background: rgba(0, 0, 0, 0.2);

      i {
        font-size: 1.4rem;
      }
    }

    .prev {
      padding-left: 2rem;
      align-items: flex-start;

      div {
        box-sizing: border-box;
        max-width: 10rem;
        font-size: 1rem;
        margin-left: 1rem;
      }
    }

    .next {
      padding-right: 2rem;
      align-items: flex-end;

      div {
        box-sizing: border-box;
        max-width: 10rem;
        font-size: 1rem;
        margin-right: 1rem;
      }
    }
  }
}

.thumbs-up {
  margin: 1rem;
  display: flex;
  justify-content: center;

  .icon-icon1 {
    font-size: 1.8rem;

    &:hover {
      color: var(--primary);
    }
  }
}

.mobile-recommend {
  position: relative;
  .recommend-title {
    position: absolute;
    top: 0;
    left: 2.2rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--font-color);
  }
  .card {
    width: 100%;
    height: 8rem;
    overflow: hidden;
  }
  .title {
    display: inline-block;
    width: 80%;
    height: 2rem;
    padding: 0.3rem 0 0 0.3rem;
    font-size: 1rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .image {
    width: 100%;
    height: 6rem;
  }
}

:deep(.el-card__header) {
  font-size: 1.6rem;
  padding: 0 !important;
  font-weight: bold;
  line-height: 1.8;
  color: var(--font-color);
}

a {
  text-decoration: underline;
}
@media screen and (min-width: 768px) {
  .mobile-recommend {
    display: none;
  }
}
</style>
