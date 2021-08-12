# vue3reporter
vue3 bug reporter

### 在 vue3 中如何使用

- 示例

```
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import reporter from 'vue3reporter'
import 'element-plus/lib/theme-chalk/index.css'
import 'dayjs/locale/zh-cn'
import locale from 'element-plus/lib/locale/lang/zh-cn'


createApp(App)
.use(store)
.use(router)
.use(reporter, { appId: 'your app id', reportUrl: 'xxx'})
.use(ElementPlus, { locale, size: 'small' })
.mount('#app')
```

### API

- 调用时参数
  ```
  type Options = {
    reportUrl: string // 上报服务器地址
    performanceUrl: string // 上报页面性能参数的地址
    appId: string // appid 用于区分项目
    openAjaxMonitor: boolean // 是否打开ajax请求错误监控 默认true打开
    openResourceMonitor: boolean // 是否打开资源加载错误监控 默认true打开
    openJsErrorMonitor: boolean // 是否打开js脚本错误监控 默认true打开
    openPromiseMonitor: boolean // 是否打开Promise报错监控 默认true打开
    openVueMonitor: boolean // 是否打开vue组件报错 默认true打开
  }
  use(reporter, options: Options)
  
  ```
- 全局方法
  ``` 
  // 手动停止上报错误
  app.config.globalProperties.$reporter.stop()
  ```
- 上报格式

  ```
  reports:
  
  timestamp // 上报时间戳
  level // 错误级别
  msg // 错误简单信息
  userAgent // 浏览器ua信息
  appId // 所属应用
  url // 页面链接
  stack // 错误堆栈
  data // 错误具体信息 json
  type // 错误类型
  ```
  
  ```
   performance:
  
   baseTime // 开始时间
   unloadTime // 卸载上一个页面的时间
   redirectTime // HTTP重定向所消耗的时间
   cacheLoadTime // 缓存加载的时间
   dnsTime // DNS查询的时间
   tcpTime // 建立TCP连接的时间
   tcp1 // 建立连接到发起请求
   tcp2 // 发起请求到收到响应
   tcp3 // 响应开始到响应结束
   activeTime //可以交互的时间
   domLoadedTime //页面加载完成的时间
   renderTime //页面渲染的时间
   pageLoadTime //加载页面花费的总时间
   loadTime //加载事件的时间
   heapLimit //最大内存
   heapSize //可用内存
   heapUsed //已用内存
   redirectCount //页面重定向的次数
   redirectType //页面重定向的类型
   userAgent // 浏览器ua
   url // 页面url
   appId // 所属应用
  ```
