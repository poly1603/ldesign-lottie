# @ldesign/lottie-lit

> Lit Element 封装的 Lottie 动画库

## 安装

```bash
npm install @ldesign/lottie-lit
```

## 使用

### Web Component

```html
<script type="module">
  import '@ldesign/lottie-lit'
</script>

<lottie-element
  path="/animation.json"
  loop
  autoplay
  renderer="svg"
></lottie-element>
```

### With Controls

```html
<lottie-player
  path="/animation.json"
  loop
  autoplay
  show-controls
  show-progress
></lottie-player>
```

### JavaScript API

```javascript
const element = document.querySelector('lottie-element')
element.play()
element.pause()
element.setSpeed(2)
```

## 属性

- `path` - 动画文件路径
- `animation-data` - 动画数据对象
- `loop` - 循环播放
- `autoplay` - 自动播放
- `renderer` - 渲染器 (svg/canvas/html)
- `quality` - 质量 (low/medium/high)
- `speed` - 播放速度
- `direction` - 播放方向 (1/-1)

## 许可证

MIT

