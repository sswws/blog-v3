import { config } from "@/config/config"
// 转码
export const Base64 = {
  encode: function (v) {
    return window.btoa(window.encodeURIComponent(v))
  },
  decode: function (v) {
    return window.decodeURIComponent(window.atob(v))
  },
}

export const _setLocalItem = function (key, value) {
  try {
    if (key === "" || key === undefined) {
      return
    }
    if (key) {
      if (value == 0) {
        value = JSON.stringify(value)
        localStorage.setItem(config.ENCRYPTION ? Base64.encode(key) : key, value)
        return
      }
      if (value === null || value === undefined || value === "") {
        return ""
      }
      // 编码
      let enObj = JSON.stringify(value)
      if (config.ENCRYPTION) {
        localStorage.setItem(Base64.encode(key), Base64.encode(enObj))
      } else {
        localStorage.setItem(key, enObj)
      }
    }
  } catch (err) {
    console.error(err)
  }
}
export const _getLocalItem = function (key) {
  try {
    if (key === null || key === "" || key === undefined) {
      return ""
    }
    if (key) {
      let value = localStorage.getItem(config.ENCRYPTION ? Base64.encode(key) : key)
      if (value === null || value === undefined || value === "") {
        return ""
      } else {
        value = config.ENCRYPTION ? Base64.decode(value) : value
        return JSON.parse(value)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export const _setSessionItem = function (key, value) {
  try {
    if (key === "" || key === undefined) {
      return
    }
    if (key) {
      if (value == 0) {
        value = JSON.stringify(value)
        sessionStorage.setItem(config.ENCRYPTION ? Base64.encode(key) : key, value)
      }
      if (value === null || value === undefined || value === "") {
        return ""
      }
      // 编码
      let enObj = JSON.stringify(value)
      if (config.ENCRYPTION) {
        sessionStorage.setItem(Base64.encode(key), Base64.encode(enObj))
      } else {
        sessionStorage.setItem(key, enObj)
      }
    }
  } catch (e) {
    console.log(e)
    return sessionStorage.setItem(config.ENCRYPTION ? Base64.encode(key) : key, value)
  }
}
export const _getSessionItem = function (key) {
  if (key === null || key === "" || key === undefined) {
    return null
  }
  try {
    if (key) {
      let value = sessionStorage.getItem(config.ENCRYPTION ? Base64.encode(key) : key)
      if (value === null || value === undefined || value === "") {
        return value
      } else {
        value = config.ENCRYPTION ? Base64.decode(value) : value
        return JSON.parse(value)
      }
    } else {
      return key
    }
  } catch (e) {
    console.log(e)
    return sessionStorage.getItem(config.ENCRYPTION ? Base64.encode(key) : key)
  }
}
export const _removeLocalItem = function (key) {
  if (key === null || key === "" || key === undefined) {
    return
  }
  if (key) {
    let enObj = config.ENCRYPTION ? Base64.encode(key) : key
    localStorage.removeItem(enObj)
  }
}
// 清空session数据
export const _removeSessionItem = function (key) {
  if (key === null || key === "" || key === undefined) {
    return
  }
  if (key) {
    let enObj = config.ENCRYPTION ? Base64.encode(key) : key
    sessionStorage.removeItem(enObj)
  }
}

/*
 * 递归深拷贝
 */
export function deepClone(source) {
  if (!source && typeof source !== "object") {
    throw new Error("error arguments", "deepClone")
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === "object") {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

export function isMobile() {
  // 手机端
  let reg = /(phone|pad|iPhone|iPod|ios|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
  return reg.test(navigator.userAgent)
}

export function randomFontColor() {
  return `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`
}

// 给一些数字转成k w
export function numberFormate(number) {
  number = typeof number == "number" ? number : parseFloat(number)
  let res
  if (number >= 10000) {
    res = (number / 10000).toFixed(1) + "w"
  } else if (number >= 1000) {
    res = (number / 1000).toFixed(1) + "k"
  } else {
    res = number
  }
  return res
}
