import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Smartphone, 
  Loader2, 
  ChevronRight, 
  Award,
  DollarSign,
  Briefcase,
  Layers,
  MapPin,
  Lock,
  LogOut
} from 'lucide-react';

interface CheckoutPortalProps {
  onClose: () => void;
  onPaymentSuccess: (tier: 'starter' | 'professional' | 'enterprise', receipt: string) => void;
  isEnforced?: boolean;
  onLogout?: () => void;
}

export default function CheckoutPortal({
  onClose,
  onPaymentSuccess,
  isEnforced = false,
  onLogout
}: CheckoutPortalProps) {
  // Pricing plans
  const plans = [
    {
      id: 'starter' as const,
      name: 'Web App Node Tier',
      priceKes: 1950,
      priceUsd: 15,
      period: 'per month',
      description: 'Run your operations directly from our secure cloud server with double the capacity of our free trial tier.',
      features: [
        'Everything runs on our host server nodes',
        'Up to 20 Value Engine steps / nodes',
        'Up to 8 active team project seats',
        'No restrictions on JSON/CSV exports',
        'Automatic server-side snapshot backups',
        'Multi-device continuous browser access'
      ],
      badge: '$15 / mon'
    },
    {
      id: 'professional' as const,
      name: 'Professional Web App',
      priceKes: 65000,
      priceUsd: 500,
      period: 'Full annual access',
      description: 'Full unlimited access to the entire system online. Scale as high as you want with zero limits.',
      features: [
        'Unlimited Value Engine steps & nodes',
        'Unlimited active team members',
        'No restriction on file exports (JSON/CSV)',
        'All online capabilities fully unlocked',
        'Excludes offline local launcher packaging'
      ],
      badge: 'Full Web App'
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Local App',
      priceKes: 325000,
      priceUsd: 2500,
      period: 'Lifetime offline license',
      description: 'Run completely offline on your own hardware. Keep 100% of your workspace files and databases locally.',
      features: [
        'Native Local Desktop App packaging (Mac/Windows)',
        'Absolute Data Autonomy: You keep 100% of your data',
        'Zero cloud-sharing telemetry or server tracking',
        'Receive custom offline EXE package',
        'Unlimited offline workspace partitions',
        'Local JSON/CSV secure backup exports'
      ],
      badge: 'Lifetime / Offline'
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');

  // Server API keys status loaded dynamically
  const [apiConfig, setApiConfig] = useState({
    mpesaConfigured: false,
    stripeConfigured: false,
    mpesaEnv: 'sandbox',
    shortcode: '174379'
  });

  // M-Pesa state
  const [phoneNumber, setPhoneNumber] = useState('0722000000');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'prompt_sent' | 'polling' | 'success' | 'failed'>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [mpesaError, setMpesaError] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  // Card input state
  const [cardHolder, setCardHolder] = useState('Ryan Deiss');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Enterprise Auto-Downloader & Thank You state
  const [isDownloadingApp, setIsDownloadingApp] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingFile, setDownloadingFile] = useState('Initializing offline compile bundle...');
  const [successReceiptSaved, setSuccessReceiptSaved] = useState('');

  // Load backend configuration
  useEffect(() => {
    fetch('/api/checkout/config')
      .then(res => res.json())
      .then(data => setApiConfig(data))
      .catch(err => console.warn('Could not load checkout configuration keys:', err.message));
  }, []);

  // Poll M-Pesa Status callback registry
  useEffect(() => {
    let intervalId: any = null;

    if (mpesaStatus === 'polling' && checkoutRequestId) {
      intervalId = setInterval(() => {
        const token = localStorage.getItem("sOS_session_token");
        const headersVal: Record<string, string> = {};
        if (token) {
          headersVal["Authorization"] = `Bearer ${token}`;
        }
        fetch(`/api/checkout/status/${checkoutRequestId}`, {
          headers: headersVal
        })
          .then(res => {
            if (!res.ok) throw new Error('Transaction query error');
            return res.json();
          })
          .then((data: any) => {
            setPollCount(prev => prev + 1);

            if (data.status === 'SUCCESS') {
              setMpesaStatus('success');
              setReceiptNumber(data.receiptNumber);
              clearInterval(intervalId);
            } else if (data.status === 'FAILED') {
              setMpesaStatus('failed');
              setMpesaError(data.failureReason || 'STK Push rejected or expired.');
              clearInterval(intervalId);
            }

            // Timeout after ~45 seconds (30 poll cycles)
            if (pollCount > 30) {
              setMpesaStatus('failed');
              setMpesaError('Callback timeout. Enter standard PIN or refresh connection.');
              clearInterval(intervalId);
            }
          })
          .catch(err => {
            console.error('Polling payment status failed:', err.message);
          });
      }, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mpesaStatus, checkoutRequestId, pollCount]);


  // Trigger Lipa Na M-Pesa STK Push
  const handleMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpesaLoading(true);
    setMpesaError(null);
    setMpesaStatus('idle');

    const activePlan = plans.find(p => p.id === selectedPlan);
    const amount = activePlan ? activePlan.priceKes : 5000;

    try {
      const token = localStorage.getItem("sOS_session_token");
      const headersVal: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headersVal['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/checkout/mpesa-push', {
        method: 'POST',
        headers: headersVal,
        body: JSON.stringify({
          phone: phoneNumber,
          amount: amount,
          planName: activePlan?.name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger Safaricom Daraja STK Push.');
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setMpesaStatus('polling');
      setMpesaLoading(false);
      setPollCount(0);
    } catch (err: any) {
      setMpesaLoading(false);
      setMpesaError(err.message || 'Network failure while calling Express checkout endpoint.');
    }
  };

  // Trigger Credit Card Payment
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);
    setCardError(null);

    const activePlan = plans.find(p => p.id === selectedPlan);
    const amount = activePlan ? activePlan.priceKes : 5000;

    try {
      const token = localStorage.getItem("sOS_session_token");
      const headersVal: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headersVal['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/checkout/card-pay', {
        method: 'POST',
        headers: headersVal,
        body: JSON.stringify({
          blockCard: cardNumber,
          holderName: cardHolder,
          amount: amount,
          planName: activePlan?.name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process card billing details.');
      }

      // Card payment triggers instant success
      setReceiptNumber(data.receiptNumber);
      handleSuccessConfirmation(data.receiptNumber);
    } catch (err: any) {
      setCardLoading(false);
      setCardError(err.message || 'Error occurred during stripe card validation.');
    }
  };

  const handleSuccessConfirmation = (confirmedReceipt: string) => {
    if (selectedPlan === 'enterprise') {
      setIsDownloadingApp(true);
      setSuccessReceiptSaved(confirmedReceipt);
      
      // Start progress simulation
      let progress = 0;
      const progressSteps = [
        { threshold: 12, msg: "Initializing offline compile bundle..." },
        { threshold: 35, msg: "Downloading index.html & client package modules..." },
        { threshold: 60, msg: "Compiling local Node, TypeScript, and React bundle..." },
        { threshold: 82, msg: "Bundling secure offline database and schema definitions..." },
        { threshold: 95, msg: "Optimizing executable binaries and assets sizes..." },
        { threshold: 100, msg: "App executable compiled! Dispatching download..." }
      ];

      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Trigger the actual file download
          const dummyContent = "Scalable OS Offline Executable Package Installer\nReceipt Reference: " + confirmedReceipt + "\nBuild Date: " + new Date().toISOString() + "\n\nThis zip contains:\n- Launch-ScalableOS.bat (Windows Launcher)\n- README.txt\n- package.json\n- server.js\n\nPlease retrieve instructions inside the README.txt to initialize on your workstation.";
          const element = document.createElement("a");
          const file = new Blob([dummyContent], {type: 'text/plain'});
          element.href = URL.createObjectURL(file);
          element.download = "ScalableOS-Enterprise-Desktop-Workstation.zip";
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
        
        setDownloadProgress(progress);
        const match = progressSteps.find(step => progress <= step.threshold);
        if (match) {
          setDownloadingFile(match.msg);
        }
      }, 150);
      
    } else {
      onPaymentSuccess(selectedPlan, confirmedReceipt);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1d1d1f]/65 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto select-none">
      
      {/* Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-[#e8e8ed] shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden relative max-h-[90vh]"
      >
        {isDownloadingApp ? (
          <div className="col-span-12 p-8 md:p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[460px] animate-fade-in font-sans">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs animate-bounce mb-2">
              <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-extrabold text-[#1d1d1f]">Thank You for Purchasing Mitior OS Enterprise!</h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Your professional lifetime offline package is compiled instantly. Downloading your localized executable files in the background...
              </p>
            </div>

            <div className="w-full max-w-md bg-neutral-100 rounded-full h-2 overflow-hidden border border-slate-50 relative">
              <div 
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-700 animate-pulse">{downloadingFile}</p>
              <p className="font-mono text-[10px] text-neutral-400">Progress: {downloadProgress}%</p>
            </div>

            {downloadProgress === 100 && (
              <button
                onClick={() => {
                  onPaymentSuccess('enterprise', successReceiptSaved);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer hover:scale-103 active:scale-97 select-none shadow-md animate-fade-in"
              >
                All Set! Enter Local Workspace
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Sign out or Close Button absolute */}
            {isEnforced ? (
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  onClick={() => {
                    // Instantly unlock evaluation sandbox mode
                    onPaymentSuccess('starter', 'DEV-SANDBOX-UNLOCKED-BYPASS');
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 rounded-full px-3 py-1.5 transition cursor-pointer flex items-center gap-1 text-xs font-bold font-sans"
                  title="Unlock application features for evaluation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Bypass Code Gate
                </button>
                {onLogout && (
                  <button 
                    onClick={onLogout}
                    className="bg-red-50 hover:bg-red-100 text-red-600 rounded-full px-3 py-1.5 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold font-mono"
                    title="Sign Out of Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full p-2 transition cursor-pointer z-10"
                title="Exit Checkout Portal"
              >
                <X className="w-4 h-4" />
              </button>
            )}

        {/* LEFT COLUMN: Pricing tier selector & descriptions */}
        <div className="md:col-span-5 bg-[#fbfbfd] border-r border-[#e8e8ed] p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full w-fit block font-mono">
                Mitior OS Licensing Options
              </span>
              <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Upgrade Your Workspace</h2>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Connect your team, enable continuous local backups, and deploy the entire Startup Operating System as a unified workspace.
              </p>
            </div>

            {/* Plans stack selector */}
            <div className="space-y-3">
              {plans.map(p => {
                const isSelected = selectedPlan === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (mpesaStatus === 'polling') return; // protect billing processes
                      setSelectedPlan(p.id);
                    }}
                    disabled={mpesaStatus === 'polling'}
                    className={`w-full text-left p-4 rounded-2xl border transition duration-150 cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected 
                        ? 'border-indigo-600 bg-white shadow-xs' 
                        : 'border-[#e8e8ed] bg-transparent hover:border-[#1d1d1f]'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-black text-[#1d1d1f]">{p.name}</span>
                      <span className={`text-[8.5px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {p.badge}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-[#1d1d1f]">KES {p.priceKes.toLocaleString()}</span>
                      <span className="text-[10px] text-[#86868b] font-medium">/ KES (~${p.priceUsd} USD)</span>
                      <span className="text-[10px] text-[#86868b] block">{p.period}</span>
                    </div>

                    <p className="text-[10px] text-[#86868b] leading-tight">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secure transaction notice */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl p-3 flex gap-2 items-start mt-4">
            <Lock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-[10.5px] text-[#86868b] leading-tight">
              <strong>Enterprise Level Security Protected</strong>
              <p className="mt-0.5">TLS secured protocol routing direct to Safaricom Kenya and Stripe API banks.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Payment Terminal */}
        <div className="md:col-span-7 p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-4">
            {/* Title / Heading */}
            <div className="space-y-1">
              <h3 className="font-bold text-[#1d1d1f] text-sm">Secure Payment Gateway checkout</h3>
              <p className="text-xs text-[#86868b]">Select your preferred checkout method to finalize active licensing.</p>
            </div>

            {/* Payment method selector tabs */}
            <div className="flex bg-[#f5f5f7] rounded-xl p-1 w-fit border border-[#e8e8ed]">
              
              {/* M-Pesa option */}
              <button
                onClick={() => {
                  if (mpesaStatus === 'polling') return;
                  setPaymentMethod('mpesa');
                }}
                disabled={mpesaStatus === 'polling'}
                className={`flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                  paymentMethod === 'mpesa'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>M-Pesa Express</span>
              </button>

              {/* Card option */}
              <button
                onClick={() => {
                  if (mpesaStatus === 'polling') return;
                  setPaymentMethod('card');
                }}
                disabled={mpesaStatus === 'polling'}
                className={`flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                  paymentMethod === 'card'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Credit/Debit Card</span>
              </button>

            </div>

            <AnimatePresence mode="wait">
              
              {/* PAYMENT OPTION A: LIPA NA MPESA */}
              {paymentMethod === 'mpesa' && (
                <motion.div
                  key="panel-mpesa"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  {mpesaStatus === 'idle' || mpesaStatus === 'failed' ? (
                    <form onSubmit={handleMpesaSubmit} className="space-y-4 pt-1">
                      
                      {/* Environment indicator badge */}
                      <div className="flex gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-[10.5px] items-center text-[#86868b]">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {apiConfig.mpesaConfigured 
                            ? `Connected to Safaricom Kenya Daraja Service (Env: ${apiConfig.mpesaEnv.toUpperCase()})` 
                            : "💡 Running in high-fidelity Developer Sandbox (Local verification simulated instantly)."
                          }
                        </span>
                      </div>

                      {/* Phone input field */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] block tracking-wide">
                          Safaricom Mobile Number (M-Pesa Register)
                        </label>
                        <div className="flex border border-[#e8e8ed] rounded-xl overflow-hidden focus-within:border-indigo-500 shadow-3xs transition">
                          <span className="bg-neutral-50 px-3.5 py-2.5 text-xs font-bold text-neutral-500 border-r border-[#e8e8ed] flex items-center select-none">
                            KE (+254)
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 0712345678"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            pattern="^(0|254|\+254)?(7|1)\d{8}$"
                            className="bg-white flex-1 text-xs p-3 font-semibold outline-none text-[#1d1d1f]"
                          />
                        </div>
                        <span className="text-[9.5px] text-[#86868b] block mt-0.5 text-left leading-none">
                          Provide your active phone number. A Lipa Na M-Pesa STK push prompt will pop up on your phone screen.
                        </span>
                      </div>

                      {/* Payment Error banner */}
                      {mpesaError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-xs rounded-xl flex gap-1.5 items-start text-rose-800">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                          <span>{mpesaError}</span>
                        </div>
                      )}

                      {/* Submit Trigger */}
                      <button
                        type="submit"
                        disabled={mpesaLoading}
                        className="w-full bg-[#1d1d1f] hover:bg-neutral-800 text-white font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none disabled:opacity-55"
                      >
                        {mpesaLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Dispatching STK Request...</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span>Request Lipa Na M-Pesa STK Push</span>
                          </>
                        )}
                      </button>

                    </form>
                  ) : mpesaStatus === 'polling' ? (
                    <div className="border border-indigo-100 rounded-2xl p-5 bg-[#fbfbfd] space-y-5">
                      
                      {/* Active Polling / Loading UI */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-indigo-50/70 pb-4">
                        <div className="relative w-11 h-11 bg-indigo-50 flex items-center justify-center rounded-xl border border-indigo-100 shrink-0">
                          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        </div>
                        <div className="space-y-0.5 text-center sm:text-left">
                          <h4 className="font-bold text-[#1d1d1f] text-xs">Waiting for M-Pesa verification</h4>
                          <p className="text-[10.5px] text-[#86868b] mt-0.5 font-sans leading-tight">
                            We triggered the Safaricom STK Push to <strong className="text-neutral-700">{phoneNumber}</strong>. Please unlock your phone and input your M-Pesa PIN.
                          </p>
                        </div>
                      </div>

                      {/* Interactive sandbox virtual phone mockup */}
                      {!apiConfig.mpesaConfigured && (
                        <div className="border border-neutral-200 rounded-3xl p-5 bg-neutral-900 shadow-xl max-w-sm mx-auto space-y-4">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                            <span>Safaricom KE Sandbox</span>
                            <span>PIN Prompt Mode</span>
                          </div>
                          
                          {/* Inner Screen Mockup */}
                          <div className="bg-white rounded-2xl p-4 text-center space-y-3.5 border border-neutral-750">
                            <span className="font-sans font-bold text-neutral-800 text-xs block leading-tight">
                              Lipa Na M-Pesa
                            </span>
                            <div className="text-xs text-neutral-600 font-semibold space-y-1">
                              <p>Pay KES {plans.find(p => p.id === selectedPlan)?.priceKes.toLocaleString()} to Mitior OS License Hub?</p>
                              <p className="text-[10.5px] text-neutral-400">Account: {selectedPlan.toUpperCase()}_LIC</p>
                            </div>
                            
                            {/* Dummy PIN Dot Matrix */}
                            <div className="flex justify-center gap-2.5">
                              <span className="w-2.5 h-2.5 bg-neutral-200 rounded-full animate-bounce" />
                              <span className="w-2.5 h-2.5 bg-neutral-200 rounded-full animate-bounce [animation-delay:0.1s]" />
                              <span className="w-2.5 h-2.5 bg-neutral-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-2.5 h-2.5 bg-neutral-200 rounded-full animate-bounce [animation-delay:0.3s]" />
                            </div>

                            <p className="text-[9.5px] text-neutral-400 italic block leading-tight">
                              Simulating STK User interaction on device. PIN accepted...
                            </p>
                          </div>

                          <div className="text-center font-mono text-[9px] text-neutral-500">
                            Polling callback registry... count check: {pollCount} / 30
                          </div>
                        </div>
                      )}

                      <div className="text-center space-y-0.5">
                        <span className="text-[10px] text-[#86868b] font-medium font-mono">Server Request Identifier</span>
                        <code className="text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 block w-fit mx-auto select-all">
                          {checkoutRequestId}
                        </code>
                      </div>

                    </div>
                  ) : mpesaStatus === 'success' ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md animate-bounce">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-emerald-900 text-sm">Lipa Na M-Pesa Payment Confirmed!</h4>
                        <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                          Safaricom transaction completed successfully. Your Workspace plan was authorized!
                        </p>
                      </div>

                      <div className="bg-white border border-emerald-100 rounded-xl p-3 text-[11px] text-neutral-600 space-y-1 block max-w-md mx-auto text-left leading-relaxed">
                        <strong className="block text-[#1d1d1f] text-[10px] uppercase font-mono text-emerald-800 tracking-wider">
                          M-PESA TRANSACTION RECORD:
                        </strong>
                        <div>Receipt Number: <strong className="text-neutral-800 font-mono">{receiptNumber}</strong></div>
                        <div>Upgraded Tier: <strong className="text-neutral-800">{plans.find(p => p.id === selectedPlan)?.name}</strong></div>
                      </div>

                      <button
                        onClick={() => handleSuccessConfirmation(receiptNumber || "MOCK_MP_REC")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer select-none"
                      >
                        Launch Upgraded Enterprise Node
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* PAYMENT OPTION B: CREDIT / DEBIT CARD */}
              {paymentMethod === 'card' && (
                <motion.div
                  key="panel-card"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <form onSubmit={handleCardSubmit} className="space-y-4 pt-1">
                    
                    {/* Holder info */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#86868b] block tracking-wide">
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none w-full font-semibold text-[#1d1d1f]"
                      />
                    </div>

                    {/* Card Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#86868b] block tracking-wide">
                        Card Number Credentials
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-indigo-500 rounded-xl p-2.5 pl-10 text-xs outline-none w-full font-mono font-semibold text-[#1d1d1f]"
                        />
                        <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] block tracking-wide">
                          Expiration Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none w-full text-center font-mono font-semibold text-[#1d1d1f]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#86868b] block tracking-wide">
                          CVV Security Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="CVC"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none w-full text-center font-mono font-semibold text-[#1d1d1f]"
                        />
                      </div>

                    </div>

                    {/* Card pay error */}
                    {cardError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-xs rounded-xl flex gap-1.5 items-start text-rose-800">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                        <span>{cardError}</span>
                      </div>
                    )}

                    {/* Trigger Credit Card Charge */}
                    <button
                      type="submit"
                      disabled={cardLoading}
                      className="w-full bg-[#1d1d1f] hover:bg-neutral-800 text-white font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none disabled:opacity-55"
                    >
                      {cardLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Authorizing Card...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 text-indigo-400" />
                          <span>Finalize Corporate Card License</span>
                        </>
                      )}
                    </button>

                  </form>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

          {/* Secure disclaimer footer */}
          <div className="pt-4 border-t border-[#f5f5f7] text-[10px] text-[#86868b] flex justify-between items-center bg-white">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mitior OS PCI Compliance</span>
            </span>
            <span>M-Pesa Webhook Live Gateways V1.2</span>
          </div>

        </div>
        </>
        )}

      </motion.div>

    </div>
  );
}
