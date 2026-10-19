import { UserRole } from './types';

export type AssistantActionType =
  | 'navigate'
  | 'create_playbook'
  | 'add_team_member'
  | 'add_kpi'
  | 'add_sprint_initiative'
  | 'create_project'
  | 'switch_role'
  | 'toggle_theme'
  | 'trigger_backup'
  | 'open_installer'
  | 'download_srs'
  | 'admin_quick_login';

export interface AssistantAction {
  type: AssistantActionType;
  label: string;
  payload?: Record<string, any>;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedAction?: AssistantAction;
  suggestedActions?: AssistantAction[];
}

export interface AssistantUserMemory {
  userId: string;
  userName: string;
  userRole: string;
  notes: string[];
  messages: AssistantChatMessage[];
  updatedAt: number;
}

export interface AssistantRuntimeContext {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: UserRole | string;
  activeTab?: string;
  activeProjectName?: string;
  theme?: 'light' | 'dark';
  pinLockActive?: boolean;
  isAdminView?: boolean;
  counts?: {
    nodes?: number;
    playbooks?: number;
    teamMembers?: number;
    scorecard?: number;
    initiatives?: number;
    enquiries?: number;
    projects?: number;
  };
}

export interface AssistantProcessResult {
  reply: string;
  isGrounded: boolean;
  executedAction?: AssistantAction;
  suggestedActions: AssistantAction[];
  addedNote?: string;
  clearedNotes?: boolean;
}

/**
 * Unrelated general-world topics that should be refused so the bot stays focused
 * on helping the user understand and operate the tool and business concepts.
 */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(weather|forecast|temperature|rain|snow|humidity)\b/i,
  /\b(recipe|cook|bake|ingredients|pasta|pizza|chicken|cake|dinner)\b/i,
  /\b(football|soccer|basketball|nba|nfl|fifa|premier league|world cup|cricket|tennis)\b/i,
  /\b(bitcoin|ethereum|dogecoin|crypto price|stock market|nasdaq|forex)\b/i,
  /\b(president of|capital of|prime minister of|who won the war|history of rome|ww2)\b/i,
  /\b(write a poem|tell me a joke|horoscope|astrology|zodiac|tarot)\b/i,
  /\b(movie review|netflix|hollywood|celebrity|taylor swift|marvel|batman)\b/i,
  /\b(python script|java class|rust borrow|c\+\+ pointer|leetcode|binary tree|quicksort)\b/i,
  /\b(medical advice|symptoms of|prescribe|dosage|ibuprofen)\b/i
];

/**
 * Broad domain & plain-English keywords covering both technical Mitior terms
 * AND everyday plain-text ways users ask about how the tool works or how to do things.
 */
const MITIOR_AND_PLAIN_TEXT_KEYWORDS: RegExp[] = [
  // Tool & app general inquiries
  /\b(mitior|mos|tool|app|application|system|platform|software|program|site|website|page|screen|interface|portal)\b/i,
  /\b(work|works|working|use|using|start|getting started|beginner|new here|first step|tour|walkthrough|overview|explain|simple|plain|understand|meaning|mean|what is|what are|what does|how do|how does|how can| how to|where is|where do|where can|can i|can you|help|guide|show me|tell me|i want|i need)\b/i,
  // Business & everyday operational concepts (plain English)
  /\b(business|company|organization|operations|workflow|process|step|stage|pipeline|funnel|customer|client|lead|sales|marketing|delivery|service|onboarding)\b/i,
  /\b(checklist|instruction|manual|guide|procedure|document|write down|standard|sop|playbook|training|video)\b/i,
  /\b(team|people|person|staff|employee|worker|colleague|hire|manager|boss|role|job|responsibility|accountabilit|organogram|org chart|chart|roster|csv|import)\b/i,
  /\b(number|target|goal|measure|track|tracking|performance|result|weekly|scorecard|kpi|metric|vital|progress|chart|status)\b/i,
  /\b(plan|planning|90 day|90-day|quarter|quarterly|month|monthly|priority|priorities|task|project|initiative|sprint|rhythm|rally cry|rock|pillar|revenue|money)\b/i,
  /\b(decision|decide|idea|evaluate|test|score|vision|mission|purpose|value|future|3 year|3-year|three year|strategy|strategic|compass|clarity|4c|four c|go\/no-go)\b/i,
  /\b(enquir|question|message|inbox|ticket|support|reply|feedback|contact)\b/i,
  // Settings, saving, sharing, security, admin
  /\b(setting|profile|name|photo|avatar|ceo|fundi|operator|auditor|admin|administrator)\b/i,
  /\b(save|saving|saved|backup|snapshot|restore|recover|lose data|data|storage|cloud|local|sync|share|invite|code|s-os-|export|download|print)\b/i,
  /\b(pin|lock|unlock|shield|security|safe|protect|password|login|log in|sign in|signup|sign up|account|logout|log out)\b/i,
  /\b(srs|ieee|spec|specification|requirement|license|upgrade|payment|m-pesa|mpesa|card|billing|desktop|install)\b/i,
  /\b(theme|dark|light|color|appearance|dock|menu|bottom|top|sidebar|tab|navigate|open|go to|switch|create|add|make|new|remember|memory|note|forget|hi|hello|hey|thanks|thank you)\b/i
];

export function isQueryGroundedToMitior(query: string): boolean {
  const clean = query.trim();
  if (!clean) return true;

  const hasOffTopicKeyword = OFF_TOPIC_PATTERNS.some((rx) => rx.test(clean));
  const hasMitiorOrPlainKeyword = MITIOR_AND_PLAIN_TEXT_KEYWORDS.some((rx) => rx.test(clean));

  // Block explicit off-topic queries (weather, recipes, sports, etc.) unless tied to a workspace example
  if (hasOffTopicKeyword && !/\b(mitior|workspace|playbook|sop|kpi|sprint|compass|value engine)\b/i.test(clean)) {
    return false;
  }

  if (hasMitiorOrPlainKeyword) {
    return true;
  }

  // If it's a normal conversational sentence without off-topic triggers, allow it and contextualize it to the tool
  if (!hasOffTopicKeyword && clean.length <= 160) {
    return true;
  }

  return false;
}

export function processMitiorAssistantQuery(
  rawMessage: string,
  context: AssistantRuntimeContext,
  existingMemory: AssistantUserMemory
): AssistantProcessResult {
  const message = rawMessage.trim();
  const lower = message.toLowerCase();
  const roleLabel = String(context.userRole || existingMemory.userRole || 'ceo').toUpperCase();
  const isReadOnly = context.pinLockActive || context.userRole === 'auditor';
  const userName = context.userName || existingMemory.userName || 'Operator';

  // 1. STRICT GROUNDING CHECK (Blocks unrelated trivia like weather, cooking, sports, etc.)
  if (!isQueryGroundedToMitior(message)) {
    return {
      isGrounded: false,
      reply:
        `🔒 **System Helper Focus**: I am here to help you understand and use **Mitior 2.0** in plain, simple language — or perform actions for you inside the app.\n\n` +
        `I can't answer unrelated general trivia (like weather, recipes, or sports), but you can ask me anything in plain text about **how this tool works** or **what you want to get done**, such as:\n` +
        `- *"How does this tool work in simple terms?"*\n` +
        `- *"Where should I start as a new user?"*\n` +
        `- *"How do I write instructions for my team?"*\n` +
        `- *"Add Sarah as Sales Manager"* or *"Create a checklist for Client Onboarding"*`,
      suggestedActions: [
        { type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } },
        { type: 'navigate', label: 'Open 1. Value Engines', payload: { tab: 'engines' } },
        { type: 'navigate', label: 'Open 2. Playbooks/SOP', payload: { tab: 'playbooks' } }
      ]
    };
  }

  // 2. EXPLICIT MEMORY COMMANDS ("Remember that...", "What do you remember?", "Forget notes")
  const rememberMatch = message.match(/^(?:please\s+)?(?:remember|note|save to memory|memorize|keep in mind)\s+(?:that\s+|this:?\s*)?(.+)$/i);
  if (rememberMatch && rememberMatch[1]) {
    const noteText = rememberMatch[1].trim();
    return {
      isGrounded: true,
      addedNote: noteText,
      reply:
        `🧠 **Saved to Your Memory (${userName})**:\n> *"${noteText}"*\n\n` +
        `I've saved this note to your account. Even if you refresh or sign in later (including via Admin Login), you can ask *"What do you remember?"* or click the **Memory** button above to see it.`,
      suggestedActions: [
        { type: 'navigate', label: 'View Home Dashboard', payload: { tab: 'overview' } },
        { type: 'navigate', label: 'Open 5. Sprints & Rhythms', payload: { tab: 'sprint' } }
      ]
    };
  }

  if (/\b(clear memory|forget everything|reset notes|clear notes|delete my notes)\b/i.test(lower)) {
    return {
      isGrounded: true,
      clearedNotes: true,
      reply: `🧹 **Notes Cleared**: I've cleared all saved custom notes for **${userName}**. You can add new ones anytime by saying *"Remember that..."*.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } }
      ]
    };
  }

  if (/\b(what do you remember|show my memory|my memory|saved notes|what do you know about me|my notes)\b/i.test(lower)) {
    const notesList =
      existingMemory.notes && existingMemory.notes.length > 0
        ? existingMemory.notes.map((n, idx) => `${idx + 1}. ${n}`).join('\n')
        : '_No saved notes yet. Just type `"Remember that our main goal this month is 20 new clients"` and I will save it for you._';

    const recentExecuted = existingMemory.messages
      .filter((m) => m.executedAction)
      .slice(-5)
      .map((m) => `- **${m.executedAction?.label}** (${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
      .join('\n');

    return {
      isGrounded: true,
      reply:
        `🧠 **Your Saved Memory (${userName})**\n` +
        `- **Signed in as**: **${userName}** (Role: \`${roleLabel}\`${isReadOnly ? ' — Read-Only Mode' : ''})\n` +
        `- **Current Workspace**: **${context.activeProjectName || 'My Workspace'}**\n\n` +
        `**Your Saved Notes:**\n${notesList}\n\n` +
        `**Recent Actions I Ran For You:**\n${recentExecuted || '_None yet in this session._'}`,
      suggestedActions: [
        { type: 'navigate', label: 'Open Profile & Settings', payload: { tab: 'settings', settingsTab: 'profile' } },
        { type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } }
      ]
    };
  }

  // 3. PLAIN-TEXT & NATURAL ACTION EXECUTION INTENTS
  // Understands both technical terms ("create playbook X") and simple everyday phrasing ("make a checklist for X", "write instructions for X")

  // 3A. Create Playbook / SOP / Checklist / Guide
  const createPlaybookMatch = message.match(
    /(?:create|add|new|generate|make|write|start|build)\s+(?:a\s+|an\s+)?(?:new\s+)?(?:playbook|sop|checklist|guide|manual|instructions?|procedure)(?:\s+(?:called|named|titled|for|on|about))?\s*[:\-"]?\s*([^".!?]+)["']?/i
  );
  if (createPlaybookMatch && createPlaybookMatch[1] && !/^(how|what|where|why|can you explain)\b/i.test(message)) {
    const pbTitle = createPlaybookMatch[1].trim();
    if (isReadOnly) {
      return {
        isGrounded: true,
        reply:
          `🛡️ **Read-Only Mode Active**: I can't create **"${pbTitle}"** right now because your workspace is locked (${context.pinLockActive ? 'PIN Lock is turned on' : 'you are in Auditor view-only role'}).\n\n` +
          `**How to fix this**: Unlock the PIN at the top of the screen, or switch your role to **CEO**, **Fundi**, or **Operator** in Settings.`,
        suggestedActions: [
          { type: 'navigate', label: 'Open Settings (Unlock / Role)', payload: { tab: 'settings' } },
          { type: 'navigate', label: 'View Existing Playbooks', payload: { tab: 'playbooks' } }
        ]
      };
    }
    const action: AssistantAction = {
      type: 'create_playbook',
      label: `Created Playbook Checklist: "${pbTitle}"`,
      payload: { title: pbTitle }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply:
        `✅ **Done!** I created a new step-by-step Playbook called **"${pbTitle}"** and opened **2. Playbooks/SOP** for you.\n\n` +
        `**What you can do next in plain steps:**\n` +
        `1. Click on **"${pbTitle}"** in the list.\n` +
        `2. Type out the instructions and add checklist steps your team should follow.\n` +
        `3. Check boxes off as tasks get done!`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 2. Playbooks/SOP', payload: { tab: 'playbooks' } },
        { type: 'navigate', label: 'Link to 1. Value Engines', payload: { tab: 'engines' } }
      ]
    };
  }

  // 3B. Add Team Member / Person / Staff / Employee
  const addTeamMatch =
    message.match(
      /(?:add|onboard|create|hire|put)\s+(?:a\s+|an\s+)?(?:new\s+)?(?:team\s+member|operator|staff|employee|person|member|worker|colleague)?\s*(?:named\s+|called\s+)?([A-Za-z][A-Za-z0-9\s._-]{1,35}?)\s+(?:as|to be|for role|with role)\s+([A-Za-z0-9\s/&_-]+)$/i
    ) ||
    message.match(
      /(?:add|onboard|create|hire)\s+(?:a\s+|an\s+)?(?:new\s+)?(?:team\s+member|operator|staff|employee|person)\s+(?:named\s+|called\s+)?([A-Za-z0-9\s._-]+?)(?:\s+as\s+([A-Za-z0-9\s/&_-]+))?$/i
    );
  if (
    addTeamMatch &&
    addTeamMatch[1] &&
    !/^(how|what|where|why)\b/i.test(message) &&
    !/\b(kpi|metric|playbook|sop|checklist|workspace|project|initiative|rock)\b/i.test(addTeamMatch[1])
  ) {
    const memberName = addTeamMatch[1].trim();
    const jobTitle = (addTeamMatch[2] || 'Operations Specialist').trim();
    if (isReadOnly) {
      return {
        isGrounded: true,
        reply: `🛡️ **Read-Only Mode**: I can't add **${memberName}** while the workspace is in Read-Only mode. Switch your role to **CEO** or **Fundi** in Settings first.`,
        suggestedActions: [{ type: 'navigate', label: 'Open 7. Settings', payload: { tab: 'settings' } }]
      };
    }
    const action: AssistantAction = {
      type: 'add_team_member',
      label: `Added "${memberName}" (${jobTitle}) to Team`,
      payload: { name: memberName, jobTitle }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply:
        `✅ **Done!** I added **${memberName}** as **${jobTitle}** to your company org chart in **3. Team Canvas**.\n\n` +
        `You can click on their card anytime to update who they report to or what tasks they are responsible for.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 3. Team Canvas', payload: { tab: 'team' } },
        { type: 'navigate', label: 'Bulk Import Team CSV (Settings)', payload: { tab: 'settings', settingsTab: 'import' } }
      ]
    };
  }

  // 3C. Add Scorecard KPI / Weekly Number / Target
  const addKpiMatch = message.match(
    /(?:add|create|new|track|measure)\s+(?:a\s+)?(?:weekly\s+)?(?:kpi|metric|scorecard metric|number|target)(?:\s+(?:called|named|for))?\s*[:\-"]?\s*([A-Za-z0-9\s%$/_-]+?)(?:\s+(?:with\s+)?(?:goal|target|of)\s+([A-Za-z0-9$%.,]+))?$/i
  );
  if (addKpiMatch && addKpiMatch[1] && !/^(how|what|where|why)\b/i.test(message)) {
    const kpiName = addKpiMatch[1].trim();
    const goalVal = (addKpiMatch[2] || '100').trim();
    if (isReadOnly) {
      return {
        isGrounded: true,
        reply: `🛡️ **Read-Only Mode**: Unlock the workspace or switch out of Auditor mode to add the metric **"${kpiName}"**.`,
        suggestedActions: [{ type: 'navigate', label: 'Open 4. Scorecard', payload: { tab: 'scorecard' } }]
      };
    }
    const action: AssistantAction = {
      type: 'add_kpi',
      label: `Added Weekly Metric "${kpiName}" (Target: ${goalVal})`,
      payload: { name: kpiName, goal: goalVal }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply:
        `✅ **Done!** I added **"${kpiName}"** with a weekly target of **${goalVal}** to **4. Vitals Scorecard**.\n\n` +
        `In plain terms: each week (Week 1 to Week 4), you or your team can type the actual number achieved into the table to see if you are on track.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 4. Vitals Scorecard', payload: { tab: 'scorecard' } }
      ]
    };
  }

  // 3D. Add Sprint Initiative / 90-Day Priority / Goal / Task
  const addInitiativeMatch = message.match(
    /(?:add|create|new|set)\s+(?:a\s+)?(?:sprint\s+initiative|initiative|quarterly\s+rock|rock|90-day\s+goal|quarterly\s+goal|priority\s+project)(?:\s+(?:called|named|titled|for|to))?\s*[:\-"]?\s*(.+)$/i
  );
  if (addInitiativeMatch && addInitiativeMatch[1] && !/^(how|what|where|why)\b/i.test(message)) {
    const initTitle = addInitiativeMatch[1].trim();
    if (isReadOnly) {
      return {
        isGrounded: true,
        reply: `🛡️ **Read-Only Mode**: Cannot add the 90-day priority **"${initTitle}"** while in Read-Only mode.`,
        suggestedActions: [{ type: 'navigate', label: 'Open 5. Sprints & Rhythms', payload: { tab: 'sprint' } }]
      };
    }
    const action: AssistantAction = {
      type: 'add_sprint_initiative',
      label: `Added 90-Day Priority: "${initTitle}"`,
      payload: { title: initTitle }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply:
        `✅ **Done!** I added **"${initTitle}"** to your 90-day plan in **5. Sprints & Rhythms**.\n\n` +
        `You can assign a team member to own it, set its due date, and update its status as you make progress this quarter.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 5. Sprints & Rhythms', payload: { tab: 'sprint' } }
      ]
    };
  }

  // 3E. Create New Workspace Project
  const createWorkspaceMatch = message.match(
    /(?:create|add|new|start)\s+(?:a\s+)?(?:new\s+)?(?:workspace|project|company\s+space|partition)(?:\s+(?:called|named|titled|for))?\s*[:\-"]?\s*([A-Za-z0-9\s_-]+)$/i
  );
  if (createWorkspaceMatch && createWorkspaceMatch[1] && !/^(how|what|where|why)\b/i.test(message)) {
    const wsName = createWorkspaceMatch[1].trim();
    if (isReadOnly) {
      return {
        isGrounded: true,
        reply: `🛡️ **Read-Only Mode**: Cannot create workspace **"${wsName}"** while in Read-Only mode.`,
        suggestedActions: [{ type: 'navigate', label: 'Open 7. Settings', payload: { tab: 'settings' } }]
      };
    }
    const action: AssistantAction = {
      type: 'create_project',
      label: `Created Workspace: "${wsName}"`,
      payload: { name: wsName, description: 'Created via Mitior OS Helper Bot' }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply: `✅ **Done!** I created and switched you into a separate workspace called **"${wsName}"**. Everything you add here stays separate from your other workspaces.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } },
        { type: 'navigate', label: 'Switch Workspaces (Settings)', payload: { tab: 'settings' } }
      ]
    };
  }

  // 3F. Switch Governance Role
  const switchRoleMatch = message.match(
    /(?:switch|change|set)\s+(?:my\s+)?role\s+to\s+(ceo|fundi|operator|auditor|admin|administrator)/i
  );
  if (switchRoleMatch && switchRoleMatch[1]) {
    const rawTarget = switchRoleMatch[1].toLowerCase();
    const targetRole: UserRole =
      rawTarget === 'admin' || rawTarget === 'administrator' ? 'ceo' : (rawTarget as UserRole);
    const action: AssistantAction = {
      type: 'switch_role',
      label: `Switched Role to ${targetRole.toUpperCase()}`,
      payload: { role: targetRole }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply:
        `✅ **Role Switched to ${targetRole.toUpperCase()}**!\n\n` +
        `**In simple terms, here is what each role means:**\n` +
        `- **CEO (Admin)**: Full control over everything, including backups, team sharing codes, and resetting data.\n` +
        `- **Fundi (Builder)**: Builds the company's workflows, checklists, and team structure.\n` +
        `- **Operator (Team Member)**: Uses checklists daily and updates weekly numbers.\n` +
        `- **Auditor (Viewer)**: View-only mode — can inspect everything safely without changing anything.`,
      suggestedActions: [
        { type: 'navigate', label: 'View Role in Settings', payload: { tab: 'settings' } },
        { type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } }
      ]
    };
  }

  // 3G. Toggle Theme (Dark / Light Mode)
  if (/\b(toggle theme|switch theme|dark mode|light mode|dark theme|light theme|change appearance)\b/i.test(lower) && !/^(how|what)\b/i.test(lower)) {
    const targetTheme =
      lower.includes('dark') ? 'dark' : lower.includes('light') ? 'light' : context.theme === 'dark' ? 'light' : 'dark';
    const action: AssistantAction = {
      type: 'toggle_theme',
      label: `Switched to ${targetTheme.toUpperCase()} Mode`,
      payload: { theme: targetTheme }
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply: `✅ **Done!** I switched the screen appearance to **${targetTheme} mode**.`,
      suggestedActions: [{ type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } }]
    };
  }

  // 3H. Trigger Server Backup / Save My Work
  if (/\b(backup workspace|trigger backup|create snapshot|save backup|backup now|run backup|save my work|save everything|back up my data)\b/i.test(lower) && !/^(how|what)\b/i.test(lower)) {
    const action: AssistantAction = {
      type: 'trigger_backup',
      label: 'Saved Workspace Backup Snapshot',
      payload: {}
    };
    return {
      isGrounded: true,
      executedAction: action,
      reply:
        `✅ **Saved!** Your changes are saved automatically as you type, and I also just created a restore point (backup snapshot) on the server.\n\n` +
        `If you ever want to go back to an earlier version, open **7. Settings → Database Snapshots** and click **Restore**.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open Settings (Backups)', payload: { tab: 'settings' } }
      ]
    };
  }

  // 3I. Direct Navigation Commands ("Go to ...", "Open ...", "Show ...", "Take me to ...")
  if (/^(go to|open|show|navigate to|take me to|switch to|launch|view)\b/i.test(lower) && !/\b(how|what|status|summary|memory|notes)\b/i.test(lower)) {
    const navMap: Array<{ keywords: RegExp; tab: string; title: string; desc: string }> = [
      { keywords: /\b(home|overview|dashboard|main|start)\b/i, tab: 'overview', title: 'Home Dashboard', desc: 'Your main summary screen showing recent activity, checklists, and weekly health.' },
      { keywords: /\b(value engine|engine|growth|fulfillment|flowchart|workflow|pipeline|process)\b/i, tab: 'engines', title: '1. Value Engines', desc: 'Visual flowchart of how you get customers (Growth) and how you deliver to them (Fulfillment).' },
      { keywords: /\b(playbook|sop|manual|checklist|instruction|guide|procedure)\b/i, tab: 'playbooks', title: '2. Playbooks/SOP', desc: 'Step-by-step instructions and checklists for your team.' },
      { keywords: /\b(team|organogram|roster|org chart|people|staff|employee)\b/i, tab: 'team', title: '3. Team Canvas', desc: 'Your company org chart showing who does what and who they report to.' },
      { keywords: /\b(scorecard|kpi|metric|vital|number|target|weekly)\b/i, tab: 'scorecard', title: '4. Vitals Scorecard', desc: 'Weekly numbers tracker to see if your business is hitting its goals.' },
      { keywords: /\b(sprint|rhythm|rock|quarter|rally cry|90-day|90 day|plan|priority)\b/i, tab: 'sprint', title: '5. Sprints & Rhythms', desc: 'Your 90-day action plan, revenue goals, and top quarterly priorities.' },
      { keywords: /\b(compass|clarity|4c|decision|vision|purpose|value|strategy)\b/i, tab: 'compass', title: '6. Clarity Compass', desc: 'Your 3-year company vision, core values, and the 4C Decision Calculator.' },
      { keywords: /\b(enquir|inbox|message|ticket|question|support)\b/i, tab: 'enquiries', title: '8. Enquiries', desc: 'Inbox for customer or team questions where you can reply directly.' },
      { keywords: /\b(srs|ieee|spec|requirement|traceability|doc)\b/i, tab: 'srs', title: '10. SRS Specs', desc: 'The full system requirements and architecture document.' },
      { keywords: /\b(setting|admin|config|backup|sync|pin|profile|blueprint|import)\b/i, tab: 'settings', title: '7. Settings & Admin', desc: 'Manage your profile, role, PIN lock, backups, and team sharing codes.' }
    ];

    for (const entry of navMap) {
      if (entry.keywords.test(lower)) {
        const action: AssistantAction = {
          type: 'navigate',
          label: `Opened ${entry.title}`,
          payload: { tab: entry.tab }
        };
        return {
          isGrounded: true,
          executedAction: action,
          reply: `✅ **Opened ${entry.title}**: ${entry.desc}`,
          suggestedActions: [
            { type: 'navigate', label: 'Back to Home Dashboard', payload: { tab: 'overview' } }
          ]
        };
      }
    }
  }

  // ============================================================================
  // 4. PLAIN-TEXT GENERAL KNOWLEDGE & CONTEXTUAL HOW-TO EXPLANATIONS
  // Explains concepts in everyday language AND connects them to how the tool works
  // ============================================================================

  // 4A. "How does this tool work?" / "What is this app?" / "Where do I start?" / "Explain in simple terms"
  if (
    /\b(how does (this|the) (tool|app|system|platform|software|mitior) work|what is (this|mitior|the app|the tool)|what does (this|mitior) do|where (do|should) i start|getting started|beginner|explain (everything|this|mitior)|how to use (this|mitior)|simple terms|plain text|plain english|walkthrough|tour)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `💡 **How Mitior 2.0 Works (In Plain, Simple Terms)**\n\n` +
        `Think of **Mitior 2.0** as an all-in-one digital binder for running your business clearly, so everything isn't stuck in one person's head. Here is how the 6 core parts fit together:\n\n` +
        `1. **Map How Your Business Runs (\`1. Value Engines\`)**:\n` +
        `   Draw a simple step-by-step map of how you find customers (**Growth**) and how you deliver your product or service (**Fulfillment**).\n` +
        `2. **Write Step-by-Step Checklists (\`2. Playbooks/SOP\`)**:\n` +
        `   For any important step in your business, write a simple checklist so anyone on your team can follow it without guessing.\n` +
        `3. **Organize Your Team (\`3. Team Canvas\`)**:\n` +
        `   List everyone on your team, their job title, who they report to, and what they are responsible for.\n` +
        `4. **Track Weekly Numbers (\`4. Scorecard\`)**:\n` +
        `   Pick a few key weekly numbers (like *New Sales Calls* or *Orders Delivered*) and enter the actual numbers each week (W1–W4) to spot problems early.\n` +
        `5. **Plan the Next 90 Days (\`5. Sprints & Rhythms\`)**:\n` +
        `   Instead of getting overwhelmed by a whole year, pick **one main theme** and a short list of top priorities for the next 3 months.\n` +
        `6. **Make Clear Decisions (\`6. Clarity Compass\`)**:\n` +
        `   Keep your company's 3-year vision in one place and use the built-in **Decision Calculator (4C Matrix)** to score new ideas from 1 to 5 before spending time or money on them.\n\n` +
        `👉 **Where to start?** Click any button below to jump straight to that step, or tell me in plain words what you want to do (for example: *"Create a checklist for Customer Onboarding"*).`,
      suggestedActions: [
        { type: 'navigate', label: 'Step 1: Open Value Engines', payload: { tab: 'engines' } },
        { type: 'navigate', label: 'Step 2: Open Playbooks (Checklists)', payload: { tab: 'playbooks' } },
        { type: 'navigate', label: 'Step 3: Open Team Canvas', payload: { tab: 'team' } },
        { type: 'navigate', label: 'Step 4: Open Weekly Scorecard', payload: { tab: 'scorecard' } }
      ]
    };
  }

  // 4B. Plain-text questions about Workflows / Processes / Getting Customers / Value Engines
  if (
    /\b(value engine|growth engine|fulfillment engine|power stage|map my business|business process|workflow|flowchart|how we get customers|deliver service)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `⚙️ **Value Engines — Explained in Plain Terms**\n\n` +
        `**What it is**: Every business has two main engines:\n` +
        `- **Growth Engine**: The steps a stranger takes to become a paying customer (e.g., *Sees Ad → Books Call → Signs Contract*).\n` +
        `- **Fulfillment Engine**: The steps your team takes to deliver great results after they pay (e.g., *Welcome Email → Setup → Delivery → Review*).\n\n` +
        `**What a "Power Stage" means**: A Power Stage is simply one of the most important steps in your flowchart where mistakes cost you money — so it needs a written checklist attached to it.\n\n` +
        `**How to use it in the tool:**\n` +
        `1. Open **1. Value Engines**.\n` +
        `2. Switch between **Growth** and **Fulfillment** at the top.\n` +
        `3. Click **+ Add Stage Node** to add a step, and toggle **Power Stage** if you want to link a checklist to it.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 1. Value Engines', payload: { tab: 'engines' } },
        { type: 'navigate', label: 'Open 2. Playbooks/SOP', payload: { tab: 'playbooks' } }
      ]
    };
  }

  // 4C. Plain-text questions about Checklists / Instructions / SOPs / Playbooks
  if (
    /\b(playbook|sop|standard operating|checklist|write instructions|train my team|how to do a task|procedure|manual)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `📘 **Playbooks & SOPs (Checklists) — Explained Simply**\n\n` +
        `**What "SOP" means**: SOP stands for *Standard Operating Procedure* — in plain English, it just means a **repeatable recipe or checklist** for how a task should be done in your company.\n\n` +
        `**How to use it in the tool:**\n` +
        `1. Go to **2. Playbooks/SOP** and click **+ New Playbook** (or just tell me *"Make a checklist for Opening the Store"*).\n` +
        `2. Write simple instructions, optionally paste a training video link, and add checkable steps.\n` +
        `3. When your team checks off steps, the app automatically records the progress on your **Home Dashboard**.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 2. Playbooks/SOP', payload: { tab: 'playbooks' } },
        { type: 'create_playbook', label: 'Create Sample "Client Onboarding Checklist"', payload: { title: 'Client Onboarding Checklist' } }
      ]
    };
  }

  // 4D. Plain-text questions about Team / People / Org Chart / Adding Staff / CSV Import
  if (
    /\b(team|organogram|org chart|add people|add someone|hire|staff|employee|who reports to|manager|roster|bulk import|csv)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `👥 **Team Canvas (Org Chart) — Explained Simply**\n\n` +
        `**What it is**: A clear visual map of everyone in your company, what their job title is, who manages them, and the 2–3 main things they are accountable for.\n\n` +
        `**How to add or manage people:**\n` +
        `- **Fastest way (ask me!)**: Type *"Add John Kamau as Operations Manager"* right here in the chat and I will add them immediately.\n` +
        `- **In the screen**: Open **3. Team Canvas** to add, edit, or view your team as cards or as a tree diagram.\n` +
        `- **Upload a spreadsheet**: If you have many employees, go to **7. Settings → Bulk Roster Import** to upload a \`.csv\` file in one click.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 3. Team Canvas', payload: { tab: 'team' } },
        { type: 'add_team_member', label: 'Add Sample Team Member (Alex Mwangi)', payload: { name: 'Alex Mwangi', jobTitle: 'Operations Coordinator' } },
        { type: 'navigate', label: 'Open Bulk CSV Import (Settings)', payload: { tab: 'settings' } }
      ]
    };
  }

  // 4E. Plain-text questions about Scorecard / KPIs / Tracking Numbers / Targets
  if (
    /\b(scorecard|kpi|metric|vital|track numbers|weekly numbers|measure performance|business goals|targets)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `📈 **Vitals Scorecard (Weekly Numbers) — Explained Simply**\n\n` +
        `**What a "KPI" is**: KPI stands for *Key Performance Indicator* — in plain English, it's a **weekly pulse number** that tells you if your business is healthy (for example: *New Leads per Week*, *Customer Response Time*, or *Weekly Revenue*).\n\n` +
        `**How to use it in the tool:**\n` +
        `1. Open **4. Scorecard** (or tell me *"Track Weekly Sales Calls with target 30"*).\n` +
        `2. Give each number an **Owner** (who is responsible) and a **Target** (what good looks like).\n` +
        `3. Fill in **Week 1, Week 2, Week 3, and Week 4** as the month goes on, and mark its status as **GREEN** (on track), **YELLOW** (needs attention), or **RED** (off track).`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 4. Vitals Scorecard', payload: { tab: 'scorecard' } },
        { type: 'add_kpi', label: 'Add Sample Metric: "Weekly Qualified Leads" (Target: 40)', payload: { name: 'Weekly Qualified Leads', goal: '40' } }
      ]
    };
  }

  // 4F. Plain-text questions about 90-Day Sprints / Quarterly Planning / Rally Cry / Rocks
  if (
    /\b(sprint|rhythm|rally cry|rock|initiative|pillar|90 day|90-day|quarterly plan|plan the quarter|priorities)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `🗓️ **90-Day Sprints & Rhythms — Explained Simply**\n\n` +
        `**Why 90 days?** A full year is too long to plan accurately, and a single week is too short for big projects. A **90-Day Sprint** (one quarter = 3 months) is the sweet spot for getting major projects finished.\n\n` +
        `**Plain-English meanings of the terms on this screen:**\n` +
        `- **Rally Cry**: Your #1 main theme for the next 3 months (e.g., *"Double Our Partner Network"*).\n` +
        `- **Good / Better / Best Revenue**: Your minimum, target, and stretch income goals for the quarter.\n` +
        `- **Strategic Pillars & Initiatives (Rocks)**: The 3 to 5 most important projects your team must finish before the 90 days end.\n\n` +
        `**Try it now**: Click below to open **5. Sprints & Rhythms**, or tell me *"Add sprint initiative Launch New Website"*.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 5. Sprints & Rhythms', payload: { tab: 'sprint' } },
        { type: 'add_sprint_initiative', label: 'Add Sample 90-Day Initiative', payload: { title: 'Automate Client Onboarding' } }
      ]
    };
  }

  // 4G. Plain-text questions about Clarity Compass / Making Decisions / 4C Matrix / Vision
  if (
    /\b(compass|clarity|4c|four c|decision|decide|evaluate an idea|go\/no-go|core value|purpose|3-year|three-year|vision|strategy)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `🧭 **Clarity Compass & 4C Decision Calculator — Explained Simply**\n\n` +
        `**What it is**: This screen keeps your big-picture company direction in one place AND gives you a simple calculator to test whether a new business idea is actually worth doing.\n\n` +
        `**How the 4C Decision Calculator works (in plain steps):**\n` +
        `Whenever you have a new idea or project, score it from **1 (Low)** to **5 (High)** on 4 simple questions:\n` +
        `1. **Customer**: Do our customers really want this?\n` +
        `2. **Company**: Does it fit our strengths and budget?\n` +
        `3. **Competition**: Does it give us an edge over competitors?\n` +
        `4. **Conditions**: Is the timing right right now?\n\n` +
        `The tool automatically calculates a percentage score: if it scores **70% or higher**, it gives you a green **GO**; below 70%, it warns you with a **NO-GO** so you don't waste time on distractions!`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 6. Clarity Compass', payload: { tab: 'compass' } }
      ]
    };
  }

  // 4H. Admin Login / Roles / Fundi / CEO / Operator / Auditor explained in plain text
  if (
    /\b(admin login|admin portal|admin console|administrator|admin credentials|admin access|what is a fundi|what is ceo|what is operator|what is auditor|roles|rbac|permissions)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `🛡️ **User Roles & Admin Login — Explained in Plain Terms**\n\n` +
        `**What the 4 Roles mean:**\n` +
        `- **CEO (Admin)**: The owner/administrator. Can edit everything, create backups, generate team sharing codes, and lock/reset the system.\n` +
        `- **Fundi (Systems Builder)**: *"Fundi"* is East African Swahili for a skilled craftsperson/architect. In Mitior, the Fundi designs the workflows, checklists, and team chart.\n` +
        `- **Operator (Team Member)**: Focused on daily work — checking off SOP steps and entering weekly scorecard numbers.\n` +
        `- **Auditor (Read-Only Viewer)**: Can look at every screen and report safely without being able to edit or delete anything.\n\n` +
        `**Admin Login Accounts (for quick testing or admin access):**\n` +
        `- **CEO Admin**: \`ryan@mitior.co\` (Password: \`password123\`)\n` +
        `- **Fundi Admin**: \`zejithefundi@gmail.com\` (Password: \`password123\`)`,
      suggestedActions: context.isAdminView
        ? [
            { type: 'admin_quick_login', label: '1-Click Sign In: CEO Admin (ryan@mitior.co)', payload: { email: 'ryan@mitior.co', password: 'password123', role: 'ceo' } },
            { type: 'admin_quick_login', label: '1-Click Sign In: Fundi Admin (zejithefundi@gmail.com)', payload: { email: 'zejithefundi@gmail.com', password: 'password123', role: 'fundi' } }
          ]
        : [
            { type: 'navigate', label: 'Open 7. Settings (Switch Role)', payload: { tab: 'settings' } },
            { type: 'switch_role', label: 'Switch My Role to CEO (Admin)', payload: { role: 'ceo' } },
            { type: 'switch_role', label: 'Switch My Role to Fundi (Builder)', payload: { role: 'fundi' } }
          ]
    };
  }

  // 4I. Saving, Backups, Sharing with Team (Sync Codes), and Security PIN Lock in plain text
  if (
    /\b(save|saving|backup|snapshot|restore|lose data|sync code|s-os-|share with team|invite team|colleague|pin|shield|lock|unlock|security|password)\b/i.test(lower)
  ) {
    return {
      isGrounded: true,
      reply:
        `🔐 **Saving, Sharing & Locking Your Work — Explained Simply**\n\n` +
        `1. **How saving works**: Every change you make is saved automatically right away. You can also save a permanent restore point on the server anytime by saying *"Backup workspace now"* or going to **7. Settings → Database Snapshots**.\n` +
        `2. **How to share your workspace with a teammate (Sync Codes)**:\n` +
        `   - Go to **7. Settings → 07. Create Sync Codes** and generate a code (it looks like \`S-OS-XXXX-YYYY\`).\n` +
        `   - Give that code to your teammate — when they enter it during setup, their screen automatically loads a copy of your workflows, checklists, and team chart!\n` +
        `3. **How the Security PIN Lock works**:\n` +
        `   - In **7. Settings → 05. Security Guard PIN**, you can set a 4-digit PIN.\n` +
        `   - Clicking the **Shield icon** at the top of the app locks the screen into **Read-Only mode** so nobody can accidentally change anything until the 4-digit PIN is entered.`,
      suggestedActions: [
        { type: 'trigger_backup', label: 'Save a Server Backup Right Now', payload: {} },
        { type: 'navigate', label: 'Open 7. Settings (PIN, Backups & Sync Codes)', payload: { tab: 'settings' } }
      ]
    };
  }

  // 4J. SRS Specification in plain text
  if (/\b(srs|ieee|specification|requirement|traceability|technical doc)\b/i.test(lower)) {
    return {
      isGrounded: true,
      reply:
        `📑 **10. SRS Specs (System Blueprint Document) — Explained Simply**\n\n` +
        `**What it is**: SRS stands for *Software Requirements Specification*. It is the complete blueprint explaining every feature, security rule, and role built into Mitior 2.0.\n\n` +
        `**How to use it**: Open **10. SRS Specs** from the sidebar or bottom menu to search for any feature, copy the text, or download the full \`SRS.md\` file in one click.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 10. SRS Specs', payload: { tab: 'srs' } },
        { type: 'download_srs', label: 'Download SRS.md File', payload: {} }
      ]
    };
  }

  // 4K. Enquiries Inbox in plain text
  if (/\b(enquir|inbox|ticket|message|customer question|reply)\b/i.test(lower)) {
    return {
      isGrounded: true,
      reply:
        `📥 **8. Enquiries Inbox — Explained Simply**\n\n` +
        `**What it is**: A simple built-in inbox where you can log and reply to questions or requests from clients and team members.\n\n` +
        `**How to use it**: Open **8. Enquiries**, click on any message to read it, type your reply right inside the card, and mark it as **In Progress** or **Resolved**.`,
      suggestedActions: [
        { type: 'navigate', label: 'Open 8. Enquiries Inbox', payload: { tab: 'enquiries' } }
      ]
    };
  }

  // 4L. Workspace Status / Summary
  if (/\b(status|summary|vitals|overview|how many|stats|what is in my workspace)\b/i.test(lower)) {
    const c = context.counts || {};
    return {
      isGrounded: true,
      reply:
        `📊 **Quick Summary of Your Workspace (${context.activeProjectName || 'My Workspace'})**\n\n` +
        `- **Signed in as**: **${userName}** (\`${roleLabel}\`)\n` +
        `- **Workflow Steps (Value Engines)**: **${c.nodes ?? 0}** steps mapped\n` +
        `- **Team Checklists (Playbooks/SOPs)**: **${c.playbooks ?? 0}** checklists\n` +
        `- **Team Members**: **${c.teamMembers ?? 0}** people on the org chart\n` +
        `- **Weekly Scorecard Numbers**: **${c.scorecard ?? 0}** metrics tracked\n` +
        `- **90-Day Priorities (Sprint Initiatives)**: **${c.initiatives ?? 0}** active goals\n` +
        `- **Your Saved Memory Notes**: **${existingMemory.notes.length}** notes`,
      suggestedActions: [
        { type: 'navigate', label: 'Open Home Dashboard', payload: { tab: 'overview' } },
        { type: 'trigger_backup', label: 'Save a Backup Snapshot Now', payload: {} }
      ]
    };
  }

  // 5. DEFAULT FRIENDLY PLAIN-TEXT GUIDE (When user says "hi", "help", or asks a general question)
  return {
    isGrounded: true,
    reply:
      `👋 Hi **${userName}**! You can talk to me in **plain, everyday language** — you don't need to know any special commands.\n\n` +
      `**Ask me general questions in plain text:**\n` +
      `- *"How does this tool work in simple terms?"*\n` +
      `- *"Where should I start?"*\n` +
      `- *"What is a Playbook / KPI / Value Engine / Fundi?"*\n` +
      `- *"How do I share my workspace with my team?"*\n` +
      `- *"How do I evaluate a new business idea?"*\n\n` +
      `**Or tell me in plain words what to do for you:**\n` +
      `- *"Make a checklist for Customer Onboarding"*\n` +
      `- *"Add Sarah Kimani as Sales Manager"*\n` +
      `- *"Track Weekly Demo Calls with target 30"*\n` +
      `- *"Add a 90-day goal to Launch Partner Portal"*\n` +
      `- *"Remember that our main focus this month is enterprise clients"*`,
    suggestedActions: context.isAdminView
      ? [
          { type: 'admin_quick_login', label: '1-Click Sign In: CEO Admin (ryan@mitior.co)', payload: { email: 'ryan@mitior.co', password: 'password123', role: 'ceo' } },
          { type: 'admin_quick_login', label: '1-Click Sign In: Fundi Admin (zejithefundi@gmail.com)', payload: { email: 'zejithefundi@gmail.com', password: 'password123', role: 'fundi' } }
        ]
      : [
          { type: 'navigate', label: 'Open 1. Value Engines', payload: { tab: 'engines' } },
          { type: 'navigate', label: 'Open 2. Playbooks (Checklists)', payload: { tab: 'playbooks' } },
          { type: 'navigate', label: 'Open 3. Team Canvas', payload: { tab: 'team' } },
          { type: 'navigate', label: 'Open 6. Clarity Compass', payload: { tab: 'compass' } }
        ]
  };
}
