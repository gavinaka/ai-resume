# AkaGavin — Evidence Noir

纯静态电影化个人网站。视觉与操作母版为原创 `Evidence Noir`：人物纪录片、决策原则、交互证据室和项目证据档案共同组成公开叙事。

网站不是传统求职简历。它通过身份坐标、经历路径、人格特征、能力原子、项目证据和公开边界，表达一个由现实经营持续校验的个人操作系统。

公网地址：`https://akagavin-evidence-noir.pages.dev/`

## 本地预览

为保证 iframe、浏览器存储和跨页面跳转一致，在本目录启动静态服务器：

```powershell
py -m http.server 4173
```

访问 `http://127.0.0.1:4173/`。

## 内容结构

- `00_PROFILE_BRIEF.md`: 公开画像、七 Agent 映射和隐私边界锚点，不进入发布包。
- `01_EVIDENCE_LEDGER.md`: 42 条公开证据的内部来源映射和证据缺口，不进入发布包。
- `02_PUBLIC_CONTENT_REVIEW.md`: 可公开、需脱敏和禁止公开内容审查，不进入发布包。
- `evidence-data.js`: 42 条证据、24 个能力档案、12 条原则档案、20 个经历事件与 11 个项目映射。
- `site-data.js`: 身份坐标、经历、特征、24 项能力原子、原则、研究线和项目证据档案。
- `index.html` / `script.js`: 三幕电影叙事、章节导航、原则、项目与能力映射。
- `infinite-canvas.html` / `canvas.js`: 使用镜头平移、缩放、节点拖动和按需关系聚焦的 Evidence Room。
- `pages/project.html`: 项目合同、证据记录和能力映射通用模板。
- `assets/`: 自托管字体与 AkaGavin 公开人物照片。

## 七 Agent 公开映射

- `Akagavin` -> Akagavin Hub
- `Trading-System` -> Trading-System
- `Heart` -> Human Layer，只表达人因方法，不公开私人记录
- `Technical expert` -> Technical expert
- `Visual Workflow Collection` -> Visual Workflow
- `交易机会触发（预警）` -> Event Alert
- `Agent Health Monitor` -> Health Monitor

`Decision Interface` 是共享报告基础设施，不是第八个 Agent。Sales SDR 保持排除，退役工作流不会重新引入。

## 画布操作

- 滚轮或双指：缩放画布。
- 拖动空白处：平移画布。
- 拖动档案：重排证据关系。
- 选择档案：仅高亮直接关系并打开证据详情。
- `Esc`：关闭详情；`0`：重置镜头。

Evidence Room 不写入浏览器存储；每次打开都从公开数据源生成一致的初始关系图。

## Cloudflare 发布包

先生成严格白名单的发布目录：

```powershell
.\scripts\build-release.ps1
```

脚本只复制网站运行文件、详情模板、字体和图片到 `dist/`，并检查私有路径、凭据特征和禁止发布目录。`00_PROFILE_BRIEF.md`、`README.md`、`archive/`、`deploy/` 和 `scripts/` 不会进入发布包。

内容关系校验：

```powershell
node .\scripts\validate-evidence.js
```

它会校验证据、能力、原则、经历和项目引用完整性，以及最低公开内容数量和敏感模式。

Cloudflare Pages Direct Upload 可以在控制台拖放 `dist/`，也可以在完成 Cloudflare 登录后使用：

```powershell
npx wrangler pages deploy .\dist --project-name=akagavin
```

当前 Cloudflare Pages 项目为 `akagavin-evidence-noir`。Cloudflare 会把 `.html` 路径规范化为无扩展名路径，但原始链接仍可正常跳转。自定义域名应在 Pages 项目设置中关联后再配置 DNS。

Direct Upload 项目不能原地切换为 Git Integration。如果后续需要每次提交自动发布，应新建一个只包含公开发布内容的独立仓库和 Pages 项目。

## 公开边界

允许发布：稳定画像、方法论、系统结构、研究方向、公开职责和能力证据。

默认排除：真实姓名、家庭信息、资产金额、账户、持仓、收益、心理记录、实时交易、雇主内部信息、Token、API、数据库 ID、私有路径和凭据。

## 归档

- `archive/command-interface-2026-07-10/`: 旧版 Command Interface。
- `archive/hiesther-replica-2026-07-11-v1/`: 细颗粒画像扩展前的已验收版本。
- `archive/evidence-atlas-v1-2026-07-11-1000/`: Evidence Noir 重构前的完整可回滚版本。
- `archive/source-photos-2026-07-11/`: 不进入发布包的高分辨率原始照片。
