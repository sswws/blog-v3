import { defineStore } from "pinia"; //引入pinia
import { _getLocalItem, _removeLocalItem, _setLocalItem } from "@/utils/tool";
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark({
  // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
  storageKey: "useDarkKEY",
  // 暗黑class名字
  valueDark: "dark",
  // 高亮class名字
  valueLight: "light",
});
const toggle = useToggle(isDark);

export const staticData = defineStore("staticData", {
  persist: {
    enabled: true, //开启数据持久化
    strategies: [
      {
        key: "staticState", //给一个要保存的名称
        storage: localStorage, //sessionStorage / localStorage 存储方式
      },
    ],
  },
  state: () => {
    return {
      previewThemeList: ["default", "github", "vuepress", "mk-cute", "smart-blue", "cyanosis"],
      codeThemeList: ["atom", "a11y", "github", "gradient", "kimbie", "paraiso", "qtcreator", "stackoverflow"],
      previewTheme: "default",
      codeTheme: "atom",
      theme: isDark.value,
      pageHeaderList: [], // 头部图片地址
    };
  },
  getters: {
    mainTheme() {
      return isDark.value;
    },
    getPageHeaderList() {
      return this.pageHeaderList || _getLocalItem("pageHeaderList");
    },
  },
  actions: {
    switchMainTheme() {
      toggle();
      this.theme = isDark.value;
      _setLocalItem("mainTheme", this.theme ? "dark" : "light");
    },
    setPageHeaderLIst(list) {
      this.pageHeaderList = list;
      _setLocalItem("pageHeaderList", list);
    },
  },
});

export const user = defineStore("user", {
  persist: {
    enabled: true, //开启数据持久化
    strategies: [
      {
        key: "userState", //给一个要保存的名称
        storage: localStorage, //sessionStorage / localStorage 存储方式
      },
    ],
  },
  state: () => {
    return {
      blogAvatar: "",
      userInfo: {}, // 当前登陆人信息
      token: "",
    };
  },
  getters: {
    getBlogAvatar() {
      return this.blogAvatar || _getLocalItem("blogAvatar");
    },
    // 获取当前登录人信息
    getUserInfo() {
      return this.userInfo || _getLocalItem("blogCurrentUserInfo");
    },
    getToken() {
      return this.token || _getLocalItem("blogToken");
    },
  },
  actions: {
    setBlogAvatar(avatar) {
      this.blogAvatar = avatar;
      _setLocalItem("blogAvatar", avatar);
    },
    setUserInfo(userInfo) {
      this.userInfo = userInfo;
      _setLocalItem("blogCurrentUserInfo", userInfo);
    },
    setToken(token) {
      this.token = token;
      _setLocalItem("blogToken", token);
    },
    clearUserInfo() {
      this.userInfo = {};
      this.token = "";
      _removeLocalItem("blogToken");
      _removeLocalItem("blogCurrentUserInfo");
    },
  },
});

export const thumbs = defineStore("thumbs", {
  persist: {
    enabled: true, //开启数据持久化
    strategies: [
      {
        key: "thumbsState", //给一个要保存的名称
        storage: localStorage, //sessionStorage / localStorage 存储方式
      },
    ],
  },
  state: () => {
    return {
      articleLikeList: [],
      talkLikeList: [],
      articleCommentLikeList: [],
      talkCommentLikeList: [],
    };
  },
  getters: {
    getArticleLikeList() {
      return this.articleLikeList || _getLocalItem("articleLikeList");
    },
    getTalkLikeList() {
      return this.talkLikeList || _getLocalItem("talkLikeList");
    },
    getArticleCommentLikeList() {
      return this.articleCommentLikeList || _getLocalItem("articleCommentLikeList");
    },
    getTalkCommentLikeList() {
      return this.talkCommentLikeList || _getLocalItem("talkCommentLikeList");
    },
  },
  actions: {
    setLikeList(type, id, op) {
      if (op == "thumbs") {
        switch (type) {
          case "article":
            this.articleLikeList.push(id);
            _setLocalItem("articleLikeList", this.articleLikeList);
            break;
          case "talk":
            this.talkLikeList.push(id);
            _setLocalItem("talkLikeList", this.talkLikeList);
            break;
          case "articleComment":
            this.articleCommentLikeList.push(id);
            _setLocalItem("articleCommentLikeList", this.articleCommentLikeList);
            break;
          case "talkComment":
            this.talkCommentLikeList.push(id);
            _setLocalItem("talkCommentLikeList", this.talkCommentLikeList);
            break;
          default:
            break;
        }
      } else if (op == "cancel") {
        let index;
        switch (type) {
          case "article":
            index = this.articleLikeList.findIndex((v) => v == id);
            this.articleLikeList.splice(index, 1);
            _setLocalItem("articleLikeList", this.articleLikeList);
            break;
          case "talk":
            index = this.talkLikeList.findIndex((v) => v == id);
            this.talkLikeList.splice(index, 1);
            _setLocalItem("talkLikeList", this.talkLikeList);
            break;
          case "articleComment":
            index = this.articleCommentLikeList.findIndex((v) => v == id);
            this.articleCommentLikeList.splice(index, 1);
            _setLocalItem("articleCommentLikeList", this.articleCommentLikeList);
            break;
          case "talkComment":
            index = this.talkCommentLikeList.findIndex((v) => v == id);
            this.talkCommentLikeList.splice(index, 1);
            _setLocalItem("talkCommentLikeList", this.talkCommentLikeList);
            break;
          default:
            break;
        }
      }
    },
  },
});
