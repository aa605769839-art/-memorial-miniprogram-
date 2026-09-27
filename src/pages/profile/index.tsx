import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Heart, User, ChevronRight, LogIn, ShieldCheck } from 'lucide-react-taro';
import { Network } from '@/network';
import { Auth, type LoginUser } from '@/auth';

interface UserProfile {
  name: string;
  avatar: string | null;
  bio: string;
}

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '访客',
    avatar: null,
    bio: '还没有简介'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: ''
  });
  const [tempAvatar, setTempAvatar] = useState<string | null>(null); // 编辑模式下的临时头像

  // 登录相关状态
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', nickname: '' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    loadUserProfile();
    setLoginUser(Auth.getUser());
  }, []);

  const loadUserProfile = () => {
    const saved = Taro.getStorageSync('userProfile');
    if (saved) {
      setUserProfile(saved);
      setEditForm({
        name: saved.name,
        bio: saved.bio
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTempAvatar(userProfile.avatar); // 初始化临时头像
    setEditForm({
      name: userProfile.name,
      bio: userProfile.bio
    });
  };

  const handleAvatarUpload = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        Taro.showLoading({ title: '上传中...' });

        try {
          const uploadRes = await Network.uploadFile({
            url: '/api/upload',
            filePath: res.tempFilePaths[0],
            name: 'file'
          });

          const data = JSON.parse(uploadRes.data);

          if (data.code === 200 && data.data.url) {
            // 只更新临时头像，不保存到 storage
            setTempAvatar(data.data.url);
            Taro.showToast({
              title: '头像上传成功',
              icon: 'success'
            });
          } else {
            throw new Error('上传失败');
          }
        } catch (uploadError) {
          console.error('头像上传失败:', uploadError);
          Taro.showToast({
            title: '上传失败',
            icon: 'none'
          });
        } finally {
          Taro.hideLoading();
        }
      }
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  };

  const handleSave = () => {
    if (!editForm.name.trim()) {
      Taro.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    const newProfile: UserProfile = {
      name: editForm.name.trim(),
      avatar: tempAvatar, // 使用临时头像
      bio: editForm.bio.trim() || '还没有简介'
    };

    // 先保存数据
    setUserProfile(newProfile);
    Taro.setStorageSync('userProfile', newProfile);

    // 然后退出编辑模式
    setIsEditing(false);
    setTempAvatar(null); // 清空临时头像

    // 显示成功提示
    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    });
  };

  const handleCancel = () => {
    // 重新加载用户资料，恢复原来的数据
    loadUserProfile();

    // 退出编辑模式
    setIsEditing(false);
    setTempAvatar(null); // 清空临时头像
  };

  // 点击遮罩层关闭弹窗
  const handleMaskClick = (e: any) => {
    // 阻止事件冒泡，避免点击弹窗内容时关闭
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleAddMemorial = () => {
    if (!Auth.isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      setShowAuth(true);
      return;
    }
    Taro.navigateTo({
      url: '/pages/profile/memorials'
    });
  };

  // ---- 登录/注册/登出 ----
  const openLogin = () => {
    setAuthTab('login');
    setAuthForm({ username: '', password: '', nickname: '' });
    setShowAuth(true);
  };

  const handleAuthSubmit = async () => {
    if (authSubmitting) return;
    if (!authForm.username.trim() || !authForm.password) {
      Taro.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    if (authTab === 'register' && authForm.password.length < 6) {
      Taro.showToast({ title: '密码至少 6 位', icon: 'none' });
      return;
    }
    setAuthSubmitting(true);
    try {
      const isLogin = authTab === 'login';
      const res = await Network.request({
        url: isLogin ? '/api/auth/login' : '/api/auth/register',
        method: 'POST',
        data: isLogin
          ? { username: authForm.username.trim(), password: authForm.password }
          : {
              username: authForm.username.trim(),
              password: authForm.password,
              ...(authForm.nickname.trim() ? { nickname: authForm.nickname.trim() } : {})
            }
      });
      const body = res.data as any;
      if (body?.code === 200 && body?.data?.token && body?.data?.user) {
        Auth.setAuth(body.data.token, body.data.user);
        setLoginUser(body.data.user);
        setShowAuth(false);
        // 登录后同步本地昵称
        const u = body.data.user as LoginUser;
        if (u.nickname) {
          const p = { name: u.nickname, avatar: null, bio: '已登录用户' };
          Taro.setStorageSync('userProfile', p);
          setUserProfile(p);
        }
        Taro.showToast({ title: isLogin ? '登录成功' : '注册成功', icon: 'success' });
      } else {
        Taro.showToast({ title: body?.msg || (isLogin ? '登录失败' : '注册失败'), icon: 'none' });
      }
    } catch (err) {
      const msg = (err as any)?.data?.msg || '网络异常，请稍后重试';
      Taro.showToast({ title: msg, icon: 'none' });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    Auth.clear();
    setLoginUser(null);
    setConfirmLogout(false);
    Taro.showToast({ title: '已退出登录', icon: 'none' });
  };

  return (
    <View className="min-h-screen bg-[#eef3e4] pb-6">
      {/* 名片区域 */}
      <View className="px-4 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View
            className="flex items-center gap-4 cursor-pointer"
            onClick={handleEdit}
          >
            <View className="w-20 h-20 rounded-full bg-[#dbe8dd] flex items-center justify-center overflow-hidden flex-shrink-0">
              {userProfile.avatar ? (
                <Image
                  src={userProfile.avatar}
                  className="w-full h-full"
                  mode="aspectFill"
                />
              ) : (
                <User color="#94a3b8" size={40} />
              )}
            </View>
            <View className="flex-1">
              <Text className="block text-xl font-bold text-[#3f5d50] mb-1">
                {userProfile.name}
              </Text>
              <Text className="block text-sm text-slate-500 line-clamp-2">
                {userProfile.bio}
              </Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </View>
        </View>
      </View>

      {/* 编辑弹窗 */}
      {isEditing && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={handleMaskClick}
        >
          <View
            className="bg-white rounded-2xl p-6 mx-4 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="block text-lg font-bold text-[#3f5d50] mb-4 text-center">
              编辑个人信息
            </Text>
            <View className="flex flex-col gap-4">
              {/* 头像上传 */}
              <View>
                <Text className="block text-sm font-medium text-slate-700 mb-2">
                  头像
                </Text>
                <View
                  className="w-20 h-20 rounded-full bg-[#dbe8dd] flex items-center justify-center overflow-hidden mx-auto cursor-pointer"
                  onClick={handleAvatarUpload}
                >
                  {tempAvatar ? (
                    <Image
                      src={tempAvatar}
                      className="w-full h-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <User color="#94a3b8" size={40} />
                  )}
                </View>
                <Text className="block text-xs text-center text-slate-500 mt-2">
                  点击上传头像
                </Text>
              </View>
              <View>
                <Text className="block text-sm font-medium text-slate-700 mb-2">
                  姓名 *
                </Text>
                <View className="bg-[#eef3e4] rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-slate-700"
                    value={editForm.name}
                    onInput={(e) => setEditForm({ ...editForm, name: e.detail.value })}
                    placeholder="请输入姓名"
                  />
                </View>
              </View>
              <View>
                <Text className="block text-sm font-medium text-slate-700 mb-2">
                  简介
                </Text>
                <View className="bg-[#eef3e4] rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-slate-700"
                    value={editForm.bio}
                    onInput={(e) => setEditForm({ ...editForm, bio: e.detail.value })}
                    placeholder="请输入简介"
                  />
                </View>
              </View>
              <View className="flex gap-3 mt-2">
                <Button
                  className="flex-1 bg-slate-200 text-slate-700 rounded-full py-3"
                  onClick={handleCancel}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 bg-[#eef3e4]0 text-white rounded-full py-3"
                  onClick={handleSave}
                >
                  保存
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 功能入口 */}
      <View className="px-4">
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <View
            className="flex items-center justify-between px-6 py-4"
            onClick={handleAddMemorial}
          >
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-[#dbe8dd] flex items-center justify-center">
                <Heart color="#6f9b86" size={20} />
              </View>
              <Text className="text-base text-slate-700">我的故友</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </View>
        </View>
      </View>

      {/* 登录/账号区域 */}
      <View className="px-4 mt-4">
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loginUser ? (
            <View className="px-6 py-4">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-[#dbe8dd] flex items-center justify-center">
                  <ShieldCheck color="#6f9b86" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="block text-base font-bold text-slate-800">
                    {loginUser.nickname || loginUser.username}
                  </Text>
                  <Text className="block text-xs text-slate-400">
                    {loginUser.role === 'admin' ? '管理员' : '普通用户'}
                  </Text>
                </View>
                <Button
                  className="bg-slate-100 text-slate-600 rounded-full px-4 py-1 text-sm"
                  onClick={() => setConfirmLogout(true)}
                >
                  退出
                </Button>
              </View>
              {loginUser.role === 'admin' && (
                <View
                  className="flex items-center justify-between px-1 py-3 border-t border-[#eef3e4]"
                  onClick={() => Taro.navigateTo({ url: '/pages/admin/gift-configs/index' })}
                >
                  <View className="flex items-center gap-2">
                    <ShieldCheck color="#6f9b86" size={18} />
                    <Text className="text-sm text-slate-600">礼物配置管理</Text>
                  </View>
                  <ChevronRight color="#94a3b8" size={18} />
                </View>
              )}
            </View>
          ) : (
            <View className="px-6 py-4 flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-[#dbe8dd] flex items-center justify-center">
                  <LogIn color="#6f9b86" size={20} />
                </View>
                <View>
                  <Text className="block text-base font-bold text-slate-800">未登录</Text>
                  <Text className="block text-xs text-slate-400">登录后可创建与管理故友空间</Text>
                </View>
              </View>
              <Button
                className="bg-[#eef3e4]0 text-white rounded-full px-5 py-1 text-sm"
                onClick={openLogin}
              >
                登录/注册
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* 登录/注册弹窗 */}
      {showAuth && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}
        >
          <View className="bg-white rounded-2xl p-6 mx-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Text className="block text-lg font-bold text-[#3f5d50] mb-4 text-center">
              {authTab === 'login' ? '登录' : '注册'}
            </Text>
            <View className="flex gap-2 mb-4">
              <Button
                className={authTab === 'login' ? 'flex-1 bg-[#eef3e4]0 text-white rounded-full py-2' : 'flex-1 bg-slate-100 text-slate-600 rounded-full py-2'}
                onClick={() => setAuthTab('login')}
              >
                登录
              </Button>
              <Button
                className={authTab === 'register' ? 'flex-1 bg-[#eef3e4]0 text-white rounded-full py-2' : 'flex-1 bg-slate-100 text-slate-600 rounded-full py-2'}
                onClick={() => setAuthTab('register')}
              >
                注册
              </Button>
            </View>
            {authTab === 'register' && (
              <View className="mb-3">
                <Text className="block text-sm font-medium text-slate-700 mb-2">昵称</Text>
                <View className="bg-[#eef3e4] rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-slate-700"
                    value={authForm.nickname}
                    onInput={(e) => setAuthForm({ ...authForm, nickname: e.detail.value })}
                    placeholder="请输入昵称（可选）"
                  />
                </View>
              </View>
            )}
            <View className="mb-3">
              <Text className="block text-sm font-medium text-slate-700 mb-2">账号</Text>
              <View className="bg-[#eef3e4] rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-slate-700"
                  value={authForm.username}
                  onInput={(e) => setAuthForm({ ...authForm, username: e.detail.value })}
                  placeholder="3-32位字母/数字"
                />
              </View>
            </View>
            <View className="mb-4">
              <Text className="block text-sm font-medium text-slate-700 mb-2">密码</Text>
              <View className="bg-[#eef3e4] rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-slate-700"
                  password
                  value={authForm.password}
                  onInput={(e) => setAuthForm({ ...authForm, password: e.detail.value })}
                  placeholder="至少6位"
                />
              </View>
            </View>
            <Button
              className="w-full bg-[#eef3e4]0 text-white rounded-full py-3"
              onClick={handleAuthSubmit}
              loading={authSubmitting}
            >
              {authTab === 'login' ? '登录' : '注册'}
            </Button>
          </View>
        </View>
      )}

      {/* 退出确认弹窗 */}
      {confirmLogout && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmLogout(false); }}
        >
          <View className="bg-white rounded-2xl p-6 mx-4 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <Text className="block text-lg font-bold text-[#3f5d50] mb-4 text-center">确认退出登录？</Text>
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-slate-200 text-slate-700 rounded-full py-3"
                onClick={() => setConfirmLogout(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-[#eef3e4]0 text-white rounded-full py-3"
                onClick={handleLogout}
              >
                退出
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProfilePage;
