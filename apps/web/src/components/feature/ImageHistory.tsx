import { useTranslation } from 'react-i18next'

export function ImageHistory() {
  const { t } = useTranslation()
  
  // 核心修改：强制返回 null，这个组件在任何地方被调用都不会渲染任何东西
  return null; 
}
