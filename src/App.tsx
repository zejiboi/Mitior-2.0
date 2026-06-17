import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  Home, 
  Layers, 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar, 
  Compass, 
  Menu, 
  X,
  Laptop,
  Sun,
  Moon,
  Settings,
  Inbox,
  Lock,
  Unlock,
  ChevronDown,
  Sparkles,
  Download
} from 'lucide-react';

import { 
  ValueEngineNode, 
  Playbook, 
  TeamMember, 
  ScorecardMetric, 
  SprintPlan, 
  ClarityCompass,
  RecentActivity,
  INITIAL_COMPASS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_PLAYBOOKS,
  INITIAL_GROWTH_NODES,
  INITIAL_FULFILLMENT_NODES,
  INITIAL_SCORECARD,
  INITIAL_SPRINT_PLAN
} from './types';

import DashboardOverview from './components/DashboardOverview';
import ValueEngineView from './components/ValueEngineView';
import PlaybookFolderView from './components/PlaybookFolderView';
import TeamCanvasView from './components/TeamCanvasView';
import ScorecardView from './components/ScorecardView';
import SprintCanvasView from './components/SprintCanvasView';
import ClarityCompassView from './components/ClarityCompassView';
import SettingsView from './components/SettingsView';
import EnquiriesView, { Enquiry } from './components/EnquiriesView';
import LoginAuthView from './components/LoginAuthView';
import OnboardingPreloadView from './components/OnboardingPreloadView';
import LandingPageView from './components/LandingPageView';
import WorkspaceSelectorView from './components/WorkspaceSelectorView';
import DesktopInstallerModal from './components/DesktopInstallerModal';
import CheckoutPortal from './components/CheckoutPortal';


export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // Real-time local license states managed via local caching
  const [licenseTier, setLicenseTier] = useState<'free' | 'starter' | 'professional' | 'enterprise'>(() => {
    return (localStorage.getItem('sOS_license_tier') as 'free' | 'starter' | 'professional' | 'enterprise') || 'free';
  });
  const [licenseReceipt, setLicenseReceipt] = useState<string>(() => {
    return localStorage.getItem('sOS_license_receipt') || '';
  });
  const [showPaymentPortal, setShowPaymentPortal] = useState<boolean>(false);

  const [userName, setUserName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sOS_current_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.name || 'Ryan Deiss';
      }
    } catch {}
    const savedUser = localStorage.getItem('sOS_user');
    return savedUser || 'Ryan Deiss';
  });

  // --- Authentication States ---
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sOS_current_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sOS_current_account');
      return !saved; // Show onboarding if not logged in / first layout setup
    } catch {
      return true;
    }
  });

  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      const savedAccount = localStorage.getItem('sOS_current_account');
      const workspaceSetupDone = localStorage.getItem('sOS_workspace_setup_done') === 'true';
      return !(savedAccount && workspaceSetupDone);
    } catch {
      return true;
    }
  });
  const [initialSignUpMode, setInitialSignUpMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'ceo' | 'employee'>(() => {
    return (localStorage.getItem('sOS_user_role') as 'ceo' | 'employee') || 'ceo';
  });
  const [showWorkspaceSetup, setShowWorkspaceSetup] = useState<boolean>(() => {
    return !localStorage.getItem('sOS_workspace_setup_done');
  });
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);
  const [showInstallerPopout, setShowInstallerPopout] = useState<boolean>(false);

  // --- Workspace Security PIN Lock States ---
  const [pinLockActive, setPinLockActive] = useState<boolean>(false);
  const [isPinConfiguredOnServer, setIsPinConfiguredOnServer] = useState<boolean>(false);
  const [pinUnlockCode, setPinUnlockCode] = useState<string>('');
  const [pinUnlockError, setPinUnlockError] = useState<string | null>(null);
  const [showPinUnlockModal, setShowPinUnlockModal] = useState<boolean>(false);

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem("sOS_session_token") || "";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...extraHeaders
    };
  };

  const checkGlobalPinStatus = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/security/pin/status/${currentUser.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setIsPinConfiguredOnServer(data.configured);
        if (data.configured) {
          setPinLockActive(true);
        } else {
          setPinLockActive(false);
        }
      }
    } catch {
      setIsPinConfiguredOnServer(false);
      setPinLockActive(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkGlobalPinStatus();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("sOS_session_token");
      if (!token || !currentUser) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const serverTier = data.user.paidTicket || 'free';
            localStorage.setItem('sOS_license_tier', serverTier);
            setLicenseTier(serverTier);
          }
        } else if (res.status === 401) {
          handleLogout();
        }
      } catch (err) {
        console.warn("Auth verify offline", err);
      }
    };
    fetchMe();
  }, [currentUser]);

  const handleVerifyUnlockPin = async () => {
    if (!currentUser) return;
    setPinUnlockError(null);
    try {
      const res = await fetch("/api/security/pin/verify", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id, pin: pinUnlockCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPinLockActive(false);
        setShowPinUnlockModal(false);
        setPinUnlockCode('');
        setPinUnlockError(null);
      } else {
        setPinUnlockError("❌ Wrong PIN code!");
      }
    } catch {
      setPinUnlockError("❌ Server connection lost.");
    }
  };

  // Trigger local install guidance on first entry into active workstation
  useEffect(() => {
    if (currentUser && !showWelcome && !showWorkspaceSetup && !showLanding) {
      const sawPopup = localStorage.getItem('sOS_saw_installer_popout_v3');
      if (!sawPopup) {
        // Delay slightly for smooth transition feel
        const timer = setTimeout(() => {
          setShowInstallerPopout(true);
          localStorage.setItem('sOS_saw_installer_popout_v3', 'true');
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, showWelcome, showWorkspaceSetup, showLanding]);

  // --- Projects & Workspaces ---
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-blank');

  // Theme system state matching local storage and user preferences
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sOS_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Sync dark class list
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sOS_theme', theme);
  }, [theme]);

  // Sync with system preferences dynamically
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('sOS_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Core business system states
  const [nodes, setNodes] = useState<ValueEngineNode[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);

  // Undo/Redo State History Stacks
  const [nodesHistory, setNodesHistory] = useState<ValueEngineNode[][]>([]);
  const [nodesHistoryIndex, setNodesHistoryIndex] = useState<number>(-1);

  const [playbooksHistory, setPlaybooksHistory] = useState<Playbook[][]>([]);
  const [playbooksHistoryIndex, setPlaybooksHistoryIndex] = useState<number>(-1);

  const handleUpdateNodesWithHistory = (newNodes: ValueEngineNode[]) => {
    setNodes(newNodes);
    const nextHistory = nodesHistory.slice(0, nodesHistoryIndex + 1);
    const updatedHistory = [...nextHistory, newNodes];
    setNodesHistory(updatedHistory);
    setNodesHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndoNodes = () => {
    if (nodesHistoryIndex > 0) {
      const prevIndex = nodesHistoryIndex - 1;
      setNodesHistoryIndex(prevIndex);
      setNodes(nodesHistory[prevIndex]);
    }
  };

  const handleRedoNodes = () => {
    if (nodesHistoryIndex < nodesHistory.length - 1) {
      const nextIndex = nodesHistoryIndex + 1;
      setNodesHistoryIndex(nextIndex);
      setNodes(nodesHistory[nextIndex]);
    }
  };

  const handleUpdatePlaybooksWithHistory = (newPlaybooks: Playbook[]) => {
    setPlaybooks(newPlaybooks);
    const nextHistory = playbooksHistory.slice(0, playbooksHistoryIndex + 1);
    const updatedHistory = [...nextHistory, newPlaybooks];
    setPlaybooksHistory(updatedHistory);
    setPlaybooksHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndoPlaybooks = () => {
    if (playbooksHistoryIndex > 0) {
      const prevIndex = playbooksHistoryIndex - 1;
      setPlaybooksHistoryIndex(prevIndex);
      setPlaybooks(playbooksHistory[prevIndex]);
    }
  };

  const handleRedoPlaybooks = () => {
    if (playbooksHistoryIndex < playbooksHistory.length - 1) {
      const nextIndex = playbooksHistoryIndex + 1;
      setPlaybooksHistoryIndex(nextIndex);
      setPlaybooks(playbooksHistory[nextIndex]);
    }
  };

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardMetric[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sprintPlan, setSprintPlan] = useState<SprintPlan>({
    quarter: '',
    rallyCry: '',
    revenueGoalGood: '',
    revenueGoalBetter: '',
    revenueGoalBest: '',
    unitGoalName: '',
    unitGoalValue: '',
    month1Name: '',
    month1Goal: '',
    month2Name: '',
    month2Goal: '',
    month3Name: '',
    month3Goal: '',
    strategicPillars: [],
    initiatives: []
  });
  const [compass, setCompass] = useState<ClarityCompass>({
    threeYearTarget: '',
    purposeStatement: '',
    coreValues: [],
    strategicAnchors: []
  });

  // Selected Playbook in manual directory
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // 1. Manage loading workspaces on account changes
  useEffect(() => {
    if (!currentUser) return;

    const projectsKey = `sOS_projects_${currentUser.id}`;
    let savedProjects: any[] = [];
    try {
      const saved = localStorage.getItem(projectsKey);
      savedProjects = saved ? JSON.parse(saved) : [];
    } catch {}

    if (savedProjects.length === 0) {
      savedProjects = [
        { id: 'proj-blank', name: 'My Workspace', description: 'Your blank custom operating workspace.' }
      ];
      localStorage.setItem(projectsKey, JSON.stringify(savedProjects));
    }
    setProjects(savedProjects);

    const activeProjKey = `sOS_active_project_id_${currentUser.id}`;
    const savedActiveId = localStorage.getItem(activeProjKey) || 'proj-blank';
    setActiveProjectId(savedActiveId);
  }, [currentUser]);

  // 2. Load operational data when user account or project partition changes
  useEffect(() => {
    if (!currentUser || !activeProjectId) return;

    setDataLoaded(false);
    const accId = currentUser.id;
    const projId = activeProjectId;

    const nodK = `sOS_nodes_${accId}_${projId}`;
    const plbK = `sOS_playbooks_${accId}_${projId}`;
    const teamK = `sOS_team_${accId}_${projId}`;
    const scK = `sOS_scorecard_${accId}_${projId}`;
    const sprK = `sOS_sprint_${accId}_${projId}`;
    const cmpK = `sOS_compass_${accId}_${projId}`;
    const enqK = `sOS_enquiries_${accId}_${projId}`;
    const actK = `sOS_activities_${accId}_${projId}`;

    const storedNodes = localStorage.getItem(nodK);
    const storedPlaybooks = localStorage.getItem(plbK);
    const storedTeam = localStorage.getItem(teamK);
    const storedScorecard = localStorage.getItem(scK);
    const storedSprint = localStorage.getItem(sprK);
    const storedCompass = localStorage.getItem(cmpK);
    const storedEnquiries = localStorage.getItem(enqK);
    const storedActivities = localStorage.getItem(actK);

    const isMommyFit = (storedSprint && storedSprint.includes("MOMMY FIT")) ||
                       (storedPlaybooks && storedPlaybooks.includes("Christina Crews")) ||
                       (storedScorecard && (storedScorecard.includes("245000") || storedScorecard.includes("Christina Crews"))) ||
                       (storedTeam && storedTeam.includes("Christina Crews"));

    if (storedNodes && storedPlaybooks && storedTeam && storedScorecard && storedSprint && storedCompass && !isMommyFit) {
      const parsedNodes = JSON.parse(storedNodes);
      const parsedPlaybooks = JSON.parse(storedPlaybooks);
      
      setNodes(parsedNodes);
      setNodesHistory([parsedNodes]);
      setNodesHistoryIndex(0);

      setPlaybooks(parsedPlaybooks);
      setPlaybooksHistory([parsedPlaybooks]);
      setPlaybooksHistoryIndex(0);

      setTeamMembers(JSON.parse(storedTeam));
      setScorecard(JSON.parse(storedScorecard));
      setSprintPlan(JSON.parse(storedSprint));
      setCompass(JSON.parse(storedCompass));
      
      const parsedEnq = storedEnquiries ? JSON.parse(storedEnquiries) : [];
      setEnquiries(parsedEnq);

      const parsedAct = storedActivities ? JSON.parse(storedActivities) : [];
      setActivities(parsedAct);

      setSelectedPlaybookId(parsedPlaybooks[0]?.id || null);
    } else {
      // Setup pristine variables pre-filled with high-fidelity corporate operating records
      const initialNodes = [
        ...INITIAL_GROWTH_NODES.map(g => {
          const pbMatch = INITIAL_PLAYBOOKS.find(pb => pb.powerStageId === g.id);
          return { ...g, playbookId: pbMatch ? pbMatch.id : '' };
        }),
        ...INITIAL_FULFILLMENT_NODES.map(f => {
          const pbMatch = INITIAL_PLAYBOOKS.find(pb => pb.powerStageId === f.id);
          return { ...f, playbookId: pbMatch ? pbMatch.id : '' };
        })
      ];
      setNodes(initialNodes);
      setNodesHistory([initialNodes]);
      setNodesHistoryIndex(0);

      setPlaybooks(INITIAL_PLAYBOOKS);
      setPlaybooksHistory([INITIAL_PLAYBOOKS]);
      setPlaybooksHistoryIndex(0);

      setTeamMembers(INITIAL_TEAM_MEMBERS);
      setScorecard(INITIAL_SCORECARD);
      setSprintPlan(INITIAL_SPRINT_PLAN);
      setCompass(INITIAL_COMPASS);
      setEnquiries([]);
      setActivities([]);
      setSelectedPlaybookId(INITIAL_PLAYBOOKS[0]?.id || null);

      localStorage.setItem(nodK, JSON.stringify(initialNodes));
      localStorage.setItem(plbK, JSON.stringify(INITIAL_PLAYBOOKS));
      localStorage.setItem(teamK, JSON.stringify(INITIAL_TEAM_MEMBERS));
      localStorage.setItem(scK, JSON.stringify(INITIAL_SCORECARD));
      localStorage.setItem(sprK, JSON.stringify(INITIAL_SPRINT_PLAN));
      localStorage.setItem(cmpK, JSON.stringify(INITIAL_COMPASS));
      localStorage.setItem(enqK, JSON.stringify([]));
      localStorage.setItem(actK, JSON.stringify([]));
    }
    setDataLoaded(true);
  }, [currentUser, activeProjectId]);

  // Synchronize updates on edits
  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_nodes_${currentUser.id}_${activeProjectId}`, JSON.stringify(nodes));
  }, [nodes, currentUser, activeProjectId, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_playbooks_${currentUser.id}_${activeProjectId}`, JSON.stringify(playbooks));
  }, [playbooks, currentUser, activeProjectId, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_team_${currentUser.id}_${activeProjectId}`, JSON.stringify(teamMembers));
  }, [teamMembers, currentUser, activeProjectId, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_scorecard_${currentUser.id}_${activeProjectId}`, JSON.stringify(scorecard));
  }, [scorecard, currentUser, activeProjectId, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_sprint_${currentUser.id}_${activeProjectId}`, JSON.stringify(sprintPlan));
  }, [sprintPlan, currentUser, activeProjectId, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_compass_${currentUser.id}_${activeProjectId}`, JSON.stringify(compass));
  }, [compass, currentUser, activeProjectId, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !activeProjectId) return;
    localStorage.setItem(`sOS_enquiries_${currentUser.id}_${activeProjectId}`, JSON.stringify(enquiries));
  }, [enquiries, currentUser, activeProjectId]);

  useEffect(() => {
    localStorage.setItem('sOS_user', userName);
  }, [userName]);

  // Synchronize activities edits to local storage
  useEffect(() => {
    if (!currentUser || !activeProjectId || !dataLoaded) return;
    localStorage.setItem(`sOS_activities_${currentUser.id}_${activeProjectId}`, JSON.stringify(activities));
  }, [activities, currentUser, activeProjectId, dataLoaded]);

  // Keep track of previous state snapshots to automatically compute operational logs
  const prevPlaybooksRef = useRef<Playbook[]>([]);
  const prevScorecardRef = useRef<ScorecardMetric[]>([]);
  const prevTeamMembersRef = useRef<TeamMember[]>([]);
  const lastActiveProjectRef = useRef<string | null>(null);

  // Automatic change detection to log recent activities
  useEffect(() => {
    if (!dataLoaded || !currentUser || !activeProjectId) return;

    // On initial project partition load or switched project, set refs and skip log creation
    if (lastActiveProjectRef.current !== activeProjectId) {
      prevPlaybooksRef.current = playbooks;
      prevScorecardRef.current = scorecard;
      prevTeamMembersRef.current = teamMembers;
      lastActiveProjectRef.current = activeProjectId;
      return;
    }

    const newLogs: Array<{ type: 'playbook' | 'scorecard' | 'team', action: 'added' | 'completed' | 'updated' | 'deleted' | 'imported', message: string }> = [];

    // 1. Playbooks detection
    playbooks.forEach(curr => {
      const prev = prevPlaybooksRef.current.find(p => p.id === curr.id);
      if (!prev) {
        newLogs.push({
          type: 'playbook',
          action: 'added',
          message: `Created playbook SOP "${curr.title}"`
        });
      } else {
        const currSteps = curr.steps || [];
        const prevSteps = prev.steps || [];
        
        currSteps.forEach(cs => {
          const ps = prevSteps.find(s => s.id === cs.id);
          if (ps) {
            if (!ps.done && cs.done) {
              newLogs.push({
                type: 'playbook',
                action: 'completed',
                message: `Completed step "${cs.text}" in playbook "${curr.title}"`
              });
            } else if (ps.done && !cs.done) {
              newLogs.push({
                type: 'playbook',
                action: 'updated',
                message: `Marked step "${cs.text}" as incomplete in playbook "${curr.title}"`
              });
            }
          } else {
            newLogs.push({
              type: 'playbook',
              action: 'updated',
              message: `Added new step "${cs.text}" to playbook "${curr.title}"`
            });
          }
        });

        prevSteps.forEach(ps => {
          if (!currSteps.some(cs => cs.id === ps.id)) {
            newLogs.push({
              type: 'playbook',
              action: 'updated',
              message: `Removed step "${ps.text}" from playbook "${curr.title}"`
            });
          }
        });
      }
    });

    prevPlaybooksRef.current.forEach(prev => {
      if (!playbooks.some(curr => curr.id === prev.id)) {
        newLogs.push({
          type: 'playbook',
          action: 'deleted',
          message: `Removed playbook SOP "${prev.title}"`
        });
      }
    });

    // 2. Scorecard detection
    scorecard.forEach(curr => {
      const prev = prevScorecardRef.current.find(m => m.id === curr.id);
      if (!prev) {
        newLogs.push({
          type: 'scorecard',
          action: 'added',
          message: `Created scorecard KPI metric "${curr.name}"`
        });
      } else {
        const currWeeks = Object.keys(curr.weeklyActuals);
        
        currWeeks.forEach(w => {
          if (curr.weeklyActuals[w] !== prev.weeklyActuals[w]) {
            newLogs.push({
              type: 'scorecard',
              action: 'updated',
              message: `Updated actual value for KPI "${curr.name}" (${w}) to ${curr.weeklyActuals[w]}`
            });
          }
        });

        if (curr.status !== prev.status) {
          newLogs.push({
            type: 'scorecard',
            action: 'updated',
            message: `KPI "${curr.name}" status changed to ${curr.status}`
          });
        }
      }
    });

    prevScorecardRef.current.forEach(prev => {
      if (!scorecard.some(curr => curr.id === prev.id)) {
        newLogs.push({
          type: 'scorecard',
          action: 'deleted',
          message: `Removed KPI metric "${prev.name}"`
        });
      }
    });

    // 3. Team members detection
    teamMembers.forEach(curr => {
      const prev = prevTeamMembersRef.current.find(t => t.id === curr.id);
      if (!prev) {
        newLogs.push({
          type: 'team',
          action: 'added',
          message: `Onboarded team operator "${curr.name}" as "${curr.jobTitle}"`
        });
      } else {
        if (curr.jobTitle !== prev.jobTitle) {
          newLogs.push({
            type: 'team',
            action: 'updated',
            message: `Updated role for "${curr.name}" to "${curr.jobTitle}"`
          });
        }
        if (curr.manager !== prev.manager) {
          newLogs.push({
            type: 'team',
            action: 'updated',
            message: `Updated manager check-in point for "${curr.name}" to "${curr.manager}"`
          });
        }
        if ((curr.accountabilities || []).length !== (prev.accountabilities || []).length) {
          newLogs.push({
            type: 'team',
            action: 'updated',
            message: `Redefined accountabilities checklist list for "${curr.name}"`
          });
        }
      }
    });

    prevTeamMembersRef.current.forEach(prev => {
      if (!teamMembers.some(curr => curr.id === prev.id)) {
        newLogs.push({
          type: 'team',
          action: 'deleted',
          message: `Offboarded operator "${prev.name}" from active roster`
        });
      }
    });

    // Write logs to activities state
    if (newLogs.length > 0) {
      setActivities(prevAct => {
        const createdActs = newLogs.map((log, index) => ({
          id: `act-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          type: log.type,
          action: log.action,
          message: log.message
        }));
        
        return [...createdActs, ...prevAct].slice(0, 50);
      });
    }

    // Capture state for next run
    prevPlaybooksRef.current = playbooks;
    prevScorecardRef.current = scorecard;
    prevTeamMembersRef.current = teamMembers;

  }, [playbooks, scorecard, teamMembers, activeProjectId, dataLoaded, currentUser]);

  const handleImportSystemData = (imported: {
    playbooks: Playbook[];
    teamMembers: TeamMember[];
    scorecard: ScorecardMetric[];
    sprintPlan: SprintPlan;
    compass: ClarityCompass;
    nodes?: ValueEngineNode[];
  }) => {
    const importedNodes = imported.nodes || [];

    setNodes(importedNodes);
    setNodesHistory([importedNodes]);
    setNodesHistoryIndex(0);

    setPlaybooks(imported.playbooks);
    setPlaybooksHistory([imported.playbooks]);
    setPlaybooksHistoryIndex(0);

    setTeamMembers(imported.teamMembers);
    setScorecard(imported.scorecard);
    setSprintPlan(imported.sprintPlan);
    setCompass(imported.compass);

    setSelectedPlaybookId(imported.playbooks[0]?.id || null);
  };

  const navigateToPlaybook = (playbookId: string, title?: string, powerStageId?: string, powerStageLabel?: string) => {
    if (title && powerStageId && powerStageLabel) {
      const newPb: Playbook = {
        id: playbookId,
        title: title,
        powerStageId: powerStageId,
        powerStageLabel: powerStageLabel,
        ownerId: 'tm-2',
        instructions: "### Executive Overview\nDescribe this power stage protocol...\n\n### Core Checklist\n- Step indicator milestone detail",
        steps: [
          { id: "s-1", text: "Initiate stage verification.", done: false }
        ],
        lastUpdated: new Date().toISOString().slice(0, 10)
      };
      
      const newPlaybooksList = [...playbooks, newPb];
      setPlaybooks(newPlaybooksList);
      const nextPbHistory = playbooksHistory.slice(0, playbooksHistoryIndex + 1);
      const updatedPbHistory = [...nextPbHistory, newPlaybooksList];
      setPlaybooksHistory(updatedPbHistory);
      setPlaybooksHistoryIndex(updatedPbHistory.length - 1);

      const updatedNodes = nodes.map(n => n.id === powerStageId ? { ...n, playbookId } : n);
      setNodes(updatedNodes);
      const nextNodesHistory = nodesHistory.slice(0, nodesHistoryIndex + 1);
      const updatedNodesHistory = [...nextNodesHistory, updatedNodes];
      setNodesHistory(updatedNodesHistory);
      setNodesHistoryIndex(updatedNodesHistory.length - 1);
    }
    
    setSelectedPlaybookId(playbookId);
    setActiveTab('playbooks');
  };

  const handleSwitchProject = (id: string) => {
    if (!currentUser) return;
    localStorage.setItem(`sOS_active_project_id_${currentUser.id}`, id);
    setActiveProjectId(id);
    setActiveTab('overview');
  };

  const handleCreateProject = (name: string, desc: string) => {
    if (!currentUser) return;
    const newProj = { id: `proj-${Date.now()}`, name, description: desc };
    const updated = [...projects, newProj];
    setProjects(updated);
    localStorage.setItem(`sOS_projects_${currentUser.id}`, JSON.stringify(updated));
    handleSwitchProject(newProj.id);
  };

  const handleDeleteProject = (id: string) => {
    if (!currentUser || projects.length <= 1) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem(`sOS_projects_${currentUser.id}`, JSON.stringify(updated));

    localStorage.removeItem(`sOS_nodes_${currentUser.id}_${id}`);
    localStorage.removeItem(`sOS_playbooks_${currentUser.id}_${id}`);
    localStorage.removeItem(`sOS_team_${currentUser.id}_${id}`);
    localStorage.removeItem(`sOS_scorecard_${currentUser.id}_${id}`);
    localStorage.removeItem(`sOS_sprint_${currentUser.id}_${id}`);
    localStorage.removeItem(`sOS_compass_${currentUser.id}_${id}`);
    localStorage.removeItem(`sOS_enquiries_${currentUser.id}_${id}`);

    if (activeProjectId === id) {
      handleSwitchProject(updated[0].id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sOS_current_account');
    localStorage.removeItem('sOS_workspace_setup_done');
    localStorage.removeItem('sOS_user_role');
    localStorage.removeItem('sOS_session_token');
    setCurrentUser(null);
    setShowLanding(true);
    setShowWorkspaceSetup(true);
    setActiveTab('overview');
  };

  const handleUpdateCurrentUser = (name: string, email: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, name, email };
      setCurrentUser(updatedUser);
      localStorage.setItem('sOS_current_account', JSON.stringify(updatedUser));
      setUserName(name);
      
      // Update Name inside team roster as well
      const teamK = `sOS_team_${currentUser.id}_${activeProjectId}`;
      const storedTeam = localStorage.getItem(teamK);
      if (storedTeam) {
        try {
          const teamArr = JSON.parse(storedTeam);
          const updatedTeam = teamArr.map((m: any) => m.id === 'tm-owner' ? { ...m, name } : m);
          setTeamMembers(updatedTeam);
          localStorage.setItem(teamK, JSON.stringify(updatedTeam));
        } catch (e) {}
      }
    }
  };

  const handlePurgeAllData = (mode: 'active_only' | 'full_factory') => {
    if (!currentUser) return;

    if (mode === 'active_only') {
      const accId = currentUser.id;
      const projId = activeProjectId;
      if (projId) {
        const freshRoster = [
          { id: "tm-owner", name: currentUser.name, manager: "Board", jobTitle: userRole === 'ceo' ? "Founder & CEO" : "Standard Employee / Staff", accountabilities: [], isFounder: true }
        ];

        localStorage.setItem(`sOS_nodes_${accId}_${projId}`, JSON.stringify([]));
        localStorage.setItem(`sOS_playbooks_${accId}_${projId}`, JSON.stringify([]));
        localStorage.setItem(`sOS_team_${accId}_${projId}`, JSON.stringify(freshRoster));
        localStorage.setItem(`sOS_scorecard_${accId}_${projId}`, JSON.stringify([]));
        localStorage.setItem(`sOS_sprint_${accId}_${projId}`, JSON.stringify(INITIAL_SPRINT_PLAN));
        localStorage.setItem(`sOS_compass_${accId}_${projId}`, JSON.stringify(INITIAL_COMPASS));
        localStorage.setItem(`sOS_enquiries_${accId}_${projId}`, JSON.stringify([]));
        localStorage.setItem(`sOS_activities_${accId}_${projId}`, JSON.stringify([]));

        setNodes([]);
        setPlaybooks([]);
        setTeamMembers(freshRoster);
        setScorecard([]);
        setSprintPlan(INITIAL_SPRINT_PLAN);
        setCompass(INITIAL_COMPASS);
        setEnquiries([]);
        setActivities([]);
      }
    } else if (mode === 'full_factory') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sOS_')) {
          localStorage.removeItem(key);
        }
      });
      handleLogout();
      window.location.reload();
    }
  };

  const handleLoginSuccess = (account: { id: string; name: string; email: string; paidTicket?: "starter" | "enterprise" | "free" | null }, isNew?: boolean) => {
    localStorage.setItem('sOS_current_account', JSON.stringify({ id: account.id, name: account.name, email: account.email }));
    const serverTier = account.paidTicket || 'free';
    localStorage.setItem('sOS_license_tier', serverTier);
    setLicenseTier(serverTier as any);
    
    setCurrentUser({ id: account.id, name: account.name, email: account.email });
    setUserName(account.name);
    setShowWelcome(isNew);
    setShowWorkspaceSetup(!localStorage.getItem('sOS_workspace_setup_done'));
    setShowLanding(false);
  };

  const handleWorkspaceSelectorComplete = (setup: {
    role: 'ceo' | 'employee';
    workspaceName: string;
    workspaceDesc: string;
    shouldPreloadData: boolean;
  }) => {
    if (!currentUser) return;
    
    const projId = `proj-${Date.now()}`;
    const newProj = { id: projId, name: setup.workspaceName, description: setup.workspaceDesc };
    
    // Write workspace project reference
    const projectsKey = `sOS_projects_${currentUser.id}`;
    const curProjList = JSON.parse(localStorage.getItem(projectsKey) || '[]');
    const updatedProjList = [...curProjList.filter((p: any) => p.id !== 'proj-blank'), newProj];
    localStorage.setItem(projectsKey, JSON.stringify(updatedProjList));
    setProjects(updatedProjList);
    setActiveProjectId(projId);
    localStorage.setItem(`sOS_active_project_id_${currentUser.id}`, projId);
    
    const accId = currentUser.id;
    const nodK = `sOS_nodes_${accId}_${projId}`;
    const plbK = `sOS_playbooks_${accId}_${projId}`;
    const teamK = `sOS_team_${accId}_${projId}`;
    const scK = `sOS_scorecard_${accId}_${projId}`;
    const sprK = `sOS_sprint_${accId}_${projId}`;
    const cmpK = `sOS_compass_${accId}_${projId}`;
    const enqK = `sOS_enquiries_${accId}_${projId}`;
    
    if (setup.shouldPreloadData) {
      localStorage.setItem(nodK, JSON.stringify([]));
      localStorage.setItem(plbK, JSON.stringify(INITIAL_PLAYBOOKS));
      localStorage.setItem(teamK, JSON.stringify(INITIAL_TEAM_MEMBERS));
      localStorage.setItem(scK, JSON.stringify(INITIAL_SCORECARD));
      localStorage.setItem(sprK, JSON.stringify(INITIAL_SPRINT_PLAN));
      localStorage.setItem(cmpK, JSON.stringify(INITIAL_COMPASS));
      localStorage.setItem(enqK, JSON.stringify([]));
    } else {
      localStorage.setItem(nodK, JSON.stringify([]));
      localStorage.setItem(plbK, JSON.stringify([]));
      localStorage.setItem(teamK, JSON.stringify([
        { id: "tm-owner", name: currentUser.name, manager: "Board", jobTitle: setup.role === 'ceo' ? "Founder & CEO" : "Standard Employee / Staff", accountabilities: [], isFounder: true }
      ]));
      localStorage.setItem(scK, JSON.stringify([]));
      localStorage.setItem(sprK, JSON.stringify(INITIAL_SPRINT_PLAN));
      localStorage.setItem(cmpK, JSON.stringify(INITIAL_COMPASS));
      localStorage.setItem(enqK, JSON.stringify([]));
    }
    
    // Set role
    setUserRole(setup.role);
    localStorage.setItem('sOS_user_role', setup.role);
    
    // Set setup done flag
    localStorage.setItem('sOS_workspace_setup_done', 'true');
    setShowWorkspaceSetup(false);
    
    // Reload state after tiny time
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Nav Items with dynamic Inbox and Config links integrated
  const navItems = [
    { id: 'overview', label: 'Home Node', icon: Home },
    { id: 'engines', label: '1. Value Engines', icon: Layers },
    { id: 'playbooks', label: '2. Playbooks/SOP', icon: FileText },
    { id: 'team', label: '3. Team Canvas', icon: Users },
    { id: 'scorecard', label: '4. Scorecard', icon: TrendingUp },
    { id: 'sprint', label: '5. Sprints & Rhythms', icon: Calendar },
    { id: 'compass', label: '6. Clarity Compass', icon: Compass },
    { id: 'enquiries', label: '8. Enquiries', icon: Inbox },
    { id: 'settings', label: '7. Settings', icon: Settings },
  ];

  // Intercept authentication flow with Landing page first
  if (showLanding) {
    return (
      <LandingPageView 
        currentUser={currentUser}
        onGetStarted={() => {
          setInitialSignUpMode(true);
          setShowLanding(false);
        }} 
        onLoginClick={() => {
          setInitialSignUpMode(false);
          setShowLanding(false);
        }} 
        onSignUpClick={() => {
          setInitialSignUpMode(true);
          setShowLanding(false);
        }}
        licenseTier={licenseTier}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginAuthView 
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setShowLanding(true)} 
        initialSignUp={initialSignUpMode}
      />
    );
  }

  if (licenseTier === 'free') {
    return (
      <CheckoutPortal 
        onClose={() => {}} 
        isEnforced={true}
        onLogout={handleLogout}
        onPaymentSuccess={(tier, receipt) => {
          localStorage.setItem('sOS_license_tier', tier);
          localStorage.setItem('sOS_license_receipt', receipt);
          setLicenseTier(tier);
          setLicenseReceipt(receipt);
        }}
      />
    );
  }

  if (showWelcome) {
    return (
      <OnboardingPreloadView 
        userName={userName}
        setUserName={(name) => {
          setUserName(name);
          if (currentUser) {
            const updatedUser = { ...currentUser, name };
            setCurrentUser(updatedUser);
            localStorage.setItem('sOS_current_account', JSON.stringify(updatedUser));
            
            // Sync user's CEO name inside the teams array as well
            const teamK = `sOS_team_${currentUser.id}_${activeProjectId}`;
            const storedTeam = localStorage.getItem(teamK);
            if (storedTeam) {
              try {
                const teamArr = JSON.parse(storedTeam);
                const updatedTeam = teamArr.map((m: any) => m.id === 'tm-owner' ? { ...m, name } : m);
                setTeamMembers(updatedTeam);
                localStorage.setItem(teamK, JSON.stringify(updatedTeam));
              } catch {}
            }
          }
        }}
        onComplete={() => {
          setShowWelcome(false);
        }}
      />
    );
  }

  if (showWorkspaceSetup) {
    return (
      <WorkspaceSelectorView 
        userName={userName}
        onSetupComplete={handleWorkspaceSelectorComplete}
      />
    );
  }

  // Find active project label to display in the header
  const activeProjName = projects.find(p => p.id === activeProjectId)?.name || 'My Workspace';

  const getHeaderInfo = (tabId: string) => {
    switch (tabId) {
      case 'overview': return { title: 'Home Node', subtitle: 'Executive dashboard, real-time activity log, and business vitals.' };
      case 'engines': return { title: 'Value Engines Builder', subtitle: 'Design lead flows and fulfillment pipelines to automate growth scale.' };
      case 'playbooks': return { title: 'Playbooks & SOP Library', subtitle: 'Standard operating procedures and interactive benchmark checklists.' };
      case 'team': return { title: 'Team Canvas Organogram', subtitle: 'Assign structural accountabilities and view active team operators.' };
      case 'scorecard': return { title: 'Vitals Scorecard', subtitle: 'Track metrics, KPIs, and operational goals with historical review.' };
      case 'sprint': return { title: 'Sprints & Rhythms', subtitle: 'Quarterly rock plan, 13-week sprints, and standard meeting schedules.' };
      case 'compass': return { title: 'Clarity Compass', subtitle: 'Formulate your mission, strategic vision, purpose, and values.' };
      case 'enquiries': return { title: 'Workspace Enquiries', subtitle: 'Incoming messages, feedback loops, and customer service channels.' };
      case 'settings': return { title: 'System Settings', subtitle: 'Manage workspaces, local imports/exports, security credentials, and offline installer options.' };
      default: return { title: 'Mitior OS Workspace', subtitle: 'Modern offline-first business template orchestrator.' };
    }
  };

  const headerInfo = getHeaderInfo(activeTab);

  return (
    <div id="sos-root-layout" className="min-h-screen bg-[#f5f5f7] dark:bg-[#161617] flex flex-col lg:flex-row text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-200">
      
      {/* 1. PERSISTENT NAVIGATION SIDEBAR - Desktop Only */}
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-[#1d1d1f] border-r border-[#e8e8ed] dark:border-[#2d2d2f] sticky top-0 h-screen overflow-y-auto select-none shrink-0 z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
        
        {/* Brand Header */}
        <div 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-5 border-b border-[#e8e8ed] dark:border-[#2d2d2f] flex items-center transition cursor-pointer hover:bg-[#f5f5f7] dark:hover:bg-[#252526]/50 ${sidebarCollapsed ? 'justify-center p-4' : 'gap-3'}`}
          title={sidebarCollapsed ? "Expand Sidebar Layout" : "Collapse Sidebar Layout"}
        >
          <div className="bg-[#1d1d1f] dark:bg-white p-2 rounded-xl text-white dark:text-[#1d1d1f] shrink-0 flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4 text-white dark:text-[#1d1d1f]" />
          </div>
          {!sidebarCollapsed && (
            <div className="space-y-0.5 text-left animate-duration-150">
              <h1 className="font-sans font-extrabold text-sm tracking-tight text-[#1d1d1f] dark:text-white leading-none">Mitior OS</h1>
              <p className="text-[10px] text-[#004b49] dark:text-[#95d1ce] font-bold tracking-widest uppercase mb-0">
                {licenseTier === 'enterprise' ? 'Local Engine' : 'Cloud Sandbox'}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Workspace Picker inside Sidebar */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-[#e8e8ed] dark:border-[#2d2d2f] bg-[#fbfbfd] dark:bg-[#252526]/30 text-left animate-duration-150">
            <label className="text-[9.5px] font-bold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-wider block mb-1">Active Office Workspace</label>
            <div className="relative">
              <select
                value={activeProjectId}
                onChange={(e) => handleSwitchProject(e.target.value)}
                className="w-full bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold text-[#1d1d1f] dark:text-white rounded-xl py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer focus:border-indigo-500 transition shadow-2xs"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#86868b] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Vertical Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 text-left">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-xl font-sans text-xs font-semibold transition-all duration-100 cursor-pointer ${
                  sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive 
                    ? 'bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] shadow-xs' 
                    : 'text-[#86868b] dark:text-[#8e8e93] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-[#e8e8ed]/60 dark:hover:bg-[#252526]'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#e6b349] dark:text-[#2d4df5] scale-105' : 'text-[#86868b]'}`} />
                {!sidebarCollapsed && <span className="animate-duration-150">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Panel */}
        <div className={`border-t border-[#e8e8ed] dark:border-[#2d2d2f] bg-[#fbfbfd] dark:bg-[#252526]/20 transition-all ${sidebarCollapsed ? 'p-2.5 space-y-2' : 'p-4 space-y-3'}`}>
          
          {/* Security Shield Lock Trigger */}
          {isPinConfiguredOnServer && (
            <button
              onClick={() => {
                if (pinLockActive) {
                  setShowPinUnlockModal(true);
                } else {
                  setPinLockActive(true);
                }
              }}
              className={`w-full flex items-center justify-between font-bold border transition duration-150 cursor-pointer ${
                sidebarCollapsed ? 'p-2 justify-center rounded-lg' : 'px-3 py-2 rounded-xl text-[11px]'
              } ${
                pinLockActive 
                  ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/60 text-amber-700 dark:text-amber-400' 
                  : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/60 text-emerald-700 dark:text-emerald-400'
              }`}
              title={pinLockActive ? "Unlock corporate templates" : "Lock corporate templates"}
            >
              <span className="flex items-center gap-1.5 justify-center">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                {!sidebarCollapsed && <span>Shield Lock</span>}
              </span>
              {!sidebarCollapsed && (
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded-md">
                  {pinLockActive ? "LOCKED" : "OPEN"}
                </span>
              )}
            </button>
          )}

          {/* Theme Switch & User Status Row */}
          <div className={`flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-2' : 'gap-2.5'}`}>
            <div className="flex items-center gap-2 text-left min-w-0">
              <div 
                className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 cursor-pointer"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={currentUser?.name || 'Ryan Deiss'}
              >
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'R'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 leading-tight animate-duration-150">
                  <p className="text-[10.5px] font-bold text-[#1d1d1f] dark:text-white truncate mb-0">{currentUser?.name || 'Ryan Deiss'}</p>
                  <p className="text-[9.5px] text-[#86868b] dark:text-[#8e8e93] capitalize truncate mb-0">{userRole === 'ceo' ? 'Founder & CEO' : 'Staff operator'}</p>
                </div>
              )}
            </div>

            {/* Apple style theme toggle button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="flex items-center justify-center p-2 rounded-xl border border-[#e8e8ed] dark:border-[#2d2d2f] bg-white dark:bg-[#1d1d1f] hover:border-neutral-400 transition cursor-pointer text-[#1d1d1f]"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-[#86868b]" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#86868b]" />
              )}
            </button>
          </div>

          {/* License Badge */}
          <div className="pt-1.5">
            {licenseTier === 'enterprise' ? (
              sidebarCollapsed ? (
                <div className="text-center text-[10px]" title="Enterprise Local App">🌟</div>
              ) : (
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black uppercase tracking-wider py-1.5 px-2 rounded-xl shadow-xs text-center">
                  🌟 Enterprise Local App
                </div>
              )
            ) : licenseTier === 'starter' ? (
              sidebarCollapsed ? (
                <div className="text-center text-[10px]" title="Web App Tier ($15)">🌐</div>
              ) : (
                <div className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider py-1 rounded-xl shadow-xs text-center">
                  🌐 Web App Tier ($15)
                </div>
              )
            ) : (
              <button
                onClick={() => setShowPaymentPortal(true)}
                className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl text-center cursor-pointer transition ${sidebarCollapsed ? 'py-1' : 'py-1.5'}`}
              >
                {sidebarCollapsed ? "🟢" : "🟢 Upgrade License"}
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* 2. MAIN WORKING ENGINE SPACE */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-[#f5f5f7] dark:bg-[#161617]">
        
        {/* Elegant Context-First Header Bar */}
        <header className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-md border-b border-[#e8e8ed] dark:border-[#2d2d2f] sticky top-0 z-45 select-none px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left Portion: Context Title or Mobile Trigger */}
            <div className="flex items-center gap-3 min-w-0 text-left">
              {/* Mobile menu trigger */}
              <div className="flex lg:hidden items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-[#f5f5f7] dark:bg-[#252526] text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-neutral-800 transition duration-150 cursor-pointer shrink-0"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>

              {/* Title & subtitle */}
              <div className="min-w-0">
                <h2 className="font-sans font-bold text-sm md:text-base text-[#1d1d1f] dark:text-white tracking-tight flex items-center gap-2 truncate mb-0">
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden md:flex items-center gap-1.5 text-xs text-[#86868b] dark:text-[#8e8e93] font-semibold hover:text-[#1d1d1f] dark:hover:text-white transition duration-150 select-none cursor-pointer bg-transparent border-0 p-0 mr-1.5 focus:outline-none"
                    title={sidebarCollapsed ? "Expand Sidebar Layout" : "Collapse Sidebar Layout"}
                  >
                    <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Users Workspace</span>
                    <span>//</span>
                  </button>
                  <span>{headerInfo.title}</span>
                </h2>
                <p className="text-[10px] md:text-[11px] text-[#86868b] dark:text-[#8e8e93] truncate max-w-xl hidden sm:block mt-0.5 leading-tight mb-0">
                  {headerInfo.subtitle}
                </p>
              </div>
            </div>

            {/* Right Portion: Quick Project Dropdown selector & license info */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Quick Select workspace for tablet/mobile where sidebar is hidden */}
              <div className="lg:hidden relative">
                <select
                  value={activeProjectId}
                  onChange={(e) => handleSwitchProject(e.target.value)}
                  className="bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold text-[#1d1d1f] dark:text-white rounded-xl py-1.5 pl-2.5 pr-7 outline-none appearance-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#86868b] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Offline installer guide directly accessible from header */}
              {licenseTier === 'enterprise' && (
                <button
                  onClick={() => setShowInstallerPopout(true)}
                  className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/45 border border-amber-200/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer hover:scale-102 transition flex items-center gap-1.5 shrink-0"
                  title="Offline Deployment Guide"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Local Setup</span>
                </button>
              )}

              {/* Secure status badge for small displays */}
              {pinLockActive && (
                <div 
                  onClick={() => setShowPinUnlockModal(true)}
                  className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 text-amber-700 dark:text-amber-400 font-bold text-[9px] px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-amber-100"
                  title="Workspace is read-only. Click to unlock"
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  <span className="hidden xs:inline">RO-LOCK</span>
                </div>
              )}
            </div>
            
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-md border-b border-[#e8e8ed] dark:border-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] font-sans p-4 space-y-1.5 z-35 animate-fade-in text-xs select-none shadow-sm text-left">
            <div className="pb-2 mb-2 border-b border-[#e8e8ed] dark:border-[#2e2e30]">
              <p className="text-[10px] text-[#86868b] font-bold uppercase tracking-wide">Workspace Selector</p>
              <div className="relative mt-1">
                <select
                  value={activeProjectId}
                  onChange={(e) => {
                    handleSwitchProject(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold text-[#1d1d1f] dark:text-white rounded-xl py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#86868b] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <p className="text-[10px] text-[#86868b] font-bold uppercase tracking-wide pb-1">Navigation Nodes</p>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition duration-100 cursor-pointer ${
                    isActive 
                      ? 'bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] font-medium' 
                      : 'hover:bg-[#f5f5f7] dark:hover:bg-[#252526] text-[#86868b] dark:text-[#8e8e93]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}

            <div className="pt-3 border-t border-[#e8e8ed] dark:border-[#2e2e30] flex items-center justify-between">
              <span className="text-[10px] text-[#86868b] font-medium capitalize">Role: {userRole === 'ceo' ? 'Founder (CEO)' : 'Operator'}</span>
              <button
                onClick={() => {
                  setTheme(theme === 'light' ? 'dark' : 'light');
                  setMobileMenuOpen(false);
                }}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold"
              >
                Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
              </button>
            </div>
          </div>
        )}

        {/* Primary container viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
          
          {/* Security Shield Lock active notification banner */}
          {pinLockActive && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-400 text-xs shadow-sm animate-fade-in text-left">
              <Lock className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block">Security Shield Lock Active ({currentUser?.name || "Corporate Admin"})</span>
                <span>All corporate workspace templates are currently read-only. Unlock using the sidebar shield control or tap the lock to edit structure layers.</span>
              </div>
              <button
                onClick={() => setShowPinUnlockModal(true)}
                className="bg-amber-100 dark:bg-amber-900 border border-amber-200 hover:bg-amber-200 text-amber-950 dark:text-amber-200 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition select-none"
              >
                Verify PIN to Unlock
              </button>
            </div>
          )}

        {/* State tabs conditional rendering */}
        {activeTab === 'overview' && (
          <DashboardOverview 
            playbooks={playbooks}
            teamMembers={teamMembers}
            scorecard={scorecard}
            sprintPlan={sprintPlan}
            compass={compass}
            enquiries={enquiries}
            onSetActiveTab={setActiveTab}
            onSelectPlaybook={setSelectedPlaybookId}
            userName={userName}
            setUserName={(name) => {
              setUserName(name);
              if (currentUser) {
                const updatedUser = { ...currentUser, name };
                setCurrentUser(updatedUser);
                localStorage.setItem('sOS_current_account', JSON.stringify(updatedUser));
              }
            }}
            userRole={pinLockActive ? 'employee' : userRole}
            activities={activities}
            onClearActivities={() => setActivities([])}
            onUpdateTeam={setTeamMembers}
            onUpdatePlaybooks={handleUpdatePlaybooksWithHistory}
          />
        )}

        {activeTab === 'engines' && (
          <ValueEngineView 
            nodes={nodes}
            playbooks={playbooks}
            onUpdateNodes={handleUpdateNodesWithHistory}
            onNavigateToPlaybook={navigateToPlaybook}
            userRole={pinLockActive ? 'employee' : userRole}
            onUndo={handleUndoNodes}
            onRedo={handleRedoNodes}
            canUndo={nodesHistoryIndex > 0}
            canRedo={nodesHistoryIndex < nodesHistory.length - 1}
          />
        )}

        {activeTab === 'playbooks' && (
          <PlaybookFolderView 
            playbooks={playbooks}
            teamMembers={teamMembers}
            nodes={nodes}
            onUpdatePlaybooks={handleUpdatePlaybooksWithHistory}
            selectedPlaybookId={selectedPlaybookId}
            setSelectedPlaybookId={setSelectedPlaybookId}
            userRole={pinLockActive ? 'employee' : userRole}
            onUndo={handleUndoPlaybooks}
            onRedo={handleRedoPlaybooks}
            canUndo={playbooksHistoryIndex > 0}
            canRedo={playbooksHistoryIndex < playbooksHistory.length - 1}
          />
        )}

        {activeTab === 'team' && (
          <TeamCanvasView 
            teamMembers={teamMembers}
            playbooks={playbooks}
            onUpdateTeam={setTeamMembers}
          />
        )}

        {activeTab === 'scorecard' && (
          <ScorecardView 
            scorecard={scorecard}
            teamMembers={teamMembers}
            playbooks={playbooks}
            onUpdateScorecard={setScorecard}
            sprintPlan={sprintPlan}
          />
        )}

        {activeTab === 'sprint' && (
          <SprintCanvasView 
            sprintPlan={sprintPlan}
            teamMembers={teamMembers}
            onUpdateSprint={setSprintPlan}
          />
        )}

        {activeTab === 'compass' && (
          <ClarityCompassView 
            compass={compass}
            onUpdateCompass={setCompass}
            userRole={pinLockActive ? 'employee' : userRole}
          />
        )}

        {activeTab === 'enquiries' && (
          <EnquiriesView 
            enquiries={enquiries}
            onUpdateEnquiries={setEnquiries}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            projects={projects}
            activeProjectId={activeProjectId}
            onSwitchProject={handleSwitchProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            playbooks={playbooks}
            teamMembers={teamMembers}
            scorecard={scorecard}
            sprintPlan={sprintPlan}
            compass={compass}
            nodes={nodes}
            onImportData={handleImportSystemData}
            onUpdateTeamMembers={setTeamMembers}
            currentUser={currentUser}
            onLogout={handleLogout}
            userRole={userRole}
            onOpenLauncherGuide={() => setShowInstallerPopout(true)}
            licenseTier={licenseTier}
            onOpenCheckout={() => setShowPaymentPortal(true)}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onPurgeAllData={handlePurgeAllData}
          />
        )}

      </main>

      {/* Mitior Desktop Installation Guidance Modal Popup overlay */}
      <DesktopInstallerModal 
        isOpen={showInstallerPopout}
        onClose={() => setShowInstallerPopout(false)}
      />

      {/* Lipa Na M-Pesa & Card Payment Billing checkout portal */}
      <AnimatePresence>
        {showPaymentPortal && (
          <CheckoutPortal
            onClose={() => setShowPaymentPortal(false)}
            onPaymentSuccess={(tier, receipt) => {
              localStorage.setItem('sOS_license_tier', tier);
              localStorage.setItem('sOS_license_receipt', receipt);
              setLicenseTier(tier);
              setLicenseReceipt(receipt);
              setShowPaymentPortal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* PIN Unlock Overlay Modal Portal */}
      {showPinUnlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Unlock Workspace</h3>
            </div>
            
            <p className="text-[#86868b] dark:text-[#8e8e93] text-xs leading-relaxed">
              Enter the 4-digit security PIN configured to authorize operations on your Mitior OS server.
            </p>

            <div className="space-y-3 pt-1">
              <input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pinUnlockCode}
                onChange={(e) => setPinUnlockCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyUnlockPin(); }}
                className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] text-center text-xl font-mono tracking-widest rounded-xl py-3 outline-none focus:border-indigo-500 transition"
                autoFocus
              />

              {pinUnlockError && (
                <p className="text-red-500 dark:text-red-400 text-xs font-semibold text-center">{pinUnlockError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowPinUnlockModal(false);
                    setPinUnlockCode('');
                    setPinUnlockError(null);
                  }}
                  className="flex-1 bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-neutral-800 dark:text-neutral-200 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyUnlockPin}
                  className="flex-1 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Humble Footer with zero margin fluff */}
      <footer className="bg-white dark:bg-[#1d1d1f]/35 border-t border-slate-100 dark:border-[#2d2d2f] text-slate-400 py-6 text-center font-sans text-[11px] select-none text-xs">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-slate-400" />
            {licenseTier === 'enterprise' 
              ? "Runs offline-first via sandboxed localized storage. All data is secure on your local workstation."
              : "Active Sandbox Space. Upgrade to Enterprise to unleash standalone desktop runtime configuration offline."}
          </span>
          <span>
            Copyright &copy; 2026. Custom business operating system.
          </span>
        </div>
      </footer>

    </div>
  </div>
  );
}
