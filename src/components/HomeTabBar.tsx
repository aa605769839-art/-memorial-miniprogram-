import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import homeIcon from '@/assets/tabbar/home.png';
import homeActiveIcon from '@/assets/tabbar/home-active.png';
import peopleIcon from '@/assets/tabbar/people.png';
import peopleActiveIcon from '@/assets/tabbar/people-active.png';
import memorialIcon from '@/assets/tabbar/memorial.png';
import memorialActiveIcon from '@/assets/tabbar/memorial-active.png';
import userIcon from '@/assets/tabbar/user.png';
import userActiveIcon from '@/assets/tabbar/user-active.png';

interface Item {
  key: string;
  text: string;
  icon: string;
  activeIcon: string;
  path: string;
}

const ITEMS: Item[] = [
  { key: 'home', text: '首页', icon: homeIcon, activeIcon: homeActiveIcon, path: '/pages/index/index' },
  { key: 'people', text: '故人', icon: peopleIcon, activeIcon: peopleActiveIcon, path: '/pages/people/index' },
  { key: 'memorial', text: '纪念', icon: memorialIcon, activeIcon: memorialActiveIcon, path: '/pages/memorial/index' },
  { key: 'profile', text: '我的', icon: userIcon, activeIcon: userActiveIcon, path: '/pages/profile/index' },
];

const HomeTabBar = () => {
  // 小程序端由原生 TabBar 渲染，无需自绘
  if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
    return null;
  }
  return (
    <View
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 600,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#0e2431',
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {ITEMS.map((item) => {
        const active = item.key === 'home';
        return (
          <View
            key={item.key}
            className="flex-1 flex flex-col items-center justify-center py-1.5"
            style={{ gap: '2px' }}
            onClick={() => {
              if (!active) {
                Taro.switchTab({ url: item.path });
              }
            }}
          >
            <Image src={active ? item.activeIcon : item.icon} style={{ width: 28, height: 28 }} mode="aspectFit" />
            <Text className="text-xs" style={{ color: active ? '#6f9b86' : '#b0a48f' }}>
              {item.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default HomeTabBar;