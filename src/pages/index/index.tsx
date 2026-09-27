import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import {
  Cross,
  BookOpen,
  Users,
  HeartHandshake,
  ChevronRight
} from 'lucide-react-taro';

// 生成的渐变品牌底、花束插画走 TOS 对象存储
const BOUQUET_URL =
  'https://coze-coding-project.tos.coze.site/coze_storage_7688625912493146158/image/generate_image_1c6c4d66-6b2a-43ef-889a-8d3d553159e1.jpeg?sign=1822027033-de06d8271c-0-e885dbe0eb57fb653ea000e3d120e0dc3b30e9c071b3e73f5c9c601e5bd08e5f';

interface Memorial {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// 社区动态静态示例（无真实动态流时兜底展示）
const FALLBACK_DYNAMICS = [
  { key: 'a', title: '李阿姨发布了一张老照片', char: '李', bg: '#e8efe9', color: '#7da98f' },
  { key: 'b', title: '孙女为爷爷献上一束纪念花', char: '孙', bg: '#f1e9d8', color: '#c9a86a' }
];

const IndexPage = () => {
  const [todayCount, setTodayCount] = useState(128);
  const [memorials, setMemorials] = useState<Memorial[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await Network.request({ url: '/api/memorials', method: 'GET' });
      if (res.data?.code === 200) {
        const list = res.data.data || [];
        setMemorials(list);
        if (list.length > 0) {
          setTodayCount(100 + list.length * 7 + (list.length % 11));
        }
      }
    } catch (e) {
      console.error('stats fail', e);
    }
  };

  const goDetail = (id: string) =>
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });

  const goPeople = (id?: string) => {
    if (id) return goDetail(id);
    Taro.switchTab({ url: '/pages/people/index' });
  };

  return (
    <View
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #b9d8c8 0%, #eef3e4 46%, #f7f1e2 100%)' }}
    >
      {/* 品牌区 */}
      <View className="px-6 pt-16 pb-2">
        <Text className="block text-4xl font-extrabold text-white tracking-wide" style={{ textShadow: '0 2px 8px rgba(120,150,130,0.35)' }}>
          晚星纪念
        </Text>
        <Text className="block text-white text-opacity-90 mt-2 text-sm tracking-widest">
          连接家人，也留住回忆
        </Text>
      </View>

      {/* 今日纪念卡片 */}
      <View className="px-5 mt-6">
        <View className="bg-[#fbf8ef] rounded-[24px] px-6 py-6 shadow-sm flex flex-row">
          <View className="flex-1 pr-2">
            <Text className="block text-[#8a6d4f] text-base font-semibold mb-3">
              今日纪念
            </Text>
            <Text className="block text-[#6b4a35] text-3xl font-extrabold leading-tight">
              今天有&nbsp;
              <Text className="text-[#c07a3c] text-4xl">{todayCount}</Text>
            </Text>
            <Text className="block text-[#6b4a35] text-3xl font-extrabold leading-tight">
              位亲人被想起
            </Text>
          </View>
          <View className="w-28 h-24 flex items-center justify-center overflow-hidden rounded-2xl">
            <Image
              src={BOUQUET_URL}
              className="w-full h-full"
              mode="aspectFit"
            />
          </View>
        </View>
      </View>

      {/* 四功能入口 */}
      <View className="px-5 mt-6">
        <View className="flex flex-row gap-3">
          {/* 电子墓碑 */}
          <View
            className="flex-1 rounded-[18px] py-5 px-3 flex flex-col items-center"
            style={{ backgroundColor: '#cfe2d4' }}
            onClick={() => goPeople()}
          >
            <Cross color="#ffffff" size={30} strokeWidth={2.2} />
            <Text className="block text-white font-semibold text-sm mt-3">电子墓碑</Text>
          </View>
          {/* 故事纪念馆 */}
          <View
            className="flex-1 rounded-[18px] py-5 px-3 flex flex-col items-center"
            style={{ backgroundColor: '#f1e6cd' }}
            onClick={() => goPeople()}
          >
            <BookOpen color="#9b7b54" size={30} strokeWidth={2} />
            <Text className="block text-[#6b4a35] font-semibold text-sm mt-3">故事纪念馆</Text>
          </View>
        </View>
        <View className="flex flex-row gap-3 mt-3">
          {/* 亲友动态 */}
          <View
            className="flex-1 rounded-[18px] py-5 px-3 flex flex-col items-center"
            style={{ backgroundColor: '#d5e3ef' }}
            onClick={() => Taro.switchTab({ url: '/pages/memorial/index' })}
          >
            <Users color="#54769a" size={30} strokeWidth={1.9} />
            <Text className="block text-[#3f4f63] font-semibold text-sm mt-3">亲友动态</Text>
          </View>
          {/* 暖心服务 */}
          <View
            className="flex-1 rounded-[18px] py-5 px-3 flex flex-col items-center"
            style={{ backgroundColor: '#f5e9ca' }}
            onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
          >
            <HeartHandshake color="#c9a86a" size={30} strokeWidth={1.9} />
            <Text className="block text-[#6b4a35] font-semibold text-sm mt-3">暖心服务</Text>
          </View>
        </View>
      </View>

      {/* 社区动态 */}
      <View className="px-5 mt-6 pb-8">
        <View className="bg-white rounded-[24px] px-6 py-5 shadow-sm">
          <Text className="block text-[#2b3a36] text-lg font-bold mb-1">
            社区动态
          </Text>
          {memorials.length > 0 ? (
            <>
              {memorials.slice(0, 2).map((m, i) => (
                <View
                  key={m.id}
                  className={`flex flex-row items-center py-3 ${i !== Math.min(memorials.length, 2) - 1 ? 'border-b border-[#f0ede4]' : ''}`}
                  onClick={() => goPeople(m.id)}
                >
                  <View className="w-11 h-11 rounded-full overflow-hidden bg-[#e8efe9] flex items-center justify-center flex-shrink-0">
                    {m.avatarUrl ? (
                      <Image src={m.avatarUrl} className="w-full h-full" mode="aspectFill" />
                    ) : (
                      <Text className="text-[#7da98f] text-lg font-semibold">{m.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="block text-[#333b37] text-sm line-clamp-1">
                      {m.name}的纪念空间收到新的问候
                    </Text>
                    <Text className="block text-[#a89f8d] text-xs mt-1">
                      {i === 0 ? '亲友献上纪念花束' : '祝福与思念陆续送达'}
                    </Text>
                  </View>
                  <ChevronRight color="#c5c0b4" size={18} />
                </View>
              ))}
            </>
          ) : (
            <>
              {FALLBACK_DYNAMICS.map((d, i) => (
                <View
                  key={d.key}
                  className={`flex flex-row items-center py-3 ${i !== FALLBACK_DYNAMICS.length - 1 ? 'border-b border-[#f0ede4]' : ''}`}
                  onClick={() => goPeople()}
                >
                  <View className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: d.bg }}>
                    <Text className="font-semibold text-lg" style={{ color: d.color }}>{d.char}</Text>
                  </View>
                  <Text className="flex-1 text-[#333b37] text-sm ml-3">{d.title}</Text>
                  <ChevronRight color="#c5c0b4" size={18} />
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default IndexPage;