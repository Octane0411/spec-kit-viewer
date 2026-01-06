# Design Doc: Spec-Kit-Viewer (VSCode Extension)

## 1. 项目概述
**Spec-Kit-Viewer** 是一个专为 Spec-Kit 工具链打造的 VSCode 插件，旨在解决团队在落地 SDD (Spec Driven Development) 流程中的痛点：英文文档阅读门槛高、Spec 间引用关系复杂难以梳理。

### 核心价值
*   **降低门槛**: 通过 LLM 实时翻译，帮助初级成员快速理解英文 Spec。
*   **可视化**: 通过交互式关系图，直观展示 Spec 之间的依赖与引用，辅助架构理解。
*   **提效**: 在 IDE 内闭环完成阅读与理解，无需跳转外部工具。

## 2. 核心功能设计

### 2.1 实时翻译 (Live Translation)
*   **触发机制**:
    *   **CodeLens**: 在 `.spec` 或生成的 Markdown 文件顶部显示 "🇨🇳 Translate to Chinese" 按钮。
    *   **Hover**: 鼠标悬停在英文段落上时，显示中文翻译浮层。
    *   **Side-by-Side**: 命令触发 "Open Translation Preview"，在右侧分栏显示全篇中文翻译。
*   **LLM 集成**:
    *   调用公司内部 **FRIDAY 平台 API** (参考 `scw-10/common/llm_clients/friday_client.py`)。
    *   **Base URL**: `https://aigc.sankuai.com/v1/openai/native`
    *   **鉴权**: 使用 `FRIDAY_APP_ID` 作为 API Key。
    *   **模型选择**: 
        *   **配置项**: 支持用户在 VSCode Settings 中配置模型名称。
        *   **默认值**: `LongCat-Flash-Chat-2512` (免费，速度快，适合实时翻译)。
        *   **其他推荐**: `gpt-4o-mini` (效果更好，适合复杂长难句)。
    *   **Prompt 策略**: 使用 System Prompt 约束翻译风格（保持技术术语不翻译，如 `Props`, `State`, `Interface`）。
*   **缓存机制**:
    *   基于文件 Hash 缓存翻译结果，避免重复调用 API 浪费 Token。

### 2.2 关系可视化 (Graph Visualization)
*   **入口**: 侧边栏 (Activity Bar) 图标或命令 `SpecKit: Show Graph`。
*   **视图**:
    *   使用 **Webview** 渲染。
    *   前端库: **ReactFlow** (推荐) 或 D3.js。
*   **交互**:
    *   **节点**: 代表一个 Spec 文件或组件。
    *   **连线**: 代表引用关系 (Reference / Import)。
    *   **点击**: 点击节点，编辑器自动跳转到对应文件及行号。
*   **数据源**:
    *   解析当前 Workspace 下的所有 `.spec` 文件。
    *   提取 `ref:`, `import`, `include` 等关键词构建依赖树。

## 3. 技术架构

### 3.1 模块划分
```mermaid
graph TD
    A[VSCode Extension Host] --> B[Translation Service]
    A --> C[Graph Service]
    A --> D[Parser Service]
    
    B --> E[FRIDAY Client (Internal API)]
    B --> F[Cache Manager (Local Storage)]
    
    C --> G[Webview Panel]
    G --> H[React App (ReactFlow)]
    
    D --> I[AST / Regex Parser]
```

### 3.2 关键技术点
*   **VSCode Webview 通信**: 使用 `postMessage` 实现 Extension Host 与 React Webview 的双向通信（发送图数据 <-> 接收点击事件）。
*   **AST 解析**: 针对 Spec-Kit 的特定语法（可能是 YAML, JSON 或自定义 DSL）编写解析器，提取依赖关系。
*   **流式传输 (Streaming)**: 翻译功能采用 Stream 模式，提升用户感知的响应速度。

## 4. 开发计划 (MVP)

### Phase 1: 基础框架与翻译 (Week 1)
1.  **前置准备**: 申请 FRIDAY 平台 App ID (参考 `scw-10/docs/reference/friday-api.md`)。
2.  初始化 VSCode 插件项目 (Yeoman generator)。
3.  实现 `CodeLensProvider`，在目标文件顶部添加按钮。
4.  对接 FRIDAY API，实现简单的文本翻译功能。
5.  实现翻译结果的 Webview 展示。

### Phase 2: 关系可视化 (Week 2)
1.  编写 `Parser`，扫描 Workspace 提取文件引用关系。
2.  集成 ReactFlow 到 Webview。
3.  实现数据通信：Extension -> Webview (Graph Data)。
4.  实现交互：Webview -> Extension (Open File)。

## 5. 简历亮点预埋
*   **"Developed a VSCode Extension..."**: 证明对 IDE 扩展机制的掌握。
*   **"Integrated LLM for real-time translation..."**: 证明 LLM API 集成与流式处理经验。
*   **"Visualized complex dependencies using ReactFlow..."**: 证明前端可视化能力。