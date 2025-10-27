/**
 * 验证和管道系统
 * 用于数据绑定的验证和转换
 */

export interface Validator {
  name: string
  validate: (value: any) => boolean
  message?: string
}

export interface TransformPipe {
  name: string
  transform: (value: any) => any
}

/**
 * 内置验证器
 */
export const Validators = {
  required: {
    name: 'required',
    validate: (value: any) => value !== null && value !== undefined && value !== '',
    message: 'This field is required'
  },

  min: (minValue: number) => ({
    name: 'min',
    validate: (value: any) => typeof value === 'number' && value >= minValue,
    message: `Value must be at least ${minValue}`
  }),

  max: (maxValue: number) => ({
    name: 'max',
    validate: (value: any) => typeof value === 'number' && value <= maxValue,
    message: `Value must be at most ${maxValue}`
  }),

  range: (min: number, max: number) => ({
    name: 'range',
    validate: (value: any) => typeof value === 'number' && value >= min && value <= max,
    message: `Value must be between ${min} and ${max}`
  }),

  pattern: (regex: RegExp) => ({
    name: 'pattern',
    validate: (value: any) => typeof value === 'string' && regex.test(value),
    message: 'Value does not match the required pattern'
  }),

  email: {
    name: 'email',
    validate: (value: any) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Invalid email address'
  },

  url: {
    name: 'url',
    validate: (value: any) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message: 'Invalid URL'
  }
}

/**
 * 内置转换管道
 */
export const Pipes = {
  uppercase: {
    name: 'uppercase',
    transform: (value: any) => typeof value === 'string' ? value.toUpperCase() : value
  },

  lowercase: {
    name: 'lowercase',
    transform: (value: any) => typeof value === 'string' ? value.toLowerCase() : value
  },

  trim: {
    name: 'trim',
    transform: (value: any) => typeof value === 'string' ? value.trim() : value
  },

  number: {
    name: 'number',
    transform: (value: any) => {
      const num = Number(value)
      return isNaN(num) ? value : num
    }
  },

  boolean: {
    name: 'boolean',
    transform: (value: any) => Boolean(value)
  },

  round: (decimals: number = 0) => ({
    name: 'round',
    transform: (value: any) => {
      if (typeof value !== 'number') return value
      const factor = Math.pow(10, decimals)
      return Math.round(value * factor) / factor
    }
  }),

  clamp: (min: number, max: number) => ({
    name: 'clamp',
    transform: (value: any) => {
      if (typeof value !== 'number') return value
      return Math.min(Math.max(value, min), max)
    }
  }),

  prefix: (prefix: string) => ({
    name: 'prefix',
    transform: (value: any) => `${prefix}${value}`
  }),

  suffix: (suffix: string) => ({
    name: 'suffix',
    transform: (value: any) => `${value}${suffix}`
  })
}