/**
 * 常用验证器和转换管道
 */

import type { Validator, TransformPipe } from './DataBinding'

/**
 * 验证器库
 */
export const Validators = {
  /** 必填验证 */
  required: (): Validator => (value: any) => {
    return value !== null && value !== undefined && value !== '' || '值不能为空'
  },

  /** 数字验证 */
  number: (): Validator => (value: any) => {
    return typeof value === 'number' && !isNaN(value) || '必须是有效数字'
  },

  /** 范围验证 */
  range: (min: number, max: number): Validator => (value: any) => {
    const num = Number(value)
    return (num >= min && num <= max) || `值必须在 ${min} 到 ${max} 之间`
  },

  /** 最小值 */
  min: (min: number): Validator => (value: any) => {
    return Number(value) >= min || `值必须大于等于 ${min}`
  },

  /** 最大值 */
  max: (max: number): Validator => (value: any) => {
    return Number(value) <= max || `值必须小于等于 ${max}`
  },

  /** 字符串长度 */
  length: (min: number, max?: number): Validator => (value: any) => {
    const len = String(value).length
    if (max !== undefined) {
      return (len >= min && len <= max) || `长度必须在 ${min} 到 ${max} 之间`
    }
    return len >= min || `长度必须大于等于 ${min}`
  },

  /** 正则表达式验证 */
  pattern: (regex: RegExp, message?: string): Validator => (value: any) => {
    return regex.test(String(value)) || message || '格式不正确'
  },

  /** 邮箱验证 */
  email: (): Validator => (value: any) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(String(value)) || '邮箱格式不正确'
  },

  /** URL 验证 */
  url: (): Validator => (value: any) => {
    try {
      new URL(String(value))
      return true
    } catch {
      return 'URL 格式不正确'
    }
  },

  /** 自定义验证 */
  custom: (fn: (value: any) => boolean, message: string): Validator => (value: any) => {
    return fn(value) || message
  }
}

/**
 * 转换管道库
 */
export const Pipes = {
  /** 转为数字 */
  toNumber: (): TransformPipe => (value: any) => {
    return Number(value)
  },

  /** 转为字符串 */
  toString: (): TransformPipe => (value: any) => {
    return String(value)
  },

  /** 转为布尔值 */
  toBoolean: (): TransformPipe => (value: any) => {
    return Boolean(value)
  },

  /** 四舍五入 */
  round: (decimals: number = 0): TransformPipe => (value: any) => {
    const num = Number(value)
    const multiplier = Math.pow(10, decimals)
    return Math.round(num * multiplier) / multiplier
  },

  /** 向上取整 */
  ceil: (): TransformPipe => (value: any) => {
    return Math.ceil(Number(value))
  },

  /** 向下取整 */
  floor: (): TransformPipe => (value: any) => {
    return Math.floor(Number(value))
  },

  /** 限制范围 */
  clamp: (min: number, max: number): TransformPipe => (value: any) => {
    return Math.max(min, Math.min(max, Number(value)))
  },

  /** 百分比 */
  percentage: (decimals: number = 0): TransformPipe => (value: any) => {
    const num = Number(value) * 100
    return Pipes.round(decimals)(num) + '%'
  },

  /** 格式化数字 */
  formatNumber: (options?: Intl.NumberFormatOptions): TransformPipe => (value: any) => {
    return new Intl.NumberFormat(undefined, options).format(Number(value))
  },

  /** 货币格式化 */
  currency: (currency: string = 'USD'): TransformPipe => (value: any) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency
    }).format(Number(value))
  },

  /** 日期格式化 */
  date: (options?: Intl.DateTimeFormatOptions): TransformPipe => (value: any) => {
    const date = value instanceof Date ? value : new Date(value)
    return new Intl.DateTimeFormat(undefined, options).format(date)
  },

  /** 大写 */
  uppercase: (): TransformPipe => (value: any) => {
    return String(value).toUpperCase()
  },

  /** 小写 */
  lowercase: (): TransformPipe => (value: any) => {
    return String(value).toLowerCase()
  },

  /** 首字母大写 */
  capitalize: (): TransformPipe => (value: any) => {
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  /** 截断 */
  truncate: (length: number, suffix: string = '...'): TransformPipe => (value: any) => {
    const str = String(value)
    return str.length > length ? str.slice(0, length) + suffix : str
  },

  /** 默认值 */
  default: (defaultValue: any): TransformPipe => (value: any) => {
    return value !== null && value !== undefined ? value : defaultValue
  },

  /** 映射 */
  map: (mapping: Record<any, any>): TransformPipe => (value: any) => {
    return mapping[value] !== undefined ? mapping[value] : value
  },

  /** 数组过滤 */
  filter: (predicate: (item: any) => boolean): TransformPipe => (value: any) => {
    return Array.isArray(value) ? value.filter(predicate) : value
  },

  /** 数组映射 */
  mapArray: (fn: (item: any) => any): TransformPipe => (value: any) => {
    return Array.isArray(value) ? value.map(fn) : value
  },

  /** JSON 解析 */
  parseJSON: (): TransformPipe => (value: any) => {
    try {
      return JSON.parse(String(value))
    } catch {
      return value
    }
  },

  /** JSON 字符串化 */
  stringifyJSON: (space?: number): TransformPipe => (value: any) => {
    try {
      return JSON.stringify(value, null, space)
    } catch {
      return value
    }
  },

  /** 自定义管道 */
  custom: (fn: TransformPipe): TransformPipe => fn
}

