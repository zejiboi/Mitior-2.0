import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  UserMinus,
  Award, 
  CheckCircle, 
  ShieldAlert,
  GitBranch,
  Upload,
  Image as ImageIcon,
  X,
  Download,
  Briefcase,
  FileText
} from 'lucide-react';
import { TeamMember, Playbook } from '../types';
import OrgHierarchyChart from './OrgHierarchyChart';

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
  
  const wordToHex = (num: number) => {
    let res = '';
    for (let i = 0; i < 4; i++) {
      const byte = (num >>> (i * 8)) & 255;
      res += ('0' + byte.toString(16)).slice(-2);
    }
    return res;
  };
  
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
};

interface TeamCanvasViewProps {
  teamMembers: TeamMember[];
  playbooks: Playbook[];
  onUpdateTeam: (updatedTeam: TeamMember[]) => void;
}

export default function TeamCanvasView({
  teamMembers,
  playbooks,
  onUpdateTeam,
}: TeamCanvasViewProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [newMemberManager, setNewMemberManager] = useState('');
  const [newBulletText, setNewBulletText] = useState<{ [tmId: string]: string }>({});
  const [newMemberPhoto, setNewMemberPhoto] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [newMemberIsVacant, setNewMemberIsVacant] = useState(false);
  
  const [ceoEmail, setCeoEmail] = useState(() => {
    const saved = localStorage.getItem('sOS_current_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed.email;
      } catch (e) {}
    }
    return 'zejithefundi@gmail.com';
  });
  const [isCeoDragging, setIsCeoDragging] = useState(false);
  const [ceoExtractSuccess, setCeoExtractSuccess] = useState(false);

  const founder = teamMembers.find(m => m.isFounder);
  const founderCabs = founder ? founder.accountabilities : [];
  const totalEmployeesCount = teamMembers.length;

  const occupiedMembers = teamMembers.filter(m => !m.isVacant);
  const vacantMembers = teamMembers.filter(m => m.isVacant);

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

  const handleSelectMemberNode = (memberId: string) => {
    const rowEl = document.getElementById(`tm-row-${memberId}`);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rowEl.classList.add('bg-neutral-100', 'dark:bg-neutral-800');
      setTimeout(() => {
        rowEl.classList.remove('bg-neutral-100', 'dark:bg-neutral-800');
      }, 2000);
    }
  };

  const processCeoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG/JPG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && founder) {
        const updated = teamMembers.map(m => {
          if (m.isFounder) {
            return { ...m, photoUrl: event.target!.result as string };
          }
          return m;
        });
        onUpdateTeam(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCeoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCeoFile(file);
    }
  };

  const handleCeoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCeoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCeoFile(file);
    }
  };

  const extractCeoPhotoFromGravatar = () => {
    if (!ceoEmail.trim()) return;
    const hash = computeMD5(ceoEmail);
    // 300x300 Gravatar with clear fallback to geometric identicon if not registered
    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=300&d=identicon`;
    
    const updated = teamMembers.map(m => {
      if (m.isFounder) {
        return { ...m, photoUrl: gravatarUrl };
      }
      return m;
    });
    
    onUpdateTeam(updated);
    setCeoExtractSuccess(true);
    setTimeout(() => {
      setCeoExtractSuccess(false);
    }, 4000);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG/JPG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewMemberPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCreateMember = () => {
    if (!newMemberName.trim()) return;
    const newId = `tm-custom-${Date.now()}`;
    const newMember: TeamMember = {
      id: newId,
      name: newMemberName,
      manager: newMemberManager || 'Ryan Deiss',
      jobTitle: newMemberTitle || 'Operations Specialist',
      accountabilities: [],
      isFounder: false,
      photoUrl: newMemberPhoto || undefined,
      isVacant: newMemberIsVacant
    };

    onUpdateTeam([...teamMembers, newMember]);
    setNewMemberName('');
    setNewMemberTitle('');
    setNewMemberManager('');
    setNewMemberPhoto('');
    setNewMemberIsVacant(false);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member?.isFounder) {
      alert("Cannot delete the Founder profile constraint.");
      return;
    }
    const updated = teamMembers.filter(m => m.id !== memberId);
    onUpdateTeam(updated);
  };

  const handleAddCabBullet = (tmId: string) => {
    const bulletText = newBulletText[tmId];
    if (!bulletText || !bulletText.trim()) return;

    const updated = teamMembers.map(m => {
      if (m.id === tmId) {
        return {
          ...m,
          accountabilities: [...m.accountabilities, bulletText.trim()]
        };
      }
      return m;
    });

    onUpdateTeam(updated);
    setNewBulletText({ ...newBulletText, [tmId]: '' });
  };

  const handleDeleteCabBullet = (tmId: string, bulletIndex: number) => {
    const updated = teamMembers.map(m => {
      if (m.id === tmId) {
        return {
          ...m,
          accountabilities: m.accountabilities.filter((_, idx) => idx !== bulletIndex)
        };
      }
      return m;
    });
    onUpdateTeam(updated);
  };

  const handleDelegateCab = (bulletIndex: number, targetTmId: string) => {
    if (!founder || !targetTmId) return;
    const bulletToDelegate = founder.accountabilities[bulletIndex];
    if (!bulletToDelegate) return;

    const updated = teamMembers.map(m => {
      if (m.isFounder) {
        return {
          ...m,
          accountabilities: m.accountabilities.filter((_, idx) => idx !== bulletIndex)
        };
      }
      if (m.id === targetTmId) {
        return {
          ...m,
          accountabilities: [...m.accountabilities, bulletToDelegate]
        };
      }
      return m;
    });

    onUpdateTeam(updated);
  };

  // Luxury profile picture allocator matching executive corporate roles
  const getProfilePhoto = (id: string, name: string): string => {
    const member = teamMembers.find(m => m.id === id);
    if (member && member.photoUrl) {
      return member.photoUrl;
    }
    const lowered = name.toLowerCase();
    if (lowered.includes('ryan') || id === 'tm-owner' || id === 'tm-1') {
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80';
    }
    if (lowered.includes('christina') || lowered.includes('crews') || id === 'tm-2') {
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80';
    }
    if (lowered.includes('sarah') || lowered.includes('connor') || id === 'tm-3' || lowered.includes('rachel')) {
      return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80';
    }
    if (lowered.includes('thomas') || lowered.includes('neo') || lowered.includes('frank') || id === 'tm-4') {
      return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80';
    }
    // Generic high-quality portrait fallback
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80';
  };

  const renderMemberRow = (tm: TeamMember) => {
    const ownedPlaybooks = playbooks.filter(p => p.ownerId === tm.id);
    return (
      <tr 
        key={tm.id} 
        id={`tm-row-${tm.id}`}
        className={`transition-all duration-300 scroll-mt-24 ${
          tm.isVacant 
            ? 'bg-rose-50/5 hover:bg-rose-50/10' 
            : tm.accountabilities.length > 5 
              ? 'bg-red-50/10 hover:bg-red-50/20' 
              : 'hover:bg-[#fbfbfd]'
        }`}
      >
        
        {/* Name, Portrait/Vacant Placeholder & Manager info */}
        <td className={`py-5 px-6 transition-colors ${tm.accountabilities.length > 5 ? 'bg-rose-50/10' : ''}`}>
          <div className="flex items-center gap-3.5">
            {tm.isVacant ? (
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-rose-300 bg-rose-50/30 flex items-center justify-center shrink-0">
                <UserMinus className="w-5 h-5 text-rose-500 animate-pulse" />
              </div>
            ) : (
              <img 
                src={getProfilePhoto(tm.id, tm.name)} 
                alt={tm.name}
                referrerPolicy="no-referrer"
                className={`w-11 h-11 rounded-full object-cover border shadow-xs shrink-0 bg-neutral-100 transition-all ${
                  tm.accountabilities.length > 5 ? 'border-rose-400 ring-2 ring-rose-200/50' : 'border-[#e8e8ed]'
                }`}
              />
            )}
            <div className="space-y-0.5">
              <span className="font-bold text-[#1d1d1f] block flex items-center gap-1.5 leading-snug text-sm">
                {tm.isFounder && <Award className="w-4 h-4 text-amber-500" />}
                {tm.name}
              </span>
              {!tm.isFounder && (
                <span className="text-[10px] text-[#86868b] flex items-center gap-1 font-mono uppercase">
                  <GitBranch className="w-3 h-3 text-[#c1c1c4]" /> {tm.isVacant ? 'Open Seat' : `Mgr: ${tm.manager}`}
                </span>
              )}
              {tm.isVacant && (
                <span className="inline-flex items-center gap-1 bg-rose-100/70 border border-rose-200/55 text-rose-800 font-extrabold text-[9px] px-2 py-0.5 mt-0.5 rounded-full uppercase tracking-wider w-fit">
                  <UserMinus className="w-2.5 h-2.5 text-rose-600 shrink-0" /> Vacant
                </span>
              )}
              {tm.accountabilities.length > 5 && (
                <div className="mt-1 flex items-center gap-1.5 text-[9px] bg-rose-100 text-rose-700 border border-rose-250 px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider w-fit font-sans">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Overlap Alert
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Job Title */}
        <td className="py-5 px-6 text-[#1d1d1f] font-semibold text-xs">
          <span className={tm.isVacant ? "text-rose-900/90 font-bold bg-[#fff5f5] px-2.5 py-1 rounded-lg border border-rose-100" : ""}>
            {tm.jobTitle}
          </span>
        </td>

        {/* CAB bullets list - STYLED LARGER AND HIGHER VISIBILITY */}
        <td className={`py-5 px-6 max-w-md space-y-4 transition-colors ${tm.accountabilities.length > 5 ? 'bg-rose-50/10 border-l-2 border-l-rose-400' : ''}`}>
          {tm.accountabilities.length > 5 && (
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-[11px] font-semibold leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black text-rose-800 block text-[11px] mb-0.5 uppercase tracking-wide">Accountability Overlap Detected</strong>
                This operator is assigned {tm.accountabilities.length} critical accountabilities (Max recommended: 5). High risk of operations overload.
              </div>
            </div>
          )}
          <div className="space-y-2 text-[#1d1d1f]">
            {tm.accountabilities.length === 0 ? (
              <span className="text-[#86868b] italic text-xs block bg-neutral-50 px-3 py-2 rounded-xl border border-dashed border-[#e8e8ed]">
                {tm.isVacant ? 'Add requested accountabilities for this vacancy.' : 'Under-capacity (no accountabilities mapped yet).'}
              </span>
            ) : (
              tm.accountabilities.map((bullet, index) => {
                const isOverlimit = tm.accountabilities.length > 5 && index >= 5;
                return (
                  <div 
                    key={index} 
                    className={`flex justify-between items-start gap-3 p-3 rounded-xl group transition-all duration-155 border-2 ${
                      isOverlimit 
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400' 
                        : 'bg-[#fdfdfd] border-slate-100 hover:border-[#1d1d1f]'
                    }`}
                  >
                    <span className={`whitespace-normal break-words pr-2 text-sm font-semibold leading-relaxed ${
                      isOverlimit ? 'text-rose-900 font-bold' : 'text-[#1d1d1f]'
                    }`}>
                      {bullet}
                      {isOverlimit && (
                        <span className="ml-2 inline-block text-[9px] bg-rose-100 text-rose-800 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Overlap CAB
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => handleDeleteCabBullet(tm.id, index)}
                      className="opacity-0 group-hover:opacity-100 text-[#86868b] hover:text-red-650 rounded p-1 transition cursor-pointer"
                      title="Remove bullet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Inline CAB Input */}
          <div className="flex gap-2 pt-1 max-w-sm">
            <input
              type="text"
              placeholder="Add new high-visibility CAB..."
              value={newBulletText[tm.id] || ''}
              onChange={(e) => setNewBulletText({ ...newBulletText, [tm.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCabBullet(tm.id);
              }}
              className="bg-neutral-50 hover:bg-[#e8e8ed]/60 focus:bg-white border border-[#e8e8ed] text-xs rounded-xl px-3 py-2 outline-none font-sans flex-1 transition"
            />
            <button
              onClick={() => handleAddCabBullet(tm.id)}
              className="bg-[#1d1d1f] hover:bg-neutral-800 text-white rounded-xl px-3.5 text-xs font-bold flex items-center justify-center cursor-pointer transition shrink-0"
            >
              + CAB
            </button>
          </div>
        </td>

        {/* SOP Playbooks owned */}
        <td className="py-5 px-6 text-[#86868b]">
          <div className="flex flex-col gap-1.5">
            {ownedPlaybooks.length === 0 ? (
              <span className="text-[#86868b] italic text-[11px]">0 active SOP</span>
            ) : (
              ownedPlaybooks.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1 bg-[#f5f5f7] border border-[#e8e8ed] rounded-full text-[10px] font-mono font-medium text-[#1d1d1f] px-2.5 py-1">
                  {p.title.split(':')[0]}
                </span>
              ))
            )}
          </div>
        </td>

        {/* Delete teammate actions */}
        <td className="py-5 px-6 text-center text-left">
          {!tm.isFounder ? (
            <button
              onClick={() => handleDeleteMember(tm.id)}
              className="text-[#86868b] hover:text-red-650 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
              title="Remove Teammate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold bg-[#fbfbfd] px-3 py-1.5 rounded-full border border-orange-200 text-orange-700">
              FOUNDER CARD
            </span>
          )}
        </td>

      </tr>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in font-sans pb-12">
      
      {/* Premium Operations Control & Roster Backup Deck */}
      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#1d1d1f] tracking-tight">Active Team Operations Deck</h2>
            <p className="text-[11px] text-[#86868b] mt-0.5">
              Manage corporate structures, map accountability functions, and back up workstation credentials locally.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end shrink-0 text-left">
          <div className="text-left">
            <p className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider font-mono">WORKSPACE ROSTER</p>
            <p className="text-xs font-black text-[#1d1d1f]">{teamMembers.length} Active Operators</p>
          </div>
        </div>
      </div>
      
      {/* Autogenerated Reporting Hierarchy Flowchart Window */}
      <OrgHierarchyChart 
        teamMembers={teamMembers} 
        playbooks={playbooks} 
        onSelectMember={handleSelectMemberNode}
      />
      
      {/* 1. MAPPING CANVAS PLACED AT THE TOP (FLIPPED ORDER) WITH SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="sos-team-canvas-card">
        
        {/* Left Column: Accountability Mapping Grid table (9 cols) */}
        <div className="lg:col-span-9 bg-white border border-[#e8e8ed] rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="border-b border-[#f5f5f7] bg-[#fbfbfd] px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1d1d1f] text-sm font-sans">
                Accountability Mapping Grid
              </h3>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                Assign critical corporate functions to specific leaders. Maximize leverage by keeping Founder free.
              </p>
            </div>
            <span className="text-[10px] bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              ADMINISTRATOR OPERATIONS ACTIVE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fbfbfd] border-b border-[#e8e8ed] text-[#86868b] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Direct report & portrait</th>
                  <th className="py-3 px-6">Official Job Title</th>
                  <th className="py-3 px-6 max-w-md">Critical Accountability Bullets (CAB) - Bigger Font</th>
                  <th className="py-3 px-6">Active SOPs</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7] text-xs">
                {/* OCCUPIED POSITIONS HEADER */}
                <tr className="bg-[#fbfbfd] text-[#86868b] text-[10px] uppercase font-bold tracking-wider select-none">
                  <td colSpan={5} className="py-3 px-6 border-b border-[#e8e8ed] bg-[#fbfbfd]">
                    Occupied Positions & Active Team Leaders ({occupiedMembers.length})
                  </td>
                </tr>
                {occupiedMembers.map(tm => renderMemberRow(tm))}

                {/* VACANT POSITIONS HEADER */}
                <tr className="bg-rose-50/20 text-rose-800 text-[10px] uppercase font-bold tracking-wider select-none">
                  <td colSpan={5} className="py-3 px-6 border-y border-[#e8e8ed] bg-rose-50/25">
                    Vacant Positions & Staffing Gaps ({vacantMembers.length})
                  </td>
                </tr>
                {vacantMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-6 text-center text-xs text-[#86868b] italic bg-rose-50/5">
                      No staffing gaps mapped. All configured seat positions are occupied.
                    </td>
                  </tr>
                ) : (
                  vacantMembers.map(tm => renderMemberRow(tm))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Roster Analytics Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-[#e8e8ed] rounded-2xl p-5 shadow-sm space-y-6 text-left">
            
            {/* Header */}
            <div className="border-b border-[#f5f5f7] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                SOP Roster Analytics
              </h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Real-time organizational summary indicators</p>
            </div>

            {/* Total Headcount Stats */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block font-sans">Headcount & Distribution</span>
              <div className="p-3.5 bg-[#fbfbfd] rounded-xl border border-neutral-100 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-700">Occupied Headcount</span>
                  <span className="text-sm font-black text-indigo-600 font-mono">{occupiedMembers.length}</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px] pt-1">
                  <span className="text-neutral-500">Founder & CEO (Board)</span>
                  <span className="font-semibold text-neutral-700 font-mono">1</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-neutral-500">Filled Direct Reports</span>
                  <span className="font-semibold text-neutral-700 font-mono">{occupiedMembers.filter(m => !m.isFounder).length}</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px] pt-1.5 border-t border-dashed border-neutral-200">
                  <span className="text-rose-700 font-semibold">Vacant Positions</span>
                  <span className="font-bold text-rose-800 font-mono">{vacantMembers.length}</span>
                </div>
              </div>
            </div>

            {/* Gaps & Vacancy Tracker */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block font-sans">Gaps & Vacancies</span>
              <div className="space-y-2.5">
                {/* 1. Vacant Staffing Gaps Card */}
                <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                      <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                      Staffing Gaps (Vacancies)
                    </span>
                    <span className="bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-md font-mono text-[10px] border border-rose-300">
                      {vacantMembers.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-700 leading-tight">
                    Active staffing vacancies configured with critical accountabilities.
                  </p>
                </div>

                {/* 2. Unassigned operating SOPs */}
                <div className="p-3 bg-red-50/40 border border-red-150/60 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-red-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Unassigned SOPs
                    </span>
                    <span className="bg-red-105 text-red-800 font-bold px-2 py-0.5 rounded-md font-mono text-[10px] border border-red-200">
                      {playbooks.filter(p => !p.ownerId || !teamMembers.some(tm => tm.id === p.ownerId)).length}
                    </span>
                  </div>
                  <p className="text-[10px] text-red-600 leading-tight">
                    Critical SOP instructions lacking a real workstation owner.
                  </p>
                </div>

                {/* 3. Under-capacity crew players */}
                <div className="p-3 bg-amber-50/45 border border-amber-150/60 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-amber-800 flex items-center gap-1 flex-row">
                      <Users className="w-3.5 h-3.5" />
                      Under-Capacity
                    </span>
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md font-mono text-[10px] border border-amber-200">
                      {teamMembers.filter(tm => !tm.isVacant && tm.accountabilities.length === 0).length}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    Onboarded managers with 0 critical accountabilities (CABs) assigned.
                  </p>
                </div>

                {/* 4. Accountability Overlap Overloaded Teammates */}
                {teamMembers.some(tm => tm.accountabilities.length > 5) && (
                  <div className="p-3 bg-rose-50 border border-rose-250 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs border-b border-rose-100 pb-1.5">
                      <span className="font-extrabold text-rose-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        Overlap Alert
                      </span>
                      <span className="bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-md font-mono text-[10px] border border-rose-300">
                        {teamMembers.filter(tm => tm.accountabilities.length > 5).length} Overloaded
                      </span>
                    </div>
                    <p className="text-[10px] text-rose-700 leading-normal pt-1">
                      Attention: <strong className="font-bold">{teamMembers.filter(tm => tm.accountabilities.length > 5).map(m => m.name).join(', ')}</strong> assigned more than 5 critical accountabilities. Burnout risk detected.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution of Roles */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block font-sans">Distribution of Roles</span>
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {Object.entries(
                  teamMembers.reduce((acc, m) => {
                    const title = m.jobTitle || 'Other';
                    acc[title] = (acc[title] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([title, count]) => {
                    const pct = Math.round((count / teamMembers.length) * 100);
                    return (
                      <div key={title} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-neutral-700 text-[11px]">
                          <span className="truncate max-w-[130px] font-semibold text-neutral-800" title={title}>{title}</span>
                          <span className="font-mono text-neutral-400 font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 2. STATS & DIAGNOSTICS PLACED BELOW THE MAIN CHART GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Founder Balance Check card in pristine light background */}
        <div className={`md:col-span-2 rounded-2xl p-6 border flex flex-col justify-between ${
          founderCabs.length === 0 
            ? 'bg-emerald-50/40 border-emerald-100 text-[#1d1d1f]' 
            : 'bg-white border-[#e8e8ed] text-[#1d1d1f]'
        }`}>
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
              {founderCabs.length === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              )}
              FOUNDER SCALE DIAGNOSTIC
            </h3>
            
            {founderCabs.length === 0 ? (
              <div className="space-y-1.5">
                <p className="font-bold text-base text-[#1d1d1f]">
                  Freedom Goal Achieved! 0 operational items owned by Founder
                </p>
                <p className="text-[#86868b] text-xs leading-relaxed">
                  You have successfully delegated all high-error operational steps. You are working with high leverage <strong>above</strong> operations, rather than getting trapped <strong>in</strong> details.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-sm text-[#1d1d1f]">
                  Attention required: You still carry {founderCabs.length} accountability bullets.
                </p>
                <p className="text-[#86868b] text-xs leading-relaxed">
                  "The more valuable you are to daily execution, the less leverage you have." Select managers to offload the active tasks below.
                </p>

                {/* Accountability Delegation Sandbox */}
                <div className="border border-[#e8e8ed] bg-[#fbfbfd] rounded-xl p-3.5 space-y-2.5 max-h-[160px] overflow-y-auto text-xs">
                  {founderCabs.map((bullet, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-[#f5f5f7] last:border-b-0 last:pb-0">
                      <span className="font-semibold text-[#1d1d1f] leading-snug">{bullet}</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleDelegateCab(idx, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-white border border-[#e8e8ed] hover:border-[#1d1d1f] text-xs p-1.5 rounded-lg outline-none cursor-pointer transition font-medium"
                      >
                        <option value="">-- Delegate --</option>
                        {teamMembers.filter(m => !m.isFounder).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] uppercase font-mono font-bold text-[#86868b] mt-4 border-t border-slate-100 pt-3">
            GOAL: ZERO OPERATIONAL BULLETS ON FOUNDER
          </div>
        </div>

        {/* Quick Headcount Stats Card */}
        <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-[#86868b] text-[10px] font-semibold uppercase tracking-wider">ACTIVE HEADCOUNT</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-[#1d1d1f] leading-tight block">
                {occupiedMembers.length - 1}
              </span>
              {vacantMembers.length > 0 && (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/50 rounded-md px-1.5 py-0.5">
                  +{vacantMembers.length} Vacant
                </span>
              )}
            </div>
            <p className="text-[#86868b] text-xs">Active occupied operators (excluding founder)</p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-[#f5f5f7]">
            <div className="text-center flex-1 bg-[#f5f5f7] rounded-xl p-2 border border-[#f5f5f7]">
              <span className="text-sm font-semibold text-[#1d1d1f]">
                {playbooks.length}
              </span>
              <p className="text-[9px] text-[#86868b] font-mono uppercase">PLAYBOOKS</p>
            </div>
            <div className="text-center flex-1 bg-[#f5f5f7] rounded-xl p-2 border border-[#f5f5f7]">
              <span className="text-sm font-semibold text-[#1d1d1f]">
                {teamMembers.reduce((sum, tm) => sum + tm.accountabilities.length, 0)}
              </span>
              <p className="text-[9px] text-[#86868b] font-mono uppercase font-bold">TOTAL CABs</p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ADMINISTRATION PANELS: TEAMMATE ROSTER */}
      <div className="max-w-2xl mx-auto">
        
        {/* ADD NEW TEAMMATE FORM */}
        <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-[#1d1d1f] flex items-center gap-1.5 text-sm">
            <UserPlus className="w-4 h-4 text-[#86868b]" />
            Add teammate to roster
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Member Name */}
            <div className="space-y-1.5">
              <label className="text-[#86868b] block font-medium">Teammate Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rachel Green"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full transition font-semibold text-xs text-[#1d1d1f]"
              />
            </div>

            {/* Job Title */}
            <div className="space-y-1.5">
              <label className="text-[#86868b] block font-medium">Official Job Title</label>
              <input
                type="text"
                placeholder="e.g. Operations Coordinator"
                value={newMemberTitle}
                onChange={(e) => setNewMemberTitle(e.target.value)}
                className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full transition font-semibold text-xs text-[#1d1d1f]"
              />
            </div>

            {/* Manager name allocation */}
            <div className="space-y-1.5">
              <label className="text-[#86868b] block font-medium">Report Manager</label>
              <select
                value={newMemberManager}
                onChange={(e) => setNewMemberManager(e.target.value)}
                className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full cursor-pointer transition text-xs font-semibold text-neutral-800"
              >
                <option value="">-- Choose Manager --</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vacant switch */}
          <div className="flex items-start gap-3 bg-[#fbfbfd] border border-[#e8e8ed] p-3.5 rounded-xl transition hover:border-[#1d1d1f]">
            <input
              type="checkbox"
              id="is-vacant-checkbox"
              checked={newMemberIsVacant}
              onChange={(e) => setNewMemberIsVacant(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-655 focus:ring-rose-500 border-neutral-350 accent-rose-600 transition cursor-pointer"
            />
            <label htmlFor="is-vacant-checkbox" className="select-none cursor-pointer text-xs space-y-0.5">
              <span className="font-bold text-[#1d1d1f] block leading-snug flex items-center gap-1.5">
                <UserMinus className="w-4 h-4 text-rose-600" />
                Mark as "Vacant Position" (Staffing Gap)
              </span>
              <span className="text-[10.5px] text-[#86868b] leading-relaxed block">
                Flags this role uniquely in the canvas to highlight recruitement needs and accountability exposure.
              </span>
            </label>
          </div>

          {/* Real image upload option */}
          <div className="space-y-1.5 text-xs">
            <label className="text-[#86868b] block font-medium">Operator Portrait Photo (Optional)</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/10' 
                  : newMemberPhoto 
                    ? 'border-emerald-500/55 bg-emerald-50/5' 
                    : 'border-[#e8e8ed] hover:border-neutral-300 bg-[#fbfbfd]'
              }`}
            >
              {newMemberPhoto ? (
                <div className="flex items-center gap-4 w-full">
                  <div className="relative shrink-0">
                    <img 
                      src={newMemberPhoto} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-full object-cover border border-[#e8e8ed] shadow-2xs" 
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setNewMemberPhoto(''); }}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition flex items-center justify-center"
                      title="Remove custom photo"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-xs text-emerald-700 block truncate">Custom Portrait Loaded</p>
                    <p className="text-[10px] text-[#86868b] truncate">Successfully encoded into safe local storage bundle.</p>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full gap-1.5 py-2 cursor-pointer">
                  <Upload className="w-5 h-5 text-neutral-400 group-hover:text-neutral-500 animate-pulse" />
                  <span className="font-semibold text-[11px] text-[#1d1d1f] text-center">
                    Drag & drop operator image or <span className="text-indigo-600 hover:underline">browse files</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 text-center">PNG, JPG, or WEBP up to 5MB</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>

          <button
            onClick={handleCreateMember}
            className="bg-[#1d1d1f] hover:bg-neutral-800 text-white rounded-xl px-4 py-2.5 text-xs font-bold tracking-tight transition cursor-pointer"
          >
            Add Teammate
          </button>
        </div>

      </div>

    </div>
  );
}
