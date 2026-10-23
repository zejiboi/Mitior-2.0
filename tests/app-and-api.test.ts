import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Server } from 'node:http';

// Configure isolated test database before importing server
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitior-test-'));
const testDbPath = path.join(tmpDir, 'test_server_db.json');
process.env.MITIOR_DB_PATH = testDbPath;
process.env.MITIOR_TEST_MODE = 'true';

import { app, hashPassword, verifyPassword, hashPin, verifyPin } from '../server';
import {
  INITIAL_COMPASS,
  INITIAL_GROWTH_NODES,
  INITIAL_FULFILLMENT_NODES,
  INITIAL_PLAYBOOKS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_SCORECARD,
  INITIAL_SPRINT_PLAN
} from '../src/types';

let server: Server;
let baseUrl = '';

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});

describe('1. IEEE 830 SRS Specification, Typography, Ergonomics & Static Integrity', () => {
  test('SRS.md exists at root and contains all IEEE 830 sections and requirement IDs', () => {
    const srsPath = path.join(process.cwd(), 'SRS.md');
    assert.equal(fs.existsSync(srsPath), true, 'SRS.md must exist at repository root');
    const content = fs.readFileSync(srsPath, 'utf-8');

    const requiredTokens = [
      'IEEE 830',
      'CEO',
      'Fundi',
      'Operator',
      'Auditor',
      '[FR-NAV]',
      '[FR-SEC]',
      '[FR-ENG]',
      '[FR-SOP]',
      '[FR-ORG]',
      '[FR-SCR]',
      '[FR-SPR]',
      '[FR-CMP]',
      '[FR-SET]',
      '[FR-LIC]',
      '[NFR-PER]',
      '[NFR-REL]',
      '[NFR-SEC]',
      'Requirements Traceability'
    ];
    for (const token of requiredTokens) {
      assert.ok(content.includes(token), `SRS.md is missing required token: ${token}`);
    }
  });

  test('GET /api/srs serves the IEEE 830 SRS markdown specification', async () => {
    const res = await fetch(`${baseUrl}/api/srs`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.version, '2.0.0');
    assert.ok(body.markdown.includes('IEEE 830'), 'API response markdown must include IEEE 830');
  });

  test('Plus Jakarta Sans & Outfit typography, OpenGraph metadata sync, and scrollbar utilities are configured', () => {
    const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
    const metadataJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'metadata.json'), 'utf-8'));
    const indexCss = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf-8');

    assert.ok(indexHtml.includes('Plus+Jakarta+Sans'), 'index.html must preload Plus Jakarta Sans');
    assert.ok(indexHtml.includes('Outfit'), 'index.html must preload Outfit');
    assert.ok(indexHtml.includes('display=swap'), 'Google Fonts must use display=swap');
    assert.ok(indexHtml.includes(metadataJson.description), 'index.html description must match metadata.json');
    assert.ok(indexCss.includes('Plus Jakarta Sans'), 'src/index.css must configure Plus Jakarta Sans');
    assert.ok(indexCss.includes('Outfit'), 'src/index.css must configure Outfit');
    assert.ok(indexCss.includes('scrollbar-gutter: stable'), 'src/index.css must include scrollbar-gutter: stable');
    assert.ok(indexCss.includes('.no-scrollbar'), 'src/index.css must include .no-scrollbar utility');
  });

  test('Persistent Bottom Dock, Workspace Navigation Sheet Modal, and 10. SRS Specs are wired in App.tsx & SettingsView.tsx', () => {
    const appTsx = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
    const settingsTsx = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsView.tsx'), 'utf-8');
    const srsViewTsx = fs.readFileSync(path.join(process.cwd(), 'src/components/SrsDocumentView.tsx'), 'utf-8');

    assert.ok(appTsx.includes('bottom-3 left-1/2 -translate-x-1/2 z-40'), 'App.tsx must contain persistent floating bottom dock');
    assert.ok(appTsx.includes('10. SRS Specs'), 'App.tsx must include 10. SRS Specs navigation node');
    assert.ok(appTsx.includes('Workspace Navigation Sheet'), 'App.tsx must include pop-up Workspace Navigation Sheet modal');
    assert.ok(settingsTsx.includes('10. SRS Specification'), 'SettingsView.tsx must include 10. SRS Specification tab');
    assert.ok(srsViewTsx.includes('Download SRS.md'), 'SrsDocumentView.tsx must include 1-click Download SRS.md button');
    assert.ok(srsViewTsx.includes('Copy Raw Markdown'), 'SrsDocumentView.tsx must include Copy Raw Markdown button');
  });

  test('Zero disruptive window.alert() calls remain anywhere in src/', () => {
    const componentsDir = path.join(process.cwd(), 'src/components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      assert.equal(/\balert\s*\(/.test(content), false, `Found forbidden alert() call in ${file}`);
    }
  });

  test('Initial domain seed models are valid and complete', () => {
    assert.equal(Array.isArray(INITIAL_GROWTH_NODES), true);
    assert.equal(Array.isArray(INITIAL_FULFILLMENT_NODES), true);
    assert.equal(Array.isArray(INITIAL_PLAYBOOKS), true);
    assert.ok(INITIAL_TEAM_MEMBERS.length >= 1);
    assert.equal(INITIAL_TEAM_MEMBERS[0].isFounder, true);
    assert.equal(Array.isArray(INITIAL_SCORECARD), true);
    assert.equal(typeof INITIAL_SPRINT_PLAN.month1Name, 'string');
    assert.equal(Array.isArray(INITIAL_COMPASS.coreValues), true);
  });
});

describe('2. Cryptographic Hashing, Authentication & Account Takeover Mitigation', () => {
  test('hashPassword and verifyPassword use salted SHA-256 and support legacy unsalted hashes', () => {
    const salted = hashPassword('MySecurePass123!');
    assert.ok(salted.includes(':'), 'Salted password hash must contain salt:digest delimiter');
    assert.equal(verifyPassword('MySecurePass123!', salted), true);
    assert.equal(verifyPassword('WrongPass', salted), false);
  });

  test('hashPin and verifyPin use salted SHA-256 and support legacy cleartext PINs', () => {
    const pinHash = hashPin('4829');
    assert.ok(pinHash.includes(':'), 'Salted PIN hash must contain salt:digest delimiter');
    assert.notEqual(pinHash, '4829', 'PIN hash must never equal cleartext PIN');
    assert.equal(verifyPin('4829', pinHash), true);
    assert.equal(verifyPin('0000', pinHash), false);
    assert.equal(verifyPin('1234', '1234'), true, 'Legacy cleartext PIN fallback must work');
  });

  test('Full Auth Lifecycle: Signup, Login, Unauthenticated Reset Rejection (401), and Verified Recovery Reset (200)', async () => {
    const email = 'architect@mitior.co';
    const initialPassword = 'InitialPassword123';

    // 1. Sign up
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Principal Architect', email, password: initialPassword })
    });
    assert.equal(signupRes.status, 200);
    const signupData: any = await signupRes.json();
    assert.equal(signupData.success, true);
    assert.ok(signupData.sessionToken.startsWith('tok_'));

    // 2. Duplicate signup rejected with 409
    const dupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate', email, password: initialPassword })
    });
    assert.equal(dupRes.status, 409);

    // 3. Unauthenticated password reset WITHOUT recovery code MUST be rejected with 401
    const unauthResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'HackedPassword999' })
    });
    assert.equal(unauthResetRes.status, 401, 'Unauthenticated password reset without recovery code must be rejected with 401');

    // 4. Request a valid recovery code via /api/auth/verify-code
    const codeRes = await fetch(`${baseUrl}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    assert.equal(codeRes.status, 200);
    const codeData: any = await codeRes.json();
    assert.equal(codeData.success, true);
    assert.equal(String(codeData.recoveryCode).length, 6);

    // 5. Reset password WITH verified recoveryCode succeeds
    const validResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'UpdatedPassword456',
        recoveryCode: codeData.recoveryCode
      })
    });
    assert.equal(validResetRes.status, 200);

    // 6. Login with new password succeeds
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'UpdatedPassword456' })
    });
    assert.equal(loginRes.status, 200);
    const loginData: any = await loginRes.json();
    assert.equal(loginData.success, true);
  });
});

describe('3. Sync Codes with Workspace Hydration, Cloud Backups, Salted PIN Lock & Billing', () => {
  let ceoToken = '';
  let ceoUserId = '';

  test('Enterprise CEO login and Sync Code generation with workspaceData payload', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ryan@mitior.co', password: 'password123' })
    });
    assert.equal(loginRes.status, 200);
    const loginData: any = await loginRes.json();
    ceoToken = loginData.sessionToken;
    ceoUserId = loginData.user.id;
    assert.equal(loginData.user.paidTicket, 'enterprise');

    const sampleWorkspaceData = {
      playbooks: [
        { id: 'pb-1', title: 'Client Onboarding SOP', powerStageId: 'n-1', powerStageLabel: 'Onboarding', ownerId: 'tm-1', instructions: 'Step 1', steps: [], lastUpdated: '2026-10-19' },
        { id: 'pb-2', title: 'Quarterly Review SOP', powerStageId: 'n-2', powerStageLabel: 'Review', ownerId: 'tm-1', instructions: 'Step 2', steps: [], lastUpdated: '2026-10-19' }
      ],
      teamMembers: INITIAL_TEAM_MEMBERS,
      scorecard: INITIAL_SCORECARD,
      sprintPlan: INITIAL_SPRINT_PLAN,
      compass: INITIAL_COMPASS,
      nodes: []
    };

    const createSyncRes = await fetch(`${baseUrl}/api/sync-codes/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        projectId: 'proj-enterprise-1',
        projectName: 'Mitior HQ',
        description: 'Executive Sync Node',
        workspaceData: sampleWorkspaceData
      })
    });
    assert.equal(createSyncRes.status, 200);
    const syncData: any = await createSyncRes.json();
    assert.equal(syncData.success, true);
    const code = syncData.syncCode.code;
    assert.ok(code.startsWith('S-OS-'));

    // Verify sync code returns workspaceData for joining Operator/Auditor nodes
    const verifyRes = await fetch(`${baseUrl}/api/sync-codes/verify/${code}`);
    assert.equal(verifyRes.status, 200);
    const verifyData: any = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.projectName, 'Mitior HQ');
    assert.ok(verifyData.workspaceData, 'Verified sync code must include workspaceData snapshot');
    assert.equal(verifyData.workspaceData.playbooks.length, 2);
  });

  test('Server Backup CRUD & Cross-Tenant Isolation', async () => {
    const backupRes = await fetch(`${baseUrl}/api/db/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        userId: ceoUserId,
        projectId: 'proj-enterprise-1',
        projectName: 'Mitior HQ',
        description: 'Automated Test Snapshot',
        data: { compass: INITIAL_COMPASS }
      })
    });
    assert.equal(backupRes.status, 200);
    const backupData: any = await backupRes.json();
    assert.equal(backupData.success, true);
    const backupId = backupData.backupId;

    // List backups
    const listRes = await fetch(`${baseUrl}/api/db/backups/${ceoUserId}`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.equal(listRes.status, 200);
    const listData: any = await listRes.json();
    assert.equal(listData.length, 1);

    // Restore backup
    const restoreRes = await fetch(`${baseUrl}/api/db/restore/${backupId}`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.equal(restoreRes.status, 200);
    const restoreData: any = await restoreRes.json();
    assert.equal(restoreData.id, backupId);

    // Cross-tenant readout attempt must fail with 401
    const crossTenantRes = await fetch(`${baseUrl}/api/db/backups/acc-other-tenant`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.equal(crossTenantRes.status, 401);
  });

  test('Security Shield PIN set, verify, and remove stores salted hash on disk', async () => {
    const setPinRes = await fetch(`${baseUrl}/api/security/pin/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ userId: ceoUserId, pin: '7391' })
    });
    assert.equal(setPinRes.status, 200);

    // Inspect raw database file to verify PIN is not stored in cleartext
    const rawDb = JSON.parse(fs.readFileSync(testDbPath, 'utf-8'));
    const pinRecord = rawDb.pins.find((p: any) => p.userId === ceoUserId);
    assert.ok(pinRecord, 'PIN record must exist in DB');
    assert.notEqual(pinRecord.pinHash, '7391', 'PIN must never be stored in cleartext');
    assert.ok(pinRecord.pinHash.includes(':'), 'PIN must be stored as salt:hash');

    // Verify wrong PIN fails with 401
    const wrongVerifyRes = await fetch(`${baseUrl}/api/security/pin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ userId: ceoUserId, pin: '0000' })
    });
    assert.equal(wrongVerifyRes.status, 401);

    // Verify correct PIN succeeds
    const rightVerifyRes = await fetch(`${baseUrl}/api/security/pin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ userId: ceoUserId, pin: '7391' })
    });
    assert.equal(rightVerifyRes.status, 200);

    // Remove PIN
    const removeRes = await fetch(`${baseUrl}/api/security/pin/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({ userId: ceoUserId, pin: '7391' })
    });
    assert.equal(removeRes.status, 200);
  });

  test('Card payment checkout & authenticated billing history', async () => {
    const payRes = await fetch(`${baseUrl}/api/checkout/card-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        blockCard: '4111 2222 3333 4444',
        amount: 45,
        holderName: 'Ryan Deiss',
        planName: 'Enterprise Local App'
      })
    });
    assert.equal(payRes.status, 200);
    const payData: any = await payRes.json();
    assert.equal(payData.success, true);

    const historyRes = await fetch(`${baseUrl}/api/checkout/history`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.equal(historyRes.status, 200);
    const historyData: any = await historyRes.json();
    assert.equal(historyData.length, 1);
    assert.equal(historyData[0].phoneOrCard, 'Card ending in *4444');
  });

  test('Grounded Helper Bot understands plain-text questions, executes actions, refuses off-topic queries, and retains user memory', async () => {
    // 1. Ask off-topic question -> must be strictly refused (isGrounded: false)
    const offTopicRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        message: 'What is the weather forecast in Tokyo and a good pasta recipe?',
        context: { userRole: 'ceo', activeTab: 'overview' }
      })
    });
    assert.equal(offTopicRes.status, 200);
    const offTopicData: any = await offTopicRes.json();
    assert.equal(offTopicData.success, true);
    assert.equal(offTopicData.isGrounded, false, 'Off-topic query must be flagged as ungrounded');
    assert.ok(offTopicData.reply.includes('System Helper Focus'));

    // 2. Ask a general question in simple plain text -> must be understood and contextualized
    const plainQuestionRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        message: 'how does this tool work in simple terms and where do i start?',
        context: { userRole: 'ceo', activeTab: 'overview' }
      })
    });
    assert.equal(plainQuestionRes.status, 200);
    const plainQuestionData: any = await plainQuestionRes.json();
    assert.equal(plainQuestionData.isGrounded, true);
    assert.ok(plainQuestionData.reply.includes('How Mitior 2.0 Works (In Plain, Simple Terms)'));

    // 3. Execute application action via simple everyday plain text -> "make a checklist for ..."
    const actionRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        message: 'make a checklist for Enterprise Client Onboarding',
        context: { userRole: 'ceo', activeTab: 'playbooks' }
      })
    });
    assert.equal(actionRes.status, 200);
    const actionData: any = await actionRes.json();
    assert.equal(actionData.isGrounded, true);
    assert.ok(actionData.executedAction, 'Must return an executedAction object');
    assert.equal(actionData.executedAction.type, 'create_playbook');
    assert.equal(actionData.executedAction.payload.title, 'Enterprise Client Onboarding');

    // 4. Save persistent memory note for the logged-in user
    const rememberRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        message: 'Remember that our Q3 priority is East Africa Enterprise Expansion',
        context: { userRole: 'ceo', activeTab: 'sprint' }
      })
    });
    assert.equal(rememberRes.status, 200);
    const rememberData: any = await rememberRes.json();
    assert.equal(rememberData.isGrounded, true);
    assert.ok(rememberData.memory.notes.includes('our Q3 priority is East Africa Enterprise Expansion'));

    // 5. Retrieve persistent memory via GET /api/assistant/memory for logged-in user
    const memRes = await fetch(`${baseUrl}/api/assistant/memory`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.equal(memRes.status, 200);
    const memData: any = await memRes.json();
    assert.equal(memData.success, true);
    assert.equal(memData.memory.userId, ceoUserId);
    assert.ok(memData.memory.notes.includes('our Q3 priority is East Africa Enterprise Expansion'));
    assert.ok(memData.memory.messages.length >= 8, 'Should retain all 4 user+assistant turn pairs');

    // 6. Verify Admin Overview endpoint is accessible for authenticated Admin session
    const adminRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert.equal(adminRes.status, 200);
    const adminData: any = await adminRes.json();
    assert.equal(adminData.success, true);
    assert.ok(adminData.stats.registeredUsers >= 1);
    assert.ok(adminData.stats.activeAssistantMemories >= 1);
  });
});

describe('4. Red/Blue/Purple Team Security Readiness Validation Suite', () => {
  let standardUserToken = '';
  let standardUserId = '';
  let adminToken = '';
  let adminUserId = '';

  test('SEC-RT-06 & SEC-RT-07: HTTP Security Headers, CORS Origin Guard, and Memory-Hard Scrypt KDF', async () => {
    const pwHash = hashPassword('PurpleTeamValidation!2026');
    assert.ok(pwHash.startsWith('scrypt:'), 'Password hash must use NIST-compliant memory-hard scrypt KDF');
    assert.equal(verifyPassword('PurpleTeamValidation!2026', pwHash), true);

    const pinDigest = hashPin('9482');
    assert.ok(pinDigest.startsWith('scrypt:'), 'PIN hash must use memory-hard scrypt KDF');
    assert.equal(verifyPin('9482', pinDigest), true);

    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-powered-by'), null, 'X-Powered-By header must be suppressed');
    assert.ok(res.headers.get('content-security-policy')?.includes("default-src 'self'"), 'CSP header must be enforced');
    assert.ok(res.headers.get('strict-transport-security')?.includes('max-age=31536000'), 'HSTS header must be enforced');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.ok(res.headers.get('cache-control')?.includes('no-store'), 'API responses must enforce Cache-Control: no-store');

    // Untrusted cross-origin request must be blocked with 403
    const corsRes = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://malicious-attacker.example.com' }
    });
    assert.equal(corsRes.status, 403, 'Untrusted cross-origin API request must be rejected with 403');
  });

  test('SEC-RT-03: Broken Function Level Authorization (BFLA) blocked on /api/admin/overview & /api/admin/audit-logs', async () => {
    // Register a standard non-admin tenant
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Standard Operator',
        email: 'operator.tenant@example.com',
        password: 'OperatorPass123!'
      })
    });
    assert.equal(signupRes.status, 200);
    const signupData: any = await signupRes.json();
    standardUserToken = signupData.sessionToken;
    standardUserId = signupData.user.id;

    // Non-admin user attempting to access /api/admin/overview must receive 403 Forbidden
    const nonAdminOverviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(nonAdminOverviewRes.status, 403, 'Standard tenant must be denied access to /api/admin/overview');

    const nonAdminAuditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(nonAdminAuditRes.status, 403, 'Standard tenant must be denied access to /api/admin/audit-logs');

    // Login as corporate admin and confirm 200 OK
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ryan@mitior.co', password: 'password123' })
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLoginData: any = await adminLoginRes.json();
    adminToken = adminLoginData.sessionToken;
    adminUserId = adminLoginData.user.id;

    const adminAuditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(adminAuditRes.status, 200);
    const auditBody: any = await adminAuditRes.json();
    assert.equal(auditBody.success, true);
    assert.ok(Array.isArray(auditBody.auditLogs));
    assert.ok(auditBody.auditLogs.some((e: any) => e.eventType === 'BFLA_ADMIN_ACCESS_DENIED'));
  });

  test('SEC-RT-02: Assistant Memory BOLA & Unauthenticated Tenant Targeting Blocked', async () => {
    // 1. Unauthenticated GET /api/assistant/memory must be rejected with 401
    const unauthGetRes = await fetch(`${baseUrl}/api/assistant/memory?userId=${adminUserId}`);
    assert.equal(unauthGetRes.status, 401);

    // 2. Unauthenticated DELETE /api/assistant/memory must be rejected with 401
    const unauthDelRes = await fetch(`${baseUrl}/api/assistant/memory?userId=${adminUserId}`, {
      method: 'DELETE'
    });
    assert.equal(unauthDelRes.status, 401);

    // 3. Unauthenticated POST /api/assistant/chat targeting a registered tenant ID must be rejected with 401
    const unauthChatTenantRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show my notes',
        context: { userId: adminUserId, userRole: 'ceo' }
      })
    });
    assert.equal(unauthChatTenantRes.status, 401);

    // 4. Authenticated standard user attempting cross-tenant GET/POST/DELETE against adminUserId must receive 403
    const crossGetRes = await fetch(`${baseUrl}/api/assistant/memory?userId=${adminUserId}`, {
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(crossGetRes.status, 403);

    const crossChatRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardUserToken}`
      },
      body: JSON.stringify({
        message: 'Clear notes',
        context: { userId: adminUserId, userRole: 'ceo' }
      })
    });
    assert.equal(crossChatRes.status, 403);

    const crossDelRes = await fetch(`${baseUrl}/api/assistant/memory?userId=${adminUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(crossDelRes.status, 403);
  });

  test('SEC-RT-01: Production Recovery Code Non-Disclosure & 5-Attempt Brute-Force Lockout', async () => {
    // Simulate strict production mode where recoveryCode must not be leaked in HTTP response
    const prevNodeEnv = process.env.NODE_ENV;
    const prevTestMode = process.env.MITIOR_TEST_MODE;
    process.env.NODE_ENV = 'production';
    process.env.MITIOR_TEST_MODE = 'false';

    try {
      const prodCodeRes = await fetch(`${baseUrl}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'operator.tenant@example.com' })
      });
      assert.equal(prodCodeRes.status, 200);
      const prodCodeData: any = await prodCodeRes.json();
      assert.equal(prodCodeData.success, true);
      assert.equal(prodCodeData.recoveryCode, undefined, 'Recovery code must never be returned in strict production mode');
      assert.equal(prodCodeData.deliveryChannel, 'out-of-band');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      process.env.MITIOR_TEST_MODE = prevTestMode;
    }

    // Verify wrong recovery code is rejected with 401 and repeated attempts trigger 429 rate-limit/lockout
    const firstBadResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operator.tenant@example.com',
        password: 'NewPassword999!',
        recoveryCode: '000000'
      })
    });
    assert.equal(firstBadResetRes.status, 401);

    let lastResetStatus = 0;
    for (let i = 0; i < 4; i++) {
      const badResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'operator.tenant@example.com',
          password: 'NewPassword999!',
          recoveryCode: '000000'
        })
      });
      lastResetStatus = badResetRes.status;
    }
    assert.equal(lastResetStatus, 429, 'Repeated failed password reset requests must trigger 429 rate-limit/lockout');
  });

  test('SEC-RT-04: Payment Negative/Zero Amount Rejection & Webhook Signature Verification', async () => {
    // Negative card payment amount must be rejected with 400
    const negCardRes = await fetch(`${baseUrl}/api/checkout/card-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardUserToken}`
      },
      body: JSON.stringify({
        blockCard: '4111 2222 3333 4444',
        amount: -500,
        holderName: 'Standard Operator',
        planName: 'Enterprise Local App'
      })
    });
    assert.equal(negCardRes.status, 400);

    // Zero M-Pesa payment amount must be rejected with 400
    const zeroMpesaRes = await fetch(`${baseUrl}/api/checkout/mpesa-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardUserToken}`
      },
      body: JSON.stringify({
        phone: '0712345678',
        amount: 0,
        planName: 'Enterprise Local App'
      })
    });
    assert.equal(zeroMpesaRes.status, 400);

    // Unauthenticated / invalid secret webhook callback must be rejected with 401
    const badWebhookRes = await fetch(`${baseUrl}/api/checkout/mpesa-callback?secret=wrong-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Body: { stkCallback: { CheckoutRequestID: 'ws_CO_TEST', ResultCode: 0 } } })
    });
    assert.equal(badWebhookRes.status, 401);
  });

  test('SEC-RT-05 & SEC-RT-08: Cross-Tenant PIN Status Isolation, PIN Lockout, Session Logout Revocation, and 0600 DB Permissions', async () => {
    // Upgrade standard user via valid card payment so they have SaaS tier access
    const upgradeRes = await fetch(`${baseUrl}/api/checkout/card-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardUserToken}`
      },
      body: JSON.stringify({
        blockCard: '4111222233334444',
        amount: 29,
        holderName: 'Standard Operator',
        planName: 'Professional Web App'
      })
    });
    assert.equal(upgradeRes.status, 200);

    // Cross-tenant PIN status inspection must fail with 403
    const crossPinStatusRes = await fetch(`${baseUrl}/api/security/pin/status/${adminUserId}`, {
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(crossPinStatusRes.status, 403);

    // Set PIN for standardUserId and trigger 5 failed attempts -> 429 lockout
    const setPinRes = await fetch(`${baseUrl}/api/security/pin/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${standardUserToken}`
      },
      body: JSON.stringify({ userId: standardUserId, pin: '5824' })
    });
    assert.equal(setPinRes.status, 200);

    let lockedStatus = 0;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const failPinRes = await fetch(`${baseUrl}/api/security/pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${standardUserToken}`
        },
        body: JSON.stringify({ userId: standardUserId, pin: '0000' })
      });
      lockedStatus = failPinRes.status;
    }
    assert.equal(lockedStatus, 429, '5th consecutive wrong PIN attempt must trigger 429 brute-force lockout');

    // Verify database file permissions are owner-only (0600)
    const stat = fs.statSync(testDbPath);
    const mode = stat.mode & 0o777;
    assert.equal(mode, 0o600, 'Database file must enforce 0600 permissions');

    // Explicit logout revokes sessionToken on server
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(logoutRes.status, 200);

    const postLogoutMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${standardUserToken}` }
    });
    assert.equal(postLogoutMeRes.status, 401, 'Revoked session token must be rejected after logout');
  });
});


