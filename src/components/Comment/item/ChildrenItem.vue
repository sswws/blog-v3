<script setup>
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { frontGetChildrenComment, applyComment, thumbUpComment, cancelThumbUp, deleteComment } from "@/api/comment";
import { ElMessage } from "element-plus";
import Pagination from "@/components/Pagination/pagi-nation.vue";
import { user, thumbs } from "@/store/index";
import { storeToRefs } from "pinia";
import Loading from "@/components/Loading/Loading.vue";
const router = useRouter();
const userStore = user();
const thumbsStore = thumbs();
const { getArticleCommentLikeList, getTalkCommentLikeList } = storeToRefs(thumbsStore);

const emits = defineEmits(["parentApplay"]);

const props = defineProps({
  type: {
    type: String, // 评论类型 talk 说说 article 文章
    default: () => {},
  },
  parent_id: {
    type: Number, // 父级评论id
    default: () => {},
  },
  id: {
    type: Number, // 说说/文章id
    default: () => {},
  },
});

const params = reactive({
  current: 1,
  size: 5,
  type: "",
  id: "",
  parent_id: "",
  loading: false,
});
const commentList = ref([]);
const commentTotal = ref(0);

const showApplay = ref(false); // 是否展示回复框
const commentTo = reactive({
  to_name: "",
  to_avatar: "",
  to_id: "",
}); // 评论的谁
const primaryCommentTo = reactive({ ...commentTo });

const applyContent = ref("");
const isParentApply = ref(false);

const likeList = (id) => {
  const list = props.type == "article" ? getArticleCommentLikeList.value : getTalkCommentLikeList.value;
  return list.includes(id);
};

// 关闭当前打开的输入评论框
const closeComment = () => {
  showApplay.value = false;
  Object.assign(commentTo, primaryCommentTo);
};

// 获取子级评论
const getComment = async (type) => {
  params.loading = true;
  // 如果要刷新 就让分页为1
  if (type == "clear") {
    params.current = 1;
  }
  const res = await frontGetChildrenComment(params);
  if (res && res.code == 0) {
    const { list, total } = res.result;
    commentList.value = list;
    commentTotal.value = total - 1;
  } else {
    ElMessage.error(res.message);
  }
  params.loading = false;
};

// 点赞
const thumbsUp = async (id) => {
  let res;
  // 查看点赞了没有，点赞了就进行取消点赞
  if (likeList(id)) {
    res = await cancelThumbUp(id);
  } else {
    res = await thumbUpComment(id);
  }
  if (res && res.code == 0) {
    if (likeList(id)) {
      // pina持久化、状态管理
      thumbsStore.setLikeList(props.type + "Comment", id, "cancel");
    } else {
      thumbsStore.setLikeList(props.type + "Comment", id, "thumbs");
    }
    getComment();
  }
};

const apply = (item, type) => {
  applyContent.value = "";
  if (type == "parent") {
    // 回复评论 回复主评论
    isParentApply.value = true;
  } else {
    // 回复子评论
    isParentApply.value = false;
  }
  showApplay.value = !showApplay.value;
  // 保存被回复人的信息 回复会用到
  if (showApplay.value) {
    commentTo.parent_id = props.parent_id;
    commentTo.from_id = item.from_id;
    commentTo.from_avatar = item.from_avatar;
    commentTo.from_name = item.from_name;
  } else {
    Object.assign(commentTo, primaryCommentTo);
  }
};

const deleteOwnComment = (id) => {
  ElMessageBox.confirm("确认删除此条评论吗", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  }).then(async () => {
    const res = await deleteComment(id, props.parent_id);
    if (res && res.code == 0) {
      ElMessage.success("删除成功");
      getComment();
    } else {
      ElMessage.success(res.message);
    }
  });
};

const toLogin = () => {
  if (userStore.getUserInfo.id) return;
  router.push("/login");
};

const pagination = (page) => {
  params.current = page.current;
  getComment();
};

const publish = async () => {
  if (!userStore.getUserInfo.id) {
    ElMessage.warning("请先登录");
    return;
  }
  if (!applyContent.value) {
    ElMessage.warning("请输入评论");
    return;
  }
  if (isParentApply.value) {
    commentTo.content = applyContent.value;
    emits("parentApplay", commentTo);
    closeComment();
    return;
  }
  const data = {
    from_id: userStore.getUserInfo.id,
    from_avatar: userStore.getUserInfo.avatar,
    from_name: userStore.getUserInfo.nick_name,
    to_id: commentTo.from_id,
    to_avatar: commentTo.from_avatar,
    to_name: commentTo.from_name,
    content: applyContent.value,
    parent_id: commentTo.parent_id,
  };
  if (props.type == "article") {
    data.article_id = props.id;
  } else if (props.type == "talk") {
    data.talk_id = props.id;
  }

  const res = await applyComment(data);
  if (res.code == 0) {
    applyContent.value = "";
    ElMessage.success("评论成功");
    closeComment();
    params.current = 1;
    getComment();
  } else {
    ElMessage.error(res.message);
  }
};

watch(
  () => props.parent_id,
  (newV) => {
    Object.assign(params, {
      id: props.id,
      type: props.type,
      parent_id: newV,
    });
    getComment();
  },
  {
    immediate: true,
  }
);

defineExpose({
  getComment,
  closeComment,
  apply,
});
</script>

<template>
  <div class="comment-children">
    <div v-if="commentList.length > 0" class="animate__animated animate__fadeIn">
      <div class="!mt-[1rem] flex justify-start items-start" v-for="(comment, index) in commentList" :key="index">
        <div class="!w-[30px] flex justify-start">
          <el-avatar :src="comment.from_avatar" :size="24" shape="circle"></el-avatar>
        </div>
        <div class="!ml-[5px]">
          <div>
            <span>{{ comment.from_name }}</span>
            <span v-if="comment.from_id == 1" class="up">UP</span>
            <span class="!ml-[1rem]">回复</span>
            <span class="!ml-[1rem] to-name">@</span>
            <span class="!ml-[3px] to-name"> {{ comment.to_name }}: </span>
            <span class="!ml-[1rem] content">{{ comment.content }}</span>
          </div>
          <div class="!mt-[0.5rem]">
            <span class="!mr-[1rem]">{{ comment.createdAt }}</span>
            <span class="!mr-[1rem] ip">{{ `IP: ${comment.ipAddress}` }}</span>
            <span :class="['thumbs', '!mr-[1rem]', 'iconfont', 'icon-icon1', likeList(comment.id) ? 'thumbs-active' : '']" @click="thumbsUp(comment.id)">
              <span class="!ml-[0.5rem]">{{ comment.thumbs_up }}</span>
            </span>
            <span class="!mr-[1rem] apply cursor-pointer" v-if="userStore.getUserInfo.id != comment.from_id" @click="apply(comment)">回复</span>
            <span class="!mr-[1rem] delete cursor-pointer" v-if="userStore.getUserInfo.id == comment.from_id || userStore.getUserInfo.id == 1" @click="deleteOwnComment(comment.id)">删除</span>
          </div>
        </div>
      </div>
    </div>
    <Loading :size="24" v-if="params.loading" />
    <div v-if="showApplay" class="flex justify-start items-center !mt-[1rem]">
      <div class="w-[60px] h-[48px] avatar">
        <el-avatar :src="userStore.getUserInfo.avatar" :size="48" @click="toLogin">登录</el-avatar>
      </div>
      <div class="flex flex-1 justify-start items-center">
        <el-input class="h-[48px]" type="textarea" v-model="applyContent" maxlength="450" :placeholder="`@ ${commentTo.from_name}`" clearable></el-input>
        <el-button type="primary" class="!ml-[5px] publish-btn" @click="publish">发布</el-button>
      </div>
    </div>
    <Pagination class="animate__animated animate__fadeIn" v-if="commentTotal > 0 && commentTotal > params.size" :size="params.size" :current="params.current" layout="prev, pager, next" :total="commentTotal" @pagination="pagination" />
  </div>
</template>

<style lang="scss" scoped>
.comment-children {
  margin-top: 1rem;
}

.content {
  word-break: break-all;
}
.thumbs {
  word-break: keep-all;
  font-size: 1rem;
}
.apply {
  word-break: keep-all;
}
.apply:hover {
  color: var(--primary);
}
.to-name {
  color: var(--primary);
}
.ip {
  font-size: 0.8rem;
  color: var(--font-color);
  display: inline-block;
}
.show-more {
  cursor: pointer;
  margin-top: 3px;

  &:hover {
    color: var(--primary);
  }
}
.thumbs-active {
  color: var(--primary);
  transform: scale(1.05);
}

.up {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: #f04c49;
}

.publish-btn {
  background-color: var(--primary);
  font-size: 0.8rem;
  height: 30px;
  padding: 0 1rem;
}
.delete {
  word-break: keep-all;
  &:hover {
    color: #f04c49;
  }
}

.avatar {
  cursor: pointer;
}
.pagination {
  text-align: left;
  margin: 0.5rem 0;
  display: flex;
  flex-direction: row;
  :deep(.el-pagination) {
    font-size: 0.8rem;
    --el-pagination-button-width: 16px;
    --el-pagination-button-height: 16px;
    --el-pagination-button-disabled-color: var(--el-text-color-placeholder);
    --el-pagination-button-disabled-bg-color: var(--el-fill-color-blank);
    --el-pagination-button-bg-color: var(--el-fill-color);
    --el-pagination-hover-color: var(--el-color-primary);
    --el-pagination-font-size-small: 12px;
    --el-pagination-button-width-small: 16px;
    --el-pagination-button-height-small: 16px;
    --el-pagination-item-gap: 8px;
  }
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
