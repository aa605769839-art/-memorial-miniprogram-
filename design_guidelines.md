# 温故小程序设计指南

## 品牌定位

**应用名称**：温故（Remember & Cherish）

**品牌定位**：
- 温暖怀念的追思空间
- 传递温暖与敬意的平台
- 让记忆永不消逝

**设计风格**：
- 温暖柔和的色调
- 简约亲和的界面
- 轻松温馨的氛围

**目标用户**：
- 需要为逝者创建纪念空间的亲属
- 希望远程表达思念的朋友
- 追求数字化纪念的年轻一代

## 配色方案（暖色调）

### 主色板（Tailwind 类名）

```css
/* 主色调 - 温暖橙色 */
--primary: #f97316;        /* orange-500 */
--primary-dark: #ea580c;   /* orange-600 */
--primary-light: #fb923c;  /* orange-400 */

/* 辅色调 - 温暖黄色 */
--accent: #fbbf24;         /* amber-400 */
--accent-light: #fde047;   /* yellow-300 */

/* 中性色 - 柔和米白 */
--bg-primary: #fff7ed;     /* orange-50 */
--bg-secondary: #ffffff;   /* white */
--bg-tertiary: #ffedd5;    /* orange-100 */

/* 文字颜色 */
--text-primary: #1c1917;   /* stone-900 */
--text-secondary: #57534e; /* stone-600 */
--text-muted: #a8a29e;     /* stone-400 */
```

### 语义色

```css
/* 成功/完成 */
--success: #22c55e;        /* green-500 */

/* 警告/注意 */
--warning: #f59e0b;        /* amber-500 */

/* 错误/危险 */
--error: #ef4444;          /* red-500 */

/* 信息提示 */
--info: #3b82f6;           /* blue-500 */
```

## 字体规范

### 标题层级

```tsx
// H1 - 页面标题
<Text className="block text-3xl font-bold text-stone-900">
  主标题
</Text>

// H2 - 区块标题
<Text className="block text-2xl font-semibold text-stone-900">
  区块标题
</Text>

// H3 - 卡片标题
<Text className="block text-xl font-medium text-stone-900">
  卡片标题
</Text>

// H4 - 小标题
<Text className="block text-lg font-medium text-stone-800">
  小标题
</Text>
```

### 正文层级

```tsx
// Body Large - 重要正文
<Text className="block text-base text-stone-700 leading-relaxed">
  重要正文内容
</Text>

// Body - 普通正文
<Text className="block text-sm text-stone-600 leading-normal">
  普通正文内容
</Text>

// Caption - 辅助文字
<Text className="block text-xs text-stone-500">
  辅助说明文字
</Text>
```

### 特殊文字

```tsx
// 姓名/标题（橙色强调）
<Text className="block text-xl font-bold text-orange-500">
  张三
</Text>

// 日期时间
<Text className="block text-xs text-stone-500">
  1950-01-01 ~ 2020-12-31
</Text>

// 引用/悼词
<Text className="block text-sm text-stone-600 italic leading-relaxed">
  "你的温暖永远留在我们心中"
</Text>
```

## 间距系统

### 页面边距

```tsx
// 页面整体边距
<View className="px-4 py-6">  {/* 16px 24px */}

// 内容区域
<View className="p-4">        {/* 16px */}
<View className="p-6">        {/* 24px */}
```

### 组件间距

```tsx
// 垂直间距（使用 gap）
<View className="flex flex-col gap-3">  {/* 12px */}
<View className="flex flex-col gap-4">  {/* 16px */}
<View className="flex flex-col gap-6">  {/* 24px */}

// 卡片间距
<View className="mb-3">  {/* 12px */}
<View className="mb-4">  {/* 16px */}
<View className="mb-6">  {/* 24px */}
```

### 内边距

```tsx
// 小组件
<View className="px-3 py-2">  {/* 12px 8px */}

// 卡片
<View className="px-4 py-3">  {/* 16px 12px */}
<View className="p-4">        {/* 16px */}

// 大卡片
<View className="px-6 py-4">  {/* 24px 16px */}
```

## 组件规范

### 按钮组件

```tsx
// 主按钮（悼念/拜访/上传）
<View className="w-full">
  <Button className="w-full bg-orange-500 text-white rounded-full py-3 shadow-md">
    悼念
  </Button>
</View>

// 次按钮（留言/查看更多）
<View className="w-full">
  <Button className="w-full bg-orange-100 text-orange-700 rounded-full py-3">
    留言
  </Button>
</View>

// 小按钮（标签/分类）
<Button className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm">
  标签
</Button>
```

### 卡片组件（正方形格子）

```tsx
// 故人卡片（正方形）
<View className="bg-white rounded-2xl overflow-hidden shadow-sm">
  {/* 图片区域 */}
  <View className="aspect-square relative">
    <Image
      src={avatarUrl}
      className="w-full h-full"
      mode="aspectFill"
    />
    {/* 底部遮罩 */}
    <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
      <Text className="block text-white font-bold text-lg">{name}</Text>
      <Text className="block text-white/80 text-xs">{dateRange}</Text>
    </View>
  </View>
</View>

// 留言卡片
<View className="bg-orange-50 rounded-xl p-4 mb-3">
  <View className="flex items-center justify-between mb-2">
    <Text className="block text-sm font-medium text-stone-700">{author}</Text>
    <Text className="block text-xs text-stone-500">{time}</Text>
  </View>
  <Text className="block text-sm text-stone-600 leading-relaxed">
    {content}
  </Text>
</View>
```

### 输入框组件

```tsx
// 文本输入（跨端兼容）
<View className="bg-orange-50 rounded-xl px-4 py-3 mb-4">
  <Input
    className="w-full bg-transparent text-stone-700 placeholder-stone-400"
    placeholder="请输入内容"
    onInput={(e) => setValue(e.detail.value)}
  />
</View>

// 多行输入
<View className="bg-orange-50 rounded-xl p-4 mb-4">
  <Textarea
    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
    placeholder="请输入详细描述..."
    onInput={(e) => setContent(e.detail.value)}
  />
</View>
```

### 列表组件（正方形网格）

```tsx
// 故人列表（网格布局）
<View className="grid grid-cols-2 gap-3 px-4 py-6">
  {memorials.map((item) => (
    <MemorialCard key={item.id} data={item} />
  ))}
</View>

// 排行榜列表
<View className="bg-white rounded-2xl p-4 shadow-sm">
  {rankings.map((item, index) => (
    <View key={item.id} className="flex items-center gap-4 py-3 border-b border-orange-100 last:border-0">
      {/* 排名 */}
      <View className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
        <Text className="block text-sm font-bold text-orange-600">{index + 1}</Text>
      </View>
      {/* 信息 */}
      <View className="flex-1">
        <Text className="block text-base font-medium text-stone-900">{item.name}</Text>
        <Text className="block text-xs text-stone-500">悼念 {item.mourning_count} 次</Text>
      </View>
      {/* 数据 */}
      <Text className="block text-orange-500 font-semibold">{item.count}</Text>
    </View>
  ))}
</View>
```

### 空状态组件

```tsx
<View className="flex flex-col items-center justify-center py-20">
  <View className="w-24 h-24 mb-6 opacity-30">
    <Heart color="#a8a29e" size={96} strokeWidth={1.5} />
  </View>
  <Text className="block text-base text-stone-500 mb-2">
    暂无内容
  </Text>
  <Text className="block text-sm text-stone-400">
    还没有创建纪念空间
  </Text>
</View>
```

### 加载状态组件

```tsx
<View className="flex items-center justify-center py-20">
  <View className="flex flex-col items-center gap-3">
    <View className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    <Text className="block text-sm text-stone-400">
      加载中...
    </Text>
  </View>
</View>
```

## 导航结构

### TabBar 配置

```typescript
tabBar: {
  color: '#a8a29e',          // 未选中 - stone-400
  selectedColor: '#f97316',  // 选中 - orange-500
  backgroundColor: '#ffffff',
  borderStyle: 'white',
  list: [
    {
      pagePath: 'pages/index/index',
      text: '故人',
      iconPath: './assets/tabbar/heart.png',
      selectedIconPath: './assets/tabbar/heart-active.png',
    },
    {
      pagePath: 'pages/ranking/index',
      text: '排行',
      iconPath: './assets/tabbar/award.png',
      selectedIconPath: './assets/tabbar/award-active.png',
    },
    {
      pagePath: 'pages/profile/index',
      text: '我的',
      iconPath: './assets/tabbar/user.png',
      selectedIconPath: './assets/tabbar/user-active.png',
    }
  ]
}
```

### 页面跳转规范

```tsx
// TabBar 切换（使用 switchTab）
Taro.switchTab({
  url: '/pages/index/index'
})

// 普通页面跳转（使用 navigateTo）
Taro.navigateTo({
  url: `/pages/detail/index?id=${id}`
})

// 返回上一页
Taro.navigateBack()
```

## 小程序约束

### 包体积限制
- 主包大小限制：2MB
- 单个分包大小限制：2MB
- 所有分包大小限制：20MB

### 图片策略
- 优先使用对象存储（OSS）
- 使用 WebP 格式降低体积
- 图片尺寸限制在 2000x2000 以内
- 懒加载优化性能

### 性能优化
- 避免长列表一次性渲染（使用虚拟列表）
- 减少页面跳转时的数据传输
- 合理使用缓存（本地存储）
- 优化图片加载（懒加载、缩略图）

### 用户体验
- 保持页面简洁，避免过度动画
- 提供清晰的反馈（加载、成功、失败）
- 优化首屏加载速度
- 确保跨端兼容性（H5/小程序）

## 特殊场景设计

### 悼念场景
- 按钮需要明显区分（主按钮）
- 悼念后给予温暖的视觉反馈
- 显示悼念次数，增强参与感

### 拜访场景
- 记录拜访时间
- 提供简洁的留言入口
- 显示最近拜访者

### 留言场景
- 限制留言长度（500字）
- 实时保存草稿
- 显示留言时间线

### 排行场景
- 按悼念次数/拜访次数排序
- 使用徽章标识前三名
- 提供多种排序方式

### 我的场景
- 展示用户创建的故人列表
- 提供上传新故人的入口
- 统计用户的悼念/拜访次数
