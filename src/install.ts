import {Reporter} from './reporter'

export type Options = {
  performanceUrl: string
  reportUrl: string
  appId: string
  openAjaxMonitor: boolean
  openResourceMonitor: boolean
  openJsErrorMonitor: boolean
  openPromiseMonitor: boolean
  openVueMonitor: boolean
}

export default function install(app, options: Partial<Options>) {
  const {appId, reportUrl} = options

  if (!appId || !reportUrl) {
    return console.error('reportUrl && appId is required')
  }

  const reporter = new Reporter(app, options)

  if (typeof app === 'function') {
    Object.defineProperty(app.prototype, '$reporter', {
      get() {
        return reporter
      }
    })
  } else {
    Object.defineProperty(app.config.globalProperties, '$reporter',{
      get() {
        return reporter
      }
    })
  }
}
