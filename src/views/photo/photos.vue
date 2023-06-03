<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getAllPhotosByAlbumId } from "@/api/photo";

const route = useRoute();
const photoList = ref([]);
const previewList = ref([]);
const previewIndex = ref(0);
const previewShow = ref(false);
const loading = ref(false);

const pageGetPhotos = async (id) => {
  let res = await getAllPhotosByAlbumId(id);
  if (res.code == 0) {
    photoList.value = res.result;
    previewList.value = res.result.map((l) => l.url);
    loading.value = false;
  }
};

const show = (index) => {
  previewIndex.value = index;
  previewShow.value = true;
};

const closeImgViewer = () => {
  previewShow.value = false;
};

onMounted(() => {
  if (route.query.id) {
    pageGetPhotos(Number(route.query.id));
  }
});
</script>

<template>
  <PageHeader />
  <div class="photoList">
    <el-row class="center_box">
      <el-col :span="24">
        <el-card class="photoList-card" v-loading="loading">
          <el-row v-if="photoList.length" class="row-space">
            <el-col class="col-space" :xs="12" :sm="6" v-for="(item, index) in photoList" :key="index">
              <div class="image-box flex_center animate__animated animate__fadeIn">
                <el-image class="image" :src="item.url" fit="cover" @click="show(index)" lazy />
              </div>
            </el-col>
            <el-image-viewer v-if="previewShow" :url-list="previewList" :initial-index="previewIndex" @close="closeImgViewer" />
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.photoList {
  .photoList-card {
    padding: 10px;
    min-height: 8rem;
  }

  .image-box {
    width: 100%;
    height: 100%;
  }

  .image {
    vertical-align: middle;
    cursor: pointer;
    width: 100%;
    object-fit: cover;
  }
}

.row-space {
  padding: 0 !important;
}

.col-space {
  padding: 1px !important;
}

@media screen and (min-width: 769px) {
  .image {
    height: 10rem;
  }
}

@media screen and (max-width: 768px) {
  .image {
    height: 8rem;
  }
}
</style>
