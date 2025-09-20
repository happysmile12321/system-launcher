# GitHub API 测试工具使用说明

## 功能概述

新增的 `-t` 选项允许你测试 GitHub API 的各种功能，验证你的 GitHub 配置是否正确，并查看 API 返回的数据。

## 使用方法

```bash
# 运行 GitHub API 测试
node src/cli/index.js -t

# 或者使用 npm script
npm run cli -- -t
```

## 测试内容

该工具会测试以下 GitHub API 功能：

1. **仓库信息获取** - 获取仓库的基本信息（名称、描述、创建时间等）
2. **仓库内容获取** - 列出仓库根目录的文件和文件夹
3. **分支信息获取** - 获取仓库的所有分支信息
4. **提交历史获取** - 获取最近的 5 个提交记录
5. **Issues 获取** - 获取仓库的开放 Issues
6. **Pull Requests 获取** - 获取仓库的开放 Pull Requests
7. **GitFS 功能测试** - 测试自定义的 GitFS 文件系统功能

## 输入要求

运行时会提示你输入以下信息：

- **GitHub Personal Access Token**: 你的 GitHub 个人访问令牌
- **GitHub 用户名或组织名**: 仓库的所有者
- **仓库名**: 要测试的仓库名称

## 输出格式

所有 API 返回的数据都会以 JSON 格式在控制台打印，包含以下信息：

- ✅ 成功获取的数据会显示详细信息
- ⚠️ 如果某些 API 调用失败，会显示警告信息
- 🎉 所有测试完成后会显示成功消息

## 注意事项

1. 确保你的 GitHub Token 有足够的权限访问目标仓库
2. 支持 Classic PAT 和 Fine-grained PAT 两种类型的令牌
3. 如果网络较慢，某些 API 调用可能会超时，这是正常现象
4. 测试过程中会验证 Token 的有效性和仓库访问权限

## 示例输出

```
[INFO] === GitHub API 测试工具 ===
? 请输入 GitHub Personal Access Token: ********
? 请输入 GitHub 用户名或组织名: your-username
? 请输入仓库名: your-repo
[INFO] 正在验证 GitHub 配置...
[SUCCESS] GitHub 配置验证成功！

[INFO] === 开始测试 GitHub API ===
[INFO] 1. 测试获取仓库信息...
[SUCCESS] ✅ 仓库信息获取成功:
{
  "name": "your-repo",
  "full_name": "your-username/your-repo",
  "description": "Repository description",
  "private": false,
  "html_url": "https://github.com/your-username/your-repo",
  ...
}

[SUCCESS] 🎉 GitHub API 测试完成！所有功能都正常工作。
```

这个工具对于调试 GitHub 集成问题、验证配置正确性以及了解 GitHub API 返回的数据结构非常有用。
