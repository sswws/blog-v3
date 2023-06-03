<script setup>
import { ref } from "vue";
import { user } from "@/store/index";
import ParentItem from "./item/ParentItem.vue";
import router from "@/router";
import { ElMessage } from "element-plus";
import { addComment } from "@/api/comment";

const userStore = user();
const props = defineProps({
  // 评论的类型 文章 article 说说 talk
  type: {
    type: String,
    default: () => {},
  },
  // 文章/说说 id
  id: {
    type: Number,
    default: () => {},
  },
});
const activeOrder = ref("hot"); // 排序 最新还是最热 最热 hot

const topApplyContent = ref(""); // 顶部评论框内的内容，当前登录人评论文章/说说

const total = ref(0); // 主评论条数

const parentItemRef = ref(null); // 子组件ref

const changeOrder = (type) => {
  activeOrder.value = type;
};

// 清空子组件内存在打开的输入框
const clearOthers = () => {
  parentItemRef.value.closeComment();
};

const toLogin = () => {
  if (userStore.getUserInfo.id) return;
  router.push("/login");
};

const publish = async () => {
  if (!userStore.getUserInfo.id) {
    ElMessage.warning("请先登录");
    return;
  }
  if (!topApplyContent.value) {
    ElMessage.warning("请输入评论");
    return;
  }
  const data = {
    from_id: userStore.getUserInfo.id,
    from_avatar: userStore.getUserInfo.avatar,
    from_name: userStore.getUserInfo.nick_name,
    content: topApplyContent.value,
  };
  if (props.type == "article") {
    data.article_id = props.id;
  } else if (props.type == "talk") {
    data.talk_id = props.id;
  }

  const res = await addComment(data);
  if (res.code == 0) {
    topApplyContent.value = "";
    ElMessage.success("评论成功");
    parentItemRef.value.getComment("clear");
  } else {
    ElMessage.error(res.message);
  }
};

// 获取主评论条数
const getTotal = (val) => {
  total.value = val;
};
</script>

<template>
  <div class="comment">
    <div class="comment-header">
      <div class="total-label">
        评论 <span class="total-value">{{ total }}</span>
      </div>
      <div class="flex !ml-[2rem] items-center">
        <span :class="['tab', activeOrder == 'hot' ? 'active-order' : '']" @click="changeOrder('hot')">最热</span>
        <span class="tab">|</span>
        <span :class="['tab', activeOrder == 'new' ? 'active-order' : '']" @click="changeOrder('new')">最新</span>
      </div>
    </div>
    <div class="comment-input flex justify-start items-center !mt-[1rem]">
      <div class="w-[60px] h-[48px] avatar">
        <el-avatar :src="userStore.getUserInfo.avatar" :size="48" @click="toLogin">登录</el-avatar>
      </div>
      <div class="flex flex-1 justify-start items-center" @mouseenter="clearOthers">
        <el-input class="h-[48px]" type="textarea" v-model="topApplyContent" maxlength="450" placeholder="说点什么吧！" clearable></el-input>
        <el-button type="primary" class="!ml-[10px] publish-btn" @click="publish">发布</el-button>
      </div>
    </div>
    <div class="comment-list">
      <ParentItem ref="parentItemRef" :active="activeOrder" :type="type" :id="id" @returnTotal="getTotal" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment {
  width: 100%;
  &-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .total {
      &-label {
        font-size: 1rem;
        display: flex;
        align-items: center;
      }

      &-value {
        margin-left: 0.8rem;
        font-size: 0.8rem;
      }
    }

    .tab {
      cursor: pointer;
      margin-left: 0.8rem;
      font-size: 0.8rem;
      color: var(--dark-font-color);

      &:hover {
        color: var(--primary);
      }
    }
  }
}

.active-order {
  color: var(--primary) !important;
}

.publish-btn {
  background-color: var(--primary);
  font-size: 0.8rem;
  height: 30px;
  padding: 0 1rem;
}
.avatar {
  cursor: pointer;
}
// pc
@media screen and (min-width: 768px) {
  .avatar {
    display: block;
  }
}
// mobile
@media screen and (max-width: 768px) {
  .avatar {
    display: none;
  }
}
</style>
