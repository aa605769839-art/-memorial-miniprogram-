import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Heart, User, ChevronRight } from 'lucide-react-taro';
import { Network } from '@/network';

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

  useEffect(() => {
    loadUserProfile();
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
    Taro.navigateTo({
      url: '/pages/profile/memorials'
    });
  };

  return (
    <View className="min-h-screen bg-blue-50 pb-6">
      {/* 名片区域 */}
      <View className="px-4 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View
            className="flex items-center gap-4 cursor-pointer"
            onClick={handleEdit}
          >
            <View className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <Text className="block text-xl font-bold text-blue-900 mb-1">
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
            <Text className="block text-lg font-bold text-blue-900 mb-4 text-center">
              编辑个人信息
            </Text>
            <View className="flex flex-col gap-4">
              {/* 头像上传 */}
              <View>
                <Text className="block text-sm font-medium text-slate-700 mb-2">
                  头像
                </Text>
                <View
                  className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mx-auto cursor-pointer"
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
                <View className="bg-blue-50 rounded-xl px-4 py-3">
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
                <View className="bg-blue-50 rounded-xl px-4 py-3">
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
                  className="flex-1 bg-blue-500 text-white rounded-full py-3"
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
            className="flex items-center justify-between px-6 py-4 border-b border-blue-50"
            onClick={handleAddMemorial}
          >
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Heart color="#3b82f6" size={20} />
              </View>
              <Text className="text-base text-slate-700">我的故友</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </View>
          <View
            className="flex items-center justify-between px-6 py-4"
            onClick={() => Taro.navigateTo({ url: '/pages/admin/gift-configs/index' })}
          >
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Text className="text-xl">🎁</Text>
              </View>
              <Text className="text-base text-slate-700">礼物配置</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;
