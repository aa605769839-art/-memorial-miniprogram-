import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Award, Heart, User, ChevronRight } from 'lucide-react-taro';

interface Memorial {
  id: string;
  name: string;
  description: string | null;
  mourningCount: number;
  visitCount: number;
}

const MemorialPage = () => {
  const [rankings, setRankings] = useState<Memorial[]>([]);
  const [type, setType] = useState<'mourning' | 'visit'>('mourning');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, [type]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await Network.request({
        url: '/api/rankings',
        method: 'GET',
        data: { type }
      });
      if (res.data?.code === 200) {
        setRankings(res.data.data || []);
      }
    } catch (e) {
      console.error('rankings fail', e);
    } finally {
      setLoading(false);
    }
  };

  const goDetail = (id: string) =>
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });

  const badge = (index: number) => {
    if (index === 0) return { color: '#c9a86a', text: '1' };
    if (index === 1) return { color: '#9ca3af', text: '2' };
    if (index === 2) return { color: '#b45309', text: '3' };
    return { color: '#d6d3c4', text: `${index + 1}` };
  };

  return (
    <View className="min-h-screen" style={{ background: 'linear-gradient(165deg,#eef3e4 0%,#f7f1e2 100%)' }}>
      <View className="px-5 pt-14 pb-2">
        <Text className="block text-2xl font-bold text-[#3f5d50]">纪念</Text>
        <Text className="block text-[#9aa68f] text-xs mt-1">把思念，郑重地交给时间</Text>
      </View>

      <View className="px-5 pt-4">
        <View className="bg-[#fbf8ef] rounded-3xl px-6 py-5 shadow-sm">
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="block text-[#6b4a35] text-base font-bold">暖心排行</Text>
            <View className="flex flex-row bg-white rounded-full p-0.5">
              <View
                className={`px-4 py-1.5 rounded-full text-center ${type === 'mourning' ? '' : ''}`}
                style={{ backgroundColor: type === 'mourning' ? '#6f9b86' : 'transparent' }}
                onClick={() => setType('mourning')}
              >
                <Text className={`text-sm font-medium ${type === 'mourning' ? 'text-white' : 'text-[#a89f8d]'}`}>悼念</Text>
              </View>
              <View
                className={`px-4 py-1.5 rounded-full text-center ${type === 'visit' ? '' : ''}`}
                style={{ backgroundColor: type === 'visit' ? '#6f9b86' : 'transparent' }}
                onClick={() => setType('visit')}
              >
                <Text className={`text-sm font-medium ${type === 'visit' ? 'text-white' : 'text-[#a89f8d]'}`}>拜访</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View className="flex items-center justify-center py-10">
              <View className="w-9 h-9 border-4 border-[#d6e3d9] border-t-[#6f9b86] rounded-full animate-spin" />
            </View>
          ) : rankings.length === 0 ? (
            <View className="flex flex-col items-center py-12">
              <View className="opacity-30 mb-4">
                <Award color="#a89f8d" size={72} strokeWidth={1.5} />
              </View>
              <Text className="block text-base text-[#7c8f83] mb-2">暂无排行数据</Text>
              <Text className="block text-sm text-[#b5ac98]">还没有人进行悼念或拜访</Text>
            </View>
          ) : (
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
              {rankings.map((item, index) => {
                const b = badge(index);
                return (
                  <View
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-3.5 ${index !== rankings.length - 1 ? 'border-b border-[#f0ede4]' : ''}`}
                    onClick={() => goDetail(item.id)}
                  >
                    <View className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: b.color }}>
                      <Text className="text-white font-bold text-base">{b.text}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-base font-medium text-[#3f5d50] mb-0.5">{item.name}</Text>
                      {item.description && (
                        <Text className="block text-xs text-[#a89f8d] line-clamp-1">{item.description}</Text>
                      )}
                    </View>
                    <View className="flex items-center gap-1.5">
                      {type === 'mourning' ? (
                        <>
                          <Heart color="#c9a86a" size={17} />
                          <Text className="text-lg font-bold text-[#6b4a35]">{item.mourningCount}</Text>
                        </>
                      ) : (
                        <>
                          <User color="#7c8f83" size={17} />
                          <Text className="text-lg font-bold text-[#3f5d50]">{item.visitCount}</Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* 入口卡片 */}
      <View className="px-5 mt-5 pb-8">
        <View
          className="flex flex-row items-center justify-between bg-white rounded-3xl px-5 py-4 shadow-sm"
          onClick={() => Taro.navigateTo({ url: '/pages/ranking/index' })}
        >
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f1e9d8' }}>
              <Award color="#c9a86a" size={20} />
            </View>
            <Text className="text-base text-[#3f5d50] font-medium">查看完整排行榜</Text>
          </View>
          <ChevronRight color="#c5c0b4" size={18} />
        </View>
      </View>
    </View>
  );
};

export default MemorialPage;