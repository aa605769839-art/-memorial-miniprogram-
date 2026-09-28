import { View, Text, Button, Input, Switch, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, X } from 'lucide-react-taro';
import { Network } from '@/network';
import { Auth } from '@/auth';
import { StarsBackground } from '@/components/StarsBackground';

// 从本地存储获取 API 基础地址
const getApiBase = (): string => {
  if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
    const savedBase = Taro.getStorageSync('admin_api_base');
    if (savedBase) return savedBase;
    return '';
  }
  return '';
};

// 校验管理员登录态
const requireAdmin = (): boolean => {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    Taro.showToast({ title: '请使用管理员账号登录', icon: 'none' });
    setTimeout(() => Taro.navigateTo({ url: '/pages/profile/index' }), 800);
    return false;
  }
  return true;
};

// API 请求封装（自动携带鉴权头；非 GET 写操作需管理员）
const apiRequest = async (options: any) => {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' && !requireAdmin()) {
    const err: any = new Error('无管理员权限');
    err.unauthorized = true;
    throw err;
  }
  const apiBase = getApiBase();
  const url = options.url.startsWith('/api') 
    ? `${apiBase}${options.url}`
    : options.url;
  
  console.log('[API Request]', url);
  
  try {
    const res = await Network.request({ ...options, url, header: { ...(options.header || {}), ...Auth.headers() } });
    return res;
  } catch (err) {
    console.error('[API Error]', err);
    throw err;
  }
};

// 判断是否为图片URL
const isImageUrl = (icon: string | null | undefined): boolean => {
  if (!icon) return false;
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('//');
};

// 礼物图标组件
const GiftIconDisplay = ({ icon, size = 'normal' }: { icon: string | null | undefined; size?: 'small' | 'normal' | 'large' }) => {
  const sizeClass = size === 'large' ? 'w-16 h-16' : size === 'small' ? 'w-6 h-6' : 'w-10 h-10';
  const textSize = size === 'large' ? 'text-5xl' : size === 'small' ? 'text-lg' : 'text-3xl';
  
  if (isImageUrl(icon)) {
    return <Image src={icon!} className={`${sizeClass} object-contain`} mode="aspectFit" />;
  }
  return <Text className={`${textSize}`}>{icon || '🎁'}</Text>;
};

interface GiftConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  price: number;
  sortOrder: number;
  isEnabled: boolean;
}

interface GiftLog {
  id: string;
  memorial_id: string;
  memorial_name: string;
  gift_type: string;
  gift_name: string;
  gift_icon: string;
  sender_name: string;
  sender_avatar: string | null;
  message: string | null;
  created_at: string;
}

const COLORS = [
  { value: 'text-pink-500', label: '粉色', bg: 'bg-pink-500' },
  { value: 'text-red-500', label: '红色', bg: 'bg-red-500' },
  { value: 'text-orange-400', label: '橙色', bg: 'bg-orange-400' },
  { value: 'text-yellow-500', label: '黄色', bg: 'bg-yellow-500' },
  { value: 'text-green-500', label: '绿色', bg: 'bg-green-500' },
  { value: 'text-[#6f9b86]', label: '蓝色', bg: 'bg-[#6f9b86]' },
  { value: 'text-purple-500', label: '紫色', bg: 'bg-purple-500' },
];

// 预设 Emoji 礼物
const PRESET_EMOJIS = ['🌸', '🕯️', '🌹', '🌻', '🌷', '💐', '🕊️', '🦋', '⭐', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍'];

const GiftConfigPage = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');
  const [giftConfigs, setGiftConfigs] = useState<GiftConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [giftLogs, setGiftLogs] = useState<GiftLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string>('');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  
  const [apiBase, setApiBase] = useState<string>('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 图标类型：emoji 或 image
  const [iconType, setIconType] = useState<'emoji' | 'image'>('emoji');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: 'text-pink-500',
    price: 0,
    isEnabled: true,
  });

  useEffect(() => {
    const saved = Taro.getStorageSync('admin_api_base');
    if (saved === undefined || saved === null) {
      setApiBase('');
      setShowApiConfig(true);
    } else {
      setApiBase(saved);
      loadGiftConfigs();
    }
  }, []);

  const loadGiftConfigs = async () => {
    console.log('[GiftConfig] 开始加载礼物配置, apiBase:', apiBase);
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest({
        url: '/api/gift-configs',
        method: 'GET',
        timeout: 10000,
      });
      console.log('[GiftConfig] API 响应:', res.data);
      if (res.data?.code === 200) {
        setGiftConfigs(res.data.data || []);
      } else {
        setError(res.data?.msg || '加载失败');
      }
    } catch (err: any) {
      console.error('[GiftConfig] 加载失败:', err);
      setError('请求失败: ' + (err?.message || '未知错误'));
      if (err?.message?.includes('fail') || err?.message?.includes('timeout')) {
        setShowApiConfig(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGiftLogs = async (page: number = 1) => {
    console.log('[GiftLogs] 开始加载, page:', page);
    setLogsLoading(true);
    setLogsError('');
    try {
      const res = await apiRequest({
        url: `/api/gifts?page=${page}&limit=20`,
        method: 'GET',
        timeout: 10000,
      });
      if (res.data?.code === 200) {
        setGiftLogs(res.data.data?.data || []);
        setLogsTotal(res.data.data?.pagination?.total || 0);
      } else {
        setLogsError(res.data?.msg || '加载失败');
      }
    } catch (err: any) {
      setLogsError('请求失败: ' + (err?.message || '未知错误'));
    } finally {
      setLogsLoading(false);
    }
  };

  const handleTabChange = (tab: 'config' | 'logs') => {
    setActiveTab(tab);
    if (tab === 'logs' && giftLogs.length === 0) {
      loadGiftLogs(1);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setIconType('emoji');
    setFormData({
      name: '',
      icon: '',
      color: 'text-pink-500',
      price: 0,
      isEnabled: true,
    });
    setShowModal(true);
  };

  const handleEdit = (config: GiftConfig) => {
    setEditingId(config.id);
    // 根据现有 icon 判断类型
    setIconType(isImageUrl(config.icon) ? 'image' : 'emoji');
    setFormData({
      name: config.name,
      icon: config.icon,
      color: config.color,
      price: config.price,
      isEnabled: config.isEnabled,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个礼物配置吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await apiRequest({
              url: `/api/gift-configs/${id}`,
              method: 'DELETE',
            });
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadGiftConfigs();
          } catch (_err) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleUploadImage = async () => {
    try {
      setUploading(true);
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempFilePath = res.tempFilePaths[0];
        
        // 上传图片
        const baseUrl = getApiBase();
        const uploadRes = await Network.uploadFile({
          url: `${baseUrl}/api/upload`,
          filePath: tempFilePath,
          name: 'file',
        });

        const data = JSON.parse(uploadRes.data);
        if (data.code === 200 && data.data?.url) {
          setFormData({ ...formData, icon: data.data.url });
          Taro.showToast({ title: '上传成功', icon: 'success' });
        } else {
          throw new Error(data.msg || '上传失败');
        }
      }
    } catch (err: any) {
      console.error('上传失败:', err);
      Taro.showToast({ title: err?.message || '上传失败', icon: 'none' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入礼物名称', icon: 'none' });
      return;
    }
    if (!formData.icon.trim()) {
      Taro.showToast({ title: iconType === 'emoji' ? '请选择或输入图标' : '请上传图片', icon: 'none' });
      return;
    }

    try {
      if (editingId) {
        await apiRequest({
          url: `/api/gift-configs/${editingId}`,
          method: 'PUT',
          data: formData,
        });
      } else {
        await apiRequest({
          url: '/api/gift-configs',
          method: 'POST',
          data: formData,
        });
      }
      Taro.showToast({ title: '保存成功', icon: 'success' });
      setShowModal(false);
      loadGiftConfigs();
    } catch (_err) {
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
      await apiRequest({
        url: `/api/gift-configs/${currentItem.id}/sort`,
        method: 'PUT',
        data: { sortOrder: targetItem.sortOrder },
      });
      await apiRequest({
        url: `/api/gift-configs/${targetItem.id}/sort`,
        method: 'PUT',
        data: { sortOrder: currentItem.sortOrder },
      });
      loadGiftConfigs();
    } catch (_err) {
      Taro.showToast({ title: '排序失败', icon: 'none' });
    }
  };

  return (
    <StarsBackground dim="light">
      {/* API 配置弹窗 */}
      {showApiConfig && (
        <View className="bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
          <View className="rounded-2xl mx-6 w-full max-w-sm p-6" style={{ backgroundColor: 'rgba(18,42,53,0.96)', border: '1px solid rgba(232,192,122,0.35)' }}>
            <Text className="text-lg font-bold mb-4 block text-white">配置后端地址</Text>
            <Text className="text-sm mb-4 block text-white/60">请输入后端 API 地址</Text>
            <View className="bg-white/10 rounded-lg mb-4 px-4">
              <Input
                className="w-full bg-transparent py-3 text-white"
                placeholder="https://your-api.com"
                value={apiBase}
                onInput={(e) => setApiBase(e.detail.value)}
              />
            </View>
            <View className="flex gap-3">
              <Button className="flex-1 py-3 rounded-lg text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} onClick={() => setShowApiConfig(false)}>
                取消
              </Button>
              <Button
                className="flex-1 py-3 rounded-lg text-[#2e1f0f]"
                style={{ backgroundColor: '#e8c07a' }}
                onClick={() => {
                  Taro.setStorageSync('admin_api_base', apiBase);
                  setShowApiConfig(false);
                  loadGiftConfigs();
                }}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 头部 */}
      <View className="px-4 pt-14 pb-4" style={{ backgroundColor: 'rgba(10,26,34,0.55)', borderBottom: '1px solid rgba(232,192,122,0.25)' }}>
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="text-xl font-bold block text-white">礼物管理中台</Text>
            <Text className="text-sm mt-1 block text-white/55">
              {activeTab === 'config' ? `共 ${giftConfigs.length} 个礼物` : `共 ${logsTotal} 条记录`}
            </Text>
          </View>
          <View className="flex gap-2">
            {activeTab === 'config' && (
              <Button className="px-4 py-2 rounded-lg text-sm text-[#2e1f0f]" style={{ backgroundColor: '#e8c07a' }} onClick={handleAdd}>
                <View className="flex items-center gap-1">
                  <Plus size={16} />
                  <Text>新增</Text>
                </View>
              </Button>
            )}
          </View>
        </View>
        
        {/* 标签页 */}
        <View className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <View
            className={`flex-1 py-3 text-center cursor-pointer ${activeTab === 'config' ? 'font-medium' : ''}`}
            style={{ borderBottom: activeTab === 'config' ? '2px solid #e8c07a' : '2px solid transparent', color: activeTab === 'config' ? '#e8c07a' : 'rgba(255,255,255,0.55)' }}
            onClick={() => handleTabChange('config')}
          >
            <Text>礼物配置</Text>
          </View>
          <View
            className={`flex-1 py-3 text-center cursor-pointer ${activeTab === 'logs' ? 'font-medium' : ''}`}
            style={{ borderBottom: activeTab === 'logs' ? '2px solid #e8c07a' : '2px solid transparent', color: activeTab === 'logs' ? '#e8c07a' : 'rgba(255,255,255,0.55)' }}
            onClick={() => handleTabChange('logs')}
          >
            <Text>赠送日志</Text>
          </View>
        </View>
      </View>

      {/* 内容区域 */}
      {activeTab === 'config' ? (
        <View className="p-4">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-12">
              <View className="w-8 h-8 rounded-full animate-spin mb-4" style={{ border: '2px solid rgba(232,192,122,0.3)', borderTopColor: '#e8c07a' }} />
              <Text className="block text-white/55">加载中...</Text>
            </View>
          ) : error ? (
            <View className="flex flex-col items-center justify-center py-12 px-6">
              <Text className="mb-2 text-center block text-[#fca5a5]">{error}</Text>
              <View className="flex gap-3">
                <Button className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} onClick={() => setShowApiConfig(true)}>
                  配置地址
                </Button>
                <Button className="px-4 py-2 rounded-lg text-sm text-[#2e1f0f]" style={{ backgroundColor: '#e8c07a' }} onClick={loadGiftConfigs}>
                  重新加载
                </Button>
              </View>
            </View>
          ) : giftConfigs.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-12">
              <Text className="block text-white/45">暂无礼物配置</Text>
              <Text className="mt-2 text-sm block text-white/40">点击右上角按钮添加</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {giftConfigs.map((config, index) => (
                <View key={config.id} className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(18,42,53,0.7)', borderColor: 'rgba(232,192,122,0.22)' }}>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-3">
                      <View className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/8">
                        <GiftIconDisplay icon={config.icon} size="normal" />
                      </View>
                      <View>
                        <Text className="text-base font-semibold text-white block">{config.name}</Text>
                        <View className="flex items-center gap-2 mt-1">
                          <View className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                          <Text className="text-xs text-white/55 block">{config.isEnabled ? '已启用' : '已禁用'}</Text>
                          <Text className="text-xs text-[#fbbf24] font-medium block">{config.price || 0}积分</Text>
                          {isImageUrl(config.icon) && <Text className="text-xs text-[#7fc3ce] block">图片</Text>}
                        </View>
                      </View>
                    </View>
                    <View className="flex items-center gap-1">
                      <View className="p-2" onClick={() => handleMove(index, 'up')} style={{ opacity: index === 0 ? 0.3 : 1 }}>
                        <ArrowUp size={18} color="#cbd5e1" />
                      </View>
                      <View className="p-2" onClick={() => handleMove(index, 'down')} style={{ opacity: index === giftConfigs.length - 1 ? 0.3 : 1 }}>
                        <ArrowDown size={18} color="#cbd5e1" />
                      </View>
                      <View className="p-2" onClick={() => handleEdit(config)}>
                        <Pencil size={18} color="#7fc3ce" />
                      </View>
                      <View className="p-2" onClick={() => handleDelete(config.id)}>
                        <Trash2 size={18} color="#fca5a5" />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="p-4">
          {logsLoading ? (
            <View className="flex flex-col items-center justify-center py-12">
              <View className="w-8 h-8 rounded-full animate-spin mb-4" style={{ border: '2px solid rgba(232,192,122,0.3)', borderTopColor: '#e8c07a' }} />
              <Text className="block text-white/55">加载中...</Text>
            </View>
          ) : logsError ? (
            <View className="flex flex-col items-center justify-center py-12">
              <Text className="mb-2 block text-[#fca5a5]">{logsError}</Text>
              <Button className="px-4 py-2 rounded-lg text-sm text-[#2e1f0f]" style={{ backgroundColor: '#e8c07a' }} onClick={() => loadGiftLogs(logsPage)}>
                重新加载
              </Button>
            </View>
          ) : giftLogs.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-12">
              <Text className="block text-white/45">暂无赠送记录</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {giftLogs.map((log) => (
                <View key={log.id} className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(18,42,53,0.7)', borderColor: 'rgba(232,192,122,0.22)' }}>
                  <View className="flex items-start gap-3">
                    <View className="w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0 bg-white/8">
                      <GiftIconDisplay icon={log.gift_icon} size="normal" />
                    </View>
                    <View className="flex-1">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="font-semibold text-white block">{log.gift_name}</Text>
                        <Text className="text-xs text-white/40 block">{new Date(log.created_at).toLocaleString()}</Text>
                      </View>
                      <View className="rounded-lg p-3 mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <Text className="text-sm text-white/70 block">
                          <Text className="font-medium text-[#f0d9a8]">{log.sender_name}</Text>
                          <Text className="text-white/45"> 赠送给 </Text>
                          <Text className="font-medium text-[#f0d9a8]">{log.memorial_name}</Text>
                        </Text>
                        {log.message && (
                          <Text className="text-sm text-white/55 mt-1 italic block">&quot;{log.message}&quot;</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              
              {logsTotal > 20 && (
                <View className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    className={`px-4 py-2 rounded-lg text-sm ${logsPage === 1 ? 'text-white/35 bg-white/10' : 'text-[#2e1f0f] bg-[#e8c07a]'}`}
                    onClick={() => { if (logsPage > 1) { const p = logsPage - 1; setLogsPage(p); loadGiftLogs(p); }}}
                    disabled={logsPage === 1}
                  >
                    上一页
                  </Button>
                  <Text className="text-white/60 block">第 {logsPage} 页</Text>
                  <Button
                    className={`px-4 py-2 rounded-lg text-sm ${logsPage >= Math.ceil(logsTotal / 20) ? 'text-white/35 bg-white/10' : 'text-[#2e1f0f] bg-[#e8c07a]'}`}
                    onClick={() => { const total = Math.ceil(logsTotal / 20); if (logsPage < total) { const p = logsPage + 1; setLogsPage(p); loadGiftLogs(p); }}}
                    disabled={logsPage >= Math.ceil(logsTotal / 20)}
                  >
                    下一页
                  </Button>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <View className="flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex' }} onClick={() => setShowModal(false)}>
          <View className="rounded-2xl w-11/12 max-w-md p-6 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'rgba(18,42,53,0.97)', border: '1px solid rgba(232,192,122,0.35)' }} onClick={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-white mb-4 block">{editingId ? '编辑礼物' : '新增礼物'}</Text>

            <View className="space-y-4">
              {/* 礼物名称 */}
              <View>
                <Text className="text-sm text-white/70 mb-2 block">礼物名称</Text>
                <View className="w-full bg-white/10 rounded-lg px-4">
                  <Input
                    className="w-full bg-transparent py-3 text-white"
                    placeholder="如：鲜花、蜡烛"
                    value={formData.name}
                    onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                  />
                </View>
              </View>

              {/* 图标类型切换 */}
              <View>
                <Text className="text-sm text-white/70 mb-2 block">图标类型</Text>
                <View className="flex gap-2">
                  <View
                    className={`flex-1 py-2 px-4 rounded-lg text-center cursor-pointer ${iconType === 'emoji' ? 'text-[#2e1f0f]' : 'text-white/70'}`}
                    style={{ backgroundColor: iconType === 'emoji' ? '#e8c07a' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => { setIconType('emoji'); setFormData({ ...formData, icon: '' }); }}
                  >
                    <Text>Emoji 表情</Text>
                  </View>
                  <View
                    className={`flex-1 py-2 px-4 rounded-lg text-center cursor-pointer ${iconType === 'image' ? 'text-[#2e1f0f]' : 'text-white/70'}`}
                    style={{ backgroundColor: iconType === 'image' ? '#e8c07a' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => { setIconType('image'); setFormData({ ...formData, icon: '' }); }}
                  >
                    <Text>上传图片</Text>
                  </View>
                </View>
              </View>

              {/* Emoji 选择 */}
              {iconType === 'emoji' && (
                <View>
                  <Text className="text-sm text-white/70 mb-2 block">选择图标</Text>
                  <View className="flex flex-wrap gap-2 mb-3">
                    {PRESET_EMOJIS.map((emoji) => (
                      <View
                        key={emoji}
                        className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg cursor-pointer ${formData.icon === emoji ? 'border-2' : ''}`}
                        style={{ backgroundColor: formData.icon === emoji ? 'rgba(232,192,122,0.25)' : 'rgba(255,255,255,0.08)', borderColor: '#e8c07a' }}
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                      >
                        <Text>{emoji}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="w-full bg-white/10 rounded-lg px-4">
                    <Input
                      className="w-full bg-transparent py-3 text-white"
                      placeholder="或输入自定义 Emoji"
                      value={formData.icon}
                      onInput={(e) => setFormData({ ...formData, icon: e.detail.value })}
                    />
                  </View>
                </View>
              )}

              {/* 图片上传 */}
              {iconType === 'image' && (
                <View>
                  <Text className="text-sm text-white/70 mb-2 block">上传图片</Text>
                  {formData.icon ? (
                    <View className="relative w-32 h-32 mb-2">
                      <Image src={formData.icon} className="w-full h-full rounded-lg object-contain bg-white/10" mode="aspectFit" />
                      <View
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                        onClick={() => setFormData({ ...formData, icon: '' })}
                      >
                        <X size={14} color="#ffffff" />
                      </View>
                    </View>
                  ) : (
                    <View
                      className="w-32 h-32 bg-white/8 rounded-lg flex flex-col items-center justify-center cursor-pointer border-2 border-dashed"
                      style={{ borderColor: 'rgba(232,192,122,0.4)' }}
                      onClick={handleUploadImage}
                    >
                      {uploading ? (
                        <View className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid rgba(232,192,122,0.3)', borderTopColor: '#e8c07a' }} />
                      ) : (
                        <>
                          <Text className="text-3xl mb-1 block">🖼️</Text>
                          <Text className="text-xs text-white/50 block">点击上传</Text>
                        </>
                      )}
                    </View>
                  )}
                  <Text className="text-xs text-white/40 mt-1 block">建议尺寸 200x200，支持 JPG、PNG</Text>
                </View>
              )}

              {/* 颜色 */}
              <View>
                <Text className="text-sm text-white/70 mb-2 block">颜色</Text>
                <View className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <View
                      key={color.value}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${formData.color === color.value ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color.bg.replace('bg-', '') }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                    />
                  ))}
                </View>
              </View>

              {/* 价格 */}
              <View>
                <Text className="text-sm text-white/70 mb-2 block">价格（虚拟货币）</Text>
                <View className="w-full bg-white/10 rounded-lg px-4">
                  <Input
                    className="w-full bg-transparent py-3 text-white"
                    placeholder="如：10、50、100"
                    type="number"
                    value={String(formData.price)}
                    onInput={(e) => setFormData({ ...formData, price: parseInt(e.detail.value) || 0 })}
                  />
                </View>
              </View>

              {/* 启用状态 */}
              <View className="flex items-center justify-between">
                <Text className="text-sm text-white/70 block">启用状态</Text>
                <Switch checked={formData.isEnabled} onChange={(e) => setFormData({ ...formData, isEnabled: e.detail.value })} />
              </View>
            </View>

            <View className="flex gap-3 mt-6">
              <Button className="flex-1 py-3 rounded-lg text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button className="flex-1 py-3 rounded-lg text-[#2e1f0f]" style={{ backgroundColor: '#e8c07a' }} onClick={handleSubmit}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </StarsBackground>
  );
};

export default GiftConfigPage;
