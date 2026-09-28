import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect, useRef } from 'react';
import { Network } from '@/network';
import { StarsBackground } from '@/components/StarsBackground';
import { User, Eye } from 'lucide-react-taro';

interface Memorial {
  id: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  avatarUrl: string | null;
  visitCount: number;
}

const PeoplePage = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const lastTapTime = useRef(0);

  useEffect(() => {
    fetchData();
  }, []);

  // TabBar 双击刷新
  useEffect(() => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      const handler = (item: any) => {
        if (item.index === 1) {
          const now = Date.now();
          if (now - lastTapTime.current < 300) {
            setLoading(true);
            fetchData();
            Taro.showToast({ title: '刷新成功', icon: 'success', duration: 1000 });
          }
          lastTapTime.current = now;
        }
      };
      // @ts-ignore
      Taro.onTabItemTap?.(handler);
      return () => {
        // @ts-ignore
        Taro.offTabItemTap?.(handler);
      };
    }
  }, []);

  const fetchData = async () => {
    try {
      const res = await Network.request({ url: '/api/memorials', method: 'GET' });
      if (res.data?.code === 200) {
        setMemorials(res.data.data || []);
      }
    } catch (e) {
      console.error('fetch fail', e);
    } finally {
      setLoading(false);
    }
  };

  const goDetail = (id: string) =>
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });

  const age = (birth: string | null, death: string | null) => {
    if (!birth || !death) return null;
    return new Date(death).getFullYear() - new Date(birth).getFullYear();
  };

  if (loading) {
    return (
      <StarsBackground dim="normal" className="flex items-center justify-center">
        <View className="flex flex-col items-center">
          <View className="w-11 h-11 border-4 border-[#e8c07a]/30 border-t-[#e8c07a] rounded-full animate-spin" />
          <Text className="block text-sm text-[#e8c07a] mt-3">加载中...</Text>
        </View>
      </StarsBackground>
    );
  }

  return (
    <StarsBackground>
      <View className="px-5 pt-14 pb-2">
        <Text className="block text-2xl font-bold text-white">故人</Text>
        <Text className="block text-[#e8c07a] text-xs mt-1">每一段思念，都值得被郑重收藏</Text>
      </View>

      <View className="px-5 py-4">
        {memorials.length === 0 ? (
          <View className="flex flex-col items-center py-24">
            <View className="w-24 h-24 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(232,192,122,0.15)' }}>
              <User color="#e8c07a" size={44} strokeWidth={1.5} />
            </View>
            <Text className="block text-base font-medium text-white mb-2">暂无纪念空间</Text>
            <Text className="block text-sm text-[#e8c07a]/70 mb-6">前往"我的"页面创建纪念空间</Text>
            <View
              className="px-6 py-2.5 rounded-full text-white"
              style={{ background: 'linear-gradient(90deg,#f0c87d,#d9a853)' }}
              onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
            >
              <Text className="text-sm font-medium">前往创建</Text>
            </View>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {memorials.map((m) => (
              <View
                key={m.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm"
                onClick={() => goDetail(m.id)}
              >
                <View className="aspect-square relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#eef3e4' }}>
                  {m.avatarUrl ? (
                    <Image src={m.avatarUrl} className="w-full h-full" mode="aspectFill" />
                  ) : (
                    <View className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dbe8dd' }}>
                      <User color="#7da98f" size={32} strokeWidth={1.5} />
                    </View>
                  )}
                </View>
                <View className="p-3 bg-white">
                  <Text className="block text-base font-bold text-[#3f5d50] truncate mb-1">
                    {m.name}
                  </Text>
                  <View className="flex items-center justify-between">
                    {age(m.birthDate, m.deathDate) && (
                      <Text className="text-sm text-[#a89f8d]">享年{age(m.birthDate, m.deathDate)}岁</Text>
                    )}
                    <View className="flex items-center gap-1">
                      <Eye size={14} color="#a89f8d" />
                      <Text className="text-xs text-[#a89f8d]">{m.visitCount}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </StarsBackground>
  );
};

export default PeoplePage;