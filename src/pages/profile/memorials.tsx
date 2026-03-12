import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Plus } from 'lucide-react-taro';
import { Network } from '@/network';

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
    <View className="min-h-screen bg-blue-50 pb-6">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-blue-100 relative">
        <Text className="block text-2xl font-bold text-blue-900">
          我的故友
        </Text>
        {/* 新建按钮 - 右上角 */}
        <View
          className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full p-2 cursor-pointer"
          onClick={handleAddMemorial}
        >
          <Plus color="#60a5fa" size={24} />
        </View>
      </View>

      {/* 故友列表 */}
      <View className="px-4 mt-4">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-slate-500">加载中...</Text>
          </View>
        ) : memorials.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="text-slate-400 text-base">
              还没有故友
            </Text>
            <Text className="text-slate-400 text-sm mt-2">
              点击右上角按钮添加
            </Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-4">
            {memorials.map((memorial) => (
              <View
                key={memorial.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-blue-100"
                onClick={() => handleMemorialClick(memorial.id)}
              >
                <View className="w-full aspect-square bg-blue-100 overflow-hidden">
                  {memorial.avatar_url ? (
                    <Image
                      src={memorial.avatar_url}
                      className="w-full h-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <Image
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=${memorial.name}&backgroundColor=bfdbfe"
                      className="w-full h-full"
                      mode="aspectFit"
                    />
                  )}
                </View>
                {/* 信息区域 - 两行布局 */}
                <View className="p-3 bg-gradient-to-b from-blue-50 to-white">
                  {/* 第一行：姓名 + 享年 */}
                  <View className="flex items-center gap-2 mb-1">
                    <Text className="text-base font-bold text-blue-900 truncate">
                      {memorial.name}
                    </Text>
                    {calculateAge(memorial.birth_date, memorial.death_date) && (
                      <Text className="text-xs text-slate-500">
                        享年{calculateAge(memorial.birth_date, memorial.death_date)}岁
                      </Text>
                    )}
                  </View>
                  {/* 第二行：访问次数右对齐 */}
                  <View className="flex justify-end">
                    <Text className="text-xs text-slate-400">
                      访问 {memorial.visit_count}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default MyMemorialsPage;
