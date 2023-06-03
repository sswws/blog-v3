<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { getTalkList } from "@/api/talk";
import TextOverflow from "@/components/TextOverflow/index.vue";
import SkeletonItem from "@/components/SkletonItem/skeleton-item.vue";
import Comment from "@/components/Comment/Comment.vue";

const talkList = ref([]);
const total = ref(0);
const loading = ref(false);
let observe;
let box;
const param = reactive({
  current: 1,
  size: 5,
});

const returnTime = (time) => {
  time = time.replace(/\-/g, "/"); // 解决ios系统上格式化时间出现NAN的bug
  let times = new Date().getTime() - new Date(time).getTime();
  let res;
  if (times < 6e4) {
    res = Math.trunc(times / 1000) + "秒";
  } else if (times >= 6e4 && times < 3.6e6) {
    res = Math.trunc(times / 6e4) + "分钟";
  } else if (times >= 3.6e6 && times < 8.64e7) {
    res = Math.trunc(times / 3.6e6) + "小时";
  } else {
    res = Math.trunc(times / 8.64e7) + "天";
  }
  return res;
};

const observeBox = () => {
  // 获取要监听的元素
  box = document.querySelector(".observer");
  observe = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (e) => {
        if (e.isIntersecting && e.intersectionRatio > 0) {
          if (total.value > talkList.value.length) {
            param.current++;
            pageGetTalkList(e);
          }
        }
      });
    },
    { threshold: [1] }
  );
  observe.observe(box);
};

const pageGetTalkList = async (e) => {
  // 第一次进入才loading
  if (param.current == 1) {
    loading.value = true;
  }
  let res = await getTalkList(param);
  if (res.code == 0) {
    talkList.value = param.current == 1 ? res.result.list : talkList.value.concat(res.result.list);
    total.value = res.result.total;
    loading.value = false;
  }
};

onMounted(async () => {
  await pageGetTalkList();
  if (talkList.value.length < total.value) {
    observeBox();
  }
});

onBeforeUnmount(() => {
  observe && observe.unobserve(box);
  observe = null;
});
</script>

<template>
  <PageHeader :loading="loading" />
  <div class="talk center_box">
    <el-card class="talk-card">
      <el-skeleton :loading="loading" style="height: 100%" animated>
        <template #template>
          <div class="flex justify-start w-[100%] !mt-[10px]" v-for="i in 3" :key="i">
            <SkeletonItem variant="text" width="60px" height="60px" />
            <div class="w-[70%] !ml-[10px]">
              <SkeletonItem variant="text" width="20%" height="20px" />
              <SkeletonItem variant="text" width="90%" height="30px" top="5px" />
            </div>
          </div>
        </template>
        <div class="w-[100%] talk-item-line" v-for="(talk, index) in talkList" :key="index">
          <div class="talk-card__item animate__animated animate__fadeIn">
            <div class="left">
              <el-avatar class="left-avatar" :src="talk.avatar" shape="square" />
            </div>
            <div class="w-[100%]">
              <div class="right">
                <div class="right-top relative">
                  <i v-if="talk.is_top == 1" class="iconfont icon-zhiding"></i>
                  <span class="nick-name">{{ talk.nick_name }}</span>
                  <TextOverflow class="content" :text="talk.content" :width="199" :maxLines="3" :font-size="13">
                    <template v-slot:default="{ clickToggle, expanded }">
                      <span @click="clickToggle" class="btn">
                        {{ expanded ? "收起" : "展开" }}
                      </span>
                    </template>
                  </TextOverflow>
                </div>
                <div class="right-bottom">
                  <el-image v-for="(url, index) in talk.talkImgList" :key="index" :src="url" class="image" loading="lazy" preview-teleported :initial-index="index" fit="cover" :preview-src-list="talk.talkImgList.map((v) => v)" />
                </div>
                <div class="time">{{ returnTime(talk.createdAt) }}前</div>
              </div>
            </div>
          </div>
          <div class="talk-card__item animate__animated animate__fadeIn">
            <Comment class="w-[100%]" type="talk" :id="talk.id" />
          </div>
        </div>
        <div class="observer">
          {{ talkList.length >= total ? "暂无更多" : "下拉加载更多" }}
        </div>
      </el-skeleton>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.talk {
  .relative {
    position: relative;
  }

  .icon-zhiding {
    position: absolute;
    right: 0;
    top: 0;
    font-size: 0.8rem;
    color: var(--top);
  }

  &-card {
    padding: 40px 50px;
    margin-top: 10px;

    &__item {
      padding: 10px;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }
  }

  .nick-name {
    color: var(--font-color);
  }

  .mt-10 {
    margin-top: 10px;
  }

  .time {
    font-size: 12px;
    color: var(--font-color);
    margin-top: 20px;
    letter-spacing: 1px;
  }

  .observer {
    text-align: center;
    font-size: 1rem;
    color: var(--font-color);
    margin-top: 3px;
    letter-spacing: 1px;
  }
}

.btn {
  margin-left: 3px;
  color: var(--primary);
  cursor: pointer;
}

.talk-item-line {
  border-bottom: 1px solid #f8f8f8;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

// pc
@media screen and (min-width: 768px) {
  .left {
    width: 60px;
    height: 60px;

    &-avatar {
      width: 60px;
      height: 60px;
    }
  }

  .right {
    width: 308px;
    margin-left: 10px;

    &-top {
      min-height: 60px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;

      .content {
        margin-top: 23px;
      }
    }

    &-bottom {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 100px 100px 100px;
      grid-auto-rows: 100px;
      gap: 1px;
    }
  }
}

// mobile
@media screen and (max-width: 768px) {
  .left {
    width: 40px;
    height: 40px;

    &-avatar {
      width: 40px;
      height: 40px;
    }
  }

  .right {
    width: 188px;
    margin-left: 10px;

    &-top {
      min-height: 40px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;

      .content {
        margin-top: 3px;
      }
    }

    &-bottom {
      margin-top: 5px;
      display: grid;
      grid-template-columns: 60px 60px 60px;
      grid-auto-rows: 60px;
      gap: 1px;
    }
  }
}
</style>
