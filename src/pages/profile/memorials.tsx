import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Plus, Heart, User } from 'lucide-react-taro';
import { Network } from '@/network';

interface Memorial {
  id: string;
  name: string;
  avatar: string;
  birthDate: string;
  deathDate: string;
  description: string;
  mourningCount: number;
  visitCount: number;
}

const MyMemorialsPage = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMemorials();
  }, []);

  const loadMemorials = async () => {
    setLoading(true);
    try {
      const res = await Network.request({
        url: '/api/memorials',
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
      <View className="bg-white px-4 py-5 border-b border-blue-100">
        <Text className="block text-2xl font-bold text-blue-900">
          我的故友
        </Text>
      </View>

      {/* 新建按钮 */}
      <View className="px-4 py-4">
        <View
          className="bg-blue-500 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer shadow-sm"
          onClick={handleAddMemorial}
        >
          <Plus color="#fff" size={24} />
          <Text className="text-white text-lg font-semibold">
            新建故友
          </Text>
        </View>
      </View>

      {/* 故友列表 */}
      <View className="px-4">
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
              点击上方按钮添加
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
                  {memorial.avatar ? (
                    <Image
                      src={memorial.avatar}
                      className="w-full h-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <View className="w-full h-full flex items-center justify-center">
                      <Text className="text-slate-400 text-sm">
                        暂无图片
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="block text-base font-semibold text-blue-900 truncate">
                  {memorial.name}
                </Text>
                <Text className="block text-xs text-slate-500 mt-1 truncate">
                  {memorial.description || '暂无描述'}
                </Text>
                <View className="flex items-center justify-between gap-2 mt-2">
                  <View className="flex items-center gap-1">
                    <Heart size={14} color="#3b82f6" />
                    <Text className="text-xs text-slate-400">
                      {memorial.mourningCount}
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <User size={14} color="#94a3b8" />
                    <Text className="text-xs text-slate-400">
                      {memorial.visitCount}
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
