import { defineConfig } from 'vite';

// GitHub Pages 项目页：仓库名 oil-station-report
// 这样构建产物中的资源路径会以 /oil-station-report/ 为前缀
export default defineConfig({
  base: '/oil-station-report/',
});

