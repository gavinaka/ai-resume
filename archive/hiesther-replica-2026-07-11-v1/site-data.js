window.SITE_DATA = {
  profile: {
    name: "AkaGavin",
    handle: "akagavin",
    role: "B2B SaaS 经营者 / 决策系统实践者",
    headline: "1 Person + AI = 1 Operating System",
    summary: "把业务经营、交易纪律、资产框架与 AI Agent 工作流，转成可观察、可执行、可复盘的系统。",
    location: "Shenzhen / Hong Kong",
    email: "待审核",
    publicBoundary: "仅展示方法、结构与公开项目，不展示私人数据和实时交易信息。"
  },

  terminal: [
    { type: "cmd", prompt: "$ ", text: "whoami" },
    { type: "output", prefix: "> ", text: "AkaGavin" },
    { type: "blank" },
    { type: "cmd", prompt: "$ ", text: "cat about.md" },
    { type: "output", prefix: "> ", text: "在不确定性中建立秩序" },
    { type: "output", prefix: "  ", text: "B2B SaaS 经营 / 决策系统 / AI Agent" },
    { type: "output", prefix: "  ", text: "事实优先，流程可审计，结果可复盘" },
    { type: "blank" },
    { type: "cmd", prompt: "$ ", text: "echo \"1 person + AI = 1 operating system\"" },
    { type: "gold", prefix: "> ", text: "1 person + AI = 1 operating system" },
    { type: "blank" },
    { type: "cmd", prompt: "$ ", text: "open akagavin-os.app", cursor: true }
  ],

  desktopIcons: [
    { label: "公开画像", kind: "file-md", window: "profile", column: 0, row: 0 },
    { label: "决策系统", kind: "file-md", window: "decision", column: 0, row: 1 },
    { label: "交易系统", kind: "file-html", href: "pages/project.html?id=trading-system", column: 0, row: 2 },
    { label: "研究账本", kind: "file-md", href: "pages/project.html?id=research-ledger", column: 0, row: 3 },
    { label: "公开边界", kind: "file-md", window: "boundary", column: 0, row: 4 },
    { label: "Agent 治理", kind: "folder", window: "agent-governance", column: 1, row: 0 },
    { label: "技术专家", kind: "file-html", href: "pages/project.html?id=technical-expert", column: 1, row: 1 },
    { label: "可视工作流", kind: "file-html", href: "pages/project.html?id=visual-workflow", column: 1, row: 2 },
    { label: "健康监控", kind: "file-html", href: "pages/project.html?id=agent-health", column: 1, row: 3 },
    { label: "事件预警", kind: "file-html", href: "pages/project.html?id=event-alert", column: 1, row: 4 },
    { label: "Work With Me", kind: "folder", window: "work", column: 2, row: 0 },
    { label: "Agent Console", kind: "app", window: "agent-console", column: 2, row: 1 },
    { label: "系统地图", kind: "folder", window: "system-map", column: 2, row: 2 }
  ],

  windows: {
    profile: {
      type: "profile",
      title: "公开画像",
      width: 520,
      body: {
        title: "AkaGavin",
        subtitle: "系统思考者，B2B SaaS 经营者",
        paragraphs: [
          "不把能力写成技能清单，而是展示如何把复杂问题拆成稳定系统。",
          "长期关注业务经营、市场结构、资产纪律和多 Agent 工作流。"
        ],
        tags: ["Evidence first", "Process first", "Audit first"]
      }
    },
    decision: {
      type: "document",
      title: "决策系统",
      width: 560,
      body: {
        heading: "把变量转成可管理的常量",
        intro: "系统的目的不是预测一切，而是在不确定条件下保持稳定决策质量。",
        items: [
          ["事实分层", "明确区分事实、推断、假设与未知。"],
          ["执行纪律", "先写计划，再执行；流程错误不能被结果洗白。"],
          ["验证闭环", "先验证样本，再扩大规模；每次结论都能追溯。"],
          ["权限治理", "真实数据源只读，写入行为单独授权。"]
        ]
      }
    },
    boundary: {
      type: "document",
      title: "公开边界",
      width: 520,
      body: {
        heading: "公开的是方法，不是私人数据",
        intro: "本网站仅使用经过筛选的公开层内容。",
        items: [
          ["允许公开", "方法论、系统结构、研究方向、项目职责。"],
          ["默认隐藏", "真实姓名、家庭信息、资产金额、账户和持仓。"],
          ["严格排除", "Token、API、数据库 ID、私有路径和雇主敏感信息。"]
        ]
      }
    },
    "agent-governance": {
      type: "folder",
      title: "Agent 治理",
      width: 500,
      body: {
        entries: [
          { label: "Technical expert", kind: "file-html", href: "pages/project.html?id=technical-expert" },
          { label: "Visual Workflow Collection", kind: "file-html", href: "pages/project.html?id=visual-workflow" },
          { label: "Agent Health Monitor", kind: "file-html", href: "pages/project.html?id=agent-health" },
          { label: "Routing & Boundaries", kind: "file-md", window: "system-map" }
        ]
      }
    },
    "system-map": {
      type: "document",
      title: "系统地图",
      width: 580,
      body: {
        heading: "一个人，多套有边界的工作流",
        intro: "每个 Agent 只负责自己的领域。跨域默认只读，真实数据留在权威来源。",
        items: [
          ["Akagavin", "稳定画像与跨领域个人策略中枢。"],
          ["Trading-System", "交易纪律、风险门禁与正式报告生产系统。"],
          ["Technical expert", "架构诊断、代码维护和 Agent 工程。"],
          ["Visual Workflow", "隐私最小化的跨工作流可视化层。"],
          ["Health Monitor", "路径、编码、配置与输出可用性的治理监控。"]
        ]
      }
    },
    work: {
      type: "services",
      title: "Work With Me",
      width: 600,
      body: {
        heading: "复杂问题，先建立可执行系统",
        subtitle: "适合围绕业务经营与 AI Agent 工作流进行深度交流。",
        services: [
          {
            icon: "◇",
            title: "B2B SaaS 经营",
            text: "城市经营、销售系统、小微商户与业务结构分析。"
          },
          {
            icon: "⌘",
            title: "Agent 工作流",
            text: "边界设计、真相源、自动化治理与可审计交付。"
          }
        ],
        contact: "联系方式待审核"
      }
    },
    "agent-console": {
      type: "chat",
      title: "Agent Console",
      width: 720,
      height: 560,
      body: {
        messages: [
          { from: "user", text: "向访问者介绍一下 AkaGavin。" },
          { from: "agent", note: "读取公开画像。", text: "他更像一个系统经营者。工作、市场研究和 AI Agent 不是分散兴趣，而是同一套决策方法在不同场景中的应用。" },
          { from: "user", text: "这个网站会展示私人数据吗？" },
          { from: "agent", note: "公开边界已启用。", text: "不会。这里展示方法、结构和公开项目，不展示账户、资产、家庭或实时交易信息。" }
        ]
      }
    }
  },

  capabilities: [
    {
      title: "OPERATE & GROW",
      items: [
        ["城市经营", "B2B SaaS 一线经营与组织执行"],
        ["销售系统", "把目标拆成可追踪的动作与反馈"],
        ["业务结构", "从现金流和真实客户压力判断优先级"]
      ]
    },
    {
      title: "RESEARCH & DECIDE",
      items: [
        ["证据链", "事实、推断、假设与未知分层"],
        ["交易纪律", "计划、风险门禁、样本验证与复盘"],
        ["长期研究", "宏观、市场结构与现金流资产"]
      ]
    },
    {
      title: "BUILD & GOVERN",
      items: [
        ["Agent 工程", "真相源、权限边界与自动化闭环"],
        ["可视工作流", "隐私最小化的跨系统状态呈现"],
        ["健康治理", "路径、编码、配置和输出质量监控"]
      ]
    }
  ],

  workGroups: [
    {
      key: "dim_01",
      title: "决策与市场系统",
      description: "把市场观察、风险控制和执行纪律组织成可审计的生产流程。",
      projects: [
        { id: "trading-system", label: "Trading-System：交易系统化引擎" },
        { id: "event-alert", label: "事件预警：候选触发与二次判断" },
        { id: "research-ledger", label: "Research Ledger：长期研究地图" }
      ]
    },
    {
      key: "dim_02",
      title: "Agent 工程与治理",
      description: "用明确职责、只读边界和验证门禁，让多 Agent 系统保持可维护。",
      projects: [
        { id: "technical-expert", label: "Technical expert：诊断与修复工作流" },
        { id: "agent-health", label: "Agent Health Monitor：只读治理监控" }
      ]
    },
    {
      key: "dim_03",
      title: "可视化与知识系统",
      description: "把复杂状态转成能快速判断、追溯来源的可视化界面。",
      projects: [
        { id: "visual-workflow", label: "Visual Workflow Collection：七 Agent 全景" },
        { id: "personal-os", label: "Personal OS：个人决策界面" }
      ]
    },
    {
      key: "dim_04",
      title: "B2B SaaS 经营",
      description: "长期处在城市经营、销售执行和小微商户真实压力的一线。",
      projects: [
        { id: "b2b-operator", label: "Operator Notes：经营现场与结构判断" }
      ]
    }
  ],

  projects: {
    "trading-system": {
      title: "Trading-System",
      subtitle: "个人交易系统化引擎",
      summary: "把证据采集、风险门禁、正式分析、报告交付与复盘组织成可追溯工作流。",
      facts: ["规则先于观点", "证据失败才允许重采", "分析与交付都有机械门禁"],
      boundary: "本页不展示账户、仓位、收益、交易点位或实时判断。"
    },
    "technical-expert": {
      title: "Technical expert",
      subtitle: "AI Agent 工程与维护系统",
      summary: "从诊断、方案取舍、审批、实现到验证，形成可以复用的技术问题闭环。",
      facts: ["先诊断后开方", "修复根因而非掩盖症状", "问题解决后沉淀为知识资产"],
      boundary: "跨工作流写入必须先检查、提案并获得明确批准。"
    },
    "visual-workflow": {
      title: "Visual Workflow Collection",
      subtitle: "七 Agent 生态的只读状态可视化层",
      summary: "只消费最小状态元数据，用离线 HTML 报告呈现跨工作流变化。",
      facts: ["报告不是事实源", "不读取交易与资产明细", "不修改任何兄弟工作流"],
      boundary: "可视化负责解释状态，不负责替代业务系统判断。"
    },
    "agent-health": {
      title: "Agent Health Monitor",
      subtitle: "只读治理监控器",
      summary: "检查路径、治理文件、编码、自动化配置、运行探针、回滚证据和输出可用性。",
      facts: ["健康度不等于业务质量", "证据可信度独立呈现", "修复动作需要新的审批链"],
      boundary: "只发现治理问题，不从监控器直接修复源工作流。"
    },
    "event-alert": {
      title: "事件预警",
      subtitle: "事件驱动的候选提醒层",
      summary: "接收结构事件，完成校验、脱敏、去重与候选提醒，再进入人工二次判断。",
      facts: ["候选不是信号", "不执行交易", "公网接收器采用 fail-closed"],
      boundary: "不展示 Webhook 密钥、运行状态、候选明细和实时市场判断。"
    },
    "research-ledger": {
      title: "Research Ledger",
      subtitle: "长期研究地图",
      summary: "围绕中国宏观、小微商户、B2B SaaS、市场结构、现金流资产与 AI 工作流持续积累。",
      facts: ["结论必须回到证据", "研究和建议明确分离", "未知项保留未知"],
      boundary: "未核验的私人研究笔记不会被包装成公开建议。"
    },
    "personal-os": {
      title: "Personal OS",
      subtitle: "个人决策系统的公开界面",
      summary: "通过桌面、作品集和无限画布，把分散经历组织成一套可理解的系统。",
      facts: ["结构优先于技能清单", "公开层与私人层分离", "内容和交互可独立维护"],
      boundary: "所有卡片内容都经过公开边界过滤。"
    },
    "b2b-operator": {
      title: "Operator Notes",
      subtitle: "B2B SaaS 城市经营视角",
      summary: "从销售动作、团队执行、小微商户预算和现金流压力出发判断业务优先级。",
      facts: ["长期一线经营经验", "关注真实客户约束", "工作是稳定基座而非全部身份"],
      boundary: "不公开雇主内部数据、客户信息、薪酬与劳动事项。"
    }
  },

  canvas: {
    layers: [
      { id: "card-photo", label: "人物图", color: "blue" },
      { id: "card-profile", label: "个人信息", color: "yellow" },
      { id: "card-timeline", label: "经历时间线", color: "blue" },
      { id: "card-narrative", label: "核心叙事", color: "yellow" },
      { id: "card-skills", label: "能力地图", color: "blue" },
      { id: "card-trading", label: "Trading-System", color: "pink" },
      { id: "card-technical", label: "Technical expert", color: "blue" },
      { id: "card-visual", label: "可视工作流", color: "yellow" },
      { id: "card-health", label: "健康监控", color: "blue" },
      { id: "card-values", label: "价值观", color: "yellow" },
      { id: "card-principles", label: "决策原则", color: "blue" },
      { id: "card-sticky-1", label: "便签：主权", color: "yellow" },
      { id: "card-sticky-2", label: "便签：验证", color: "blue" }
    ],
    connections: [
      ["card-photo", "card-profile"],
      ["card-profile", "card-narrative"],
      ["card-profile", "card-timeline"],
      ["card-narrative", "card-principles"],
      ["card-principles", "card-trading"],
      ["card-principles", "card-technical"],
      ["card-technical", "card-visual"],
      ["card-technical", "card-health"],
      ["card-values", "card-profile"]
    ]
  }
};
