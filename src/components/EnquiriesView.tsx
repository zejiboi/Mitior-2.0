import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Mail, 
  Send, 
  Tag, 
  Trash2, 
  CheckCircle,
  Clock, 
  Search, 
  Sparkles,
  MessageSquare,
  Cpu,
  Key,
  Database
} from 'lucide-react';

export interface Enquiry {
  id: string;
  senderName: string;
  senderEmail: string;
  company: string;
  subject: string;
  message: string;
  date: string;
  status: 'New' | 'In-Progress' | 'Addressed';
}

interface EnquiriesViewProps {
  enquiries: Enquiry[];
  onUpdateEnquiries: (updated: Enquiry[]) => void;
}

// Choice Email configuration structure
interface EmailApiConfig {
  provider: 'none' | 'resend' | 'emailjs' | 'sendgrid';
  apiKey: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
  senderEmail: string;
  recipientEmail: string;
}

export default function EnquiriesView({ enquiries, onUpdateEnquiries }: EnquiriesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(enquiries[0]?.id || null);

  // Form input builders
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Custom Email Connection settings state
  const [apiConfig, setApiConfig] = useState<EmailApiConfig>(() => {
    const saved = localStorage.getItem('s_email_api_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      provider: 'none',
      apiKey: '',
      serviceId: '',
      templateId: '',
      publicKey: '',
      senderEmail: 'leads@fitnessteamsolutions.com',
      recipientEmail: 'ryan@demoblogscale.com'
    };
  });

  const [apiLogs, setApiLogs] = useState<string[]>(['[System]: Email Router Gateway operational. Ready for API injection.']);

  const addApiLog = (msg: string) => {
    setApiLogs(prev => [`[${new Date().toLocaleTimeString()}]: ${msg}`, ...prev].slice(0, 8));
  };

  const handleSaveConfig = () => {
    localStorage.setItem('s_email_api_config', JSON.stringify(apiConfig));
    addApiLog(`Configuration saved. Active Mail Routing Provider changed to ${apiConfig.provider.toUpperCase()}`);
    alert("Connection specifications updated and stored locally.");
  };

  const activeEnquiry = enquiries.find(e => e.id === activeEnquiryId) || enquiries[0];

  const handleStatusChange = (id: string, newStatus: 'New' | 'In-Progress' | 'Addressed') => {
    const updated = enquiries.map(e => e.id === id ? { ...e, status: newStatus } : e);
    onUpdateEnquiries(updated);
  };

  const handleDeleteEnquiry = (id: string) => {
    const updated = enquiries.filter(e => e.id !== id);
    onUpdateEnquiries(updated);
    if (activeEnquiryId === id) {
      setActiveEnquiryId(updated[0]?.id || null);
    }
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formSubject || !formMessage) return;

    const newEnquiry: Enquiry = {
      id: `enq-${Date.now()}`,
      senderName: formName,
      senderEmail: formEmail,
      company: formCompany || 'Independent Creator',
      subject: formSubject,
      message: formMessage,
      date: new Date().toISOString().slice(0, 10),
      status: 'New'
    };

    const updated = [newEnquiry, ...enquiries];
    onUpdateEnquiries(updated);
    setActiveEnquiryId(newEnquiry.id);

    // Dynamic Choice Dispatch triggered asynchronously
    triggerEmailDispatch(newEnquiry);

    // Reset Form
    setFormName('');
    setFormEmail('');
    setFormCompany('');
    setFormSubject('');
    setFormMessage('');

    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  const triggerEmailDispatch = async (enq: Enquiry) => {
    const { provider, apiKey, serviceId, templateId, publicKey, senderEmail, recipientEmail } = apiConfig;
    
    if (provider === 'none') {
      addApiLog(`[Sandbox Simulated Mode]: Successfully generated lead log locally for ${enq.senderName}.`);
      return;
    }

    addApiLog(`Attempting live outbound dispatch via connected ${provider.toUpperCase()} client...`);

    try {
      if (provider === 'resend') {
        if (!apiKey) throw new Error("Missing Resend API Token credential.");
        
        // Prepare Resend Post parameters
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            from: senderEmail || 'onboarding@resend.dev',
            to: recipientEmail,
            subject: `[Lead Form Injected]: ${enq.subject}`,
            html: `<p><strong>Sender:</strong> ${enq.senderName} (${enq.senderEmail})</p>
                   <p><strong>Company:</strong> ${enq.company}</p>
                   <p><strong>Message:</strong></p>
                   <p>${enq.message}</p>`
          })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Resend Rejected Request: ${text}`);
        }
        addApiLog(`SUCCESS! Outbound message delivered to Resend queues.`);

      } else if (provider === 'emailjs') {
        if (!serviceId || !templateId || !publicKey) {
          throw new Error("EmailJS routing requires valid public key, service and template credentials.");
        }

        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              from_name: enq.senderName,
              reply_to: enq.senderEmail,
              from_company: enq.company,
              message_subject: enq.subject,
              message: enq.message,
              to_email: recipientEmail
            }
          })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`EmailJS Rejected Request: ${text}`);
        }
        addApiLog(`SUCCESS! Outbound package routed to EmailJS server.`);

      } else if (provider === 'sendgrid') {
        if (!apiKey) throw new Error("Missing SendGrid API client authorization node.");

        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: recipientEmail }]
            }],
            from: { email: senderEmail || 'leads@fitnessteamsolutions.com' },
            subject: `[Grid Lead Form]: ${enq.subject}`,
            content: [{
              type: 'text/html',
              value: `<p><strong>Name:</strong> ${enq.senderName}</p><p><strong>Message:</strong> ${enq.message}</p>`
            }]
          })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`SendGrid Rejected Request: ${text}`);
        }
        addApiLog(`SUCCESS! Outbound signal dispatched to SendGrid API.`);
      }
    } catch (err: any) {
      addApiLog(`Dispatch Alert: ${err.message || err}. Payload generated and logged safely inside local leads database.`);
    }
  };

  const filtered = enquiries.filter(e => 
    e.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-6 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2">
          <Inbox className="w-5 h-5 text-[#86868b]" />
          Inbound Enquiries & Lead Center
        </h2>
        <p className="text-[#86868b] dark:text-[#8e8e93] text-xs">
          Connect your custom email marketing API, view real-time leads logs, and submit mock clients enquiries inline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Enquiries Catalog directory - Left */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-4 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#86868b]" />
            <input
              type="text"
              placeholder="Search enquiries database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-[#f5f5f7] rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none transition"
            />
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[#86868b] text-center py-8 text-xs">No customer enquiries lodged.</p>
            ) : (
              filtered.map(e => {
                const isActive = activeEnquiry?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => setActiveEnquiryId(e.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex justify-between items-start gap-2.5 ${
                      isActive
                        ? 'border-[#1d1d1f] dark:border-[#f5f5f7] bg-[#fbfbfd] dark:bg-[#252526] text-[#1d1d1f] dark:text-[#f5f5f7]'
                        : 'border-[#e8e8ed] dark:border-[#2d2d2f] bg-white dark:bg-[#1d1d1f] text-[#86868b] dark:text-[#8e8e93] hover:border-[#1d1d1f] dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="space-y-1 w-full overflow-hidden">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-xs text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                          {e.senderName}
                        </span>
                        <span className="text-[9px] font-mono whitespace-nowrap text-[#86868b]">{e.date}</span>
                      </div>
                      <h4 className="font-medium text-xs truncate leading-snug text-[#1d1d1f] dark:text-neutral-200">
                        {e.subject}
                      </h4>
                      <p className="text-[10px] text-[#86868b] truncate">
                        {e.company} • {e.senderEmail}
                      </p>
                      
                      {/* Interactive Badge indicator */}
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                        e.status === 'New' 
                          ? 'bg-amber-50 border border-amber-100 text-amber-600 dark:bg-amber-950/25 dark:text-amber-400' 
                          : e.status === 'In-Progress'
                          ? 'bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/25 dark:text-blue-400'
                          : 'bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400'
                      }`}>
                        {e.status === 'New' && <Clock className="w-2.5 h-2.5" />}
                        {e.status === 'In-Progress' && <MessageSquare className="w-2.5 h-2.5" />}
                        {e.status === 'Addressed' && <CheckCircle className="w-2.5 h-2.5" />}
                        {e.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed focused Panel - Right */}
        <div className="lg:col-span-7 space-y-6">
          {activeEnquiry ? (
            <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Header metadata controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#f5f5f7] dark:border-[#2d2d2f] pb-4">
                <div className="space-y-1 font-sans">
                  <span className="text-[9px] font-mono bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 uppercase tracking-wider font-bold">
                    INBOUND DATA LOG
                  </span>
                  <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {activeEnquiry.subject}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#86868b]">
                    <span>Sender: <strong>{activeEnquiry.senderName}</strong></span>
                    <span>Company: {activeEnquiry.company}</span>
                    <span>Email: <a href={`mailto:${activeEnquiry.senderEmail}`} className="underline text-sky-600">{activeEnquiry.senderEmail}</a></span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEnquiry(activeEnquiry.id)}
                  className="text-[#86868b] hover:text-red-500 border border-transparent hover:border-[#e8e8ed] dark:hover:border-[#2d2d2f] p-2 rounded-xl transition duration-155 cursor-pointer max-sm:w-full flex items-center justify-center gap-1.5"
                  title="Archive Enquiry"
                >
                  <Trash2 className="w-4 h-4" /> <span className="sm:hidden text-xs">Delete From System</span>
                </button>
              </div>

              {/* Message Payload container */}
              <div className="bg-[#fbfbfd] dark:bg-[#252526] rounded-2xl p-5 border border-[#e8e8ed] dark:border-[#2d2d30] space-y-3 font-sans">
                <p className="text-[#1d1d1f] dark:text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {activeEnquiry.message}
                </p>
                <div className="text-[10px] text-[#86868b] dark:text-[#8e8e93] border-t border-[#e8e8ed] dark:border-[#2d2d2f] pt-2 flex items-center gap-1">
                  <span>Enquiry generated on secure client terminal:</span>
                  <strong className="font-mono text-[#1d1d1f] dark:text-white uppercase">{activeEnquiry.date}</strong>
                </div>
              </div>

              {/* Action buttons mapping */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#86868b] font-medium mr-1">Leads Status:</span>
                {(['New', 'In-Progress', 'Addressed'] as const).map(item => (
                  <button
                    key={item}
                    onClick={() => handleStatusChange(activeEnquiry.id, item)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-tight uppercase cursor-pointer transition flex items-center gap-1 ${
                      activeEnquiry.status === item
                        ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
                        : 'bg-[#f5f5f7] dark:bg-[#252526] text-[#86868b] dark:text-[#8e8e93] border border-[#e8e8ed] dark:border-[#2d2d2f] hover:bg-[#e8e8ed]/60'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-12 text-center text-[#86868b]">
              <Mail className="w-8 h-8 mx-auto opacity-35 mb-2" />
              <p className="text-sm font-semibold">No enquiry selected.</p>
              <p className="text-xs">Add elements or select some in the list to review details.</p>
            </div>
          )}

          {/* Outbound Email API Integration Gate (New!) */}
          <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5 border-b border-[#f5f5f7] dark:border-[#2d2d2f] pb-3">
              <Cpu className="w-4 h-4 text-emerald-500" />
              Connected Outbound Email API client of choice
            </h4>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Email API Provider Choice</label>
                <select
                  value={apiConfig.provider}
                  onChange={(e) => setApiConfig({ ...apiConfig, provider: e.target.value as any })}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="none">🔌 Simulated Environment (Offline Sandbox)</option>
                  <option value="resend">📩 Resend API (Recommended for modern SAAS)</option>
                  <option value="emailjs">📬 EmailJS API (No-Backend Direct Setup)</option>
                  <option value="sendgrid">🔥 SendGrid Node (Legacy Enterprise Scale)</option>
                </select>
              </div>

              {/* Dynamic Key Form inputs depending on API Selection */}
              {apiConfig.provider !== 'none' && (
                <div className="bg-[#fcfcfd] dark:bg-[#202021] border border-[#e8e8ed] dark:border-[#2c2c2e] rounded-xl p-4 space-y-3 animate-fade-in text-[11px]">
                  
                  {apiConfig.provider === 'resend' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-bold text-[#86868b] uppercase block">Resend API Key Token</label>
                        <input
                          type="password"
                          placeholder="re_xxxxxxxxxxxxxx"
                          value={apiConfig.apiKey}
                          onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Validated Sender E-mail</label>
                          <input
                            type="email"
                            placeholder="onboarding@resend.dev"
                            value={apiConfig.senderEmail}
                            onChange={(e) => setApiConfig({ ...apiConfig, senderEmail: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Forward Recipient Inbox</label>
                          <input
                            type="email"
                            placeholder="your@inbox.com"
                            value={apiConfig.recipientEmail}
                            onChange={(e) => setApiConfig({ ...apiConfig, recipientEmail: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {apiConfig.provider === 'emailjs' && (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Service ID</label>
                          <input
                            type="text"
                            placeholder="service_xxxxx"
                            value={apiConfig.serviceId}
                            onChange={(e) => setApiConfig({ ...apiConfig, serviceId: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Template ID</label>
                          <input
                            type="text"
                            placeholder="template_xxxxx"
                            value={apiConfig.templateId}
                            onChange={(e) => setApiConfig({ ...apiConfig, templateId: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Public Key (User ID)</label>
                          <input
                            type="password"
                            placeholder="user_xxxxxxxx"
                            value={apiConfig.publicKey}
                            onChange={(e) => setApiConfig({ ...apiConfig, publicKey: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-[#86868b] uppercase block">Target Recipient Email address</label>
                        <input
                          type="email"
                          placeholder="inbound@mycompany.com"
                          value={apiConfig.recipientEmail}
                          onChange={(e) => setApiConfig({ ...apiConfig, recipientEmail: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>
                    </>
                  )}

                  {apiConfig.provider === 'sendgrid' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-bold text-[#86868b] uppercase block">SendGrid Service Token</label>
                        <input
                          type="password"
                          placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={apiConfig.apiKey}
                          onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Sender Web Verified Mail</label>
                          <input
                            type="email"
                            value={apiConfig.senderEmail}
                            onChange={(e) => setApiConfig({ ...apiConfig, senderEmail: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#86868b] uppercase block">Destination Recipient Inbox</label>
                          <input
                            type="email"
                            value={apiConfig.recipientEmail}
                            onChange={(e) => setApiConfig({ ...apiConfig, recipientEmail: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1a1b] border border-[#e8e8ed] dark:border-[#2a2a2b] rounded-lg px-3 py-1.5 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="text-[9px] text-[#86868b] leading-relaxed pt-1 flex items-center gap-1 font-mono">
                    <Key className="w-3.5 h-3.5" /> API credentials remain private, stored locally inside your sandbox client.
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveConfig}
                className="bg-[#1d1d1f] dark:bg-[#f5f5f7] hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-[#1d1d1f] font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 cursor-pointer w-full justify-center"
              >
                <Database className="w-3.5 h-3.5" /> Save Email API rules
              </button>
            </div>
          </div>

          {/* Submission Form Simulator */}
          <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5 border-b border-[#f5f5f7] dark:border-[#2d2d2f] pb-3">
              <Sparkles className="w-4 h-4 text-[#1d1d1f] dark:text-white" />
              Submit Inbound Enquiry Simulator
            </h4>

            <form onSubmit={handleSimulateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">Sender Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Green"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-white rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">Sender Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel@fashionlabs.net"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-white rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Ralph Lauren"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-white rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Inquiry regarding licensing operations sequence..."
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-white rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide precise details of the question or requirement..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-white rounded-xl px-3.5 py-2.5 text-xs outline-none leading-relaxed resize-none font-sans"
                />
              </div>

              {submitSuccess && (
                <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-950/30">
                  Enquiry successfully synthesized and dispatched to leads queue!
                </p>
              )}

              <button
                type="submit"
                className="bg-[#1d1d1f] dark:bg-[#f5f5f7] hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-[#1d1d1f] font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Inject Simulated Enquiry
              </button>
            </form>
          </div>

          {/* Integration Gateway Log Console */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-inner mt-4 font-mono text-[10px] text-zinc-100">
            <div className="flex justify-between items-center pb-2.5 border-b border-neutral-800 mb-2.5">
              <span className="text-[9px] uppercase font-bold text-zinc-400">EMAIL API ROUTING SIGNALS CONSOLE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto leading-relaxed divide-y divide-neutral-800/45">
              {apiLogs.map((log, i) => (
                <div key={i} className="pt-1.5 first:pt-0">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
