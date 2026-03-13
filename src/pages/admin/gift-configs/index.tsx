import { View, Text, Button, Input, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown } from 'lucide-react-taro';

interface GiftConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isEnabled: boolean;
}

const COLORS = [
  { value: 'text-pink-500', label: '粉色', bg: 'bg-pink-500' },
  { value: 'text-red-500', label: '红色', bg: 'bg-red-500' },
  { value: 'text-orange-400', label: '橙色', bg: 'bg-orange-400' },
  { value: 'text-yellow-500', label: '黄色', bg: 'bg-yellow-500' },
  { value: 'text-green-500', label: '绿色', bg: 'bg-green-500' },
  { value: 'text-blue-500', label: '蓝色', bg: 'bg-blue-500' },
  { value: 'text-purple-500', label: '紫色', bg: 'bg-purple-500' },
];

const GiftConfigPage = () => {
  const [giftConfigs, setGiftConfigs] = useState<GiftConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: 'text-pink-500',
    isEnabled: true,
  });

  // 调试信息
  console.log('[GiftConfig] 组件初始化');

  useEffect(() => {
    console.log('[GiftConfig] useEffect 执行');
    loadGiftConfigs();
  }, []);

  // 页面显示时重新加载数据（从其他页面返回时）
  useDidShow(() => {
    loadGiftConfigs();
  });

  const loadGiftConfigs = async () => {
    setLoading(true);
    try {
      const res = await Network.request({
        url: '/api/gift-configs',
        method: 'GET',
      });
      if (res.data?.code === 200) {
        setGiftConfigs(res.data.data || []);
      }
    } catch (error) {
      console.error('加载礼物配置失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', icon: '', color: 'text-pink-500', isEnabled: true });
    setShowModal(true);
  };

  const handleEdit = (config: GiftConfig) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      icon: config.icon,
      color: config.color,
      isEnabled: config.isEnabled,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/gift-configs/${id}`,
              method: 'DELETE',
            });
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadGiftConfigs();
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.icon) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    try {
      if (editingId) {
        await Network.request({
          url: `/api/gift-configs/${editingId}`,
          method: 'PUT',
          data: formData,
        });
      } else {
        await Network.request({
          url: '/api/gift-configs',
          method: 'POST',
          data: { ...formData, sortOrder: giftConfigs.length },
        });
      }
      Taro.showToast({ title: '保存成功', icon: 'success' });
      setShowModal(false);
      loadGiftConfigs();
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === giftConfigs.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = giftConfigs[index];
    const targetItem = giftConfigs[newIndex];

    try {
      await Network.request({
        url: `/api/gift-configs/${currentItem.id}/sort`,
        method: 'PUT',
        data: { sortOrder: targetItem.sortOrder },
      });
      await Network.request({
        url: `/api/gift-configs/${targetItem.id}/sort`,
        method: 'PUT',
        data: { sortOrder: currentItem.sortOrder },
      });
      loadGiftConfigs();
    } catch (error) {
      Taro.showToast({ title: '排序失败', icon: 'none' });
    }
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">礼物配置管理</Text>
            <Text className="text-sm text-gray-500 mt-1">共 {giftConfigs.length} 个礼物</Text>
          </View>
          <Button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
            onClick={handleAdd}
          >
            <View className="flex items-center gap-1">
              <Plus size={16} />
              <Text>新增礼物</Text>
            </View>
          </Button>
        </View>
      </View>

      {/* 礼物列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : giftConfigs.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="text-gray-400">暂无礼物配置</Text>
            <Text className="text-gray-400 text-sm mt-2">点击右上角按钮添加</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {giftConfigs.map((config, index) => (
              <View
                key={config.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-3">
                    <Text className="text-3xl">{config.icon}</Text>
                    <View>
                      <Text className="text-base font-semibold text-gray-900">
                        {config.name}
                      </Text>
                      <View className="flex items-center gap-2 mt-1">
                        <View className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                        <Text className="text-xs text-gray-500">
                          {config.isEnabled ? '已启用' : '已禁用'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex items-center gap-2">
                    <View
                      className="p-2 cursor-pointer"
                      onClick={() => handleMove(index, 'up')}
                      style={{ opacity: index === 0 ? 0.3 : 1 }}
                    >
                      <ArrowUp size={18} color="#6b7280" />
                    </View>
                    <View
                      className="p-2 cursor-pointer"
                      onClick={() => handleMove(index, 'down')}
                      style={{ opacity: index === giftConfigs.length - 1 ? 0.3 : 1 }}
                    >
                      <ArrowDown size={18} color="#6b7280" />
                    </View>
                    <View
                      className="p-2 cursor-pointer"
                      onClick={() => handleEdit(config)}
                    >
                      <Pencil size={18} color="#3b82f6" />
                    </View>
                    <View
                      className="p-2 cursor-pointer"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 弹窗 */}
      {showModal && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowModal(false)}
        >
          <View
            className="bg-white rounded-2xl w-11/12 max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? '编辑礼物' : '新增礼物'}
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-2">礼物名称</Text>
                <Input
                  className="w-full bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="如：鲜花、蜡烛"
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2">图标（Emoji）</Text>
                <Input
                  className="w-full bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="如：🌸、🕯️"
                  value={formData.icon}
                  onInput={(e) => setFormData({ ...formData, icon: e.detail.value })}
                />
                <Text className="text-xs text-gray-400 mt-1">建议使用 Emoji 表情</Text>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2">颜色</Text>
                <View className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <View
                      key={color.value}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                        formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.bg.replace('bg-', '') }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                    />
                  ))}
                </View>
              </View>

              <View className="flex items-center justify-between">
                <Text className="text-sm text-gray-600">启用状态</Text>
                <Switch
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.detail.value })}
                />
              </View>
            </View>

            <View className="flex gap-3 mt-6">
              <Button
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg"
                onClick={handleSubmit}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default GiftConfigPage;
