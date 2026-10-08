import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { ArrowLeft, Info, LogOut, ShieldCheck, ChevronRight } from 'lucide-react-taro';
import { Auth } from '@/auth';
import { StarsBackground } from '@/components/StarsBackground';

interface LoginUser {
  id: string;
  username: string;
  nickname?: string | null;
  role: string | number;
}

const SettingsPage = () => {
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useDidShow(() => {
    const u = Auth.getUser() as LoginUser | null;
    setLoginUser(u);
  });

  const handleLogout = () => {
    Auth.clear();
    setConfirmLogout(false);
    Taro.showToast({ title: '已退出登录', icon: 'none' });
    Taro.navigateBack();
  };

  const displayName = loginUser?.nickname || loginUser?.username || '';

  return (
    <StarsBackground dim="light">
      {/* 顶部导航 */}
      <View className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(180deg, rgba(30,72,84,0.6) 0%, rgba(18,46,58,0.35) 100%)' }}>
        <View className="flex items-center gap-3">
          <View className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} onClick={() => Taro.navigateBack()}>
            <ArrowLeft size={18} color="#fff" />
          </View>
          <Text className="text-white text-xl font-bold flex-1">设置与帮助</Text>
        </View>
      </View>

      <View className="px-4 py-4 space-y-4">
        {/* 账号信息 + 关于 */}
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
          {loginUser && (
            <View className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <View className="flex items-center gap-2">
                <ShieldCheck size={18} color="#7fc3ce" />
                <Text className="text-white text-sm font-medium">{displayName}</Text>
              </View>
              <Text className="text-white/45 text-xs">已登录 · {loginUser.username}</Text>
            </View>
          )}
          <View
            className="flex items-center justify-between px-4 py-4"
            onClick={() => Taro.showModal({ title: '关于晚星纪念', content: '晚星纪念 v1.0', showCancel: false })}
          >
            <View className="flex items-center gap-2">
              <Info size={18} color="#48A8A8" />
              <Text className="text-white text-sm font-medium">关于晚星纪念</Text>
            </View>
            <View className="flex items-center gap-1">
              <Text className="text-white/45 text-xs">v1.0</Text>
              <ChevronRight size={16} color="#8a8f94" />
            </View>
          </View>
        </View>

        {/* 退出登录 */}
        {loginUser && (
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
            <View className="flex items-center justify-between px-4 py-4" onClick={() => setConfirmLogout(true)}>
              <View className="flex items-center gap-2">
                <LogOut size={18} color="#e8c07a" />
                <Text className="text-white text-sm font-medium">退出登录</Text>
              </View>
              <ChevronRight size={16} color="#8a8f94" />
            </View>
          </View>
        )}
      </View>

      {/* 退出确认 */}
      {confirmLogout && (
        <View
          className="fixed inset-0 flex items-center justify-center px-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          onClick={() => setConfirmLogout(false)}
        >
          <View className="rounded-2xl p-5 w-full max-w-xs" style={{ backgroundColor: '#fff' }} onClick={(e) => e.stopPropagation()}>
            <Text className="block text-center text-base font-bold" style={{ color: '#2E3438' }}>退出登录</Text>
            <Text className="block text-center text-sm mt-2" style={{ color: '#8A8F94' }}>确定要退出当前账号吗？</Text>
            <View style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <View style={{ flex: 1 }}>
                <Button style={{ background: '#f1f2f4', color: '#2E3438', borderRadius: 12 }} onClick={() => setConfirmLogout(false)}>取消</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button style={{ background: 'linear-gradient(150deg,#c9a86a,#a9872f)', color: '#fff', borderRadius: 12 }} onClick={handleLogout}>退出</Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </StarsBackground>
  );
};

export default SettingsPage;