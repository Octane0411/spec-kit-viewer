# Spec-Kit-Viewer 扩展测试指南

## 🚀 如何测试这个VSCode扩展

### 第一步：启动开发环境

1. **在VSCode中打开项目**：
   ```bash
   cd /Users/wangruobing/Personal/spec-kit-viewer
   code .
   ```

2. **确保所有依赖已安装**：
   ```bash
   npm install
   ```

3. **编译项目**：
   ```bash
   npm run compile
   npm run webpack
   ```

### 第二步：启动扩展开发主机

1. **使用F5快捷键**或者：
   - 打开 "运行和调试" 面板 (Ctrl+Shift+D)
   - 选择 "Run Extension" 配置
   - 点击绿色播放按钮

2. **这将会**：
   - 启动一个新的VSCode窗口（扩展开发主机）
   - 自动打开 `test-docs` 文件夹
   - 加载你的扩展

### 第三步：配置翻译API（可选）

如果你有FRIDAY API的访问权限：

1. 在扩展开发主机中，打开设置 (Cmd+,)
2. 搜索 "Spec-Kit Viewer"
3. 配置以下设置：
   ```json
   {
     "specKit.translation.apiKey": "你的API密钥",
     "specKit.translation.baseUrl": "https://your-friday-api-url.com",
     "specKit.translation.model": "LongCat-Flash-Chat-2512"
   }
   ```

**注意**：如果没有配置API，扩展会使用模拟翻译服务进行测试。

### 第四步：测试翻译功能

#### 测试CodeLens功能

1. **打开测试文件**：
   - 在扩展开发主机中，打开 `test-docs/sample-spec.md`

2. **查找CodeLens操作**：
   - 在文档顶部应该看到 "🌏 Translate to Chinese"
   - 在各个标题行应该看到 "🌏 Translate Section"

3. **点击翻译**：
   - 点击 "🌏 Translate to Chinese"
   - 应该会在右侧打开翻译预览面板

#### 测试翻译面板

1. **观察翻译过程**：
   - 翻译面板应该立即打开
   - 如果配置了真实API，会看到流式翻译
   - 如果使用模拟服务，会看到模拟的翻译结果

2. **测试缓存功能**：
   - 再次点击相同的翻译按钮
   - 第二次应该立即显示缓存的结果

#### 测试章节翻译

1. **点击章节翻译**：
   - 在任何 `##` 标题行点击 "🌏 Translate Section"
   - 应该只翻译该章节的内容

### 第五步：测试不同类型的文档

测试以下文件以验证不同的功能：

1. **`test-docs/sample-spec.md`** - 主要功能测试
2. **`test-docs/linked-document.md`** - 链接依赖测试
3. **`test-docs/plan.md`** - 文件类型分类测试

### 第六步：测试命令面板

1. **打开命令面板** (Cmd+Shift+P)
2. **搜索 "SpecKit"**，应该看到：
   - `SpecKit: Open Translation Preview`
   - `SpecKit: Show Dependency Graph` (显示"计划中"消息)

### 第七步：调试和日志

1. **查看开发者控制台**：
   - 在扩展开发主机中按 F12
   - 查看Console标签页中的日志信息

2. **查看扩展主机日志**：
   - 在主VSCode窗口中查看 "输出" 面板
   - 选择 "扩展主机" 来源

## 🔍 预期行为

### ✅ 应该正常工作的功能

- [x] CodeLens操作在Markdown文件中显示
- [x] 点击翻译按钮打开侧边面板
- [x] 翻译内容显示（真实API或模拟）
- [x] 翻译缓存功能
- [x] 章节翻译功能
- [x] 命令面板集成

### 🚧 已知限制

- User Story 2（依赖关系图）尚未实现
- ReactFlow依赖已移除（将在User Story 2中重新添加）
- 某些错误处理可能需要进一步完善

## 🐛 故障排除

### 问题：CodeLens不显示
**解决方案**：
- 确保文件是Markdown格式 (`.md`)
- 重启扩展开发主机
- 检查控制台是否有错误

### 问题：翻译失败
**解决方案**：
- 检查API配置是否正确
- 查看控制台错误信息
- 验证网络连接

### 问题：编译错误
**解决方案**：
```bash
npm run compile
npm run webpack
```

## 📝 测试清单

在提交之前，请确认以下测试项目：

- [ ] 扩展在开发主机中成功激活
- [ ] CodeLens操作在Markdown文件中显示
- [ ] 全文档翻译功能正常
- [ ] 章节翻译功能正常
- [ ] 翻译面板正确打开和显示
- [ ] 缓存功能正常工作
- [ ] 命令面板集成正常
- [ ] 错误处理适当（无API密钥时）
- [ ] 控制台无严重错误

## 🎯 下一步

成功测试User Story 1后，下一步是实现User Story 2：
- 添加ReactFlow依赖
- 实现GraphPanel和GraphView
- 创建依赖关系图可视化功能

---

**提示**：这是MVP版本，专注于翻译功能。依赖关系图功能将在下个阶段实现。