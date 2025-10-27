<template>
  <div class="app">
    <h1>🚀 Lottie Vue Demo</h1>
    
    <div class="demo-grid">
      <!-- 基础组件示例 -->
      <div class="demo-card">
        <h2>基础组件示例</h2>
        <Lottie
          :animation-data="animationData"
          :loop="true"
          :autoplay="isPlaying"
          :speed="speed"
          class="lottie-container"
          @ready="onReady"
          @complete="onComplete"
        />
        <div class="controls">
          <button @click="isPlaying = !isPlaying">
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <button @click="speed += 0.5">加速 ({{ speed }}x)</button>
          <button @click="speed = Math.max(0.5, speed - 0.5)">减速</button>
        </div>
      </div>
      
      <!-- Hook 示例 -->
      <HookDemo />
      
      <!-- 交互式示例 -->
      <InteractiveDemo />
      
      <!-- Ref 控制示例 -->
      <RefDemo />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lottie } from '@ldesign/lottie-vue'
import HookDemo from './components/HookDemo.vue'
import InteractiveDemo from './components/InteractiveDemo.vue'
import RefDemo from './components/RefDemo.vue'
import animationData from './animation.json'

const isPlaying = ref(true)
const speed = ref(1)

const onReady = () => {
  console.log('Animation ready!')
}

const onComplete = () => {
  console.log('Animation completed!')
}
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 40px;
  color: #1a1a1a;
  font-size: 2.5rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
}

.demo-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.demo-card h2 {
  font-size: 1.25rem;
  margin-bottom: 20px;
  color: #444;
}

.lottie-container {
  width: 100%;
  height: 250px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
}

.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #42b983;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.controls button:hover {
  background: #33a06f;
}
</style>

