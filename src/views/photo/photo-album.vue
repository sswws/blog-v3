<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { getAllAlbum } from "@/api/photo";

const albumList = ref([]);
const loading = ref(false);
let observe = null;

const router = useRouter();
const goToPhotos = (item) => {
  router.push({ path: "/photos", query: { id: item.id, pageTitle: item.album_name } });
};

const getAll = async () => {
  let res = await getAllAlbum();
  if (res.code == 0) {
    albumList.value = res.result;
    loading.value = false;
    nextTick(() => {
      observeAlbumBox(); // 监听盒子
    });
  }
};

const observeAlbumBox = () => {
  // 获取要监听的元素
  const boxList = document.querySelectorAll(".albumList-box");
  observe = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (e) => {
        if (e.intersectionRatio > 0) {
          const nameElement = e.target.childNodes[0].childNodes[0];
          const descElement = e.target.childNodes[0].childNodes[1];
          const imgElement = e.target.childNodes[1];
          // 获取数据
          const name = nameElement.getAttribute("title");
          const desc = descElement.getAttribute("title");
          const src = imgElement.getAttribute("data-src");
          // 绑定数据
          nameElement.innerHTML = name;
          descElement.innerHTML = desc;
          imgElement.setAttribute("src", src);
          //3.停止监听当前图片对象
          observe.unobserve(e.target); //停止监听
        }
      });
    },
    { threshold: [0.1] }
  );
  boxList.forEach((box) => {
    observe.observe(box);
  });
};

onMounted(() => {
  // 监听页面滚动
  getAll();
});

onBeforeUnmount(() => {
  observe.disconnect();
});
</script>

<template>
  <PageHeader />
  <div class="albumList">
    <el-row class="center_box">
      <el-col :span="24">
        <el-card class="albumList-card" v-loading="loading">
          <el-row class="row-space">
            <el-col class="col-space" :xs="12" :sm="6" v-for="item in albumList" :key="item.id">
              <div class="albumList-box flex_center" @click="goToPhotos(item)">
                <div class="albumList-box__mask">
                  <span class="name text_overflow" :title="item.album_name"></span>
                  <span class="desc text_overflow" :title="item.description"></span>
                </div>
                <img class="albumList-box__image animate__animated animate__bounceIn" :data-src="item.album_cover" />
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.albumList {
  &-card {
    padding: 10px;
    min-height: 12em;
  }
  &-box {
    position: relative;
    width: 16rem;
    height: 10rem;
    &__image {
      border-radius: 8px;
      vertical-align: middle;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    &__mask {
      display: block;
      position: absolute;
      top: 0.8rem;
      left: 1rem;
      right: 1rem;
      bottom: 40%;
      border-radius: 8px;
      padding: 5px;
      z-index: 999;
      background: rgba(0, 0, 0, 0.2);
      .name {
        display: block;
        width: 100%;
        color: #fff;
        font-size: 1.4rem;
        font-weight: bold;
      }
      .desc {
        display: block;
        width: 100%;
        color: #fff;
        font-size: 1rem;
        font-weight: bold;
      }
    }
  }
}
.albumList-box:hover {
  transition: all 0.2s ease-in-out;
  transform: scaleX(0.95);
}
.row-space {
  padding: 0 !important;
}
.col-space {
  padding: 5px 2px !important;
}

@media screen and (max-width: 768px) {
  .albumList-box {
    width: 12rem;
    height: 8rem;
  }
}
</style>
