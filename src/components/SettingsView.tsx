import React, { useState, ChangeEvent } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Settings2,  
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2,
  Users,
  Laptop,
  ChevronRight,
  UserPlus,
  FileCode,
  FileSpreadsheet,
  Play,
  Check,
  HelpCircle,
  Info,
  Lock,
  RefreshCw,
  History,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Award
} from 'lucide-react';
import { Playbook, TeamMember, ScorecardMetric, SprintPlan, ClarityCompass, ValueEngineNode, INITIAL_PLAYBOOKS, INITIAL_TEAM_MEMBERS, INITIAL_SCORECARD, INITIAL_SPRINT_PLAN, INITIAL_COMPASS } from '../types';

// Fast & Safe compact MD5 implementation for Gravatar email extraction
const computeMD5 = (str: string): string => {
  const sUTF8 = unescape(encodeURIComponent(str.trim().toLowerCase()));
  const lMessageLength = sUTF8.length;
  const lNumberOfWordsTemp1 = lMessageLength + 8;
  const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
  const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
  const lWordArray = new Array(lNumberOfWords).fill(0);
  
  for (let i = 0; i < lMessageLength; i++) {
    const wordIndex = Math.floor(i / 4);
    const bitShift = (i % 4) * 8;
    lWordArray[wordIndex] |= (sUTF8.charCodeAt(i) << bitShift);
  }
  
  const wordIndex = Math.floor(lMessageLength / 4);
  const bitShift = (lMessageLength % 4) * 8;
  lWordArray[wordIndex] |= (0x80 << bitShift);
  lWordArray[lNumberOfWords - 2] = lMessageLength * 8;
  lWordArray[lNumberOfWords - 1] = 0;
  
  const rotateLeft = (num: number, cnt: number) => (num << cnt) | (num >>> (32 - cnt));
  const addUnsigned = (q1: number, q2: number) => {
    const lX8 = q1 & 0x80000000;
    const lY8 = q2 & 0x80000000;
    const lX4 = q1 & 0x40000000;
    const lY4 = q2 & 0x40000000;
    const lResult = (q1 & 0x3FFFFFFF) + (q2 & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    }
    return (lResult ^ lX8 ^ lY8);
  };
  
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;
  
  const S11 = 7,  S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5,  S22 = 9,  S23 = 14, S24 = 20;
  const S31 = 4,  S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6,  S42 = 10, S43 = 15, S44 = 21;
  
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);
  
  const FF = (A: number, B: number, C: number, D: number, x_val: number, s: number, ac: number) => {
    A = addUnsigned(A, addUnsigned(addUnsigned(F(B, C, D), x_val), ac));
    return addUnsigned(rotateLeft(A, s), B);
  };
  const GG = (A: number, B: number, C: number, D: number, x_val: number, s: number, ac: number) => {
    A = addUnsigned(A, addUnsigned(addUnsigned(G(B, C, D), x_val), ac));
    return addUnsigned(rotateLeft(A, s), B);
  };
  const HH = (A: number, B: number, C: number, D: number, x_val: number, s: number, ac: number) => {
    A = addUnsigned(A, addUnsigned(addUnsigned(H(B, C, D), x_val), ac));
    return addUnsigned(rotateLeft(A, s), B);
  };
  const II = (A: number, B: number, C: number, D: number, x_val: number, s: number, ac: number) => {
    A = addUnsigned(A, addUnsigned(addUnsigned(I(B, C, D), x_val), ac));
    return addUnsigned(rotateLeft(A, s), B);
  };
  
  for (let k = 0; k < lWordArray.length; k += 16) {
    const AA = a; const BB = b; const CC = c; const DD = d;
    
    a = FF(a, b, c, d, lWordArray[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, lWordArray[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, lWordArray[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, lWordArray[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, lWordArray[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, lWordArray[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, lWordArray[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, lWordArray[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, lWordArray[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, lWordArray[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, lWordArray[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, lWordArray[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, lWordArray[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, lWordArray[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, lWordArray[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, lWordArray[k + 15], S14, 0x49B40821);
    
    a = GG(a, b, c, d, lWordArray[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, lWordArray[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, lWordArray[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, lWordArray[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, lWordArray[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, lWordArray[k + 10], S22, 0x02441453);
    c = GG(c, d, a, b, lWordArray[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, lWordArray[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, lWordArray[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, lWordArray[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, lWordArray[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, lWordArray[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, lWordArray[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, lWordArray[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, lWordArray[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, lWordArray[k + 12], S24, 0x8D2A4C8A);
    
    a = HH(a, b, c, d, lWordArray[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, lWordArray[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, lWordArray[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, lWordArray[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, lWordArray[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, lWordArray[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, lWordArray[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, lWordArray[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, lWordArray[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, lWordArray[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, lWordArray[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, lWordArray[k + 6], S34, 0x04881D05);
    a = HH(a, b, c, d, lWordArray[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, lWordArray[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, lWordArray[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, lWordArray[k + 2], S34, 0xC4AC5665);
    
    a = II(a, b, c, d, lWordArray[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, lWordArray[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, lWordArray[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, lWordArray[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, lWordArray[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, lWordArray[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, lWordArray[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, lWordArray[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, lWordArray[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, lWordArray[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, lWordArray[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, lWordArray[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, lWordArray[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, lWordArray[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, lWordArray[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, lWordArray[k + 9], S44, 0xEB86D391);
    
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  
  const temp = [a, b, c, d];
  let res = "";
  for (let idx = 0; idx < 4; idx++) {
    let word = temp[idx];
    for (let bitIdx = 0; bitIdx < 4; bitIdx++) {
      const byte = (word >>> (bitIdx * 8)) & 0xFF;
      res += byte.toString(16).padStart(2, "0");
    }
  }
  return res;
};

interface Project {
  id: string;
  name: string;
  description: string;
}

interface SettingsViewProps {
  projects: Project[];
  activeProjectId: string;
  onSwitchProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => void;
  onDeleteProject: (id: string) => void;
  playbooks: Playbook[];
  teamMembers: TeamMember[];
  scorecard: ScorecardMetric[];
  sprintPlan: SprintPlan;
  compass: ClarityCompass;
  nodes: ValueEngineNode[];
  onImportData: (data: {
    playbooks: Playbook[];
    teamMembers: TeamMember[];
    scorecard: ScorecardMetric[];
    sprintPlan: SprintPlan;
    compass: ClarityCompass;
    nodes?: ValueEngineNode[];
  }) => void;
  onUpdateTeamMembers?: (members: TeamMember[]) => void;
  currentUser: { id: string; name: string; email: string } | null;
  onLogout: () => void;
  userRole?: 'ceo' | 'employee';
  onOpenLauncherGuide?: () => void;
  licenseTier?: 'free' | 'starter' | 'professional' | 'enterprise';
  onOpenCheckout?: () => void;
  onUpdateCurrentUser?: (name: string, email: string) => void;
  onPurgeAllData?: (mode: 'active_only' | 'full_factory') => void;
}

export default function SettingsView({
  projects,
  activeProjectId,
  onSwitchProject,
  onCreateProject,
  onDeleteProject,
  playbooks,
  teamMembers,
  scorecard,
  sprintPlan,
  compass,
  nodes,
  onImportData,
  onUpdateTeamMembers,
  currentUser,
  onLogout,
  userRole = 'ceo',
  onOpenLauncherGuide,
  licenseTier = 'free',
  onOpenCheckout,
  onUpdateCurrentUser,
  onPurgeAllData
}: SettingsViewProps) {
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'projects' | 'import' | 'presets' | 'security' | 'backups' | 'faq' | 'billing' | 'desktop' | 'sync'>('profile');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // --- SERVER PERSISTENT DATABASE BACKUP STATE ---
  const [serverBackups, setServerBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null);

  // --- SERVER CHECKOUT HISTORY STATE ---
  const [checkoutHistory, setCheckoutHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- ACCESS GUARD PIN STATE ---
  const [pinCode, setPinCode] = useState('');
  const [isPinConfigured, setIsPinConfigured] = useState(false);
  const [pinStatusMsg, setPinStatusMsg] = useState<string | null>(null);

  // --- SYNC CODE ACTIONS STATE ---
  const [syncCodes, setSyncCodes] = useState<any[]>([]);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [syncCodeDesc, setSyncCodeDesc] = useState('');
  const [syncCodeProjectId, setSyncCodeProjectId] = useState(activeProjectId || '');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // --- CEO DRAG & DROP & EXTRACTION ---
  const [ceoEmail, setCeoEmail] = useState('');
  const [isCeoDragging, setIsCeoDragging] = useState(false);
  const [ceoExtractSuccess, setCeoExtractSuccess] = useState(false);

  // --- FAQ SECTION ACORDION OPEN/CLOSE ---
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(null);

  // --- ACCOUNT INFO EDIT STATES ---
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // --- PURGE DATA FLOW STATES ---
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [purgeStatusMsg, setPurgeStatusMsg] = useState<string | null>(null);

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem("sOS_session_token") || "";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...extraHeaders
    };
  };

  const loadSyncCodes = async () => {
    if (!currentUser) return;
    setIsLoadingSync(true);
    setSyncErrorMsg(null);
    try {
      const res = await fetch("/api/sync-codes", {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSyncCodes(data.syncCodes || []);
      } else {
        setSyncErrorMsg(data.error || "Failed to load sync codes.");
      }
    } catch {
      setSyncErrorMsg("Server unreachable.");
    } finally {
      setIsLoadingSync(false);
    }
  };

  const createSyncCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSyncErrorMsg(null);
    setSyncSuccessMsg(null);
    
    // Choose correct project selection
    const targetProjId = syncCodeProjectId || activeProjectId;
    const targetProject = projects.find(p => p.id === targetProjId) || projects[0];
    if (!targetProject) {
      setSyncErrorMsg("Select a valid Multi-Project partition Space target.");
      return;
    }

    try {
      const res = await fetch("/api/sync-codes/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId: targetProject.id,
          projectName: targetProject.name,
          description: syncCodeDesc
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncSuccessMsg(`S-OS Sync Key generated successfully!`);
        setSyncCodeDesc("");
        // Reload list
        loadSyncCodes();
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      } else {
        setSyncErrorMsg(data.error || "Generation restricted.");
      }
    } catch {
      setSyncErrorMsg("Failed connection trigger. Verify network connectivity.");
    }
  };

  const deleteSyncCode = async (code: string) => {
    if (!currentUser) return;
    setSyncErrorMsg(null);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch("/api/sync-codes/delete", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncSuccessMsg("Sync code deactivated and deleted successfully!");
        loadSyncCodes();
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      } else {
        setSyncErrorMsg(data.error || "Deletion error.");
      }
    } catch {
      setSyncErrorMsg("Network block.");
    }
  };

  const loadServerBackups = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/db/backups/${currentUser.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setServerBackups(data);
      }
    } catch (err) {
      console.warn("Failed fetching server backup list:", err);
    }
  };

  const triggerServerBackup = async () => {
    if (!currentUser) return;
    setBackupLoading(true);
    setDbStatusMsg(null);
    try {
      const res = await fetch(`/api/db/backup`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          projectId: activeProjectId,
          projectName: projects.find(p => p.id === activeProjectId)?.name || "Active Workspace",
          description: backupNote.trim() || `Incremental server backup`,
          data: {
            playbooks,
            teamMembers,
            scorecard,
            sprintPlan,
            compass,
            nodes
          }
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setDbStatusMsg("✨ Workspace snapshot successfully committed to server database!");
        setBackupNote('');
        loadServerBackups();
      } else {
        setDbStatusMsg(`❌ Failed committing: ${resData.error || "Unknown server error"}`);
      }
    } catch (err) {
      setDbStatusMsg("❌ Network error connecting to database.");
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreServerBackup = async (backupId: string) => {
    if (!confirm("Are you absolutely sure you want to load this backup? This replaces your current dashboard metrics instantly!")) return;
    setBackupLoading(true);
    setDbStatusMsg(null);
    try {
      const res = await fetch(`/api/db/restore/${backupId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const backupRecord = await res.json();
        if (backupRecord?.data) {
          onImportData({
            playbooks: backupRecord.data.playbooks || [],
            teamMembers: backupRecord.data.teamMembers || [],
            scorecard: backupRecord.data.scorecard || [],
            sprintPlan: backupRecord.data.sprintPlan || {
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
            },
            compass: backupRecord.data.compass || {
              threeYearTarget: "",
              purposeStatement: "",
              coreValues: [],
              strategicAnchors: []
            },
            nodes: backupRecord.data.nodes || []
          });
          setDbStatusMsg("🎉 Database snapshot successfully synchronized & restored!");
        } else {
          setDbStatusMsg("❌ Snapshot contained malformed payload records.");
        }
      } else {
        setDbStatusMsg("❌ Failed pulling snapshot metadata from database.");
      }
    } catch (err) {
      setDbStatusMsg("❌ Network connectivity failed restoring.");
    } finally {
      setBackupLoading(false);
    }
  };

  const deleteServerBackup = async (backupId: string) => {
    setBackupLoading(true);
    try {
      const res = await fetch(`/api/db/backup/${backupId}`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        loadServerBackups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBackupLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/checkout/history");
      if (res.ok) {
        const data = await res.json();
        setCheckoutHistory(data);
      }
    } catch (err) {
      console.warn("Could not load billing logs:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPinStatus = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/security/pin/status/${currentUser.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setIsPinConfigured(data.configured);
      }
    } catch {}
  };

  const handleSetPin = async () => {
    if (!currentUser) return;
    setPinStatusMsg(null);
    if (!/^\d{4}$/.test(pinCode)) {
      setPinStatusMsg("❌ Access PIN must be exactly 4 numerical digits!");
      return;
    }
    try {
      const res = await fetch("/api/security/pin/set", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id, pin: pinCode })
      });
      if (res.ok) {
        setPinStatusMsg("🔒 Lock PIN successfully active!");
        setIsPinConfigured(true);
        setPinCode('');
      } else {
        const resData = await res.json();
        setPinStatusMsg(`❌ Failed locking credentials: ${resData.error || "Server issue"}`);
      }
    } catch {
      setPinStatusMsg("❌ Locking server offline.");
    }
  };

  const handleRemovePin = async () => {
    if (!currentUser) return;
    setPinStatusMsg(null);
    try {
      const res = await fetch("/api/security/pin/remove", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: currentUser.id, pin: pinCode })
      });
      const data = await res.json();
      if (res.ok) {
        setPinStatusMsg("🔓 Shield deactivated! Workspace open.");
        setIsPinConfigured(false);
        setPinCode('');
      } else {
        setPinStatusMsg(`❌ Failed: ${data.error || "Wrong PIN"}`);
      }
    } catch {
      setPinStatusMsg("❌ Network block.");
    }
  };

  React.useEffect(() => {
    if (currentUser) {
      loadServerBackups();
      loadPaymentHistory();
      fetchPinStatus();
      loadSyncCodes();
    }
  }, [currentUser, activeProjectId, activeSettingsTab]);

  // Local state for customized saved frameworks
  const [customBlueprints, setCustomBlueprints] = useState<Array<{ id: string; name: string; date: string; data: any }>>(() => {
    try {
      const saved = localStorage.getItem('sOS_local_blueprints');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newBlueprintName, setNewBlueprintName] = useState('');

  // States for Bulk Operator Roster Onboard Import Utility
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkParsedMembers, setBulkParsedMembers] = useState<TeamMember[]>([]);
  const [bulkImportSuccess, setBulkImportSuccess] = useState<string | null>(null);
  const [isBulkDragging, setIsBulkDragging] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError(null);
    setBulkImportSuccess(null);
    const file = e.target.files?.[0];
    if (file) {
      processBulkFile(file);
    }
  };

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBulkDragging(false);
    setBulkError(null);
    setBulkImportSuccess(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processBulkFile(file);
    }
  };

  const processBulkFile = (file: File) => {
    setBulkFile(file);
    setBulkParsedMembers([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (file.name.endsWith('.csv')) {
          const parsed = parseBulkCSV(text);
          setBulkParsedMembers(parsed);
        } else if (file.name.endsWith('.json')) {
          const parsed = parseBulkJSON(text);
          setBulkParsedMembers(parsed);
        } else {
          setBulkError('Unsupported file format. Please upload a .csv or .json file.');
        }
      } catch (err: any) {
        setBulkError(err.message || 'Error occurred while parsing the file. Please review your file format.');
      }
    };
    reader.onerror = () => {
      setBulkError('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const parseBulkCSV = (text: string): TeamMember[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('The CSV file is empty or does not contain data lines under the header row.');
    }
    
    // Clean headers: lowercase and remove quotes/accents
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    const nameIdx = headers.indexOf('name');
    const jobTitleIdx = headers.indexOf('jobtitle') !== -1 ? headers.indexOf('jobtitle') : (headers.indexOf('role') !== -1 ? headers.indexOf('role') : headers.indexOf('job title'));
    const managerIdx = headers.indexOf('manager') !== -1 ? headers.indexOf('manager') : headers.indexOf('reports to');
    const accountabilitiesIdx = headers.indexOf('accountabilities') !== -1 ? headers.indexOf('accountabilities') : headers.indexOf('responsibilities');
    const isFounderIdx = headers.indexOf('isfounder') !== -1 ? headers.indexOf('isfounder') : headers.indexOf('founder');
    const photoUrlIdx = headers.indexOf('photourl') !== -1 ? headers.indexOf('photourl') : headers.indexOf('photo');

    if (nameIdx === -1) {
      throw new Error("Missing required header field: 'name'. Other headers can be 'jobTitle', 'manager', 'accountabilities', and 'isFounder'.");
    }

    const members: TeamMember[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line and handle commas inside quotes cleanly
      const cells: string[] = [];
      let currentCell = '';
      let inQuotes = false;
      
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());

      const rawName = cells[nameIdx];
      if (!rawName) continue;
      const name = rawName.replace(/^["']|["']$/g, '').trim();
      if (!name) continue;

      const jobTitle = jobTitleIdx !== -1 && cells[jobTitleIdx] 
        ? cells[jobTitleIdx].replace(/^["']|["']$/g, '').trim() 
        : 'Operator';
        
      const manager = managerIdx !== -1 && cells[managerIdx] 
        ? cells[managerIdx].replace(/^["']|["']$/g, '').trim() 
        : 'Founder & CEO';

      let accountabilities: string[] = [];
      if (accountabilitiesIdx !== -1 && cells[accountabilitiesIdx]) {
        const rawAcc = cells[accountabilitiesIdx].replace(/^["']|["']$/g, '').trim();
        // Support splitting on common delimiters like semicolon, pipe, or comma
        if (rawAcc.includes(';')) {
          accountabilities = rawAcc.split(';').map(v => v.trim()).filter(Boolean);
        } else if (rawAcc.includes('|')) {
          accountabilities = rawAcc.split('|').map(v => v.trim()).filter(Boolean);
        } else {
          accountabilities = rawAcc.split(',').map(v => v.trim()).filter(Boolean);
        }
      }

      const isFounder = isFounderIdx !== -1 && cells[isFounderIdx]
        ? cells[isFounderIdx].toLowerCase().trim() === 'true' || cells[isFounderIdx].trim() === '1'
        : false;

      const photoUrl = photoUrlIdx !== -1 && cells[photoUrlIdx] 
        ? cells[photoUrlIdx].replace(/^["']|["']$/g, '').trim() 
        : undefined;

      members.push({
        id: `tm-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        name,
        manager,
        jobTitle,
        accountabilities,
        isFounder,
        photoUrl
      });
    }

    if (members.length === 0) {
      throw new Error('No valid rows containing a name could be parsed from the CSV.');
    }
    return members;
  };

  const parseBulkJSON = (text: string): TeamMember[] => {
    const rawParsed = JSON.parse(text);
    const list = Array.isArray(rawParsed) ? rawParsed : (rawParsed.teamMembers || rawParsed.team || []);
    if (!Array.isArray(list)) {
      throw new Error('JSON structure must be an array of team members, or an object containing a "teamMembers" array.');
    }

    return list.map((item: any, i: number) => {
      if (!item.name) {
        throw new Error(`Row ${i + 1} is missing the required "name" property.`);
      }
      return {
        id: item.id || `tm-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        name: String(item.name).trim(),
        manager: String(item.manager || item.reportsTo || 'Founder & CEO').trim(),
        jobTitle: String(item.jobTitle || item.title || item.role || 'Operator').trim(),
        accountabilities: Array.isArray(item.accountabilities)
          ? item.accountabilities.map((v: any) => String(v).trim())
          : typeof item.accountabilities === 'string'
            ? item.accountabilities.split(/[,;|]/).map(v => v.trim()).filter(Boolean)
            : [],
        isFounder: !!item.isFounder || !!item.founder,
        photoUrl: item.photoUrl || item.photo || undefined
      };
    });
  };

  const executeBulkImport = () => {
    if (!onUpdateTeamMembers) {
      setBulkError('Roster operations callback is missing.');
      return;
    }
    if (bulkParsedMembers.length === 0) return;

    try {
      if (importMode === 'replace') {
        onUpdateTeamMembers(bulkParsedMembers);
        setBulkImportSuccess(`Success! Replaced active team roster with ${bulkParsedMembers.length} newly parsed operators.`);
      } else {
        // Append mode
        let currentMembers = [...teamMembers];
        const hasExistingFounder = currentMembers.some(m => m.isFounder);
        
        const finalToConcat = bulkParsedMembers.map(nm => {
          if (nm.isFounder && hasExistingFounder) {
            // downgrade founder status for appends to avoid duplicate founders
            return { ...nm, isFounder: false };
          }
          return nm;
        });

        onUpdateTeamMembers([...currentMembers, ...finalToConcat]);
        setBulkImportSuccess(`Success! Appended ${bulkParsedMembers.length} operators to your current active roster.`);
      }
      // Reset parser states on successful commit
      setBulkFile(null);
      setBulkParsedMembers([]);
    } catch (err: any) {
      setBulkError(err.message || 'An error occurred during final writing database transaction.');
    }
  };

  const isEmployee = userRole === 'employee';

  const handleCreateProj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateProject(newProjName.trim(), newProjDesc.trim() || 'Custom operational workspace.');
    setNewProjName('');
    setNewProjDesc('');
  };

  const exportSystemData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ playbooks, teamMembers, scorecard, sprintPlan, compass, nodes }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mitior-os-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleJsonImport = (e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.playbooks && parsed.teamMembers && parsed.scorecard && parsed.sprintPlan && parsed.compass) {
          onImportData(parsed);
          setImportSuccess("Business Operating System data successfully restored!");
          setTimeout(() => setImportSuccess(null), 4000);
        } else {
          setImportError("Invalid blueprint file format. Ensure all 5 elements are present.");
        }
      } catch (err) {
        setImportError("Failed to parse JSON file. Check structure validity.");
      }
    };
    fileReader.readAsText(file);
  };

  // Save Current Setup to Local Preset Library
  const handleSaveToLocalLibrary = () => {
    if (!newBlueprintName.trim()) return;
    const newBp = {
      id: `bp-loc-${Date.now()}`,
      name: newBlueprintName.trim(),
      date: new Date().toISOString().slice(0, 10),
      data: { playbooks, teamMembers, scorecard, sprintPlan, compass, nodes }
    };
    const updated = [...customBlueprints, newBp];
    setCustomBlueprints(updated);
    localStorage.setItem('sOS_local_blueprints', JSON.stringify(updated));
    setNewBlueprintName('');
    setImportSuccess("Saved custom template to your browser Blueprints Library!");
    setTimeout(() => setImportSuccess(null), 4000);
  };

  const handleDeleteLocalBlueprint = (id: string) => {
    const updated = customBlueprints.filter(bp => bp.id !== id);
    setCustomBlueprints(updated);
    localStorage.setItem('sOS_local_blueprints', JSON.stringify(updated));
  };

  const handleLoadLibraryBlueprint = (bpData: any) => {
    onImportData(bpData);
    setImportSuccess("Operational blueprint structure applied to current workspace!");
    setTimeout(() => setImportSuccess(null), 4000);
  };

  // Beautiful System Presets (all values are empty, ready for custom entries)
  const systemPresets = [
    {
      id: "sys-bp-saas",
      title: "SaaS Operational Blueprint (Blank)",
      description: "Blank template designed for recurring software operations, trials, activate flows, and renewals.",
      data: {
        compass: {
          threeYearTarget: "Establish baseline user retention flow.",
          purposeStatement: "Provide direct workflow clarity with zero friction.",
          coreValues: ["Extreme Reliability", "Kaizen Speed", "User First Integrity"],
          strategicAnchors: ["Reliable service deliverability"]
        },
        teamMembers: [
          { id: "tm-owner", name: currentUser?.name || "Administrator", manager: "Board", jobTitle: "Founder & CEO", accountabilities: [], isFounder: true }
        ],
        scorecard: [],
        sprintPlan: {
          quarter: "SaaS Scaling Plan", rallyCry: "Minimize user friction", revenueGoalGood: "", revenueGoalBetter: "", revenueGoalBest: "", unitGoalName: "Daily Active Users", unitGoalValue: "", month1Name: "Month 1", month1Goal: "", month2Name: "Month 2", month2Goal: "", month3Name: "Month 3", month3Goal: "", strategicPillars: [{ title: "CORE STANDARD", desc: "Automate onboarding check-ins" }], initiatives: []
        },
        playbooks: [
          { id: "pb-saas-trial", title: "SOP-101: Triaging Free Trial Users", powerStageId: "ve-saas-2", powerStageLabel: "Sign up Free Trial", ownerId: "tm-owner", instructions: "### Executive Overview\nConfigure and monitor initial onboarding interactions.\n\n### Sequence Steps\n1. Check CRM trigger status.\n2. Verify workspace sandbox creation.", steps: [{ id: "s1", text: "CRM webhook received and verified", done: false }], videoUrl: "" }
        ],
        nodes: [
          { id: "ve-saas-1", label: "Organic Acquisition Channel", type: "start", x: 100, y: 150, engineType: "growth", description: "Inbound traffic sourcing pipeline", playbooksId: "" },
          { id: "ve-saas-2", label: "Sign up Free Trial", type: "process", x: 280, y: 150, engineType: "growth", description: "Client initializes free Sandbox workspace", isPowerStage: true, playbookId: "pb-saas-trial" },
          { id: "ve-saas-3", label: "E-Mail Activation Check", type: "decision", x: 460, y: 150, engineType: "growth", description: "Verify email ownership and engagement", playbooksId: "" },
          { id: "ve-saas-4", label: "Enterprise Upgrade Checkout", type: "process", x: 640, y: 150, engineType: "growth", description: "Process commercial license purchase", playbooksId: "" },
          { id: "ve-saas-5", label: "Active Conversion Close", type: "outcome", x: 820, y: 150, engineType: "growth", description: "Conversion milestone reached", playbooksId: "" },
          
          { id: "ve-saas-f1", label: "Onboarding Welcome Email", type: "start", x: 100, y: 150, engineType: "fulfillment", description: "Automated activation resources dispatch", playbooksId: "" },
          { id: "ve-saas-f2", label: "Client Workspace Provisioning", type: "process", x: 280, y: 150, engineType: "fulfillment", description: "Spinning up dedicated customer container database", playbooksId: "" },
          { id: "ve-saas-f3", label: "Operational Check-in Call", type: "process", x: 460, y: 150, engineType: "fulfillment", description: "Alignment call on core setup goals", playbooksId: "" },
          { id: "ve-saas-f4", label: "Success Benchmark Audit", type: "decision", x: 640, y: 150, engineType: "fulfillment", description: "Audit usage compliance and satisfaction metrics", playbooksId: "" },
          { id: "ve-saas-f5", label: "Renewal Milestone", type: "outcome", x: 820, y: 150, engineType: "fulfillment", description: "SaaS annual or monthly subscription contract renewal", playbooksId: "" }
        ]
      }
    },
    {
      id: "sys-bp-consult",
      title: "Consulting Agency Blueprint (Blank)",
      description: "Blank framework designed for custom discovery calls, proposals, milestones and consulting reviews.",
      data: {
        compass: {
          threeYearTarget: "Develop outstanding service delivery to drive localized brand authority.",
          purposeStatement: "Provide direct service standards to customers with humility and kaizen principles.",
          coreValues: ["Extreme Ownership", "謙遜 (Humility)", "Action Protocol Execution"],
          strategicAnchors: ["Reliable service delivery pipelines"]
        },
        teamMembers: [
          { id: "tm-owner", name: currentUser?.name || "Administrator", manager: "Board", jobTitle: "Founder & CEO", accountabilities: [], isFounder: true }
        ],
        scorecard: [],
        sprintPlan: {
          quarter: "Consulting Expansion Sprint", rallyCry: "Uplevel onboarding feedback loops", revenueGoalGood: "", revenueGoalBetter: "", revenueGoalBest: "", unitGoalName: "Target Partners", unitGoalValue: "", month1Name: "Month 1", month1Goal: "", month2Name: "Month 2", month2Goal: "", month3Name: "Month 3", month3Goal: "", strategicPillars: [{ title: "PILLAR #1", desc: "Formulate delivery standards" }], initiatives: []
        },
        playbooks: [
          { id: "pb-consult-strategy", title: "SOP-101: High-Ticket Discovery Session", powerStageId: "ve-con-4", powerStageLabel: "Clarity Breakthrough Consult", ownerId: "tm-owner", instructions: "### Executive Overview\nGuide for conducting standard breakthrough strategy validation reviews.\n\n### Stage Steps\n1. Confirm applicant goals.\n2. Review baseline infrastructure stats.", steps: [{ id: "c1", text: "Validate applicant prerequisites manually", done: false }], videoUrl: "" }
        ],
        nodes: [
          { id: "ve-con-1", label: "Organic Sourcing Channel", type: "start", x: 100, y: 150, engineType: "growth", description: "Client inbound content traffic Sourcing", playbooksId: "" },
          { id: "ve-con-2", label: "Strategy Landing Booklet Page", type: "process", x: 280, y: 150, engineType: "growth", description: "Pre-qualification assessment form layout", playbooksId: "" },
          { id: "ve-con-3", label: "Triage Calendar Call", type: "decision", x: 460, y: 150, engineType: "growth", description: "Evaluate pre-requisite match", playbooksId: "" },
          { id: "ve-con-4", label: "Clarity Breakthrough Consult", type: "process", x: 640, y: 150, engineType: "growth", description: "Conduct thorough strategy diagnostic roadmap session", isPowerStage: true, playbookId: "pb-consult-strategy" },
          { id: "ve-con-5", label: "Proposal Presentation Contract", type: "process", x: 820, y: 150, engineType: "growth", description: "Draft contract alignment parameters", playbooksId: "" },
          { id: "ve-con-6", label: "Client Onboarding Conversion", type: "outcome", x: 1000, y: 150, engineType: "growth", description: "Onboarded and paid partner success state!", playbooksId: "" },
          
          { id: "ve-con-f1", label: "Account Setup Protocol", type: "start", x: 100, y: 150, engineType: "fulfillment", description: "Client account setup dispatch", playbooksId: "" },
          { id: "ve-con-f2", label: "Strategy Kickoff Milestone", type: "process", x: 280, y: 150, engineType: "fulfillment", description: "Perform alignment session on client roadmaps", playbooksId: "" },
          { id: "ve-con-f3", label: "Bi-Weekly High-Performance Sprints", type: "process", x: 460, y: 150, engineType: "fulfillment", description: "Conduct campaign optimizations and performance edits", playbooksId: "" },
          { id: "ve-con-f4", label: "Outcome Retrospective Review", type: "decision", x: 640, y: 150, engineType: "fulfillment", description: "Verify ending results with baseline goals", playbooksId: "" },
          { id: "ve-con-f5", label: "Partner Program Ascension", type: "outcome", x: 820, y: 150, engineType: "fulfillment", description: "Upsell client into permanent masterminds", playbooksId: "" }
        ]
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* Settings Banner Header */}
      <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-6 rounded-2xl shadow-sm space-y-1 text-left">
        <h2 className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-500" />
          Workspace Management & Preferences
        </h2>
        <p className="text-[#86868b] dark:text-[#8e8e93] text-xs">
          Configure multi-tenant partitions, setup security credentials, restore server backups, or upgrade active licenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Numbered Google-Style Menu/Sidebar Navigation */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="text-left px-2 pb-2.5 mb-2 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-[10px] font-bold text-neutral-404 uppercase tracking-widest font-mono">Operations Console</h3>
            <p className="text-[9px] text-neutral-500 leading-none">Browse security parameters, secrets & backups</p>
          </div>

          {/* Desktop Sidebar menu list */}
          <div className="space-y-1 hidden sm:block">
            {[
              { id: 'profile' as const, num: '1', label: 'Active Profile', icon: Users, visible: true, desc: 'Manage authenticated identity' },
              { id: 'projects' as const, num: '2', label: 'Multi-Project Spaces', icon: FolderGit2, visible: true, desc: 'Configure workspace partitions' },
              { id: 'import' as const, num: '3', label: 'Bulk Roster Import', icon: UserPlus, visible: true, desc: 'Add staff bulk CSV templates' },
              { id: 'presets' as const, num: '4', label: 'Blueprints Library', icon: Award, visible: true, desc: 'Deploy workflow presets' },
              { id: 'security' as const, num: '5', label: 'Security Guard PIN', icon: Lock, visible: true, desc: 'Secure structural changes' },
              { id: 'backups' as const, num: '6', label: 'Database Snapshots', icon: RefreshCw, visible: true, desc: 'Incremental server sync snapshots' },
              { id: 'sync' as const, num: '7', label: 'Create Sync Codes', icon: RefreshCw, visible: userRole === 'ceo', desc: 'Secure node sync keys' },
              { id: 'faq' as const, num: '8', label: 'Knowledge Base', icon: HelpCircle, visible: true, desc: 'Offline support & documentation' },
              { id: 'billing' as const, num: '9', label: 'Billing & Payments', icon: CreditCard, visible: licenseTier === 'free', desc: 'Upgrade active evaluation tier' },
              { id: 'desktop' as const, num: '10', label: 'Desktop Client Setup', icon: Laptop, visible: licenseTier === 'enterprise', desc: 'Native executable packaging' },
            ].filter(t => t.visible).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition duration-150 cursor-pointer text-left select-none group relative ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-extrabold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#252526] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                    isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}>
                    0{tab.num}
                  </div>
                  
                  <Icon className={`w-3.5 h-3.5 shrink-0 transition duration-150 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                  }`} />
                  
                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-xs block leading-tight">{tab.label}</span>
                    <span className="text-[8.5px] text-neutral-400 group-hover:text-neutral-500 block truncate mt-0.5 block truncate font-normal">{tab.desc}</span>
                  </div>
                  
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 ${isActive ? 'text-indigo-600 opacity-100' : 'text-neutral-300'}`} />
                </button>
              );
            })}
          </div>

          {/* Mobile Sliding Pill Container */}
          <div className="block sm:hidden overflow-x-auto whitespace-nowrap scrollbar-none py-1 flex gap-1.5 scrollbar-thin">
            {[
              { id: 'profile' as const, label: 'Profile', icon: Users, visible: true },
              { id: 'projects' as const, label: 'Spaces', icon: FolderGit2, visible: true },
              { id: 'import' as const, label: 'Teammates', icon: UserPlus, visible: true },
              { id: 'presets' as const, label: 'Blueprints', icon: Award, visible: true },
              { id: 'security' as const, label: 'Security PIN', icon: Lock, visible: true },
              { id: 'backups' as const, label: 'Backups', icon: RefreshCw, visible: true },
              { id: 'sync' as const, label: 'Sync Codes', icon: RefreshCw, visible: userRole === 'ceo' },
              { id: 'faq' as const, label: 'FAQ', icon: HelpCircle, visible: true },
              { id: 'billing' as const, label: 'Billing', icon: CreditCard, visible: licenseTier === 'free' },
              { id: 'desktop' as const, label: 'Desktop', icon: Laptop, visible: licenseTier === 'enterprise' },
            ].filter(t => t.visible).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 shrink-0 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Setting Tab Panel Container Card */}
        <div className="lg:col-span-8">
          
          <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-5 shadow-sm min-h-[440px] flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* RENDER PROFILE SETTING */}
              {activeSettingsTab === 'profile' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Active Workstation Account</h3>
                      <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5">Manage operator credentials, permission nodes and physical credentials.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/40">
                      ID: {currentUser?.id || "ACC_LOCAL_NODE"}
                    </span>
                  </div>

                  {/* Profile Edit Card */}
                  <div className="bg-[#fbfbfd] dark:bg-[#252526] border border-[#e8e8ed] dark:border-neutral-805 rounded-xl p-4 space-y-4 shadow-sm">
                    {!isEditingProfile ? (
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-neutral-400 block font-mono">AUTHENTICATING OPERATOR</span>
                          <h4 className="font-semibold text-sm text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                            {currentUser?.name || 'Ryan Deiss'}
                          </h4>
                          <p className="font-mono text-[10.5px] text-neutral-500">{currentUser?.email || 'ryan@mitior.co'}</p>
                          
                          <div className="flex gap-2 items-center pt-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-white dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 border border-neutral-200/50">
                              Workspace Count: {projects.length}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/40">
                              Status: Fully Validated
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditName(currentUser?.name || '');
                              setEditEmail(currentUser?.email || '');
                              setIsEditingProfile(true);
                            }}
                            className="bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-[#1d1d1f] dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 transition duration-150 cursor-pointer"
                          >
                            Edit Account Info
                          </button>
                          <button
                            type="button"
                            onClick={onLogout}
                            className="bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:opacity-90 text-xs font-bold px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer"
                          >
                            Log Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <span className="text-[9px] uppercase font-bold text-indigo-500 block font-mono">MODIFYING WORKSPACE IDENTITY</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5 text-xs">
                            <label className="text-neutral-500 dark:text-neutral-400 font-bold block">Operator Full Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-[#f5f5f7] dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-medium rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-[#1d1d1f] dark:text-white"
                              placeholder="Ryan Deiss"
                            />
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <label className="text-neutral-500 dark:text-neutral-400 font-bold block">Operator Email Address</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full bg-[#f5f5f7] dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-medium rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-[#1d1d1f] dark:text-white"
                              placeholder="ryan@mitior.co"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="bg-neutral-105 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold px-4 py-1.5 rounded-xl transition duration-150 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editName.trim() || !editEmail.trim()) {
                                alert("Operator configuration fields cannot be left empty.");
                                return;
                              }
                              if (onUpdateCurrentUser) {
                                onUpdateCurrentUser(editName.trim(), editEmail.trim());
                              }
                              setIsEditingProfile(false);
                              setProfileSaveSuccess(true);
                              setTimeout(() => setProfileSaveSuccess(false), 3000);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-1.5 rounded-xl transition duration-150 cursor-pointer"
                          >
                            Save Identity Changes
                          </button>
                        </div>
                      </div>
                    )}

                    {profileSaveSuccess && (
                      <p className="text-emerald-600 text-[10.5px] font-bold mt-1 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100/40">
                        ✓ Operational profile and workspace owner identity synced successfully.
                      </p>
                    )}
                  </div>

                  {/* Metadata cards layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#fbfbfd] dark:bg-[#252526]/30 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-mono font-bold text-neutral-400">Security PIN Shield</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {isPinConfigured ? "Shield Active" : "No Shield Configured"}
                      </p>
                      <p className="text-[10px] text-neutral-400">Blocks unauthorized deletes, playbooks, and structural adjustments.</p>
                    </div>

                    <div className="bg-[#fbfbfd] dark:bg-[#252526]/30 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-mono font-bold text-neutral-400">Licensing Grade</span>
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-indigo-100 text-indigo-705 dark:bg-indigo-950 dark:text-indigo-400 uppercase tracking-wide">
                          {licenseTier}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {licenseTier === 'free' ? "Evaluation Blueprint" : "Professional Lifetime Node"}
                      </p>
                      <p className="text-[10px] text-neutral-405">Bound to physical client system memory.</p>
                    </div>
                  </div>

                  {/* Executive Portrait Studio (Founder/CEO) */}
                  {(() => {
                    const founderObj = teamMembers.find(m => m.isFounder);
                    if (!founderObj) return null;
                    
                    const handleCeoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file && onUpdateTeamMembers) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            const updated = teamMembers.map(m => m.id === founderObj.id ? { ...m, customPhoto: event.target?.result as string } : m);
                            onUpdateTeamMembers(updated);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    };

                    const handleCeoDrop = (e: React.DragEvent) => {
                      e.preventDefault();
                      setIsCeoDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && onUpdateTeamMembers) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            const updated = teamMembers.map(m => m.id === founderObj.id ? { ...m, customPhoto: event.target?.result as string } : m);
                            onUpdateTeamMembers(updated);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    };

                    const extractCeoPhotoFromGravatar = () => {
                      if (!ceoEmail.trim() || !onUpdateTeamMembers) return;
                      const hash = computeMD5(ceoEmail);
                      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
                      const updated = teamMembers.map(m => m.id === founderObj.id ? { ...m, customPhoto: gravatarUrl } : m);
                      onUpdateTeamMembers(updated);
                      setCeoExtractSuccess(true);
                      setTimeout(() => {
                        setCeoExtractSuccess(false);
                      }, 3000);
                    };

                    return (
                      <div className="border border-[#e8e8ed] dark:border-neutral-800 rounded-2xl p-5 space-y-4 bg-[#fbfbfd] dark:bg-[#252526]/40 mt-4 text-left">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-xs text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-500" />
                              Executive Portrait Studio (Founder/CEO)
                            </h4>
                            <p className="text-[10px] text-[#86868b] dark:text-[#8e8e93] leading-relaxed max-w-md">
                              Publish a headshot portrait for the CEO/Founder ({founderObj.name || 'Ryan Deiss'}), or auto-extract it dynamically using Gravatar email synchronization.
                            </p>
                          </div>
                          <img 
                            src={founderObj.customPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'} 
                            alt="CEO"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-neutral-800 ring-4 ring-amber-100 dark:ring-amber-950 shadow-xs shrink-0"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setIsCeoDragging(true); }}
                            onDragLeave={() => setIsCeoDragging(false)}
                            onDrop={handleCeoDrop}
                            className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center min-h-[70px] ${
                              isCeoDragging 
                                ? 'border-amber-400 bg-amber-50/10' 
                                : 'border-[#e8e8ed] dark:border-[#2d2d2f] hover:border-amber-300 dark:hover:border-[#352516] bg-white dark:bg-[#1d1d1f]'
                            }`}
                          >
                            <label className="flex flex-col items-center justify-center w-full gap-1 cursor-pointer">
                              <Upload className="w-4 h-4 text-neutral-400 shrink-0" />
                              <span className="font-semibold text-[10px] text-[#1d1d1f] dark:text-[#f5f5f7]">
                                Drag headshot here or highlight <span className="text-amber-600 hover:underline">computer files</span>
                              </span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                onChange={handleCeoFileChange}
                              />
                            </label>
                          </div>

                          <div className="space-y-2 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-3 rounded-xl">
                            <label className="text-[10px] text-[#86868b] block font-semibold leading-none">Extract portrait from registered Gravatar</label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="email"
                                placeholder="CEO gravatar profile email..."
                                value={ceoEmail}
                                onChange={(e) => setCeoEmail(e.target.value)}
                                className="bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] outline-none px-2 py-1.5 rounded-lg flex-1 text-[11px] font-medium text-[#1d1d1f] dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={extractCeoPhotoFromGravatar}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10.5px] transition duration-150 shrink-0 cursor-pointer"
                              >
                                Sync
                              </button>
                            </div>
                            {ceoExtractSuccess && (
                              <p className="text-emerald-700 text-[9.5px] font-bold">
                                ✓ Saved secure profile sync!
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Export Team Roster (JSON) button */}
                  {(() => {
                    const handleExportRoster = () => {
                      try {
                        const dataStr = JSON.stringify(teamMembers, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', url);
                        const dateStr = new Date().toISOString().slice(0, 10);
                        linkElement.setAttribute('download', `mitior_os_roster_backup_${dateStr}.json`);
                        linkElement.click();
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Error exporting roster:', error);
                      }
                    };

                    return (
                      <div className="bg-[#fbfbfd] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-4 flex items-center justify-between gap-4 mt-3">
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                            <Download className="w-4 h-4 text-indigo-500" />
                            Export Team Database Backup
                          </h4>
                          <p className="text-[10px] text-[#86868b] dark:text-[#8e8e93]">
                            Download the active team roster containing accountability charts as standard JSON metadata completely offline-first.
                          </p>
                        </div>
                        <button
                          onClick={handleExportRoster}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-150 flex items-center gap-1.5 shrink-0 select-none shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Roster (JSON)</span>
                        </button>
                      </div>
                    );
                  })()}

                  <div className="bg-[#fbfbfd] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-4 flex items-start gap-3 mt-4">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">100% Offline Integrity Secured</h4>
                      <p className="text-[10px] text-[#86868b] dark:text-[#8e8e93] leading-relaxed">
                        All account profiles and project configurations are sandboxed to your localized cache database. No data is shared with cloud telemetry trackers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER PROJECTS SWITCHER */}
              {activeSettingsTab === 'projects' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Multi-Project Workspaces</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5 font-sans">Initialize secondary sandbox databases with isolated parameters.</p>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {projects.map(p => {
                      const isActive = p.id === activeProjectId;
                      return (
                        <div 
                          key={p.id}
                          className={`p-3 rounded-xl border flex justify-between items-center transition ${
                            isActive 
                              ? 'bg-[#fbfbfd] dark:bg-neutral-900 border-indigo-600 dark:border-indigo-400/50 shadow-2xs' 
                              : 'bg-white dark:bg-transparent border-neutral-100 dark:border-neutral-800'
                          }`}
                        >
                          <div className="text-left leading-normal overflow-hidden pr-2">
                            <h4 className="font-bold text-xs text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5 capitalize mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-600 animate-pulse' : 'bg-neutral-300'}`} />
                              {p.name}
                            </h4>
                            <p className="text-[10px] text-[#86868b] truncate max-w-[280px] mt-0.5">{p.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isActive ? (
                              <>
                                <button
                                  onClick={() => onSwitchProject(p.id)}
                                  className="text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-755 dark:text-indigo-400 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/40 cursor-pointer transition-all"
                                >
                                  Activate
                                </button>
                                {projects.length > 1 && (
                                  <button
                                    onClick={() => onDeleteProject(p.id)}
                                    className="text-neutral-400 hover:text-red-505 p-1 rounded transition cursor-pointer"
                                    title="Delete workspace"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Create Project Workspace form */}
                  {!isEmployee && (
                    <div className="bg-[#fbfbfd] dark:bg-[#252526] border border-neutral-150 dark:border-neutral-800 rounded-xl p-3.5 space-y-2.5 mt-2 text-left">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Create Partition Space</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Workspace Title (e.g. Acme Inc)"
                          value={newProjName}
                          onChange={(e) => setNewProjName(e.target.value)}
                          className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 cursor-text text-[#1d1d1f] dark:text-[#f5f5f7]"
                        />
                        <input
                          type="text"
                          placeholder="Brief Description (e.g. Growth Target)"
                          value={newProjDesc}
                          onChange={(e) => setNewProjDesc(e.target.value)}
                          className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 cursor-text text-[#1d1d1f] dark:text-[#f5f5f7]"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newProjName.trim()) return;
                          onCreateProject(newProjName.trim(), newProjDesc.trim());
                          setNewProjName('');
                          setNewProjDesc('');
                        }}
                        className="w-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:opacity-90 text-xs font-bold py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Create Project Workspace
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER TEAM ROSTER IMPORT */}
              {activeSettingsTab === 'import' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Bulk Team Roster Import</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5 font-sans">Rapidly onboard your teams using standard CSV metrics.</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 rounded-xl p-3 space-y-2">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">📋 CSV Header Format Requirement</span>
                    <p className="text-[10px] leading-relaxed text-neutral-400">
                      Standard columns: <code className="font-mono bg-neutral-150 dark:bg-neutral-800 px-1 py-0.5 rounded text-indigo-500">name</code>, <code className="font-mono bg-neutral-150 dark:bg-neutral-800 px-1 py-0.5 rounded text-indigo-500">jobTitle</code>, <code className="font-mono bg-neutral-150 dark:bg-neutral-800 px-1 py-0.5 rounded text-indigo-500">manager</code>, <code className="font-mono bg-neutral-150 dark:bg-neutral-800 px-1 py-0.5 rounded text-indigo-500">accountabilities</code>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent = `name,jobTitle,manager,accountabilities,isFounder
"Rachel Green","Operations Executive","Ryan Deiss","Maintain client satisfaction;Manage billing systems",false
"Monica Geller","Fulfillment Director","Ryan Deiss","Audit shipment compliance;Draft standard playbooks",false`;
                        navigator.clipboard.writeText(csvContent);
                        alert("Structured CSV copied to clipboard!");
                      }}
                      className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 px-3 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copy Sample CSV Format</span>
                    </button>
                  </div>

                  {/* Bulk Operator Onboarding container */}
                  <div className="border border-neutral-150 dark:border-neutral-800 rounded-xl p-4 bg-[#fbfbfd] dark:bg-[#1a1a1b] space-y-3.5">
                    
                    {isEmployee ? (
                      <div className="p-3 bg-neutral-200/50 dark:bg-neutral-900 rounded-xl text-neutral-500 text-[11px] leading-relaxed select-none">
                        ⚠️ Roster import pipelines are restricted in Employee mode. Request manager authorizations to adjust rosters.
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <label className="flex-1 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 p-4 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer group transition duration-150 text-center">
                          <Upload className="w-5 h-5 text-neutral-400 group-hover:text-indigo-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-neutral-750 dark:text-neutral-300">
                            {bulkFile ? `Selected: ${bulkFile.name}` : "Upload .CSV Roster Database"}
                          </span>
                          <span className="text-[9px] text-neutral-400">Click to locate or drop database file</span>
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleBulkFileChange}
                          />
                        </label>
                      </div>
                    )}

                    {bulkError && (
                      <div className="bg-red-50 text-red-700 text-[10px] p-2 rounded-lg leading-snug">
                        ❌ {bulkError}
                      </div>
                    )}

                    {bulkImportSuccess && (
                      <div className="bg-emerald-50 text-emerald-800 text-[10.5px] p-2.5 rounded-lg font-medium leading-relaxed">
                        🎉 {bulkImportSuccess}
                      </div>
                    )}

                    {/* Parser feedback and merge checks */}
                    {bulkParsedMembers.length > 0 && (
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3 text-left">
                        <h4 className="font-extrabold text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7]">Parsed Operators ({bulkParsedMembers.length} found)</h4>
                        
                        <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-1 text-[10.5px]">
                          {bulkParsedMembers.map((m, idx) => (
                            <div key={idx} className="p-1 px-2.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-805 rounded-md flex justify-between">
                              <span className="font-bold text-neutral-800 dark:text-neutral-200">{m.name}</span>
                              <span className="text-neutral-400 truncate max-w-[150px]">{m.jobTitle}</span>
                            </div>
                          ))}
                        </div>

                        {/* Import mode radio */}
                        <div className="flex gap-4 p-1 text-left justify-start text-[11px] font-sans">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="radio"
                              name="bulkMode"
                              checked={importMode === 'append'}
                              onChange={() => setImportMode('append')}
                              className="w-3.5 h-3.5 cursor-pointer text-indigo-600"
                            />
                            <span>Merge & Append (Recommended)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="radio"
                              name="bulkMode"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="w-3.5 h-3.5 cursor-pointer text-indigo-600"
                            />
                            <span className="text-red-650">Clean Overwrite Active</span>
                          </label>
                        </div>

                        {/* Execute Commit button */}
                        <button
                          onClick={executeBulkImport}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Play className="w-3 h-3 text-white" />
                          <span>Commit Bulk Onboard Import</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RENDER BLUEPRINTS LIBRARY */}
              {activeSettingsTab === 'presets' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Blueprints & Presets Library</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5">Initialize ready-to-run business configurations with zero thinking.</p>
                  </div>

                  {/* Save current station */}
                  {!isEmployee && (
                    <div className="space-y-1 bg-neutral-50/50 dark:bg-[#1a1a1b] p-3 rounded-xl border border-neutral-150 dark:border-neutral-800">
                      <label className="text-[10px] uppercase font-bold text-[#86868b] block">Capture Workstation Snapshot</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Preset name (e.g. Design Agency)"
                          value={newBlueprintName}
                          onChange={(e) => setNewBlueprintName(e.target.value)}
                          className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold rounded-xl px-3 py-1.5 outline-none transition focus:border-indigo-500 flex-1 text-[#1d1d1f] dark:text-[#f5f5f7] cursor-text"
                        />
                        <button
                          onClick={handleSaveToLocalLibrary}
                          className="bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-xl px-4 py-1.5 text-xs font-bold cursor-pointer hover:opacity-90 transition shrink-0"
                        >
                          Save Library
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Saved custom lists */}
                  {customBlueprints.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <label className="text-[10px] uppercase font-bold text-[#86868b] block">My Saved Blueprint Templates ({customBlueprints.length})</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[100px] overflow-y-auto pr-1">
                        {customBlueprints.map((bp) => (
                          <div key={bp.id} className="flex justify-between items-center p-2 rounded-xl bg-neutral-50 dark:bg-[#252526] border border-neutral-150 dark:border-neutral-800 text-xs">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">{bp.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleLoadLibraryBlueprint(bp.data)}
                                className="text-[10px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-neutral-800 dark:text-neutral-200"
                              >
                                Deploy
                              </button>
                              <button
                                onClick={() => handleDeleteLocalBlueprint(bp.id)}
                                className="text-neutral-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System presets */}
                  <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-left">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block font-mono">Preconfigured SaaS Blueprints</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {systemPresets.map((sys) => (
                        <div key={sys.id} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 text-left hover:border-indigo-500/50 transition bg-neutral-50/20">
                          <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{sys.title}</h4>
                          <p className="text-[10px] text-neutral-400 leading-snug mb-2 min-h-[35px]">{sys.description}</p>
                          <button
                            onClick={() => handleLoadLibraryBlueprint(sys.data)}
                            className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/40 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1 w-full"
                          >
                            <Play className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>Mount Empty Layout</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER SECURITY PIN */}
              {activeSettingsTab === 'security' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Security Shield PIN Lock</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5 font-sans">Enforce locks on structural layout alterations to secure client weights.</p>
                  </div>

                  <div className="space-y-3 max-w-md bg-neutral-50/50 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Security Gate PIN Status:</span>
                      <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${isPinConfigured ? 'bg-emerald-100 text-emerald-805 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                        {isPinConfigured ? "🔒 PIN ACTIVE" : "⚠️ OPEN ACCESS"}
                      </span>
                    </div>

                    <div className="flex gap-2.5">
                      <input
                        type="password"
                        placeholder="Enter 4-Digit PIN"
                        maxLength={4}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-mono tracking-widest text-center font-bold rounded-xl px-3 py-2 outline-none w-32 text-[#1d1d1f] dark:text-[#f5f5f7] cursor-text"
                      />
                      
                      {isPinConfigured ? (
                        <button
                          onClick={handleRemovePin}
                          className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition flex-1"
                        >
                          Deactivate Security Guard
                        </button>
                      ) : (
                        <button
                          onClick={handleSetPin}
                          className="bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:opacity-90 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition flex-1"
                        >
                          Lock System Structure
                        </button>
                      )}
                    </div>

                    {pinStatusMsg && (
                      <div className={`p-2 rounded-xl text-[10.5px] leading-snug animate-fade-in ${pinStatusMsg.startsWith("❌") ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>
                        {pinStatusMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RENDER SNAPSHOTS, RECOVERY & DATA PURGE */}
              {activeSettingsTab === 'backups' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-1">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Data Recovery, Backups & Reset Console</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5">Synchronize incremental cloud snapshots, restore offline structures, or factory reset configuration parameters.</p>
                  </div>

                  {/* SECTION 1: Incremental Cloud Backups */}
                  <div className="bg-[#fbfbfd] dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400 block pb-1 border-b border-neutral-100 dark:border-neutral-800/65">Commit Milestones Snapshot</span>
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Milestone description (e.g. Agency Pivot V2)"
                        value={backupNote}
                        onChange={(e) => setBackupNote(e.target.value)}
                        className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 flex-1 text-[#1d1d1f] dark:text-[#f5f5f7] cursor-text"
                      />
                      <button
                        disabled={backupLoading}
                        onClick={triggerServerBackup}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 rounded-xl px-4.5 py-1.5 text-xs font-extrabold cursor-pointer transition shrink-0"
                      >
                        {backupLoading ? "Syncing..." : "Sync Active"}
                      </button>
                    </div>

                    {dbStatusMsg && (
                      <div className={`p-2 rounded-xl text-[11px] leading-snug animate-fade-in ${dbStatusMsg.startsWith("❌") ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>
                        {dbStatusMsg}
                      </div>
                    )}

                    {/* Snapshot catalog list */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/65">
                      <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider block font-mono">Server snapshots catalog ({serverBackups.length})</span>
                      
                      {serverBackups.length === 0 ? (
                        <div className="text-center py-4 bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-100/5 rounded-xl text-[#86868b] text-[10.5px]">
                          No cloud snapshots committed for this project space yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1 text-xs">
                          {serverBackups.map((bak) => (
                            <div key={bak.id} className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-800 text-xs shadow-2xs">
                              <div className="text-left leading-normal overflow-hidden pr-2">
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 block truncate text-[11px]">{bak.description}</span>
                                <span className="text-[9px] text-[#86868b] block font-mono mt-0.5">
                                  {new Date(bak.timestamp).toLocaleDateString()} • {bak.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => restoreServerBackup(bak.id)}
                                  className="bg-indigo-50 hover:bg-indigo-100 dark:bg-[#252526] text-indigo-700 dark:text-indigo-400 font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteServerBackup(bak.id)}
                                  className="text-neutral-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: Dynamic Recovery Options Card */}
                  <div className="border border-[#e8e8ed] dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900/40 space-y-3.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block tracking-wider">🔧 Data Recovery & Exports</span>
                    
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                      Select a restoration procedure to recover data from local files, server presets or factory standards:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {/* Sub-option A: Restore Offline JSON */}
                      <div className="border border-[#e8e8ed] dark:border-neutral-800/80 p-3.5 rounded-xl bg-[#fbfbfd] dark:bg-[#1c1c1e] text-left flex flex-col justify-between space-y-2">
                        <div>
                          <h4 className="font-bold text-xs text-[#1d1d1f] dark:text-white flex items-center gap-1.5 pb-1 border-b border-neutral-100 dark:border-neutral-800/60 w-full">
                            <Upload className="w-3.5 h-3.5 text-indigo-500" />
                            Offline JSON Recovery
                          </h4>
                          <p className="text-[10px] text-[#86868b] leading-tight pt-1">
                            Load exported company metrics blueprints, team rosters & roadmap sprint records from physical backup records on your PC.
                          </p>
                        </div>
                        
                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (licenseTier === 'free') {
                                alert("Export pipeline is restricted for Free Tier validation profiles. Please upgrade to unleash full operational JSON exports.");
                                return;
                              }
                              exportSystemData();
                            }}
                            className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1d1d1f] dark:text-white rounded-lg py-1.5 px-2.5 font-bold text-[10px] border border-neutral-200 dark:border-neutral-700 flex-1 text-center cursor-pointer transition"
                          >
                            Export
                          </button>
                          
                          {!isEmployee ? (
                            <label className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 px-2.5 font-bold text-[10px] border border-indigo-700 flex-1 text-center cursor-pointer select-none">
                              <span>Import</span>
                              <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleJsonImport} 
                                className="hidden" 
                                id="file-import-uploader-settings"
                              />
                            </label>
                          ) : (
                            <span className="text-[9.5px] text-neutral-400 text-center block leading-loose flex-1">Restricted</span>
                          )}
                        </div>
                      </div>

                      {/* Sub-option B: Restore Preset blueprints */}
                      <div className="border border-[#e8e8ed] dark:border-neutral-800/80 p-3.5 rounded-xl bg-[#fbfbfd] dark:bg-[#1c1c1e] text-left flex flex-col justify-between space-y-2">
                        <div>
                          <h4 className="font-bold text-xs text-[#1d1d1f] dark:text-white flex items-center gap-1.5 pb-1 border-b border-neutral-100 dark:border-neutral-800/60 w-full">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            Load Preset Blueprints
                          </h4>
                          <p className="text-[10px] text-[#86868b] leading-tight pt-1">
                            Clear active space parameters and insert standardized pre-filled business playbooks and scorecard KPI definitions to study.
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Restore demo templates? This wipes any active customization cells inside this partition.")) {
                              onImportData({
                                playbooks: INITIAL_PLAYBOOKS,
                                teamMembers: currentUser ? [
                                  { id: "tm-owner", name: currentUser.name, manager: "Board", jobTitle: "Founder & CEO", accountabilities: [], isFounder: true }
                                ] : INITIAL_TEAM_MEMBERS,
                                scorecard: INITIAL_SCORECARD,
                                sprintPlan: INITIAL_SPRINT_PLAN,
                                compass: INITIAL_COMPASS
                              });
                              setImportSuccess("Operational presets restored inside your active partition!");
                              setTimeout(() => setImportSuccess(null), 3550);
                            }
                          }}
                          className="bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg py-1.5 px-3 font-bold text-[10px] border border-neutral-200 dark:border-neutral-700 text-center cursor-pointer transition block w-full"
                        >
                          Recover Preset Templates
                        </button>
                      </div>
                    </div>

                    {importError && (
                      <div className="p-2 border border-rose-100 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded-lg">
                        ❌ {importError}
                      </div>
                    )}
                    {importSuccess && (
                      <div className="p-2 border border-emerald-100 bg-emerald-50 text-emerald-800 text-[10px] font-semibold rounded-lg">
                        ✓ {importSuccess}
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: Deep Warning Safe Data Purge Console */}
                  <div className="border border-red-200 dark:border-rose-950 rounded-xl p-4 bg-red-50/10 dark:bg-rose-950/5 space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-[10px] uppercase font-mono font-black text-rose-600 block tracking-wider">⚠️ Critical Danger Zone: System Purge Console</span>
                    </div>

                    <p className="text-[#86868b] text-[10.5px] leading-relaxed">
                      Wiping data structures cannot be undone. To authorize structural purges, type <code className="bg-red-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded font-black text-rose-700 font-mono text-[9.5px]">PURGE</code> below to unlock command controls:
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <input
                        type="text"
                        placeholder="Type PURGE here..."
                        value={purgeConfirmText}
                        onChange={(e) => setPurgeConfirmText(e.target.value)}
                        className="bg-white dark:bg-[#151516] border border-red-200 dark:border-[#3a2022] text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-red-500 text-rose-700 sm:w-48 text-center cursor-text"
                      />

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Option 1: Current Partition Wipe */}
                        <button
                          type="button"
                          disabled={purgeConfirmText !== "PURGE"}
                          onClick={() => {
                            if (confirm("Wipe active partition? All current metrics, roadmaps and playbooks will be erased forever.")) {
                              if (onPurgeAllData) {
                                onPurgeAllData('active_only');
                              }
                              setPurgeStatusMsg("Wiped current workspace data clean!");
                              setPurgeConfirmText('');
                              setTimeout(() => setPurgeStatusMsg(null), 3000);
                            }
                          }}
                          className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-[#3a2022] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 disabled:opacity-30 disabled:hover:bg-white text-xs font-bold px-3 py-2 rounded-xl transition duration-150 cursor-pointer text-center"
                        >
                          Wipe Current Partition
                        </button>

                        {/* Option 2: Full Factory Reset */}
                        <button
                          type="button"
                          disabled={purgeConfirmText !== "PURGE"}
                          onClick={() => {
                            if (confirm("Executing full factory reset. All account credentials, keys, security PINs and workspaces will be purged from this machine FOREVER. Are you ready?")) {
                              if (onPurgeAllData) {
                                onPurgeAllData('full_factory');
                              }
                            }
                          }}
                          className="bg-red-605 bg-red-600 hover:bg-red-700 disabled:bg-neutral-100 dark:disabled:bg-neutral-850 text-white disabled:text-neutral-400 text-xs font-black px-3 py-2 rounded-xl transition duration-150 cursor-pointer text-center"
                        >
                          Full Machine Factory Reset
                        </button>
                      </div>
                    </div>

                    {purgeStatusMsg && (
                      <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] font-mono leading-none pt-2">
                        System status: {purgeStatusMsg}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* RENDER SYNC CODES SECTION FOR ADMINISTRATORS */}
              {activeSettingsTab === 'sync' && userRole === 'ceo' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Node Sync Keys Creation Engine</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5">
                      Provision cryptographic keys to link remote staff members seamlessly to a target project space.
                    </p>
                  </div>

                  {/* Creation Form Panel */}
                  <form onSubmit={createSyncCode} className="bg-[#fbfbfd] dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl space-y-4">
                    <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block tracking-wider">
                      Generate New Sync Code
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Space Selector */}
                      <div className="space-y-1.5 text-xs">
                        <label className="text-neutral-500 dark:text-neutral-400 font-semibold block">Target Multi-Project Space</label>
                        <select
                          value={syncCodeProjectId}
                          onChange={(e) => setSyncCodeProjectId(e.target.value)}
                          className="w-full bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer"
                        >
                          <option value="">-- Choose target space --</option>
                          {projects.map((proj) => (
                            <option key={proj.id} value={proj.id}>
                              {proj.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Code Tag description */}
                      <div className="space-y-1.5 text-xs">
                        <label className="text-neutral-500 dark:text-neutral-400 font-semibold block">Teammate Designation / Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Finance Division, Remote Contractors"
                          value={syncCodeDesc}
                          onChange={(e) => setSyncCodeDesc(e.target.value)}
                          className="w-full bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 text-[#1d1d1f] dark:text-[#f5f5f7]"
                        />
                      </div>
                    </div>

                    {syncErrorMsg && (
                      <div className="p-2.5 rounded-xl text-[11px] bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200 dark:border-red-900/30">
                        {syncErrorMsg}
                      </div>
                    )}

                    {syncSuccessMsg && (
                      <div className="p-2.5 rounded-xl text-[11px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 border border-emerald-250 dark:border-emerald-900/35">
                        {syncSuccessMsg}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isLoadingSync}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 rounded-xl px-5 py-2 text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSync ? 'animate-spin' : ''}`} />
                        <span>Generate Active Node Key</span>
                      </button>
                    </div>
                  </form>

                  {/* Catalogue List of created keys */}
                  <div className="space-y-3 mt-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block font-mono">
                      Active Synchronization Keys ({syncCodes.length})
                    </span>

                    {isLoadingSync ? (
                      <div className="text-center py-5 text-neutral-405 text-xs">
                        Querying Node Registries...
                      </div>
                    ) : syncCodes.length === 0 ? (
                      <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-150 dark:border-neutral-805 rounded-xl text-[#86868b] text-[11px] leading-relaxed">
                        No sync keys active. Teammates joining as "Employee" role will prompt for an administrator's code; generate one above to enable partition syncing.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {syncCodes.map((item) => (
                          <div key={item.code} className="p-3.5 rounded-2xl bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs flex flex-col justify-between space-y-3 shadow-2xs relative overflow-hidden group">
                            
                            {/* Copyable code top */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] uppercase bg-neutral-100 dark:bg-[#252526] text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded font-bold font-mono">
                                  {item.projectName} Space
                                </span>
                                <button
                                  onClick={() => deleteSyncCode(item.code)}
                                  className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg transition duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800 shrink-0"
                                  title="Revoke code"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>

                              <div className="flex gap-2 items-center bg-neutral-50 dark:bg-[#151516] p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800">
                                <span className="font-mono text-xs font-bold text-[#1d1d1f] dark:text-indigo-400 block select-all break-all flex-1 tracking-wider text-center">
                                  {item.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.code);
                                    alert(`Copied sync code to clipboard: ${item.code}`);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:underline font-bold shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {/* Info footer */}
                            <div className="text-[10.5px] text-neutral-500 leading-normal border-t border-neutral-100 dark:border-neutral-800/85 pt-2.5">
                              <p className="font-bold text-neutral-850 dark:text-neutral-300 truncate">
                                {item.description}
                              </p>
                              <span className="text-[9px] text-[#86868b] block font-mono mt-0.5">
                                Created {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detailed guidance card */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 p-4 rounded-xl border border-indigo-150 dark:border-indigo-900/40 text-xs leading-relaxed space-y-1.5">
                    <h5 className="font-bold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" /> Enterprise Connection Manual
                    </h5>
                    <p>
                      S-OS Sync Keys act as workspace connectors. When staff members initialize their workstation client nodes as "Employee," entering an active Sync Key registers their console node automatically with this cloud database snapshot.
                    </p>
                  </div>
                </div>
              )}

              {/* RENDER SUPPORT FAQ */}
              {activeSettingsTab === 'faq' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Knowledge Base & FAQ</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5 font-sans">Find immediate resolutions on data-privacy and offline settings.</p>
                  </div>

                  <div className="space-y-1 pt-1 font-sans text-xs max-h-[290px] overflow-y-auto pr-1">
                    {[
                      {
                        q: "How does my data database persist?",
                        a: "Your records reside locally in a sandbox state by default. Upgrading to Enterprise unlocks continuous backups to our secure server database filesystem so you can recover your workspaces across reboots.",
                        visible: true
                      },
                      {
                        q: "How does Safaricom Lipa Na M-Pesa work?",
                        a: "When you launch checkout, our server makes a direct secure STK Push request to Safaricom's Daraja gateway. It floats a dialog on your phone to complete PIN entry. In offline/dev settings, an automatic high-fidelity sandbox simulator processes your test payments in 5 seconds.",
                        visible: true
                      },
                      {
                        q: "Are credit card and mobile checkouts secure?",
                        a: "Absolutely. All credentials and payment callback verification pathways operate on encrypted server routes using direct Stripe API and Safaricom TLS protocols. Sensitive keys are never served to the client.",
                        visible: true
                      },
                      {
                        q: "How do I launch this fully on offline desktop?",
                        a: "Run the specialized installer via powershell. It downloads the server runtime locally, configures direct entry points, and opens on port 3000 giving you an independent, self-contained workspace.",
                        visible: licenseTier === 'enterprise'
                      },
                      {
                        q: "What is client data-privacy?",
                        a: "Mitior OS is completely private and local first. Only credentials you explicitly configure in secrets are utilized, keeping your corporate analytics shielded from telemetry sniffers.",
                        visible: true
                      }
                    ].filter(item => item.visible).map((faq, i) => {
                      const isOpen = faqOpenIdx === i;
                      return (
                        <div key={i} className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5 last:border-b-0 text-left">
                          <button
                            onClick={() => setFaqOpenIdx(isOpen ? null : i)}
                            className="w-full flex justify-between items-center text-left py-1.5 text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 font-bold cursor-pointer select-none transition"
                          >
                            <span className="pr-2">{faq.q}</span>
                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transform transition-transform duration-200 ${isOpen ? 'rotate-90 text-indigo-600' : 'text-neutral-405'}`} />
                          </button>
                          {isOpen && (
                            <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] leading-relaxed mt-1 p-3 bg-neutral-50 dark:bg-[#1a1a1b] rounded-xl border border-neutral-100 dark:border-neutral-800 animate-fade-in">
                              {faq.a}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RENDER BILLING PORTAL IF FREE */}
              {activeSettingsTab === 'billing' && licenseTier === 'free' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-105 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Upgrade Billing Panel</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5 font-sans">Accept M-Pesa push prompts on your local validation profile.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center flex-wrap gap-4 text-left">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 block font-mono">WORKSPACE GRADE</span>
                      <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                        🟢 Free Evaluation Profile
                      </span>
                    </div>
                    {onOpenCheckout && (
                      <button
                        onClick={onOpenCheckout}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-95 duration-100 text-left"
                      >
                        <span>Upgrade License</span>
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Kenyan transactions index */}
                  {checkoutHistory.length > 0 && (
                    <div className="space-y-2 pt-1 text-xs text-left">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono tracking-wider block">Kenyan billing transactions audit</span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {checkoutHistory.map((h, idx) => (
                          <div key={idx} className="p-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 text-[10.5px] leading-snug text-left flex justify-between items-start gap-1">
                            <div>
                              <div className="font-bold text-neutral-800 dark:text-neutral-200">{h.planName}</div>
                              <div className="text-[9.5px] text-neutral-500">Method: {h.paymentMethod} ({h.phoneOrCard})</div>
                              <div className="text-[9.5px] text-neutral-450 font-mono">{h.receiptNumber}</div>
                            </div>
                            <div className="text-right whitespace-nowrap shrink-0 font-sans">
                              <span className="font-black text-neutral-800 dark:text-white block">KES {h.amount}</span>
                              <span className={`text-[8.5px] uppercase font-bold font-mono px-1.5 py-0.5 rounded-full ${h.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                                {h.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live secrets guideline */}
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3.5 space-y-2 text-left">
                    <h4 className="text-[10px] uppercase font-bold text-neutral-450 block tracking-wider font-mono">Configuring Payment Gateways</h4>
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                      Set environmental parameters inside your local <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded text-indigo-500 text-[10.5px] font-bold">.env</code> to route real card and mobile money STK checks:
                    </p>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 text-[9px] font-mono text-neutral-500 rounded-xl border border-neutral-150 dark:border-neutral-805 space-y-0.5 select-all overflow-x-auto block text-left">
                      <div>MPESA_CONSUMER_KEY="your_safaricom_key"</div>
                      <div>MPESA_CONSUMER_SECRET="your_safaricom_secret"</div>
                      <div>MPESA_SHORTCODE="your_paybill_number"</div>
                      <div>MPESA_PASSKEY="stk_push_passkey"</div>
                      <div>STRIPE_SECRET_KEY="your_stripe_secret"</div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER NATIVE DESKTOP SETUP IF ENTERPRISE */}
              {activeSettingsTab === 'desktop' && licenseTier === 'enterprise' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
                    <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">Desktop Native Client Run</h3>
                    <p className="text-[#86868b] dark:text-[#8e8e93] text-[10px] mt-0.5">Run this application on offline corporate nodes completely private.</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-[#1a1a1b] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-2.5 font-mono text-[10.5px] text-left">
                    <span className="text-[9px] text-neutral-405 block font-sans font-bold uppercase tracking-wider">⚡ Setup Windows Launcher Execution</span>
                    <code className="text-indigo-600 dark:text-indigo-400 font-bold block select-all break-all bg-white dark:bg-[#151516] p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">powershell -ExecutionPolicy Bypass -File .\installer.ps1</code>
                    <p className="font-sans text-[10px] text-neutral-500 leading-relaxed pt-1.5">
                      Our custom Windows batch script extracts system dependencies, builds Vite client weights on localhost:3000, and binds Express server APIs completely offline with <strong>absolute data autonomy</strong>.
                    </p>
                  </div>

                  {onOpenLauncherGuide && (
                    <button
                      onClick={onOpenLauncherGuide}
                      className="w-full bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/35 text-indigo-700 dark:text-indigo-400 rounded-xl py-3 px-3 font-bold text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      id="settings-open-installer-btn"
                    >
                      <span>Show Graphical Workspace Setup Checklist</span>
                      <ChevronRight className="w-4 h-4 shrink-0 text-indigo-600 animate-pulse" />
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* General Disclaimer */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-4 text-center">
              <p className="text-[10px] text-neutral-400 font-sans">
                Mitior Operating System. Developed and distributed globally for independent SaaS founders and local builders.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
