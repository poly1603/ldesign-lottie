import { createApp } from 'vue'
import LottieVue from '@ldesign/lottie-vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)

// 注册 Lottie 插件
app.use(LottieVue)

app.mount('#app')

