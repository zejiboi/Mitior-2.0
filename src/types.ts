export interface ValueEngineNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'outcome';
  x: number;
  y: number;
  engineType: 'growth' | 'fulfillment';
  description: string;
  isPowerStage?: boolean;
  playbookId?: string;
  nextNodes?: string[]; // IDs of connected nodes
}

export interface PlaybookStep {
  id: string;
  text: string;
  done: boolean;
  dependsOnStepId?: string;
}

export interface Playbook {
  id: string;
  title: string;
  powerStageId: string;
  powerStageLabel: string;
  ownerId: string;
  instructions: string;
  steps: PlaybookStep[];
  videoUrl?: string;
  lastUpdated: string;
}

export interface TeamMember {
  id: string;
  name: string;
  manager: string;
  jobTitle: string;
  accountabilities: string[];
  isFounder: boolean;
  photoUrl?: string;
  customPhoto?: string;
  isVacant?: boolean;
}

export type MetricCategory = 'evergreen' | 'northstar' | 'marketing' | 'sales';

export interface ScorecardMetric {
  id: string;
  name: string;
  category: MetricCategory;
  weeklyActuals: { [weekId: string]: string }; // e.g. "Week 1": "250000"
  target: string;
  ownerId: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  metricSource: string;
  unit: string;
  notes: string;
  playbookId?: string;
}

export interface SprintInitiative {
  id: string;
  name: string;
  dueDate: string;
  status: 'Accomplished' | 'On-Track' | 'Behind' | 'Reprioritized' | 'Not Started';
  ownerId: string;
  stakeholders: string;
  team: string;
  pillar: string;
}

export interface SprintPlan {
  quarter: string; // e.g. "Q2 2026"
  rallyCry: string; // e.g. "Pivot To (Fitness) Partners"
  revenueGoalGood: string;
  revenueGoalBetter: string;
  revenueGoalBest: string;
  unitGoalName: string;
  unitGoalValue: string;
  month1Name: string;
  month1Goal: string;
  month2Name: string;
  month2Goal: string;
  month3Name: string;
  month3Goal: string;
  strategicPillars: { title: string; desc: string }[];
  initiatives: SprintInitiative[];
}

export interface ClarityCompass {
  threeYearTarget: string; // COMPANY CASE
  purposeStatement: string; // CUSTOMER CASE
  coreValues: string[]; // CULTURE CASE
  strategicAnchors: string[]; // COMPETITIVE CASE
}

export interface DecisionEvaluation {
  id: string;
  decisionName: string;
  date: string;
  companyCaseScore: number; // 1-5
  companyCaseNotes: string;
  customerCaseScore: number; // 1-5
  customerCaseNotes: string;
  cultureCaseScore: number; // 1-5
  cultureCaseNotes: string;
  competitiveCaseScore: number; // 1-5
  competitiveCaseNotes: string;
  verdict: string; // Recommendation
  overallScore: number; // 0-100
}

export interface MeetingAgenda {
  id: string;
  name: string;
  frequency: string;
  duration: string;
  purpose: string;
  participants: string;
  rule: string;
  agendaItems: { duration: string; topic: string; description: string }[];
}

// Initial/preset demo data with clean, zero-valued fields
export const INITIAL_COMPASS: ClarityCompass = {
  threeYearTarget: "",
  purposeStatement: "",
  coreValues: [],
  strategicAnchors: []
};

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: "tm-1", name: "Administrator", manager: "Board", jobTitle: "Founder & CEO", accountabilities: [], isFounder: true }
];

export const INITIAL_PLAYBOOKS: Playbook[] = [];

export const INITIAL_GROWTH_NODES: ValueEngineNode[] = [];

export const INITIAL_FULFILLMENT_NODES: ValueEngineNode[] = [];

export const INITIAL_SCORECARD: ScorecardMetric[] = [];

export const INITIAL_SPRINT_PLAN: SprintPlan = {
  quarter: "",
  rallyCry: "",
  revenueGoalGood: "",
  revenueGoalBetter: "",
  revenueGoalBest: "",
  unitGoalName: "",
  unitGoalValue: "",
  month1Name: "Month 1",
  month1Goal: "",
  month2Name: "Month 2",
  month2Goal: "",
  month3Name: "Month 3",
  month3Goal: "",
  strategicPillars: [],
  initiatives: []
};

export const STANDARD_MEETING_AGENDAS: MeetingAgenda[] = [
  {
    id: "ma-1",
    name: "90-Minute Weekly Pulse Check-In",
    frequency: "Weekly (Every Monday Morning)",
    duration: "90 Minutes",
    purpose: "Review the company scorecard metrics, solve current red-light bottlenecks, make resource planning decisions, and ensure commitment to the sprint plan.",
    participants: "Core Leadership Team",
    rule: "No scorecard... No meeting!",
    agendaItems: [
      { duration: "5 min", topic: "Good News Sharing", description: "Sharing one personal and one professional win from each leadership member to build dynamic alignment." },
      { duration: "15 min", topic: "Scorecard Metric Audit", description: "Quick scan of evergreen and north star metrics cells. Identify which cells are flagged as RED or YELLOW." },
      { duration: "10 min", topic: "Sprint Milestone Review", description: "Check status of the active Quarterly Sprint initiatives (On-Track, Behind, Accomplished)." },
      { duration: "5 min", topic: "Customer & Employee Headlines", description: "Hot-topic updates or immediate critical shoutouts about clients." },
      { duration: "50 min", topic: "IDS Panel (Identify, Discuss, Solve)", description: "The core engine: Select key RED metrics and solve them fundamentally using the Clarity Compass framework." },
      { duration: "5 min", topic: "To-Do Listing and Wrap-Up", description: "List actionable next-steps, double-check who owns what task, and declare immediate milestones." }
    ]
  },
  {
    id: "ma-2",
    name: "Monthly Business Review & Reset",
    frequency: "Monthly (Last Tuesday of Month)",
    duration: "4 Hours",
    purpose: "Review overall cash collection trends, diagnose long-term progress of strategic pillars, and pivot the sprint plan in light of last month's events.",
    participants: "Full Leadership + Team Managers",
    rule: "Must compile HubSpot and quick accounting sheets 24 hours prior to meeting runtime.",
    agendaItems: [
      { duration: "30 min", topic: "Comprehensive Monthly performance metrics summary", description: "Audit long-tail reports from the previous month of finance, operations, and channel acquisitions." },
      { duration: "60 min", topic: "Quarterly Sprint Alignment Review", description: "Audit original roadmap milestones. Are we likely to hit the Good/Better/Best targets?" },
      { duration: "90 min", topic: "SOP & Value Engine Audit", description: "Identify if any flow chart bottleneck requires drafting or optimizing an active Playbook." },
      { duration: "60 min", topic: "Resource & Capital Reallocation", description: "Solve strategic budget allocation, tools selection, or hiring pipelines." }
    ]
  }
];

export interface RecentActivity {
  id: string;
  timestamp: string;
  type: 'playbook' | 'scorecard' | 'team';
  action: 'added' | 'completed' | 'updated' | 'deleted' | 'imported';
  message: string;
}

