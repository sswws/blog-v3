<script setup>
import { reactive, ref, watch } from "vue";
import { frontGetParentComment, applyComment, thumbUpComment, cancelThumbUp, deleteComment } from "@/api/comment";
import TextOverflow from "@/components/TextOverflow/index.vue";
import ChildrenItem from "./ChildrenItem.vue";
import Loading from "@/components/Loading/Loading.vue";
import { user, thumbs } from "@/store/index";
import { ElMessage, ElMessageBox } from "element-plus";
import { storeToRefs } from "pinia";
const userStore = user();
const thumbsStore = thumbs();
const { getArticleCommentLikeList, getTalkCommentLikeList } = storeToRefs(thumbsStore);

const emits = defineEmits(["returnTotal"]);

const props = defineProps({
  active: {
    // 按最热/最新 排序
    type: String,
    default: "hot",
  },
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
const childrenRef = ref();
// 父级评论搜索参数
const params = reactive({
  current: 1,
  size: 5,
  type: "",
  id: "",
  order: "",
  loading: false,
});
// 父级评论列表
const commentList = ref([]);
const commentTotal = ref(0);

const likeList = (id) => {
  const list = props.type == "article" ? getArticleCommentLikeList.value : getTalkCommentLikeList.value;
  return list.includes(id);
};

const getComment = async (type) => {
  params.loading = true;
  if (type == "clear") {
    params.current = 1;
  }
  const res = await frontGetParentComment(params);
  if (res && res.code == 0) {
    const { list, total } = res.result;
    commentList.value = params.current == 1 ? list : commentList.value.concat(list);
    commentTotal.value = total - 0;
    emits("returnTotal", commentTotal.value);
  } else {
    ElMessage.error(res.message);
  }
  params.loading = false;
};

const showMore = () => {
  params.current++;
  getComment();
};

const currentApplyIndex = ref(0);

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

const apply = (item, index) => {
  currentApplyIndex.value = index;
  childrenRef.value[index].apply(item, "parent");
};

// 关闭打开的输入框
const closeComment = () => {
  if (commentList.length) {
    childrenRef.value.forEach((v) => {
      v.closeComment();
    });
  }
};

const deleteOwnComment = (id) => {
  ElMessageBox.confirm("确认删除此条评论吗？子级评论也会被删除哦", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  }).then(async () => {
    const res = await deleteComment(id);
    if (res && res.code == 0) {
      ElMessage.success("删除成功");
      getComment();
    } else {
      ElMessage.success(res.message);
    }
  });
};

const publish = async (item) => {
  const data = {
    from_id: userStore.getUserInfo.id,
    from_avatar: userStore.getUserInfo.avatar,
    from_name: userStore.getUserInfo.nick_name,
    to_id: item.from_id,
    to_avatar: item.from_avatar,
    to_name: item.from_name,
    content: item.content,
    parent_id: item.parent_id,
  };
  if (props.type == "article") {
    data.article_id = props.id;
  } else if (props.type == "talk") {
    data.talk_id = props.id;
  }

  const res = await applyComment(data);
  if (res.code == 0) {
    ElMessage.success("评论成功");
    params.current = 1;
    childrenRef.value[currentApplyIndex.value].getComment("clear");
    currentApplyIndex.value = 0;
  } else {
    ElMessage.error(res.message);
  }
};

watch(
  () => props.type,
  (newV) => {
    Object.assign(params, {
      id: props.id,
      type: newV,
      order: props.active,
    });
    getComment();
  },
  {
    immediate: true,
  }
);
watch(
  () => props.active,
  (newV) => {
    Object.assign(params, {
      order: newV,
      current: 1,
    });
    getComment();
  },
  {}
);

defineExpose({
  getComment,
  closeComment,
});
</script>

<template>
  <div class="comment">
    <div class="!mt-[2rem] animate__animated animate__fadeIn" v-if="commentList.length" v-for="(comment, index) in commentList" :key="index">
      <div class="flex justify-start items-start">
        <div class="w-[60px]">
          <el-avatar :src="comment.from_avatar" :size="48">{{ comment.from_name }}</el-avatar>
        </div>
        <div class="right">
          <div class="cursor-pointer">
            {{ comment.from_name }}
            <span v-if="comment.from_id == 1" class="up">UP</span>
          </div>
          <div class="!mt-[1rem]">
            <TextOverflow class="content" :text="comment.content" :width="199" :maxLines="2" :font-size="13">
              <template v-slot:default="{ clickToggle, expanded }">
                <span @click="clickToggle" class="btn">
                  {{ expanded ? "收起" : "展开" }}
                </span>
              </template>
            </TextOverflow>
          </div>
          <div class="!mt-[0.5rem]">
            <span class="!mr-[1rem]">{{ comment.createdAt }}</span>
            <span class="!mr-[1rem] ip">{{ `IP: ${comment.ipAddress}` }}</span>
            <span :class="['thumbs', '!mr-[1rem]', 'iconfont', 'icon-icon1', likeList(comment.id) ? 'thumbs-active' : '']" @click="thumbsUp(comment.id)">
              <span class="!ml-[0.5rem]">{{ comment.thumbs_up }}</span>
            </span>
            <span class="!mr-[1rem] apply cursor-pointer" @click="apply(comment, index)">回复</span>
            <span class="!mr-[1rem] delete cursor-pointer" v-if="userStore.getUserInfo.id == comment.from_id || userStore.getUserInfo.id == 1" @click="deleteOwnComment(comment.id)">删除</span>
          </div>
          <ChildrenItem class="!mt-[1.5rem]" ref="childrenRef" :type="props.type" :id="id" :parent_id="comment.id" @parentApplay="publish" />
        </div>
      </div>
    </div>
    <Loading :size="48" v-if="params.loading" />
    <div v-else-if="commentTotal > commentList.length" class="show-more" @click="showMore">展开更多</div>
    <div v-else class="h-[48px]"></div>
  </div>
</template>

<style lang="scss" scoped>
.comment {
  width: 100%;
  margin-top: 2rem;
}

.active {
  color: var(--primary);
}
.icon-icon1 {
  cursor: pointer;
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

.delete {
  word-break: keep-all;
  &:hover {
    color: #f04c49;
  }
}

.ip {
  font-size: 0.8rem;
  color: var(--font-color);
  display: inline-block;
}

.show-more {
  cursor: pointer;
  margin-top: 3px;
  font-size: 0.8rem;
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

.btn {
  margin-left: 3px;
  color: var(--primary);
  cursor: pointer;
}

@media screen and (max-width: 768px) {
  .right {
    margin-left: 1rem;
  }
}
</style>
