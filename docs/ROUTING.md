# 🛣️ 路由配置说明

## 📋 路由模式

Orchestrator Pro 使用 **Hash路由模式** 来实现单页面应用(SPA)的客户端路由。

### 🔧 配置详情

**文件位置**: `src/web/ui/src/router/index.js`

```javascript
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(), // Hash路由模式
  routes
});
```

## 🎯 路由列表

| 路径 | 组件 | 页面标题 | 图标 |
|------|------|----------|------|
| `/` | - | - | - |
| `/workflows` | WorkflowsPage | 工作流 | workflow |
| `/components` | ComponentsPage | 组件 | component |
| `/triggers` | TriggersPage | 触发器 | trigger |
| `/backup` | BackupManagementPage | 备份管理 | backup |
| `/containers` | ContainerManagement | 容器管理 | container |
| `/services` | SystemServicesPage | 系统服务 | service |

## 🔗 URL格式

### Hash路由URL示例

```
http://localhost:3000/#/workflows
http://localhost:3000/#/components
http://localhost:3000/#/triggers
http://localhost:3000/#/backup
http://localhost:3000/#/containers
http://localhost:3000/#/services
```

### 默认重定向

访问根路径 `/` 会自动重定向到 `/workflows`：

```
http://localhost:3000/#/ → http://localhost:3000/#/workflows
```

## ✅ Hash路由的优势

### 1. **无需服务器配置**
- 不需要配置服务器重写规则
- 适用于任何Web服务器
- 静态文件部署即可

### 2. **兼容性好**
- 支持所有现代浏览器
- 不需要服务器端支持
- 适用于CDN部署

### 3. **部署简单**
- 直接部署静态文件
- 无需复杂的服务器配置
- 支持GitHub Pages等静态托管

### 4. **URL可分享**
- Hash部分不会发送到服务器
- 可以直接分享特定页面链接
- 浏览器前进后退正常工作

## 🚀 导航使用

### 编程式导航

```javascript
import { useRouter } from 'vue-router';

const router = useRouter();

// 导航到指定页面
router.push('/workflows');
router.push('/components');
router.push('/triggers');
```

### 声明式导航

```vue
<template>
  <router-link to="/workflows">工作流</router-link>
  <router-link to="/components">组件</router-link>
  <router-link to="/triggers">触发器</router-link>
</template>
```

## 🔄 路由守卫

### 全局前置守卫

```javascript
router.beforeEach((to, from, next) => {
  // 路由跳转前的逻辑
  console.log(`从 ${from.path} 跳转到 ${to.path}`);
  next();
});
```

### 组件内守卫

```javascript
export default {
  beforeRouteEnter(to, from, next) {
    // 组件进入前
    next();
  },
  beforeRouteLeave(to, from, next) {
    // 组件离开前
    next();
  }
};
```

## 📱 响应式设计

路由系统完全支持响应式设计：

- **桌面端**: 完整的导航栏显示
- **移动端**: 可折叠的导航菜单
- **平板端**: 自适应的布局调整

## 🛠️ 开发调试

### 路由调试

```javascript
// 在浏览器控制台中查看当前路由
console.log('当前路由:', this.$route);
console.log('路由历史:', this.$router.history);
```

### 路由状态检查

```javascript
// 检查路由是否激活
const isActive = (path) => {
  return this.$route.path === path;
};
```

## 🔧 自定义配置

### 添加新路由

1. 在 `routes` 数组中添加新路由配置
2. 创建对应的Vue组件
3. 在导航中添加链接

```javascript
{
  path: '/new-page',
  name: 'NewPage',
  component: NewPageComponent,
  meta: {
    title: '新页面',
    icon: 'new-icon'
  }
}
```

### 路由元信息

每个路由都可以包含 `meta` 信息：

```javascript
{
  path: '/workflows',
  meta: {
    title: '工作流',
    icon: 'workflow',
    requiresAuth: true,
    description: '可视化工作流设计器'
  }
}
```

## 📚 相关文档

- [Vue Router官方文档](https://router.vuejs.org/)
- [Hash模式说明](https://router.vuejs.org/guide/essentials/history-mode.html#hash-mode)
- [路由配置最佳实践](https://router.vuejs.org/guide/essentials/navigation.html)

## 🎯 总结

Hash路由模式为Orchestrator Pro提供了：

- ✅ **简单部署**: 无需服务器配置
- ✅ **广泛兼容**: 支持所有环境
- ✅ **易于维护**: 配置简单清晰
- ✅ **用户友好**: URL可分享和收藏

这种路由模式特别适合企业级应用和开源项目的部署需求。
