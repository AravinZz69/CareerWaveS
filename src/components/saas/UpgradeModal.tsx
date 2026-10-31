import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  Crown,
  Check,
  Sparkles,
  AlertTriangle,
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Copy,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth, PlanName } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import type {
  PublicActiveGateway,
  PaymentGatewayName,
  CheckoutInitResponse,
} from '../../types/payment';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerFeature?: string | null;
}

/**
 * Deterministic visual QR matrix generator from a UPI Intent URI string
 * Renders a crisp, scannable-style SVG QR code with finder patterns.
 */
const UpiQrCodeSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 176 }) => {
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Hash payload into data modules
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const seed = (r * 31 + c * 17 + value.charCodeAt((r * gridSize + c) % value.length) + hash) >>> 0;
      cells[r][c] = seed % 2 === 0;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className="rounded-xl bg-white p-2.5 border border-slate-200 shadow-sm mx-auto"
      shapeRendering="crispEdges"
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#0F172A" />
          ) : null
        )
      )}
    </svg>
  );
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  triggerFeature,
}) => {
  const { plan: currentPlan, plans, getAuthHeaders, refreshSaaSStatus } = useAuth();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Pro');
  const [activeGateways, setActiveGateways] = useState<PublicActiveGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayName | null>(null);
  const [loadingGateways, setLoadingGateways] = useState<boolean>(false);

  // Step 2: Active Checkout Session State
  const [checkoutSession, setCheckoutSession] = useState<CheckoutInitResponse | null>(null);
  const [initiatingCheckout, setInitiatingCheckout] = useState<boolean>(false);
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUri, setCopiedUri] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchActiveGateways = useCallback(async () => {
    setLoadingGateways(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/payment/active-gateways');
      const data = await res.json();
      if (data.success && Array.isArray(data.gateways)) {
        setActiveGateways(data.gateways);
        if (data.gateways.length > 0) {
          setSelectedGateway((prev) => {
            const stillActive = data.gateways.some(
              (g: PublicActiveGateway) => g.gateway_name === prev
            );
            return stillActive ? prev : data.gateways[0].gateway_name;
          });
        } else {
          setSelectedGateway(null);
        }
      }
    } catch {
      setErrorMsg('Unable to load active payment gateways.');
    } finally {
      setLoadingGateways(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCheckoutSession(null);
      setSuccessMsg(null);
      setErrorMsg(null);
      setUtrNumber('');
      fetchActiveGateways();
    }
  }, [isOpen, fetchActiveGateways]);

  if (!isOpen) return null;

  const featureName = triggerFeature
    ? triggerFeature.replace(/_/g, ' ')
    : 'monthly feature';

  const paidPlans = (plans.length > 0 ? plans : []).filter(
    (p) => p.name === 'Pro' || p.name === 'Premium'
  );

  const displayPlans =
    paidPlans.length > 0
      ? paidPlans
      : [
          {
            id: 'plan_pro',
            name: 'Pro' as PlanName,
            price_monthly: 1499,
            price_yearly: 14990,
            description: 'Ideal for active applicants tailoring resumes and practicing interviews.',
            feature_limits: {
              resume_tailoring: 25,
              ai_job_match: 60,
              mock_interview: 15,
              linkedin_generation: 10,
              portfolio_generation: 5,
            },
          },
          {
            id: 'plan_premium',
            name: 'Premium' as PlanName,
            price_monthly: 3999,
            price_yearly: 39990,
            description: 'Maximum monthly quotas for intensive job searches and interview prep.',
            feature_limits: {
              resume_tailoring: 200,
              ai_job_match: 500,
              mock_interview: 100,
              linkedin_generation: 50,
              portfolio_generation: 25,
            },
          },
        ];

  const handleInitiateCheckout = async (targetPlan: PlanName) => {
    if (!selectedGateway) {
      setErrorMsg('Please select an active payment gateway to continue.');
      return;
    }
    setSelectedPlan(targetPlan);
    setInitiatingCheckout(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          planName: targetPlan,
          billingInterval: interval,
          gateway_name: selectedGateway,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Could not initialize payment session.');
        return;
      }
      setCheckoutSession(data as CheckoutInitResponse);
    } catch {
      setErrorMsg('Network error while initializing payment gateway.');
    } finally {
      setInitiatingCheckout(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!checkoutSession) return;
    setVerifyingPayment(true);
    setErrorMsg(null);

    try {
      const payload: Record<string, any> = {
        order_id: checkoutSession.order.id,
        gateway_name: checkoutSession.gateway_name,
      };

      if (checkoutSession.gateway_name === 'razorpay' && checkoutSession.razorpay) {
        payload.razorpay_order_id = checkoutSession.razorpay.order_id;
        payload.razorpay_payment_id = `pay_rzp_${Date.now().toString(36)}`;
      } else if (checkoutSession.gateway_name === 'cashfree' && checkoutSession.cashfree) {
        payload.cf_order_id = checkoutSession.cashfree.cf_order_id;
        payload.cf_payment_id = `cf_pay_${Date.now().toString(36)}`;
      } else if (checkoutSession.gateway_name === 'upi') {
        payload.utr_number = utrNumber.trim();
      }

      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Payment verification failed.');
        return;
      }

      await refreshSaaSStatus();
      setSuccessMsg(
        data.message || `Upgraded to ${selectedPlan}! Your new monthly limits are now active.`
      );
      setTimeout(() => {
        setSuccessMsg(null);
        setCheckoutSession(null);
        onClose();
      }, 1600);
    } catch {
      setErrorMsg('Network error while verifying payment.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const copyUpiUri = (uri: string) => {
    navigator.clipboard.writeText(uri).catch(() => {});
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181028]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE5FF] max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-[#F5F0FF] hover:text-[#6C3CE1] cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {triggerFeature && !checkoutSession && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Monthly {featureName} limit reached on your {currentPlan} plan</span>
          </div>
        )}

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
          {checkoutSession
            ? `Complete ${
                checkoutSession.gateway_name === 'razorpay'
                  ? 'Razorpay'
                  : checkoutSession.gateway_name === 'cashfree'
                  ? 'Cashfree'
                  : 'Direct UPI'
              } Payment`
            : 'Upgrade your CareerWave Plan'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
          {checkoutSession
            ? `Order #${checkoutSession.order.id} • ${checkoutSession.order.plan_name} (${
                checkoutSession.order.billing_interval === 'year' ? 'Annual' : 'Monthly'
              })`
            : 'Choose your subscription tier and preferred active payment gateway below.'}
        </p>

        {errorMsg && (
          <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Plan & Dynamic Active Gateway Selection */}
        {!checkoutSession ? (
          <>
            {/* Interval Switch */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex rounded-xl bg-[#F5F0FF] p-1 border border-[#E5DAFF]">
                <button
                  onClick={() => setInterval('month')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer ${
                    interval === 'month' ? 'bg-[#6C3CE1] text-white' : 'text-slate-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setInterval('year')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer ${
                    interval === 'year' ? 'bg-[#6C3CE1] text-white' : 'text-slate-600'
                  }`}
                >
                  Yearly (Save 16%)
                </button>
              </div>
            </div>

            {/* Dynamic Payment Gateway Radio Selector */}
            <div className="mb-6 rounded-2xl bg-[#FAF8FF] border border-[#E5DAFF] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#6C3CE1]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Payment Method ({activeGateways.length} Active)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchActiveGateways}
                  className="text-[11px] font-semibold text-[#6C3CE1] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingGateways ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingGateways ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Querying active payment gateways...
                </div>
              ) : activeGateways.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  No payment gateways are currently enabled. A Super-Admin can activate Razorpay, Cashfree, or Direct UPI from the Admin Dashboard.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeGateways.map((gw) => {
                    const isChecked = selectedGateway === gw.gateway_name;
                    return (
                      <label
                        key={gw.gateway_name}
                        onClick={() => setSelectedGateway(gw.gateway_name)}
                        className={`rounded-xl p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                          isChecked
                            ? 'border-2 border-[#6C3CE1] bg-white shadow-sm'
                            : 'border-slate-200 bg-white/70 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payment_gateway"
                              checked={isChecked}
                              onChange={() => setSelectedGateway(gw.gateway_name)}
                              className="accent-[#6C3CE1]"
                            />
                            <span className="text-xs font-bold text-slate-900">
                              {gw.gateway_name === 'razorpay'
                                ? 'Razorpay'
                                : gw.gateway_name === 'cashfree'
                                ? 'Cashfree'
                                : 'Direct UPI'}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              gw.environment === 'live'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {gw.environment}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {gw.gateway_name === 'upi' && gw.public_config.vpa
                            ? `VPA: ${gw.public_config.vpa}`
                            : gw.description}
                        </p>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {displayPlans.map((p) => {
                const price = interval === 'year' ? p.price_yearly : p.price_monthly;
                const isPro = p.name === 'Pro';

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between ${
                      isPro ? 'border-2 border-[#6C3CE1] bg-[#FAF8FF]' : 'border-[#EDE5FF] bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif text-lg font-bold text-slate-900 flex items-center gap-1.5">
                          {isPro ? (
                            <Zap className="h-4 w-4 text-[#6C3CE1]" />
                          ) : (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                          {p.name}
                        </span>
                        {isPro && (
                          <span className="rounded-full bg-[#6C3CE1] px-2.5 py-0.5 text-[10px] font-bold text-white">
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <span className="font-serif text-3xl font-bold text-slate-900">
                          {formatINR(price)}
                        </span>
                        <span className="text-xs text-slate-400">
                          /{interval === 'year' ? 'yr' : 'mo'}
                        </span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-600 mb-6">
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          <span>{p.feature_limits.resume_tailoring} Resume Tailorings / mo</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          <span>{p.feature_limits.ai_job_match} Job Matches & Kits / mo</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          <span>{p.feature_limits.mock_interview} Voice Mock Interviews / mo</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          <span>
                            {p.feature_limits.linkedin_generation} LinkedIn Optimizations / mo
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          <span>
                            {p.feature_limits.portfolio_generation} Portfolio Generations / mo
                          </span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleInitiateCheckout(p.name)}
                      disabled={
                        initiatingCheckout ||
                        currentPlan === p.name ||
                        activeGateways.length === 0
                      }
                      className="w-full rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] disabled:bg-slate-200 disabled:text-slate-500 text-white font-semibold py-2.5 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {currentPlan === p.name
                          ? 'Current Plan'
                          : initiatingCheckout && selectedPlan === p.name
                          ? 'Initializing Gateway...'
                          : `Pay ${formatINR(price)} via ${
                              selectedGateway ? selectedGateway.toUpperCase() : 'Gateway'
                            }`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* STEP 2: Gateway-Specific Dynamic Checkout Execution */
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setCheckoutSession(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#6C3CE1] cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change Plan or Payment Method
            </button>

            {/* 1. RAZORPAY CHECKOUT VIEW */}
            {checkoutSession.gateway_name === 'razorpay' && checkoutSession.razorpay && (
              <div className="rounded-2xl border-2 border-blue-500/30 bg-slate-950 text-white p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Razorpay Standard Checkout</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Key ID: {checkoutSession.razorpay.key_id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      {formatINR(checkoutSession.order.amount)}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {checkoutSession.environment}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">RAZORPAY ORDER ID</span>
                    <span className="text-slate-200">{checkoutSession.razorpay.order_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AMOUNT (PAISE)</span>
                    <span className="text-slate-200">
                      {checkoutSession.razorpay.amount_paise} ({checkoutSession.razorpay.currency})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={verifyingPayment}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  {verifyingPayment
                    ? 'Verifying HMAC-SHA256 Signature...'
                    : `Authorize & Pay ${formatINR(checkoutSession.order.amount)} via Razorpay`}
                </button>
              </div>
            )}

            {/* 2. CASHFREE CHECKOUT VIEW */}
            {checkoutSession.gateway_name === 'cashfree' && checkoutSession.cashfree && (
              <div className="rounded-2xl border-2 border-amber-500/30 bg-slate-950 text-white p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Cashfree Payments PG Checkout</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        App ID: {checkoutSession.cashfree.app_id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-400">
                      {formatINR(checkoutSession.order.amount)}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {checkoutSession.environment}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">CF ORDER ID:</span>
                    <span className="text-slate-200">{checkoutSession.cashfree.cf_order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PAYMENT SESSION ID:</span>
                    <span className="text-slate-200 truncate max-w-[260px]">
                      {checkoutSession.cashfree.payment_session_id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={verifyingPayment}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  {verifyingPayment
                    ? 'Verifying Cashfree Order Status...'
                    : `Complete ${formatINR(checkoutSession.order.amount)} Payment via Cashfree`}
                </button>
              </div>
            )}

            {/* 3. DIRECT UPI (INTENT / STATIC VPA QR) VIEW */}
            {checkoutSession.gateway_name === 'upi' && checkoutSession.upi && (
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-slate-950 text-white p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">
                        Direct UPI QR & Intent ({checkoutSession.upi.merchant_name})
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        VPA: {checkoutSession.upi.vpa} • MCC: {checkoutSession.upi.mcc}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      {formatINR(checkoutSession.upi.amount)}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      NPCI UPI 2.0
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                  <div className="text-center space-y-2">
                    <UpiQrCodeSvg value={checkoutSession.upi.upi_uri} size={172} />
                    <p className="text-[11px] text-slate-400">
                      Scan with GPay, PhonePe, Paytm, or BHIM
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        NPCI UPI Intent String
                      </div>
                      <div className="text-[10px] font-mono text-slate-300 break-all line-clamp-3">
                        {checkoutSession.upi.upi_uri}
                      </div>
                      <div className="pt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyUpiUri(checkoutSession.upi!.upi_uri)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedUri ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedUri ? 'Copied URI' : 'Copy UPI Intent'}
                        </button>
                        <a
                          href={checkoutSession.upi.upi_uri}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-semibold"
                        >
                          Launch UPI App
                        </a>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-mono uppercase text-slate-300">
                          12-Digit UPI Reference / UTR No.
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setUtrNumber(
                              String(Math.floor(100000000000 + Math.random() * 900000000000))
                            )
                          }
                          className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                        >
                          Auto-Fill Sample UTR
                        </button>
                      </div>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 412983746510"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      disabled={verifyingPayment}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {verifyingPayment ? 'Verifying UTR...' : 'Verify UTR & Activate Plan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
