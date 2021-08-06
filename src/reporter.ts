import {Options} from './install'

const formatParams = function(data) {
  const arr = []
  for (const name in data) {
    arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]))
  }
  return arr.join('&')
}

export class Reporter {
  reportUrl: string
  appId: string
  ajaxUrl: string
  openAjaxMonitor = false
  openResourceMonitor = true
  openJsErrorMonitor = true
  openPromiseMonitor = true
  openVueMonitor = true

  options = {
    timestamp: '', // 时间戳
    level: 'error', // 日志错误级别
    msg: '', // 错误具体信息
    userAgent: navigator.userAgent,
    appId: '',
    url: location.href, // 网页地址
    stack: '', // 错误堆栈信息
    data: {} // 更多错误信息
  }

  constructor(private app, options: Partial<Options>) {
    const {
      reportUrl,
      appId,
      openAjaxMonitor,
      openResourceMonitor,
      openJsErrorMonitor,
      openPromiseMonitor,
      openVueMonitor
    } = options

    this.reportUrl = reportUrl
    this.appId = appId
    this.openAjaxMonitor = openAjaxMonitor ?? this.openAjaxMonitor
    this.openResourceMonitor = openResourceMonitor ?? this.openResourceMonitor
    this.openJsErrorMonitor = openJsErrorMonitor ?? this.openJsErrorMonitor
    this.openPromiseMonitor = openPromiseMonitor ?? this.openPromiseMonitor
    this.openVueMonitor = openVueMonitor ?? this.openVueMonitor
    this.openAjaxMonitor && this.ajaxMonitor()
    this.openResourceMonitor && this.resourceMonitor()
    this.openJsErrorMonitor && this.jsErrorMonitor()
    this.openPromiseMonitor && this.promiseMonitor()
    this.openVueMonitor && this.vueMonitor()
  }

  processStackMsg(error) {
    let stack = error.stack
      .replace(/\n/gi, '') // 去掉换行，节省传输内容大小
      .replace(/\bat\b/gi, '@') // chrome中是at，ff中是@
      .split('@') // 以@分割信息
      .slice(0, 9) // 最大堆栈长度（Error.stackTraceLimit = 10），所以只取前10条
      .map((v) => v.replace(/^\s*|\s*$/g, '')) // 去除多余空格
      .join('~') // 手动添加分隔符，便于后期展示
      .replace(/\?[^:]+/gi, '') // 去除js文件链接的多余参数(?x=1之类)
    const msg = error.toString()
    if (stack.indexOf(msg) < 0) {
      stack = msg + '@' + stack
    }
    return stack
  }
  formatComponentName(vm) {
    if (vm.$root === vm) return 'root'
    const name = vm._isVue ? (vm.$options && vm.$options.name) || (vm.$options && vm.$options._componentTag) : vm.name
    return (name ? 'component <' + name + '>' : 'anonymous component') + (vm._isVue && vm.$options && vm.$options.__file ? ' at ' + (vm.$options && vm.$options.__file) : '')
  }
  reportPerformance() {
    /* performance 对象 */
    // @ts-ignore
    const performance = window.webkitPerformance || window.msPerformance || window.performance
    /* 所需信息 */
    const points = [
      'navigationStart', /* 开始浏览的时间 */
      'unloadEventStart', 'unloadEventEnd', /* 卸载上一个页面的时间 */
      'redirectStart', 'redirectEnd', /* HTTP重定向所消耗的时间 */
      'fetchStart', 'domainLookupStart', /* 缓存加载的时间 */
      'domainLookupStart', 'domainLookupEnd', /* DNS查询的时间 */
      'connectStart', 'connectEnd', /* 建立TCP连接的时间 */
      'connectStart', 'requestStart', 'responseStart', 'responseEnd', /* 建立TCP连接的时间 */
      'domInteractive', /* 可以交互的时间 */
      'domContentLoadedEventStart', 'domContentLoadedEventEnd', /* DomContentLoaded  页面加载完成的时间*/
      'domLoading', 'domComplete', /* 页面渲染的时间 */
      'domLoading', 'navigationStart', /* 加载页面花费的总时间 */
      'loadEventStart', 'loadEventEnd', /* 加载事件的时间 */
      'jsHeapSizeLimit', 'totalJSHeapSize', 'usedJSHeapSize', /* 内存的使用情况 */
      'redirectCount', 'type' /* 页面重定向的次数和类型 */
    ]
    /* 性能对象的属性 */
    const timing = performance.timing
    const memory = performance.memory
    const navigation = performance.navigation
    /* 判断性能对象是否可用 */
    if (performance && timing && memory && navigation) {
      /* 组装统计的信息 */
      const m = {
        timing: timing,
        memory: memory,
        navigation: navigation,
        userAgent: navigator.userAgent,
        url: location.href,
        data: + new Date  /* + 相当于 .valueOf()  */
      }
      /* 打印出上传的信息 */
      console.log(m)
    }
  }
  // Ajax监控
  ajaxMonitor() {
    const sAjaxListener: Record<string, any> = {}
    sAjaxListener.tempSend = XMLHttpRequest.prototype.send //复制原先的send方法
    sAjaxListener.tempOpen = XMLHttpRequest.prototype.open //复制原先的open方法
    //重写open方法,记录请求的url
    // @ts-ignore
    XMLHttpRequest.prototype.open = function(method, url, isAsync) {
      sAjaxListener.tempOpen.apply(this, [method, url, isAsync])
      this.ajaxUrl = url
    }
    XMLHttpRequest.prototype.send = function(_data) {
      const oldReq = this.onreadystatechange
      this.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status >= 200 && this.status < 300) {
            oldReq && oldReq.apply(this, [_data])
          } else {
            this.options.msg = 'ajax请求错误'
            this.options.stack = `错误码：${this.status}`
            this.options.data = JSON.stringify({
              fileName: this.ajaxUrl,
              category: 'ajax',
              text: this.statusText,
              status: this.status
            })
            // 合并上报的数据，包括默认上报的数据和自定义上报的数据
            const reportData = Object.assign({}, this.options)
            // 把错误信息发送给后台
            this.sendReport(reportData)
          }
        }
      }
      sAjaxListener.tempSend.apply(this, [_data])
    }
  }
  //监控资源加载错误(img,script,css,以及jsonp)
  resourceMonitor() {
    window.addEventListener('error', (e: any) => {
      const target = e.target ? e.target : e.srcElement
      this.options.msg = e.target.localName + ' is load error'
      this.options.stack = 'resource is not found'
      this.options.data = JSON.stringify({
        tagName: e.target.localName,
        html: target.outerHTML,
        type: e.type,
        fileName: e.target.currentSrc,
        category: 'resource'
      })
      if (e.target != window) {
        //抛去js语法错误
        // 合并上报的数据，包括默认上报的数据和自定义上报的数据
        const reportData = Object.assign({}, this.options)
        this.sendReport(reportData)
      }
    }, true)
  }
  //监控js错误
  jsErrorMonitor() {
    window.onerror = (msg, _url, line, col, error) => {
      if (msg === 'Script error.' && !_url) {
        return false
      }
      //采用异步的方式,避免阻塞
      setTimeout(() => {
        //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
        // @ts-ignore
        col = col || (window.event && window.event.errorCharacter) || 0
        //msg信息较少,如果浏览器有追溯栈信息,使用追溯栈信息
        this.options.msg = msg as string
        if (error && error.stack) {
          this.options.stack = error.stack
        } else {
          this.options.stack = ''
        }
        this.options.data = JSON.stringify({
          url: this.ajaxUrl,
          fileName: _url,
          category: 'javascript',
          line: line,
          col: col
        })
        // 合并上报的数据，包括默认上报的数据和自定义上报的数据
        const reportData = Object.assign({}, this.options)
        // 把错误信息发送给后台
        this.sendReport(reportData)
      }, 0)

      // return true // 返回true则错误不会被打印到控制台
    }
  }
  // 监控 promise 异常
  promiseMonitor() {
    window.addEventListener('unhandledrejection', (event: any) => {
      // 进行各种处理
      this.options.msg = event.reason
      this.options.data = JSON.stringify({
        url: location.href,
        category: 'promise'
      })
      this.options.stack = 'promise is error'
      const reportData = Object.assign({}, this.options)
      this.sendReport(reportData)
      // 如果想要阻止继续抛出，即会在控制台显示 `Uncaught(in promise) Error` 的话，调用以下函数
      event.preventDefault()
    },true)
  }
  //Vue异常监控
  vueMonitor() {
    this.app.config.errorHandler = (error, vm, info) => {
      const componentName = this.formatComponentName(vm)

      this.options.msg = error.message
      this.options.stack = this.processStackMsg(error)
      this.options.data = JSON.stringify({
        category: 'vue',
        componentName: componentName,
        info: info
      });

      // 合并上报的数据，包括默认上报的数据和自定义上报的数据
      const reportData = Object.assign({}, this.options)
      this.sendReport(reportData)
    }
  }
  stop(){
    this.sendReport = () => {}
  }
  sendReport(reportData) {
    let img = new Image()
    img.onload = img.onerror = function() {
      img = null
    }
    const reqData = Object.assign({}, this.options, reportData, {
      timestamp: new Date().getTime(),
      url: location.href,
      appId: this.appId
    })
    img.src = `${this.reportUrl}?${formatParams(reqData)}`
  }
}
