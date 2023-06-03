import App from "./App.vue";
import { createApp } from "vue";
import router from "./router";
import { createPinia } from "pinia"; //引入pinia
import "./assets/css/iconFont/iconfont.css";
import "element-plus/dist/index.css"; // 引入样式
import "element-plus/theme-chalk/dark/css-vars.css";
import piniaPluginPersist from "pinia-plugin-persist";
// animate
import "animate.css";
// tailwind.css  https://www.tailwindcss.cn/docs
import "./styles/tailwind.css";
// svgicon
import "@/icons/index";
// 指令
import vCopy from "./directives/copy";

const app = createApp(App);
app.directive("copy", vCopy);
app.use(router).use(createPinia().use(piniaPluginPersist)).mount("#app");
