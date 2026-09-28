import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Plus, Eye, User } from 'lucide-react-taro';
import { Network } from '@/network';
import { StarsBackground } from '@/components/StarsBackground';

interface Memorial {
  id: string;
  name: string;
  avatar_url: string | null;
  birth_date: string;
  death_date: string;
  description: string | null;
  mourning_count: number;
  visit_count: number;
}

const MyMemorialsPage = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(false);

  // 页面显示时加载数据（包括从其他页面返回时）
  useDidShow(() => {
    loadMemorials();
  });

  const getUserId = () => {
    let userId = Taro.getStorageSync('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      Taro.setStorageSync('userId', userId);
    }
    return userId;
  };

  const loadMemorials = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const res = await Network.request({
        url: '/api/memorials',
        method: 'GET',
        data: { userId }
      });

      if (res.statusCode === 200 && res.data.data) {
        setMemorials(res.data.data);
      }
    } catch (error) {
      console.error('加载故友列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemorial = () => {
    Taro.navigateTo({
      url: '/pages/profile/form'
    });
  };

  const handleMemorialClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  };

  const calculateAge = (birthDate: string, deathDate: string) => {
    if (!birthDate || !deathDate) return null;
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    return death.getFullYear() - birth.getFullYear();
  };

  return (
    <StarsBackground dim="light">
      {/* 头部 */}
      <View className="px-4 pt-14 pb-5 relative" style={{ borderBottom: '1px solid rgba(232,192,122,0.25)' }}>
        <Text className="block text-2xl font-bold text-white">
          我的故友
        </Text>
        {/* 新建按钮 - 右上角 */}
        <View
          className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full p-2 cursor-pointer"
          onClick={handleAddMemorial}
        >
          <Plus color="#e8c07a" size={24} />
        </View>
      </View>

      {/* 故友列表 */}
      <View className="px-4 mt-4">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-white/60">加载中...</Text>
          </View>
        ) : memorials.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="text-white/60 text-base">
              还没有故友
            </Text>
            <Text className="text-white/40 text-sm mt-2">
              点击右上角按钮添加
            </Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-4">
            {memorials.map((memorial) => (
              <View
                key={memorial.id}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ backgroundColor: 'rgba(18,42,53,0.8)', border: '1px solid rgba(232,192,122,0.3)' }}
                onClick={() => handleMemorialClick(memorial.id)}
              >
                <View className="w-full aspect-square overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  {memorial.avatar_url ? (
                    <Image
                      src={memorial.avatar_url}
                      className="w-full h-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <View className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(127,195,206,0.15)' }}>
                      <User color="#7fc3ce" size={48} strokeWidth={1.4} />
                    </View>
                  )}
                </View>
                {/* 信息区域 - 两行布局 */}
                <View className="p-3">
                  {/* 第一行：姓名 */}
                  <Text className="text-base font-bold text-white truncate mb-1">
                    {memorial.name}
                  </Text>
                  {/* 第二行：享岁居右 + 访问icon */}
                  <View className="flex items-center justify-between">
                    {calculateAge(memorial.birth_date, memorial.death_date) && (
                      <Text className="text-sm text-white/50">
                        享年{calculateAge(memorial.birth_date, memorial.death_date)}岁
                      </Text>
                    )}
                    <View className="flex items-center gap-1">
                      <Eye size={14} color="#e8c07a" />
                      <Text className="text-xs text-[#e8c07a]/70">
                        {memorial.visit_count}
                      </Text>
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

export default MyMemorialsPage;
