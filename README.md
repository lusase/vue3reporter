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
