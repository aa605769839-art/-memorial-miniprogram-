# 🎁 礼物系统 API 文档

## Base URL

```
开发环境: http://localhost:3000/api
生产环境: https://your-domain.com/api
```

---

## 一、礼物配置管理接口

### 接口列表

| 序号 | 方法 | 路径 | 描述 | 请求头 |
|------|------|------|------|--------|
| 1 | GET | `/gift-configs` | 获取所有礼物配置 | Content-Type: application/json |
| 2 | GET | `/gift-configs/enabled` | 获取启用的礼物配置 | Content-Type: application/json |
| 3 | GET | `/gift-configs/:id` | 获取单个礼物配置 | Content-Type: application/json |
| 4 | POST | `/gift-configs` | 创建礼物配置 | Content-Type: application/json |
| 5 | PUT | `/gift-configs/:id` | 更新礼物配置 | Content-Type: application/json |
| 6 | DELETE | `/gift-configs/:id` | 删除礼物配置 | Content-Type: application/json |
| 7 | PUT | `/gift-configs/:id/sort` | 更新礼物排序 | Content-Type: application/json |

### 请求参数详情

#### POST /gift-configs (创建礼物)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| name | string | ✅ | - | 礼物名称，如：鲜花 |
| icon | string | ✅ | - | 表情图标，如：🌸 |
| color | string | ❌ | text-pink-500 | 颜色类名 |
| price | number | ❌ | 0 | 价格，0表示免费 |
| is_enabled | boolean | ❌ | true | 是否启用 |
| sort_order | number | ❌ | 0 | 排序序号 |

#### PUT /gift-configs/:id (更新礼物)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | ✅ | 路径参数，礼物ID |
| name | string | ❌ | 礼物名称 |
| icon | string | ❌ | 表情图标 |
| color | string | ❌ | 颜色类名 |
| price | number | ❌ | 价格 |
| is_enabled | boolean | ❌ | 是否启用 |

#### PUT /gift-configs/:id/sort (更新排序)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | ✅ | 路径参数，礼物ID |
| sortOrder | number | ✅ | 排序序号 |

### 响应数据结构

#### GiftConfig 对象

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | UUID，唯一标识 |
| name | string | 礼物名称 |
| icon | string | 表情图标 |
| color | string | Tailwind颜色类 |
| price | number | 价格 |
| sort_order | number | 排序序号 |
| is_enabled | boolean | 是否启用 |
| created_at | string | 创建时间 (ISO 8601) |
| updated_at | string | 更新时间 (ISO 8601) |

#### 标准响应格式

| 字段名 | 类型 | 说明 |
|--------|------|------|
| code | number | 200表示成功 |
| msg | string | 消息说明 |
| data | any | 响应数据 |

---

## 二、礼物赠送记录接口

### 接口列表

| 序号 | 方法 | 路径 | 描述 | 请求头 |
|------|------|------|------|--------|
| 1 | GET | `/gifts` | 获取赠送日志（中台） | Content-Type: application/json |
| 2 | GET | `/gifts/memorial/:memorialId` | 获取某纪念空间的礼物 | Content-Type: application/json |
| 3 | POST | `/gifts` | 赠送礼物 | Content-Type: application/json |

### 请求参数详情

#### GET /gifts (获取日志)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | ❌ | 1 | 页码 |
| limit | number | ❌ | 50 | 每页数量 |

#### GET /gifts/memorial/:memorialId

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| memorialId | string | ✅ | 路径参数，纪念空间ID |

#### POST /gifts (赠送礼物)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| memorial_id | string | ✅ | 纪念空间ID |
| gift_type | string | ✅ | 礼物配置ID |
| sender_name | string | ✅ | 赠送者昵称 |
| sender_avatar | string | ❌ | 赠送者头像URL |
| message | string | ❌ | 附言/留言 |

### 响应数据结构

#### GiftItem 对象

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | UUID，唯一标识 |
| memorial_id | string | 纪念空间ID |
| memorial_name | string | 故人姓名 |
| gift_type | string | 礼物配置ID |
| gift_name | string | 礼物名称 |
| gift_icon | string | 礼物图标 |
| sender_name | string | 赠送者昵称 |
| sender_avatar | string | 头像URL |
| message | string | 留言内容 |
| created_at | string | 赠送时间 (ISO 8601) |

#### 分页响应

| 字段名 | 类型 | 说明 |
|--------|------|------|
| data | array | GiftItem数组 |
| pagination.total | number | 总记录数 |
| pagination.page | number | 当前页码 |
| pagination.limit | number | 每页数量 |
| pagination.totalPages | number | 总页数 |

---

## 三、数据库表结构

### gift_configs 表（礼物配置）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| name | varchar(100) | NOT NULL | - | 礼物名称 |
| icon | varchar(50) | NOT NULL | - | 表情图标 |
| color | varchar(50) | - | text-pink-500 | 颜色类名 |
| price | integer | - | 0 | 价格 |
| sort_order | integer | - | 0 | 排序序号 |
| is_enabled | boolean | - | true | 是否启用 |
| created_at | timestamptz | - | now() | 创建时间 |
| updated_at | timestamptz | - | now() | 更新时间 |

### gifts 表（赠送记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 唯一标识 |
| memorial_id | uuid | FOREIGN KEY | - | 纪念空间ID |
| gift_type | uuid | NOT NULL | - | 礼物配置ID |
| gift_name | varchar(100) | NOT NULL | - | 礼物名称 |
| gift_icon | varchar(50) | - | - | 礼物图标 |
| sender_name | varchar(100) | NOT NULL | - | 赠送者昵称 |
| sender_avatar | text | - | - | 头像URL |
| message | text | - | - | 留言 |
| created_at | timestamptz | - | now() | 赠送时间 |

---

## 四、前端调用示例代码

### 1. 获取启用的礼物列表

```typescript
const getEnabledGifts = async () => {
  const res = await fetch('/api/gift-configs/enabled');
  const data = await res.json();
  return data.data;
};
```

### 2. 赠送礼物

```typescript
const sendGift = async (giftData: {
  memorial_id: string;
  gift_type: string;
  sender_name: string;
  sender_avatar?: string;
  message?: string;
}) => {
  const res = await fetch('/api/gifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giftData)
  });
  return res.json();
};
```

### 3. 获取赠送日志（中台）

```typescript
const getGiftLogs = async (page = 1, limit = 20) => {
  const res = await fetch(`/api/gifts?page=${page}&limit=${limit}`);
  const data = await res.json();
  return data.data;
};
```

### 4. 创建礼物配置（中台）

```typescript
const createGiftConfig = async (config: {
  name: string;
  icon: string;
  color?: string;
  price?: number;
  is_enabled?: boolean;
}) => {
  const res = await fetch('/api/gift-configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return res.json();
};
```

---

## 五、颜色选项

| color 值 | 说明 |
|----------|------|
| text-pink-500 | 粉色 |
| text-red-500 | 红色 |
| text-orange-400 | 橙色 |
| text-yellow-500 | 黄色 |
| text-green-500 | 绿色 |
| text-blue-500 | 蓝色 |
| text-purple-500 | 紫色 |

---

## 六、错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

文档版本: 1.0
生成时间: 2026-03-16
