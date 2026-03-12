import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Plus, Heart, User } from 'lucide-react-taro';
import { Network } from '@/network';

interface Memorial {
  id: string;
  name: string;
  avatar_url: string | null; // 修正字段名
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
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer"
                onClick={() => handleMemorialClick(memorial.id)}
              >
                <View className="w-full aspect-square bg-blue-100 rounded-xl overflow-hidden mb-3">
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
                {/* 名字和日期 */}
                <View className="flex items-center justify-between mb-1">
                  <Text className="text-base font-semibold text-blue-900 truncate flex-1">
                    {memorial.name}
                  </Text>
                  <Text className="text-xs text-slate-400 ml-1">
                    {memorial.birth_date && memorial.death_date
                      ? `${new Date(memorial.birth_date).getFullYear()}-${String(new Date(memorial.birth_date).getMonth() + 1).padStart(2, '0')} ~ ${new Date(memorial.death_date).getFullYear()}-${String(new Date(memorial.death_date).getMonth() + 1).padStart(2, '0')}`
                      : ''}
                  </Text>
                </View>
                {/* 简介 - 最多两行，去除名字 */}
                {memorial.description && (
                  <Text className="block text-xs text-slate-500 line-clamp-2 mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {memorial.description.replace(memorial.name, '').trim()}
                  </Text>
                )}
                <View className="flex items-center justify-between gap-2 mt-1">
                  <View className="flex items-center gap-1">
                    <Heart size={14} color="#3b82f6" />
                    <Text className="text-xs text-slate-400">
                      {memorial.mourning_count}
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <User size={14} color="#94a3b8" />
                    <Text className="text-xs text-slate-400">
                      {memorial.visit_count}
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
