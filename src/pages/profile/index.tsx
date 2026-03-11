import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Plus, Heart, User, Pencil, ChevronRight } from 'lucide-react-taro';

interface UserProfile {
  name: string;
  avatar: string | null;
  bio: string;
}

interface Stats {
  mourningCount: number;
  visitCount: number;
}

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '访客',
    avatar: null,
    bio: '还没有简介'
  });
  const [stats, setStats] = useState<Stats>({
    mourningCount: 0,
    visitCount: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: ''
  });

  useEffect(() => {
    loadUserProfile();
    loadStats();
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

  const loadStats = () => {
    const saved = Taro.getStorageSync('userStats');
    if (saved) {
      setStats(saved);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: userProfile.name,
      bio: userProfile.bio
    });
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
      avatar: userProfile.avatar,
      bio: editForm.bio.trim() || '还没有简介'
    };

    setUserProfile(newProfile);
    Taro.setStorageSync('userProfile', newProfile);
    setIsEditing(false);
    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userProfile.name,
      bio: userProfile.bio
    });
  };

  const handleAddMemorial = () => {
    Taro.navigateTo({
      url: '/pages/profile/form'
    });
  };

  return (
    <View className="min-h-screen bg-blue-50 pb-6">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-blue-100">
        <Text className="block text-2xl font-bold text-blue-900">
          我的
        </Text>
      </View>

      {/* 名片区域 */}
      <View className="px-4 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          {isEditing ? (
            <View className="flex flex-col gap-4">
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
          ) : (
            <View className="flex items-center gap-4">
              <View className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {userProfile.avatar ? (
                  <Text className="text-xs text-slate-400">头像</Text>
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
              <View
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"
                onClick={handleEdit}
              >
                <Pencil color="#3b82f6" size={20} />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 功能入口 */}
      <View className="px-4">
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <View
            className="flex items-center justify-between px-6 py-4 border-b border-blue-50"
            onClick={handleAddMemorial}
          >
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus color="#3b82f6" size={20} />
              </View>
              <Text className="text-base text-slate-700">添加故人</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </View>
        </View>
      </View>

      {/* 统计信息 */}
      <View className="px-4 mt-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="block text-lg font-semibold text-blue-900 mb-4">
            我的统计
          </Text>
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-blue-50 rounded-xl p-4 text-center">
              <Heart color="#3b82f6" size={24} />
              <Text className="block text-2xl font-bold text-blue-500 mt-2">
                {stats.mourningCount}
              </Text>
              <Text className="block text-xs text-slate-500 mt-1">
                悼念次数
              </Text>
            </View>
            <View className="bg-blue-50 rounded-xl p-4 text-center">
              <User color="#94a3b8" size={24} />
              <Text className="block text-2xl font-bold text-slate-600 mt-2">
                {stats.visitCount}
              </Text>
              <Text className="block text-xs text-slate-500 mt-1">
                拜访次数
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;
