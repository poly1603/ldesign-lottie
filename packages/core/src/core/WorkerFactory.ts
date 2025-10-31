/**
 * Worker Factory
 * 使用 Blob URL 创建 Worker，避免外部文件依赖问题
 */

// Worker 源代码（将在构建时内联）
const workerCode = `
/**
 * Lottie Web Worker
 * 在后台线程处理 CPU 密集型任务
 */

// 简单的压缩/解压缩实现（用于 Worker 内部）
async function compressData(data, options) {
  // 简单的 JSON 字符串化和 base64 编码
  const jsonStr = JSON.stringify(data);
  return btoa(encodeURIComponent(jsonStr));
}

async function decompressData(data, options) {
  try {
    const jsonStr = decodeURIComponent(atob(data));
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error('Failed to decompress data: ' + error.message);
  }
}

// 解析动画数据
async function parseAnimationData(data, options) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Invalid animation JSON data');
    }
  }
  return data;
}

// 优化动画数据
async function optimizeAnimationData(data, options = {}) {
  const optimized = JSON.parse(JSON.stringify(data));
  
  // 移除隐藏的图层
  if (options.removeHiddenLayers && optimized.layers) {
    optimized.layers = optimized.layers.filter(layer => {
      return layer.hd !== true && layer.isHidden !== true;
    });
  }
  
  // 简化路径精度
  if (options.simplifyPaths && typeof options.precision === 'number') {
    const precision = Math.pow(10, options.precision);
    const simplifyNumber = (num) => Math.round(num * precision) / precision;
    
    const simplifyPath = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(simplifyPath);
      }
      if (obj && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          if (typeof obj[key] === 'number') {
            result[key] = simplifyNumber(obj[key]);
          } else {
            result[key] = simplifyPath(obj[key]);
          }
        }
        return result;
      }
      return obj;
    };
    
    if (optimized.layers) {
      optimized.layers = simplifyPath(optimized.layers);
    }
  }
  
  return optimized;
}

// Worker 消息处理
self.onmessage = async (e) => {
  const { type, id, data, options } = e.data;
  const startTime = performance.now();

  try {
    let result;

    switch (type) {
      case 'parse':
        result = await parseAnimationData(data, options);
        break;

      case 'compress':
        result = await compressData(data, options);
        break;

      case 'decompress':
        result = await decompressData(data, options);
        break;

      case 'optimize':
        result = await optimizeAnimationData(data, options);
        break;

      default:
        throw new Error(\`Unknown worker task type: \${type}\`);
    }

    const duration = performance.now() - startTime;

    self.postMessage({
      id,
      result,
      duration
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Worker 初始化完成
self.postMessage({ type: 'ready' });
`;

/**
 * 创建 Worker 实例（使用 Blob URL）
 */
export function createLottieWorker(): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  
  try {
    const worker = new Worker(workerUrl);
    
    // 清理 Blob URL（在 Worker 加载后）
    // 注意：不能立即清理，因为 Worker 可能还在初始化
    setTimeout(() => {
      URL.revokeObjectURL(workerUrl);
    }, 1000);
    
    return worker;
  } catch (error) {
    // 清理 Blob URL
    URL.revokeObjectURL(workerUrl);
    throw error;
  }
}

/**
 * 检查 Worker 是否支持
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof Blob !== 'undefined';
}
