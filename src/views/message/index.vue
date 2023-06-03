<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { getMessageList, addMessage } from "@/api/message";
import TextOverflow from "@/components/TextOverflow/index.vue";
import { user } from "@/store/index";
import { ElMessageBox } from "element-plus";
import router from "@/router";
import { _getLocalItem, _removeLocalItem, _setLocalItem } from "@/utils/tool";
import SkeletonItem from "@/components/SkletonItem/skeleton-item.vue";

const userState = user();
const messageList = ref([]);
const total = ref(0);
const loading = ref(false);
let observe;
let box;
const param = reactive({
  current: 1,
  size: 10,
});

const activeName = ref("");

const contactV = (rule, value, cb) => {
  const reg = new RegExp(/^1[3-9]\d{9}$/);
  if (!value) {
    return cb(new Error("请输入联系方式"));
  } else if (value && form.type == "tel" && !reg.test(value)) {
    return cb(new Error("请输入正确格式的手机号码"));
  } else {
    cb();
  }
};

const formRef = ref();

const form = reactive({
  message: "",
  type: "",
  contact: "",
  avatar: "",
  nick_name: "",
});

const primaryForm = reactive({ ...form });

const fromRules = reactive({
  message: [{ required: true, message: "请输入留言", trigger: "blur" }],
  type: [{ required: true, message: "请选择联系方式类别", trigger: ["blur", "change"] }],
  contact: [{ required: true, validator: contactV, trigger: "blur" }],
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
          if (total.value > messageList.value.length) {
            param.current++;
            pageGetMessageList(e);
          }
        }
      });
    },
    { threshold: [1] }
  );
  observe.observe(box);
};

const pageGetMessageList = async () => {
  if (param.current == 1) {
    loading.value = true;
  }
  let res = await getMessageList(param);
  if (res.code == 0) {
    messageList.value = param.current == 1 ? res.result.list : messageList.value.concat(res.result.list);
    total.value = res.result.total;
    loading.value = false;
  }
};

const leaveMessage = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!userState.getUserInfo.id) {
        ElMessageBox.confirm("您未登录，是否需要先登录再留言", "提示", {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
        })
          .then(() => {
            _setLocalItem("registerInfo", form);
            router.push("/login");
          })
          .catch(async () => {
            const res = await addMessage(form);
            if (res && res.code == 0) {
              ElMessage.success("留言成功");
              activeName.value = "";
              Object.assign(form, primaryForm);
              param.current = 1;
              pageGetMessageList();
            } else {
              ElMessage.error(res.message);
            }
          });
      } else {
        form.avatar = userState.getUserInfo.avatar;
        form.nick_name = userState.getUserInfo.nick_name;
        const res = await addMessage(form);
        if (res && res.code == 0) {
          ElMessage.success("留言成功");
          activeName.value = "";
          Object.assign(form, primaryForm);
          param.current = 1;
          pageGetMessageList();
          _getLocalItem("registerInfo") && _removeLocalItem("registerInfo");
        } else {
          ElMessage.error(res.message);
        }
      }
    }
  });
};

onMounted(async () => {
  if (_getLocalItem("registerInfo")) {
    Object.assign(form, _getLocalItem("registerInfo"));
    activeName.value = "applay";
    await leaveMessage();
  }
  await pageGetMessageList();
  if (messageList.value.length < total.value) {
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
  <div class="center_box">
    <el-collapse class="apply" v-model="activeName">
      <el-collapse-item title="留下点什么，证明你来过" name="applay">
        <el-form class="apply-form" ref="formRef" :model="form" :rules="fromRules" label-width="100px" label-suffix=":">
          <el-form-item label="联系类别" prop="type">
            <el-select v-model="form.type" :style="{ width: '160px' }" placeholder="请选择联系类别" clearable>
              <el-option label="QQ" value="qq" />
              <el-option label="WX" value="wx" />
              <el-option label="Phone" value="tel" />
            </el-select>
          </el-form-item>
          <el-form-item label="联系方式" prop="contact">
            <el-input v-model="form.contact" :style="{ width: '220px' }" :maxlength="form.type == 'tel' ? 11 : 20" placeholder="请输入联系方式" clearable />
          </el-form-item>
          <el-form-item label="留言内容" prop="message">
            <el-input type="textarea" v-model="form.message" :style="{ width: '220px' }" maxlength="225" resize="none" :autosize="{ minRows: 2, maxRows: 6 }" show-word-limit placeholder="请输入留言内容" clearable />
          </el-form-item>
        </el-form>
        <div class="pos">
          <el-button class="apply-button" type="danger" @click="leaveMessage">留言</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
    <el-skeleton :loading="loading" style="height: 100%" animated>
      <template #template>
        <div class="flex justify-start w-[100%] !mt-[10px]" v-for="i in 3" :key="i">
          <SkeletonItem variant="circle" width="60px" height="60px" />
          <div class="w-[70%] !ml-[10px]">
            <SkeletonItem variant="text" width="20%" height="20px" />
            <SkeletonItem variant="text" width="90%" height="30px" top="5px" />
          </div>
        </div>
      </template>
      <div class="message-card">
        <el-card class="!mt-[10px]" v-for="(message, index) in messageList" :key="index">
          <div class="message-card__item animate__animated animate__fadeIn">
            <div class="left">
              <el-avatar class="left-avatar" :src="message.avatar">{{ message.nick_name }} </el-avatar>
            </div>
            <div class="right">
              <div class="right-top relative">
                <i v-if="message.is_top == 1" class="iconfont icon-zhiding"></i>
                <span class="nick-name">{{ message.nick_name }}</span>
                <TextOverflow class="content" :text="message.message" :width="199" :maxLines="3" :font-size="13">
                  <template v-slot:default="{ clickToggle, expanded }">
                    <span @click="clickToggle" class="btn">
                      {{ expanded ? "收起" : "展开" }}
                    </span>
                  </template>
                </TextOverflow>
              </div>
              <div class="right-bottom">
                <el-image v-for="(url, index) in message.messageImgList" :key="index" :src="url" class="image" loading="lazy" preview-teleported :initial-index="index" fit="cover" :preview-src-list="message.messageImgList.map((v) => v)" />
              </div>
              <div class="time">{{ returnTime(message.createdAt) }}前</div>
            </div>
          </div>
        </el-card>
      </div>
      <div class="observer">
        {{ messageList.length >= total ? "暂无更多" : "下拉加载更多" }}
      </div>
    </el-skeleton>
  </div>
</template>

<style lang="scss" scoped>
.apply {
  margin: 3.75px;
  .pos {
    padding: 0.5rem 0 0 10rem;
  }

  &-button {
    height: 24px;
    padding: 0 30px;
    background-color: var(--border-color);
    border: none;
    transition: all 0.5s;
    &:hover {
      background-color: var(--primary);
    }
  }
}
.message {
  &-card {
    margin: 5px;
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

  .time {
    font-size: 12px;
    color: var(--font-color);
    margin-top: 20px;
    letter-spacing: 1px;
  }
}
.observer {
  text-align: center;
  font-size: 1rem;
  color: var(--font-color);
  margin-top: 3px;
  letter-spacing: 1px;
}
.btn {
  margin-left: 3px;
  color: var(--primary);
  cursor: pointer;
}
:deep(.el-form-item) {
  padding: 10px 0;
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
        margin-top: 5px;
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
        margin-top: 5px;
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
