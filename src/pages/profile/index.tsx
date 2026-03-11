import { View, Text, Image, Input, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { Network } from '@/network';
import { Plus, Camera, Heart, User } from 'lucide-react-taro';

interface NewMemorial {
  name: string;
  birthDate: string;
  deathDate: string;
  description: string;
  achievements: string;
}

const ProfilePage = () => {
  const [formData, setFormData] = useState<NewMemorial>({
    name: '',
    birthDate: '',
    deathDate: '',
    description: '',
    achievements: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof NewMemorial, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAvatar = async () => {
    if (!formData.name) {
      Taro.showToast({
        title: '请先输入姓名',
        icon: 'none'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a beautiful, heartwarming cartoon-style portrait of ${formData.name}. ${formData.description ? `Personality and life story: ${formData.description}.` : ''} ${formData.achievements ? `Life achievements and legacy: ${formData.achievements}.` : ''} Style: gentle and kind expression, warm smile, loving eyes, soft and detailed cartoon art style, based on their life story and personality, peaceful and serene atmosphere, soft blue tones mixed with warm colors, professional cartoon illustration, clean lines, soft shadows, high quality, like a memorial portrait that captures their essence. 2K resolution.`;

      const res = await Network.request({
        url: '/api/generate-avatar',
        method: 'POST',
        data: { prompt }
      });

      if (res.data?.code === 200) {
        setAvatarUrl(res.data.data);
        Taro.showToast({
          title: '头像生成成功',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      Taro.showToast({
        title: '头像生成失败',
        icon: 'none'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Taro.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!formData.birthDate || !formData.deathDate) {
      Taro.showToast({
        title: '请输入生卒日期',
        icon: 'none'
      });
      return;
    }

    try {
      const achievements = formData.achievements
        ? formData.achievements.split(/[,，、]/).map(a => a.trim()).filter(Boolean)
        : null;

      const res = await Network.request({
        url: '/api/memorials',
        method: 'POST',
        data: {
          name: formData.name,
          birthDate: new Date(formData.birthDate).toISOString(),
          deathDate: new Date(formData.deathDate).toISOString(),
          description: formData.description || null,
          achievements,
          avatarUrl
        }
      });

      if (res.data?.code === 200) {
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        });

        // 重置表单
        setFormData({
          name: '',
          birthDate: '',
          deathDate: '',
          description: '',
          achievements: ''
        });
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Failed to create memorial:', error);
      Taro.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  };

  return (
    <View className="min-h-screen bg-blue-50 pb-6">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-blue-100">
        <Text className="block text-2xl font-bold text-blue-900">
          我的
        </Text>
      </View>

      {/* 添加故人表单 */}
      <View className="px-4 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="block text-lg font-semibold text-blue-900 mb-6">
            添加故人
          </Text>

          {/* 头像预览 */}
          <View className="flex flex-col items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mb-3">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  className="w-full h-full"
                  mode="aspectFill"
                />
              ) : (
                <User color="#94a3b8" size={48} />
              )}
            </View>
            <Button
              className="bg-blue-100 text-blue-600 rounded-full px-4 py-2 flex items-center gap-2"
              size="mini"
              onClick={generateAvatar}
              disabled={isGenerating}
            >
              <Camera size={14} />
              <Text className="text-sm">
                {isGenerating ? '生成中...' : '生成头像'}
              </Text>
            </Button>
            <Text className="block text-xs text-slate-400 mt-2">
              根据信息生成卡通头像
            </Text>
          </View>

          {/* 表单字段 */}
          <View className="flex flex-col gap-4">
            {/* 姓名 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-2">
                姓名 *
              </Text>
              <View className="bg-blue-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-slate-700 placeholder-slate-400"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onInput={(e) => handleInputChange('name', e.detail.value)}
                />
              </View>
            </View>

            {/* 出生日期 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-2">
                出生日期 *
              </Text>
              <View className="bg-blue-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-slate-700 placeholder-slate-400"
                  // @ts-expect-error Taro Input type 'date' is valid but not in type definition
                  type="date"
                  value={formData.birthDate}
                  onInput={(e) => handleInputChange('birthDate', e.detail.value)}
                />
              </View>
            </View>

            {/* 去世日期 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-2">
                去世日期 *
              </Text>
              <View className="bg-blue-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-slate-700 placeholder-slate-400"
                  // @ts-expect-error Taro Input type 'date' is valid but not in type definition
                  type="date"
                  value={formData.deathDate}
                  onInput={(e) => handleInputChange('deathDate', e.detail.value)}
                />
              </View>
            </View>

            {/* 简介 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-2">
                简介
              </Text>
              <View className="bg-blue-50 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                  placeholder="请输入简介..."
                  value={formData.description}
                  onInput={(e) => handleInputChange('description', e.detail.value)}
                  maxlength={200}
                />
                <Text className="block text-xs text-slate-400 mt-1 text-right">
                  {formData.description.length}/200
                </Text>
              </View>
            </View>

            {/* 主要成就 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-2">
                主要成就
              </Text>
              <View className="bg-blue-50 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                  placeholder="请输入主要成就，用逗号分隔..."
                  value={formData.achievements}
                  onInput={(e) => handleInputChange('achievements', e.detail.value)}
                  maxlength={300}
                />
                <Text className="block text-xs text-slate-400 mt-1 text-right">
                  {formData.achievements.length}/300
                </Text>
              </View>
            </View>

            {/* 提交按钮 */}
            <Button
              className="bg-blue-500 text-white rounded-full py-3 shadow-md mt-2"
              onClick={handleSubmit}
            >
              <View className="flex items-center gap-2 justify-center">
                <Plus size={18} />
                <Text>添加故人</Text>
              </View>
            </Button>
          </View>
        </View>

        {/* 统计信息 */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <Text className="block text-lg font-semibold text-blue-900 mb-4">
            我的统计
          </Text>
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-blue-50 rounded-xl p-4 text-center">
              <Heart color="#3b82f6" size={24} />
              <Text className="block text-2xl font-bold text-blue-500 mt-2">
                0
              </Text>
              <Text className="block text-xs text-slate-500 mt-1">
                悼念次数
              </Text>
            </View>
            <View className="bg-blue-50 rounded-xl p-4 text-center">
              <User color="#94a3b8" size={24} />
              <Text className="block text-2xl font-bold text-slate-600 mt-2">
                0
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
