import http from "@/config/request";

/** 获取留言列表 */
export const getMessageList = (data) => {
  return new Promise((resolve, reject) => {
    http.post("/api/message/getMessageList", data).then((res) => {
      resolve(res);
    });
  });
};

/** 新增留言 */
export const addMessage = (data) => {
  return new Promise((resolve, reject) => {
    http.post("/api/message/add", data).then((res) => {
      resolve(res);
    });
  });
};
