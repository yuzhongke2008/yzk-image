// apps/web/src/components/feature/ImageHistory.tsx
import { useTranslation } from 'react-i18next'

// 使用 any 接收所有传入的 props，确保父组件调用时不报错
export function ImageHistory(_props: any) {
  const { t } = useTranslation()
  
  // 核心：强制不渲染任何内容
  return null; 
}

// 必须确保有一个默认导出，因为有的文件可能使用 default import
export default ImageHistory;
