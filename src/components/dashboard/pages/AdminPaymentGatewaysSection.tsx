import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CreditCard,
  QrCode,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Lock,
  Globe,
  Sliders,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import type {
  PaymentGatewayConfig,
  PaymentGatewayName,
  PaymentEnvironment,
  PaymentOrderRecord,
  RazorpayCredentials,
  CashfreeCredentials,
  UpiCredentials,
} from '../../../types/payment';

interface AdminPaymentGatewaysSectionProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminPaymentGatewaysSection: React.FC<AdminPaymentGatewaysSectionProps> = ({
  showToast,
}) => {
  const { getAuthHeaders, refreshSaaSStatus } = useAuth();
  const [gateways, setGateways] = useState<PaymentGatewayConfig<any>[]>([]);
  const [orders, setOrders] = useState<PaymentOrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingGateway, setSavingGateway] = useState<string | null>(null);
  const [togglingGateway, setTogglingGateway] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Local editable form state per gateway
  const [forms, setForms] = useState<Record<PaymentGatewayName, {
    environment: PaymentEnvironment;
    is_active: boolean;
    credentials: Record<string, string>;
  }>>({
    razorpay: {
      environment: 'sandbox',
      is_active: true,
      credentials: { key_id: '', key_secret: '', webhook_secret: '' },
    },
    cashfree: {
      environment: 'sandbox',
      is_active: true,
      credentials: { app_id: '', secret_key: '', webhook_secret: '' },
    },
    upi: {
      environment: 'live',
      is_active: true,
      credentials: { vpa: '', merchant_name: '', mcc: '5734' },
    },
  });

  const fetchGatewaysConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-gateways', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.gateways)) {
        setGateways(data.gateways);
        setOrders(data.orders || []);

        const nextForms: any = {};
        for (const gw of data.gateways as PaymentGatewayConfig<any>[]) {
          nextForms[gw.gateway_name] = {
            environment: gw.environment,
            is_active: gw.is_active,
            credentials: { ...gw.credentials },
          };
        }
        setForms((prev) => ({ ...prev, ...nextForms }));
      }
    } catch {
      showToast('Failed to load payment gateway configurations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchGatewaysConfig();
  }, [fetchGatewaysConfig]);

  const handleToggleGateway = async (gatewayName: PaymentGatewayName, nextActive: boolean) => {
    setTogglingGateway(gatewayName);
    try {
      const res = await fetch(`/api/admin/payment-gateways/${gatewayName}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: nextActive,
          environment: forms[gatewayName]?.environment,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to toggle gateway.', 'error');
        return;
      }
      setGateways((prev) =>
        prev.map((g) => (g.gateway_name === gatewayName ? data.gateway : g))
      );
      setForms((prev) => ({
        ...prev,
        [gatewayName]: {
          ...prev[gatewayName],
          is_active: data.gateway.is_active,
          environment: data.gateway.environment,
        },
      }));
      showToast(data.message || `${gatewayName.toUpperCase()} status updated.`);
    } catch {
      showToast('Network error while toggling gateway.', 'error');
    } finally {
      setTogglingGateway(null);
    }
  };

  const handleEnvironmentChange = (
    gatewayName: PaymentGatewayName,
    env: PaymentEnvironment
  ) => {
    setForms((prev) => ({
      ...prev,
      [gatewayName]: {
        ...prev[gatewayName],
        environment: env,
      },
    }));
  };

  const handleCredentialChange = (
    gatewayName: PaymentGatewayName,
    field: string,
    value: string
  ) => {
    setForms((prev) => ({
      ...prev,
      [gatewayName]: {
        ...prev[gatewayName],
        credentials: {
          ...prev[gatewayName].credentials,
          [field]: value,
        },
      },
    }));
  };

  const handleSaveGateway = async (gatewayName: PaymentGatewayName) => {
    const form = forms[gatewayName];
    if (!form) return;
    setSavingGateway(gatewayName);
    try {
      const res = await fetch(`/api/admin/payment-gateways/${gatewayName}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: form.is_active,
          environment: form.environment,
          credentials: form.credentials,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to save gateway configuration.', 'error');
        return;
      }
      setGateways((prev) =>
        prev.map((g) => (g.gateway_name === gatewayName ? data.gateway : g))
      );
      showToast(data.message || `${gatewayName.toUpperCase()} credentials saved!`);
    } catch {
      showToast('Failed to save gateway configuration.', 'error');
    } finally {
      setSavingGateway(null);
    }
  };

  const handleTestWebhook = async (gatewayName: PaymentGatewayName) => {
    setTestingWebhook(gatewayName);
    try {
      const res = await fetch(`/api/admin/payment-gateways/${gatewayName}/test-webhook`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Webhook test failed.', 'error');
        return;
      }
      showToast(data.message || 'Webhook signature verified & test order fulfilled!');
      await fetchGatewaysConfig();
      await refreshSaaSStatus();
    } catch {
      showToast('Failed to run webhook test.', 'error');
    } finally {
      setTestingWebhook(null);
    }
  };

  const toggleRevealSecret = (key: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyWebhookUrl = (gatewayName: string, path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {});
    setCopiedWebhook(gatewayName);
    showToast(`Copied ${fullUrl} to clipboard.`);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const activeCount = gateways.filter((g) => g.is_active).length;

  const getGatewayIcon = (name: PaymentGatewayName) => {
    if (name === 'razorpay') return <CreditCard size={18} className="text-blue-400" />;
    if (name === 'cashfree') return <Zap size={18} className="text-amber-400" />;
    return <QrCode size={18} className="text-emerald-400" />;
  };

  const getGatewayAccent = (name: PaymentGatewayName) => {
    if (name === 'razorpay') return 'border-blue-500/30 bg-blue-500/5';
    if (name === 'cashfree') return 'border-amber-500/30 bg-amber-500/5';
    return 'border-emerald-500/30 bg-emerald-500/5';
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Status Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
              Dynamic Multi-Gateway Routing Engine • Zero-Restart Hot Reload
            </span>
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Super-Admin Payment Gateway Control Center
          </h3>
          <p className="text-xs text-slate-400 max-w-3xl">
            Activate, deactivate, switch between <span className="text-slate-200 font-medium">Sandbox</span> and{' '}
            <span className="text-slate-200 font-medium">Live</span> environments, and rotate API keys or UPI VPAs directly in the database. Customer checkouts query{' '}
            <code className="text-blue-400 font-mono text-[11px]">GET /api/payment/active-gateways</code> on-the-fly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <Shield size={15} className="text-blue-400" />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Active Gateways</div>
              <div className="text-xs font-bold text-white">
                {activeCount} of {gateways.length || 3} Enabled
              </div>
            </div>
          </div>

          <button
            onClick={fetchGatewaysConfig}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync Store
          </button>
        </div>
      </div>

      {activeCount === 0 && !loading && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <div>
            <span className="font-bold">Warning: All payment gateways are currently disabled.</span>{' '}
            Customers will not see any payment options on the checkout screen until you enable at least one gateway below.
          </div>
        </div>
      )}

      {/* 3 Gateway Configuration Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {(['razorpay', 'cashfree', 'upi'] as PaymentGatewayName[]).map((gwName) => {
          const gw = gateways.find((g) => g.gateway_name === gwName);
          const form = forms[gwName];
          const isActive = form?.is_active ?? true;
          const env = form?.environment ?? 'sandbox';
          const creds = form?.credentials || {};

          return (
            <div
              key={gwName}
              className={`bg-slate-900/90 border rounded-xl flex flex-col justify-between transition-all ${
                isActive ? 'border-slate-700/90 shadow-lg' : 'border-slate-800/60 opacity-75'
              }`}
            >
              <div>
                {/* Card Header + Master Toggle Switch */}
                <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${getGatewayAccent(
                        gwName
                      )}`}
                    >
                      {getGatewayIcon(gwName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {gw?.display_name ||
                            (gwName === 'razorpay'
                              ? 'Razorpay Checkout'
                              : gwName === 'cashfree'
                              ? 'Cashfree Payments'
                              : 'Direct UPI (Intent / QR)')}
                        </h4>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {gw?.description}
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle Switch */}
                  <div className="flex flex-col items-end shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      disabled={togglingGateway === gwName}
                      onClick={() => handleToggleGateway(gwName, !isActive)}
                      title={isActive ? 'Disable Gateway' : 'Enable Gateway'}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">
                      Master Toggle
                    </span>
                  </div>
                </div>

                {/* Environment Mode Selector */}
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Globe size={13} className="text-slate-400" />
                    Environment Mode
                  </span>
                  <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    {(['sandbox', 'live'] as PaymentEnvironment[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleEnvironmentChange(gwName, mode)}
                        className={`px-3 py-1 rounded-md text-[11px] font-mono uppercase transition-colors cursor-pointer ${
                          env === mode
                            ? mode === 'live'
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gateway-Specific Credential Inputs */}
                <div className="p-5 space-y-3.5">
                  {gwName === 'razorpay' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Razorpay Key ID
                        </label>
                        <input
                          type="text"
                          value={creds.key_id || ''}
                          onChange={(e) =>
                            handleCredentialChange('razorpay', 'key_id', e.target.value)
                          }
                          placeholder="rzp_test_... or rzp_live_..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Razorpay Key Secret
                        </label>
                        <div className="relative">
                          <input
                            type={revealedSecrets['rzp_secret'] ? 'text' : 'password'}
                            value={creds.key_secret || ''}
                            onChange={(e) =>
                              handleCredentialChange('razorpay', 'key_secret', e.target.value)
                            }
                            placeholder="Enter Razorpay Key Secret"
                            className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleRevealSecret('rzp_secret')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {revealedSecrets['rzp_secret'] ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Webhook Secret (x-razorpay-signature)
                        </label>
                        <div className="relative">
                          <input
                            type={revealedSecrets['rzp_wh'] ? 'text' : 'password'}
                            value={creds.webhook_secret || ''}
                            onChange={(e) =>
                              handleCredentialChange('razorpay', 'webhook_secret', e.target.value)
                            }
                            placeholder="whsec_..."
                            className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleRevealSecret('rzp_wh')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {revealedSecrets['rzp_wh'] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {gwName === 'cashfree' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Cashfree App ID (x-client-id)
                        </label>
                        <input
                          type="text"
                          value={creds.app_id || ''}
                          onChange={(e) =>
                            handleCredentialChange('cashfree', 'app_id', e.target.value)
                          }
                          placeholder="TEST... or CF..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Cashfree Secret Key (x-client-secret)
                        </label>
                        <div className="relative">
                          <input
                            type={revealedSecrets['cf_secret'] ? 'text' : 'password'}
                            value={creds.secret_key || ''}
                            onChange={(e) =>
                              handleCredentialChange('cashfree', 'secret_key', e.target.value)
                            }
                            placeholder="cfsk_ma_..."
                            className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleRevealSecret('cf_secret')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {revealedSecrets['cf_secret'] ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Webhook Secret (x-webhook-signature)
                        </label>
                        <div className="relative">
                          <input
                            type={revealedSecrets['cf_wh'] ? 'text' : 'password'}
                            value={creds.webhook_secret || ''}
                            onChange={(e) =>
                              handleCredentialChange('cashfree', 'webhook_secret', e.target.value)
                            }
                            placeholder="whsec_cf_..."
                            className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleRevealSecret('cf_wh')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {revealedSecrets['cf_wh'] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {gwName === 'upi' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Merchant UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          value={creds.vpa || ''}
                          onChange={(e) => handleCredentialChange('upi', 'vpa', e.target.value)}
                          placeholder="merchant@okaxis or merchant@icici"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Merchant Display Name (pn)
                        </label>
                        <input
                          type="text"
                          value={creds.merchant_name || ''}
                          onChange={(e) =>
                            handleCredentialChange('upi', 'merchant_name', e.target.value)
                          }
                          placeholder="CareerWave Technologies"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                          Merchant Category Code (MCC)
                        </label>
                        <input
                          type="text"
                          value={creds.mcc || ''}
                          onChange={(e) => handleCredentialChange('upi', 'mcc', e.target.value)}
                          placeholder="5734 (Computer Software Stores)"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[10px] font-mono text-slate-400 break-all">
                        <span className="text-emerald-400 uppercase block mb-0.5">
                          Generated NPCI Intent URI Preview:
                        </span>
                        {`upi://pay?pa=${encodeURIComponent(
                          creds.vpa || 'merchant@upi'
                        )}&pn=${encodeURIComponent(
                          creds.merchant_name || 'Merchant'
                        )}&mc=${encodeURIComponent(creds.mcc || '5734')}&cu=INR`}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Footer: Webhook URL + Test Webhook + Save Button */}
              <div className="p-5 pt-0 space-y-3">
                {gwName !== 'upi' && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase text-slate-500">
                        Webhook Callback Endpoint
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 truncate">
                        /api/webhooks/{gwName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyWebhookUrl(gwName, `/api/webhooks/${gwName}`)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedWebhook === gwName ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      Copy
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveGateway(gwName)}
                    disabled={savingGateway === gwName}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save size={14} />
                    {savingGateway === gwName ? 'Saving...' : 'Save Configuration'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestWebhook(gwName)}
                    disabled={testingWebhook === gwName}
                    title="Simulate a signed webhook callback and verify HMAC signature"
                    className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Terminal size={13} className="text-emerald-400" />
                    {testingWebhook === gwName ? 'Testing...' : 'Test Webhook'}
                  </button>
                </div>

                {gw?.updated_at && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Updated by {gw.updated_by || 'admin'}</span>
                    <span>{new Date(gw.updated_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Multi-Gateway Payment Orders & Webhook Verification Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock size={15} className="text-blue-400" />
              Live Multi-Gateway Payment Orders & Webhook Ledger
            </h4>
            <p className="text-xs text-slate-400">
              Real-time log of checkout orders across Razorpay, Cashfree, and Direct UPI with signature and UTR verification status.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Provider Ref / UTR</th>
                <th className="py-3 px-4">Verification Event</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-slate-300">{ord.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{ord.user_name}</div>
                    <div className="text-[11px] text-slate-500">{ord.user_email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {ord.plan_name} ({ord.billing_interval})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    ₹{Number(ord.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="uppercase font-mono text-[11px] font-semibold text-slate-200">
                        {ord.gateway_name}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          ord.environment === 'live'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {ord.environment}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    {ord.utr_number
                      ? `UTR: ${ord.utr_number}`
                      : ord.provider_payment_id || ord.provider_order_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {ord.webhook_event || 'awaiting_callback'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                        ord.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : ord.status === 'failed'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {ord.status === 'paid' && <CheckCircle2 size={11} />}
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No payment orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
