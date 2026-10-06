import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Cake, Flower2, Sparkles } from 'lucide-react-taro';
import { Network } from '@/network';
import { Auth } from '@/auth';
import { StarsBackground } from '@/components/StarsBackground';

interface MemorialLite {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
}

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const CalendarPage = () => {
  const [memorials, setMemorials] = useState<MemorialLite[]>([]);
  const [year, setYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  const [month, setMonth] = useState(() => {
    return new Date().getMonth() + 1;
  });
  const [todayStr, setTodayStr] = useState('');

  useDidShow(() => {
    const now = new Date();
    setTodayStr(toDateKey(now));
    loadMemorials();
  });

  const loadMemorials = async () => {
    try {
      // 优先拉取我创建的故人；公开故人列表也可用
      let res: any = await Network.request({ url: '/api/memorials/my', method: 'GET', header: Auth.headers() });
      let list = res.data?.data || [];
      if (!list.length) {
        res = await Network.request({ url: '/api/memorials', method: 'GET' });
        list = res.data?.data || [];
      }
      const mapped = list.map((m: any) => ({
        id: m.id,
        name: m.name,
        birth_date: m.birth_date || m.birthDate || null,
        death_date: m.death_date || m.deathDate || null,
      }));
      setMemorials(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  const toDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

  const changeMonth = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setYear(y);
    setMonth(m);
  };

  // 该月内每个故人的纪念日
  const monthlyEvents = (y: number, m: number) => {
    const events: { date: string; type: string; memorial: MemorialLite; diff: number }[] = [];
    memorials.forEach((mem) => {
      const pushIf = (dateStr: string | null, type: string) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        const ey = d.getFullYear();
        // 当年该月纪念日：取本年
        const dateKey = keyOf(y, m, d.getDate());
        // 判断该月是否有效（避免2月30等）
        const check = new Date(y, m, 0);
        if (check.getDate() >= d.getDate()) {
          events.push({ date: dateKey, type, memorial: mem, diff: y - ey });
        }
      };
      pushIf(mem.death_date, '忌日');
      pushIf(mem.birth_date, '生辰');
    });
    return events;
  };

  const events = monthlyEvents(year, month);
  const eventByDate: Record<string, { type: string; memorial: MemorialLite; diff: number; name: string }[]> = {};
  events.forEach((ev) => {
    if (!eventByDate[ev.date]) eventByDate[ev.date] = [];
    eventByDate[ev.date].push({ ...ev, name: ev.memorial.name });
  });

  // 构建日历网格
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <StarsBackground dim="light">
      <View className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(180deg, rgba(30,72,84,0.6) 0%, rgba(18,46,58,0.35) 100%)' }}>
        <View className="flex items-center gap-3 mb-4">
          <View className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} onClick={() => Taro.navigateBack()}>
            <ArrowLeft size={18} color="#fff" />
          </View>
          <Text className="text-white text-xl font-bold">纪念日历</Text>
        </View>
        {/* 月份切换 */}
        <View className="flex items-center justify-between">
          <View className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} onClick={() => changeMonth(-1)}>
            <ChevronLeft size={18} color="#fff" />
          </View>
          <Text className="text-white text-lg font-semibold">{year} 年 {month} 月</Text>
          <View className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} onClick={() => changeMonth(1)}>
            <ChevronRight size={18} color="#fff" />
          </View>
        </View>
      </View>

      <View className="px-4 py-4">
        <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
          {/* 星期头 */}
          <View className="flex mb-2">
            {WEEK_LABELS.map((w, i) => (
              <View key={i} className="flex-1 text-center">
                <Text className="text-xs text-white/50">{w}</Text>
              </View>
            ))}
          </View>
          {/* 日期网格 */}
          <View className="flex flex-wrap">
            {cells.map((d, i) => {
              if (d === null) return <View key={i} className="w-[14.28%] py-2" />;
              const dateKey = keyOf(year, month, d);
              const evs = eventByDate[dateKey] || [];
              const isToday = dateKey === todayStr;
              return (
                <View key={i} className="w-[14.28%] py-1.5 flex flex-col items-center gap-1">
                  <View
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isToday ? '#e8c07a' : evs.length ? 'rgba(232,192,122,0.25)' : 'transparent',
                      border: isToday ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text className="text-sm" style={{ color: isToday ? '#2e1f0f' : '#fff' }}>{d}</Text>
                  </View>
                  <View className="flex gap-0.5 h-1.5">
                    {evs.slice(0, 3).map((ev, ei) => (
                      <Text key={ei} className="text-[8px] leading-none" style={{ color: ev.type === '忌日' ? '#e8c07a' : '#7fc3ce' }}>
                        {ev.type === '忌日' ? '×' : '·'}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 本月纪念日列表 */}
        <View className="rounded-2xl mt-4 p-4" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
          <View className="flex items-center gap-2 mb-3">
            <Sparkles size={17} color="#e8c07a" />
            <Text className="text-white font-semibold text-base">本月纪念日</Text>
          </View>
          {events.length === 0 ? (
            <Text className="block text-sm text-white/50 py-4 text-center">本月暂无生辰或忌日</Text>
          ) : (
            events.map((ev, i) => (
              <View key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ev.type === '忌日' ? 'rgba(232,192,122,0.2)' : 'rgba(127,195,206,0.2)' }}>
                  {ev.type === '忌日' ? <Flower2 size={18} color="#e8c07a" /> : <Cake size={18} color="#7fc3ce" />}
                </View>
                <View className="flex-1">
                  <View className="flex items-center gap-2">
                    <Text className="text-white font-medium text-sm">{ev.memorial.name}</Text>
                    <Text className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: ev.type === '忌日' ? '#e8c07a' : '#7fc3ce' }}>
                      {ev.type}
                    </Text>
                  </View>
                  <Text className="block text-xs text-white/40 mt-0.5">
                    {keyOf(year, month, +ev.date.slice(8))} {ev.diff === 0 ? '' : ev.diff > 0 ? `（辞世 ${ev.diff} 周年）` : `（诞辰 ${-ev.diff} 周年）`}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </StarsBackground>
  );
};

export default CalendarPage;