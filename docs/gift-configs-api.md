# 礼物配置管理接口文档

## 基础信息

| 项目 | 值 |
|------|-----|
| 基础URL | `https://df124f73-ebd8-456a-8080-e345d6017e67.dev.coze.site/api` |
| 响应格式 | `application/json` |
| 统一响应 | `{ code: number, msg: string, data: any }` |

---

## 接口列表

### 1. 获取所有礼物配置

获取完整的礼物配置列表（包含已禁用）。

- **URL**: `/gift-configs`
- **Method**: `GET`
- **Auth**: 不需要

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57",
      "name": "鲜花",
      "icon": "🌸",
      "color": "text-pink-500",
      "sort_order": 1,
      "is_enabled": true,
      "created_at": "2026-03-12T13:55:47.730834+08:00",
      "updated_at": "2026-03-12T13:55:47.730834+08:00"
    }
  ]
}
```

---

### 2. 获取启用的礼物配置

获取前端展示用的礼物列表（仅启用的）。

- **URL**: `/gift-configs/enabled`
- **Method**: `GET`
- **Auth**: 不需要

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57",
      "name": "鲜花",
      "icon": "🌸",
      "color": "text-pink-500",
      "sort_order": 1,
      "is_enabled": true,
      "created_at": "2026-03-12T13:55:47.730834+08:00",
      "updated_at": "2026-03-12T13:55:47.730834+08:00"
    }
  ]
}
```

---

### 3. 获取单个礼物配置

- **URL**: `/gift-configs/:id`
- **Method**: `GET`
- **Auth**: 不需要

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 礼物配置ID (UUID) |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57",
    "name": "鲜花",
    "icon": "🌸",
    "color": "text-pink-500",
    "sort_order": 1,
    "is_enabled": true,
    "created_at": "2026-03-12T13:55:47.730834+08:00",
    "updated_at": "2026-03-12T13:55:47.730834+08:00"
  }
}
```

---

### 4. 创建礼物配置

- **URL**: `/gift-configs`
- **Method**: `POST`
- **Auth**: 不需要
- **Content-Type**: `application/json`

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 礼物名称，如：鲜花、蜡烛 |
| icon | string | ✅ | 礼物图标，如：🌸、🕯️ |
| color | string | ❌ | 颜色样式类，默认：`text-pink-500` |
| sortOrder | number | ❌ | 排序序号，默认：0 |
| isEnabled | boolean | ❌ | 是否启用，默认：true |

#### 颜色可选值

| 值 | 说明 |
|-----|------|
| `text-pink-500` | 粉色（默认） |
| `text-red-500` | 红色 |
| `text-orange-400` | 橙色 |
| `text-yellow-500` | 黄色 |
| `text-green-500` | 绿色 |
| `text-blue-500` | 蓝色 |
| `text-purple-500` | 紫色 |

#### 请求示例

```json
{
  "name": "鲜花",
  "icon": "🌸",
  "color": "text-pink-500",
  "sortOrder": 1,
  "isEnabled": true
}
```

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57",
    "name": "鲜花",
    "icon": "🌸",
    "color": "text-pink-500",
    "sort_order": 1,
    "is_enabled": true,
    "created_at": "2026-03-12T13:55:47.730834+08:00",
    "updated_at": "2026-03-12T13:55:47.730834+08:00"
  }
}
```

---

### 5. 更新礼物配置

- **URL**: `/gift-configs/:id`
- **Method**: `PUT`
- **Auth**: 不需要
- **Content-Type**: `application/json`

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 礼物配置ID (UUID) |

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ❌ | 礼物名称 |
| icon | string | ❌ | 礼物图标 |
| color | string | ❌ | 颜色样式类 |
| sortOrder | number | ❌ | 排序序号 |
| isEnabled | boolean | ❌ | 是否启用 |

#### 请求示例

```json
{
  "name": "玫瑰花",
  "color": "text-red-500"
}
```

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57",
    "name": "玫瑰花",
    "icon": "🌸",
    "color": "text-red-500",
    "sort_order": 1,
    "is_enabled": true,
    "created_at": "2026-03-12T13:55:47.730834+08:00",
    "updated_at": "2026-03-12T14:30:22.123456+08:00"
  }
}
```

---

### 6. 删除礼物配置

- **URL**: `/gift-configs/:id`
- **Method**: `DELETE`
- **Auth**: 不需要

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 礼物配置ID (UUID) |

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57"
  }
}
```

---

### 7. 更新礼物排序

用于调整礼物展示顺序（上移/下移）。

- **URL**: `/gift-configs/:id/sort`
- **Method**: `PUT`
- **Auth**: 不需要
- **Content-Type**: `application/json`

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 礼物配置ID (UUID) |

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sortOrder | number | ✅ | 新的排序序号 |

#### 请求示例

```json
{
  "sortOrder": 2
}
```

#### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "2771bc8e-d2e0-437a-b9e8-56f9c93dec57",
    "sort_order": 2
  }
}
```

---

## 数据模型

### GiftConfig (礼物配置)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 唯一标识 (UUID) |
| name | string | 礼物名称 |
| icon | string | 图标（Emoji） |
| color | string | 颜色样式类 |
| sort_order | number | 排序序号 |
| is_enabled | boolean | 是否启用 |
| created_at | string | 创建时间 (ISO 8601) |
| updated_at | string | 更新时间 (ISO 8601) |

---

## 错误响应

所有接口的错误响应格式统一：

```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null,
  "path": "/api/gift-configs/xxx",
  "timestamp": "2026-03-12T08:21:38.350Z"
}
```

### 常见状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 前端调用示例

```typescript
import { Network } from '@/network';

// 获取所有礼物配置
const fetchAllConfigs = async () => {
  const res = await Network.request({
    url: '/api/gift-configs',
    method: 'GET'
  });
  return res.data.data;
};

// 创建礼物配置
const createConfig = async (data: {
  name: string;
  icon: string;
  color?: string;
}) => {
  const res = await Network.request({
    url: '/api/gift-configs',
    method: 'POST',
    data
  });
  return res.data.data;
};

// 更新排序
const updateSort = async (id: string, sortOrder: number) => {
  const res = await Network.request({
    url: `/api/gift-configs/${id}/sort`,
    method: 'PUT',
    data: { sortOrder }
  });
  return res.data.data;
};
```

---

## 管理页面访问地址

H5 管理页面：https://coze-coding-project.tos.coze.site/coze_storage_7615796173898547240/h5-admin/gift-configs-v6/index_f1d3fd52.html

（有效期30天，过期后需重新部署）
