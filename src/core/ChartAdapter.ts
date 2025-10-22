/**
 * 图表适配器
 * 将数据转换为 Lottie 动画，实现数据可视化
 */

import type { ILottieInstance } from '../types'
import { DataBinding } from './DataBinding'
import { Pipes } from './ValidationPipes'

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'radar'

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label?: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
  borderWidth?: number
}

export interface ChartOptions {
  type: ChartType
  animated?: boolean
  animationDuration?: number
  showLegend?: boolean
  showGrid?: boolean
  responsive?: boolean
  aspectRatio?: number
}

export interface ChartConfig {
  data: ChartData
  options: ChartOptions
}

/**
 * 图表适配器类
 */
export class ChartAdapter {
  private instance: ILottieInstance
  private binding: DataBinding
  private config: ChartConfig
  private currentData: ChartData

  constructor(instance: ILottieInstance, config: ChartConfig) {
    this.instance = instance
    this.config = config
    this.currentData = config.data
    this.binding = new DataBinding(instance)

    this.initialize()
  }

  /**
   * 初始化图表
   */
  private initialize(): void {
    this.updateChart(this.currentData)
  }

  /**
   * 更新图表数据
   */
  updateChart(data: ChartData): void {
    this.currentData = data

    switch (this.config.options.type) {
      case 'bar':
        this.updateBarChart(data)
        break
      case 'line':
        this.updateLineChart(data)
        break
      case 'pie':
      case 'donut':
        this.updatePieChart(data)
        break
      case 'area':
        this.updateAreaChart(data)
        break
      case 'radar':
        this.updateRadarChart(data)
        break
    }
  }

  /**
   * 更新柱状图
   */
  private updateBarChart(data: ChartData): void {
    const maxValue = this.getMaxValue(data)

    data.datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((value, index) => {
        const normalizedValue = maxValue > 0 ? value / maxValue : 0
        const targetLayer = `bar_${datasetIndex}_${index}`

        // 绑定高度/缩放
        this.binding.bind({
          path: `data.${datasetIndex}.${index}`,
          target: targetLayer,
          property: 'scale',
          pipes: [
            Pipes.clamp(0, 1),
            (v) => [1, normalizedValue, 1] // x, y, z 缩放
          ]
        })

        // 绑定标签
        if (data.labels[index]) {
          this.binding.bind({
            path: `labels.${index}`,
            target: `label_${index}`,
            property: 'text'
          })
        }
      })
    })

    // 更新数据
    this.binding.setData({
      data: data.datasets.map(d => d.data),
      labels: data.labels
    })
  }

  /**
   * 更新折线图
   */
  private updateLineChart(data: ChartData): void {
    const maxValue = this.getMaxValue(data)
    const points: Array<{ x: number, y: number }> = []

    data.datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((value, index) => {
        const x = (index / (dataset.data.length - 1)) * 100
        const y = maxValue > 0 ? (value / maxValue) * 100 : 0

        points.push({ x, y })

        // 绑定点位置
        this.binding.bind({
          path: `points.${datasetIndex}.${index}`,
          target: `point_${datasetIndex}_${index}`,
          property: 'position',
          pipes: [(v: { x: number, y: number }) => [v.x, v.y]]
        })
      })
    })

    this.binding.setData({
      points: data.datasets.map((dataset) =>
        dataset.data.map((value, i) => ({
          x: (i / (dataset.data.length - 1)) * 100,
          y: maxValue > 0 ? (value / maxValue) * 100 : 0
        }))
      )
    })
  }

  /**
   * 更新饼图
   */
  private updatePieChart(data: ChartData): void {
    const total = this.getTotal(data)
    let currentAngle = 0

    data.datasets[0]?.data.forEach((value, index) => {
      const percentage = total > 0 ? value / total : 0
      const angle = percentage * 360

      // 绑定扇形角度
      this.binding.bind({
        path: `slices.${index}.angle`,
        target: `slice_${index}`,
        property: 'rotation',
        pipes: [
          (v) => currentAngle + (v / 2) // 旋转到中心位置
        ]
      })

      // 绑定扇形大小
      this.binding.bind({
        path: `slices.${index}.size`,
        target: `slice_${index}`,
        property: 'scale',
        pipes: [
          (v) => [v, v, 1]
        ]
      })

      currentAngle += angle
    })

    this.binding.setData({
      slices: data.datasets[0]?.data.map((value, index) => {
        const percentage = total > 0 ? value / total : 0
        return {
          angle: percentage * 360,
          size: 1,
          value,
          label: data.labels[index]
        }
      })
    })
  }

  /**
   * 更新面积图
   */
  private updateAreaChart(data: ChartData): void {
    // 类似折线图，但填充区域
    this.updateLineChart(data)

    // 额外处理填充透明度
    data.datasets.forEach((dataset, datasetIndex) => {
      this.binding.bind({
        path: `areas.${datasetIndex}.opacity`,
        target: `area_${datasetIndex}`,
        property: 'opacity',
        defaultValue: 0.6
      })
    })
  }

  /**
   * 更新雷达图
   */
  private updateRadarChart(data: ChartData): void {
    const maxValue = this.getMaxValue(data)
    const angleStep = 360 / data.labels.length

    data.datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((value, index) => {
        const angle = index * angleStep
        const radius = maxValue > 0 ? (value / maxValue) * 100 : 0

        // 转换为笛卡尔坐标
        const x = radius * Math.cos((angle * Math.PI) / 180)
        const y = radius * Math.sin((angle * Math.PI) / 180)

        this.binding.bind({
          path: `radar.${datasetIndex}.${index}`,
          target: `radar_point_${datasetIndex}_${index}`,
          property: 'position',
          pipes: [(v: { x: number, y: number }) => [v.x, v.y]]
        })
      })
    })

    this.binding.setData({
      radar: data.datasets.map((dataset) =>
        dataset.data.map((value, index) => {
          const angle = index * angleStep
          const radius = maxValue > 0 ? (value / maxValue) * 100 : 0
          return {
            x: radius * Math.cos((angle * Math.PI) / 180),
            y: radius * Math.sin((angle * Math.PI) / 180)
          }
        })
      )
    })
  }

  /**
   * 更新单个数据点
   */
  updateDataPoint(datasetIndex: number, pointIndex: number, value: number): void {
    if (!this.currentData.datasets[datasetIndex]) return

    this.currentData.datasets[datasetIndex].data[pointIndex] = value
    this.updateChart(this.currentData)
  }

  /**
   * 更新整个数据集
   */
  updateDataset(datasetIndex: number, data: number[]): void {
    if (!this.currentData.datasets[datasetIndex]) return

    this.currentData.datasets[datasetIndex].data = data
    this.updateChart(this.currentData)
  }

  /**
   * 添加数据点
   */
  addDataPoint(label: string, values: number[]): void {
    this.currentData.labels.push(label)
    this.currentData.datasets.forEach((dataset, index) => {
      if (values[index] !== undefined) {
        dataset.data.push(values[index])
      }
    })
    this.updateChart(this.currentData)
  }

  /**
   * 移除数据点
   */
  removeDataPoint(index: number): void {
    this.currentData.labels.splice(index, 1)
    this.currentData.datasets.forEach(dataset => {
      dataset.data.splice(index, 1)
    })
    this.updateChart(this.currentData)
  }

  /**
   * 动画到新数据
   */
  async animateToData(newData: ChartData, duration: number = 1000): Promise<void> {
    const steps = 60 // 60 帧
    const stepDuration = duration / steps
    const oldData = JSON.parse(JSON.stringify(this.currentData))

    for (let step = 0; step <= steps; step++) {
      const progress = step / steps
      const interpolatedData = this.interpolateData(oldData, newData, progress)

      this.updateChart(interpolatedData)

      if (step < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration))
      }
    }

    this.currentData = newData
  }

  /**
   * 插值数据
   */
  private interpolateData(from: ChartData, to: ChartData, progress: number): ChartData {
    const result: ChartData = {
      labels: to.labels,
      datasets: []
    }

    to.datasets.forEach((toDataset, datasetIndex) => {
      const fromDataset = from.datasets[datasetIndex]
      if (!fromDataset) {
        result.datasets.push(toDataset)
        return
      }

      result.datasets.push({
        ...toDataset,
        data: toDataset.data.map((toValue, pointIndex) => {
          const fromValue = fromDataset.data[pointIndex] || 0
          return fromValue + (toValue - fromValue) * progress
        })
      })
    })

    return result
  }

  /**
   * 获取最大值
   */
  private getMaxValue(data: ChartData): number {
    let max = 0
    data.datasets.forEach(dataset => {
      const datasetMax = Math.max(...dataset.data)
      max = Math.max(max, datasetMax)
    })
    return max
  }

  /**
   * 获取总和
   */
  private getTotal(data: ChartData): number {
    return data.datasets[0]?.data.reduce((sum, val) => sum + val, 0) || 0
  }

  /**
   * 获取当前数据
   */
  getData(): ChartData {
    return JSON.parse(JSON.stringify(this.currentData))
  }

  /**
   * 更新配置
   */
  updateOptions(options: Partial<ChartOptions>): void {
    Object.assign(this.config.options, options)
    this.updateChart(this.currentData)
  }

  /**
   * 销毁
   */
  destroy(): void {
    // DataBinding 会在 instance 销毁时自动清理
  }
}

