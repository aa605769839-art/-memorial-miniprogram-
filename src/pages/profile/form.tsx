import { View, Text, Image, Button, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { Network } from '@/network';
import { Camera, User } from 'lucide-react-taro';

interface NewMemorial {
  name: string;
  birthDate: string;
  deathDate: string;
  description: string;
  achievements: string;
}

const FormPage = () => {
  const [formData, setFormData] = useState<NewMemorial>({
    name: '',
    birthDate: '',
    deathDate: '',
    description: '',
    achievements: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof NewMemorial, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAvatar = async (): Promise<string | null> => {
    if (!formData.name) {
      Taro.showToast({
        title: '请先输入姓名',
        icon: 'none'
      });
      return null;
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
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      Taro.showToast({
        title: '头像生成失败',
        icon: 'none'
      });
      return null;
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

    setIsSaving(true);
    try {
      // 如果没有头像，先生成头像
      let finalAvatarUrl = avatarUrl;
      if (!finalAvatarUrl) {
        Taro.showLoading({
          title: '正在生成头像...',
          mask: true
        });
        finalAvatarUrl = await generateAvatar();
        Taro.hideLoading();
        
        if (!finalAvatarUrl) {
          Taro.showToast({
            title: '头像生成失败，请重试',
            icon: 'none'
          });
          setIsSaving(false);
          return;
        }
      }

      // 获取或生成用户ID
      let userId = Taro.getStorageSync('userId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        Taro.setStorageSync('userId', userId);
      }

      const achievements = formData.achievements
        ? formData.achievements.split(/[,，、]/).map(a => a.trim()).filter(Boolean)
        : null;

      const res = await Network.request({
        url: '/api/memorials',
        method: 'POST',
        data: {
          userId,
          name: formData.name,
          birthDate: new Date(formData.birthDate).toISOString(),
          deathDate: new Date(formData.deathDate).toISOString(),
          description: formData.description || null,
          achievements,
          avatarUrl: finalAvatarUrl
        }
      });

      if (res.data?.code === 200) {
        Taro.showToast({
          title: '保存成功',
          icon: 'success'
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create memorial:', error);
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="min-h-screen bg-blue-50 pb-6">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-blue-100">
        <Text className="block text-2xl font-bold text-blue-900">
          添加故人
        </Text>
      </View>

      {/* 表单 */}
      <View className="px-4 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          {/* 头像预览 */}
          <View className="flex flex-col items-center mb-6">
            <View className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden mb-4 shadow-sm border border-blue-200">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  className="w-full h-full"
                  mode="aspectFill"
                />
              ) : (
                <View className="flex flex-col items-center gap-2">
                  <User color="#94a3b8" size={64} />
                  <Text className="text-sm text-slate-400">暂无头像</Text>
                </View>
              )}
            </View>
            <Button
              className="bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-full px-6 py-2.5 shadow-md flex items-center gap-2"
              size="mini"
              onClick={generateAvatar}
              disabled={isGenerating}
            >
              <Camera size={16} color={isGenerating ? '#fff' : '#fff'} />
              <Text className="text-sm font-medium">
                {isGenerating ? '生成中...' : 'AI 生成头像'}
              </Text>
            </Button>
            <Text className="block text-xs text-slate-400 mt-2 text-center">
              根据姓名、简介和成就自动生成卡通头像
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
              disabled={isSaving}
            >
              <Text>{isSaving ? '保存中...' : '保存故人'}</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FormPage;
