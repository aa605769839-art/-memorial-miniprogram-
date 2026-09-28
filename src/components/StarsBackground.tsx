import { View, Image } from '@tarojs/components';
import { ReactNode } from 'react';

// 深邃星空纪念背景（对象存储网络图：上半区纪念标识+金色光带点缀，下半区纯深蓝供内容展示）
export const BG_STARS_URL =
  'https://coze-coding-project.tos.coze.site/coze_storage_7688625912493146158/images/home-bg-v3_8951ca4d.png?sign=1793161490-def9b034af-0-03e34474f578ca213fd4b5ee8aadb8947753115ea1a9ccc32902e40c8aaa3f43';

interface BgProps {
  children: ReactNode;
  className?: string;
  /** 遮罩强度，默认轻微 */
  dim?: 'none' | 'light' | 'normal';
}

/**
 * 通用深邃星空背景容器。
 * 底层全屏网络背景图 + 半透明遮罩，上层承载业务内容。
 * 所有页面统一使用此背景保持风格一致。
 */
export const StarsBackground = ({ children, className = '', dim = 'light' }: BgProps) => {
  const dimMap = {
    none: 'transparent',
    light: 'linear-gradient(180deg, rgba(10,25,35,0.12) 0%, rgba(9,22,30,0.25) 100%)',
    normal: 'linear-gradient(180deg, rgba(10,25,35,0.3) 0%, rgba(8,20,28,0.5) 100%)'
  };
  return (
    <View className={`min-h-screen relative ${className}`}>
      <Image
        src={BG_STARS_URL}
        className="absolute top-0 left-0 w-full h-full"
        style={{ position: 'fixed' }}
        mode="aspectFill"
        aria-hidden
      />
      <View
        className="absolute top-0 left-0 w-full h-full"
        style={{ position: 'fixed', background: dimMap[dim] }}
      />
      <View className="relative z-10">{children}</View>
    </View>
  );
};