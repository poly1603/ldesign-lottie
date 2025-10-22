/**
 * 数据源适配器
 * 支持多种数据源类型，实现实时数据更新
 */

export type DataSourceType = 'static' | 'api' | 'websocket' | 'sse' | 'polling'

export interface DataSourceConfig {
  /** 数据源类型 */
  type: DataSourceType
  /** 数据源 URL（API/WebSocket/SSE） */
  url?: string
  /** 轮询间隔（ms） */
  pollingInterval?: number
  /** 请求头 */
  headers?: Record<string, string>
  /** 认证令牌 */
  token?: string
  /** 重连策略 */
  reconnect?: {
    enabled: boolean
    maxAttempts: number
    delay: number
  }
  /** 数据转换函数 */
  transform?: (data: any) => any
  /** 错误处理 */
  onError?: (error: Error) => void
  /** 离线缓存 */
  enableCache?: boolean
}

export interface DataSourceEvent {
  type: 'connected' | 'disconnected' | 'data' | 'error'
  data?: any
  error?: Error
}

/**
 * 数据源基类
 */
abstract class BaseDataSource {
  protected config: Required<Omit<DataSourceConfig, 'url' | 'pollingInterval' | 'token'>> &
    Pick<DataSourceConfig, 'url' | 'pollingInterval' | 'token'>
  protected listeners = new Map<string, Set<Function>>()
  protected cache: any = null
  protected isConnected: boolean = false

  constructor(config: DataSourceConfig) {
    this.config = {
      type: config.type,
      url: config.url,
      pollingInterval: config.pollingInterval,
      headers: config.headers || {},
      token: config.token,
      reconnect: config.reconnect || { enabled: true, maxAttempts: 3, delay: 1000 },
      transform: config.transform || ((data) => data),
      onError: config.onError || console.error,
      enableCache: config.enableCache ?? true
    }
  }

  abstract connect(): Promise<void>
  abstract disconnect(): void
  abstract send?(data: any): void

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event)
      return
    }
    this.listeners.get(event)?.delete(callback)
  }

  protected emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('[DataSource] Callback error:', error)
      }
    })
  }

  protected saveCache(data: any): void {
    if (this.config.enableCache) {
      this.cache = data
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`datasource_${this.config.url}`, JSON.stringify(data))
        } catch (error) {
          console.warn('[DataSource] Failed to save cache:', error)
        }
      }
    }
  }

  protected loadCache(): any {
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`datasource_${this.config.url}`)
        return cached ? JSON.parse(cached) : null
      } catch (error) {
        console.warn('[DataSource] Failed to load cache:', error)
      }
    }
    return null
  }

  getCache(): any {
    return this.cache
  }
}

/**
 * API 数据源
 */
export class APIDataSource extends BaseDataSource {
  async connect(): Promise<void> {
    if (!this.config.url) {
      throw new Error('URL is required for API data source')
    }

    try {
      const headers: Record<string, string> = { ...this.config.headers }
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }

      const response = await fetch(this.config.url, { headers })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const transformed = this.config.transform(data)

      this.saveCache(transformed)
      this.isConnected = true
      this.emit('connected')
      this.emit('data', transformed)
    } catch (error) {
      this.config.onError(error as Error)
      this.emit('error', error)

      // 尝试使用缓存数据
      const cached = this.loadCache()
      if (cached) {
        this.emit('data', cached)
      }
    }
  }

  disconnect(): void {
    this.isConnected = false
    this.emit('disconnected')
  }

  async refresh(): Promise<void> {
    await this.connect()
  }
}

/**
 * WebSocket 数据源
 */
export class WebSocketDataSource extends BaseDataSource {
  private ws: WebSocket | null = null
  private reconnectAttempts: number = 0
  private reconnectTimer: number | null = null

  async connect(): Promise<void> {
    if (!this.config.url) {
      throw new Error('URL is required for WebSocket data source')
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url!)

        this.ws.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const transformed = this.config.transform(data)
            this.saveCache(transformed)
            this.emit('data', transformed)
          } catch (error) {
            console.error('[WebSocketDataSource] Parse error:', error)
          }
        }

        this.ws.onerror = (error) => {
          this.config.onError(new Error('WebSocket error'))
          this.emit('error', error)
          reject(error)
        }

        this.ws.onclose = () => {
          this.isConnected = false
          this.emit('disconnected')
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.emit('disconnected')
  }

  send(data: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('[WebSocketDataSource] Not connected')
    }
  }

  private attemptReconnect(): void {
    if (!this.config.reconnect.enabled) return
    if (this.reconnectAttempts >= this.config.reconnect.maxAttempts) {
      console.error('[WebSocketDataSource] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnect.delay * this.reconnectAttempts

    console.log(`[WebSocketDataSource] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WebSocketDataSource] Reconnect failed:', error)
      })
    }, delay)
  }
}

/**
 * Server-Sent Events 数据源
 */
export class SSEDataSource extends BaseDataSource {
  private eventSource: EventSource | null = null
  private reconnectAttempts: number = 0
  private reconnectTimer: number | null = null

  async connect(): Promise<void> {
    if (!this.config.url) {
      throw new Error('URL is required for SSE data source')
    }

    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(this.config.url!)

        this.eventSource.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected')
          resolve()
        }

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const transformed = this.config.transform(data)
            this.saveCache(transformed)
            this.emit('data', transformed)
          } catch (error) {
            console.error('[SSEDataSource] Parse error:', error)
          }
        }

        this.eventSource.onerror = (error) => {
          this.config.onError(new Error('SSE error'))
          this.emit('error', error)
          this.isConnected = false
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.isConnected = false
    this.emit('disconnected')
  }

  private attemptReconnect(): void {
    if (!this.config.reconnect.enabled) return
    if (this.reconnectAttempts >= this.config.reconnect.maxAttempts) {
      console.error('[SSEDataSource] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnect.delay * this.reconnectAttempts

    console.log(`[SSEDataSource] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(error => {
        console.error('[SSEDataSource] Reconnect failed:', error)
      })
    }, delay)
  }
}

/**
 * 轮询数据源
 */
export class PollingDataSource extends APIDataSource {
  private pollingTimer: number | null = null

  async connect(): Promise<void> {
    await super.connect()
    this.startPolling()
  }

  disconnect(): void {
    this.stopPolling()
    super.disconnect()
  }

  private startPolling(): void {
    if (!this.config.pollingInterval) return

    this.pollingTimer = window.setInterval(() => {
      this.refresh().catch(error => {
        console.error('[PollingDataSource] Poll failed:', error)
      })
    }, this.config.pollingInterval)
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }
}

/**
 * 数据源工厂
 */
export class DataSourceFactory {
  static create(config: DataSourceConfig): BaseDataSource {
    switch (config.type) {
      case 'api':
        return new APIDataSource(config)

      case 'websocket':
        return new WebSocketDataSource(config)

      case 'sse':
        return new SSEDataSource(config)

      case 'polling':
        if (!config.pollingInterval) {
          throw new Error('pollingInterval is required for polling data source')
        }
        return new PollingDataSource(config)

      case 'static':
      default:
        throw new Error(`Unsupported data source type: ${config.type}`)
    }
  }
}

