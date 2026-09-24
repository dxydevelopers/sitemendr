import { useEffect, useRef, useState } from "react";
import { CheckCircle, Mail, MessageCircle, Phone, Send, ShieldCheck, Clock, ExternalLink } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

// Shown in Dashboard > Settings. Handles both verification channels —
// email works today; phone shows as "coming soon" until at least one of
// SMS or WhatsApp has real credentials configured on the backend.
//
// SMS and WhatsApp use genuinely different flows:
//  - SMS: we send a code, the user types it back in here.
//  - WhatsApp (loop trick): we hand them a pre-filled wa.me link, THEY send
//    the code to us, and a backend webhook catches it — this component
//    polls for that to happen rather than accepting typed input directly.
export default function VerificationCenter() {
  const { user, refreshUser } = useAuth();
  const [caps, setCaps] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const [channel, setChannel] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");

  // SMS flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // WhatsApp loop flow state
  const [whatsappLink, setWhatsappLink] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("");
  const [polling, setPolling] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const pollTimer = useRef(null);

  useEffect(() => {
    api.get("/auth/verification-methods").then((res) => {
      setCaps(res.data);
      if (res.data.sms) setChannel("sms");
      else if (res.data.whatsapp) setChannel("whatsapp");
    });
  }, []);

  // Stop polling on unmount so it never keeps running after leaving the page
  useEffect(() => () => clearInterval(pollTimer.current), []);

  async function handleResendEmail() {
    setResending(true);
    setResendMsg("");
    try {
      const res = await api.post("/auth/resend-verification-email");
      setResendMsg(res.data.message);
    } catch (err) {
      setResendMsg(err.response?.data?.message || "Couldn't resend — try again shortly");
    } finally {
      setResending(false);
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setPhoneError("");
    setPhoneMsg("");
    if (!phone.trim()) { setPhoneError("Enter your phone number"); return; }
    setSending(true);
    try {
      const res = await api.post("/auth/send-phone-otp", { phone: phone.trim(), channel });

      if (channel === "whatsapp") {
        setWhatsappLink(res.data.whatsappLink);
        setWhatsappCode(res.data.code);
        startPolling();
      } else {
        setPhoneMsg(res.data.message);
        setOtpSent(true);
      }
    } catch (err) {
      setPhoneError(err.response?.data?.message || "Couldn't send the code — try again");
    } finally {
      setSending(false);
    }
  }

  function startPolling() {
    setPolling(true);
    pollTimer.current = setInterval(async () => {
      try {
        const res = await api.get("/auth/phone-verification-status");
        if (res.data.verified) {
          clearInterval(pollTimer.current);
          setPolling(false);
          setWhatsappLink("");
          await refreshUser();
        }
      } catch {
        // transient network hiccup — the next poll tick will just try again
      }
    }, 2500);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setPhoneError("");
    if (!otp.trim()) { setPhoneError("Enter the code you received"); return; }
    setVerifying(true);
    try {
      await api.post("/auth/verify-phone-otp", { otp: otp.trim() });
      await refreshUser();
      setOtpSent(false);
      setOtp("");
    } catch (err) {
      setPhoneError(err.response?.data?.message || "Incorrect or expired code");
    } finally {
      setVerifying(false);
    }
  }

  // Manual fallback for the WhatsApp flow — in case the webhook doesn't
  // catch it (network hiccup, the delivery got delayed, etc.), the same
  // code can just be typed in directly instead of waiting on the loop.
  async function handleManualVerify(e) {
    e.preventDefault();
    setPhoneError("");
    if (!manualCode.trim()) { setPhoneError("Enter the code"); return; }
    setVerifying(true);
    try {
      await api.post("/auth/verify-phone-otp", { otp: manualCode.trim() });
      clearInterval(pollTimer.current);
      setPolling(false);
      setWhatsappLink("");
      await refreshUser();
    } catch (err) {
      setPhoneError(err.response?.data?.message || "Incorrect or expired code");
    } finally {
      setVerifying(false);
    }
  }

  const phoneChannelsAvailable = caps ? [caps.sms && "sms", caps.whatsapp && "whatsapp"].filter(Boolean) : [];
  const phoneVerificationLive = phoneChannelsAvailable.length > 0;

  return (
    <div className="space-y-4">
      <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest">Verification</p>

      {/* Email */}
      <div className="bg-mall-800 rounded-xl p-4 border border-cream/8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              user?.isEmailVerified ? "bg-emerald-500/15" : "bg-cream/8"
            }`}>
              <Mail size={16} className={user?.isEmailVerified ? "text-emerald-400" : "text-cream/40"} />
            </div>
            <div className="min-w-0">
              <p className="text-cream text-sm font-medium">Email</p>
              <p className="text-cream/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          {user?.isEmailVerified ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium shrink-0">
              <CheckCircle size={13} /> Verified
            </span>
          ) : caps && !caps.email ? (
            <span className="flex items-center gap-1 text-cream/30 text-xs shrink-0">
              <Clock size={13} /> Coming soon
            </span>
          ) : (
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="shrink-0 text-mall-accent text-xs font-medium hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend link"}
            </button>
          )}
        </div>
        {resendMsg && <p className="text-cream/40 text-xs mt-3">{resendMsg}</p>}
      </div>

      {/* Phone */}
      <div className="bg-mall-800 rounded-xl p-4 border border-cream/8">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            user?.isPhoneVerified ? "bg-emerald-500/15" : "bg-cream/8"
          }`}>
            <Phone size={16} className={user?.isPhoneVerified ? "text-emerald-400" : "text-cream/40"} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-cream text-sm font-medium">Phone</p>
            <p className="text-cream/40 text-xs">{user?.phone || "Not added yet"}</p>
          </div>
          {user?.isPhoneVerified && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium shrink-0">
              <CheckCircle size={13} /> Verified
            </span>
          )}
        </div>

        {!caps ? null : !phoneVerificationLive ? (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream/8 text-cream/30 text-xs">
            <Clock size={13} className="shrink-0" />
            Phone verification is coming soon — not available yet.
          </div>
        ) : user?.isPhoneVerified ? null : (
          <div className="mt-3 pt-3 border-t border-cream/8">
            {/* Channel picker — only shown if more than one channel is live */}
            {phoneChannelsAvailable.length > 1 && !otpSent && !whatsappLink && (
              <div className="flex gap-2 mb-3">
                {caps.sms && (
                  <button
                    type="button"
                    onClick={() => setChannel("sms")}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border transition ${
                      channel === "sms" ? "border-mall-accent text-mall-accent bg-mall-accent/10" : "border-cream/15 text-cream/40"
                    }`}
                  >
                    <MessageCircle size={12} /> SMS
                  </button>
                )}
                {caps.whatsapp && (
                  <button
                    type="button"
                    onClick={() => setChannel("whatsapp")}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border transition ${
                      channel === "whatsapp" ? "border-mall-accent text-mall-accent bg-mall-accent/10" : "border-cream/15 text-cream/40"
                    }`}
                  >
                    <ShieldCheck size={12} /> WhatsApp
                  </button>
                )}
              </div>
            )}

            {/* ── SMS flow ─────────────────────────────────────────── */}
            {channel === "sms" && (
              !otpSent ? (
                <form onSubmit={handleSendOtp} className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 07XXXXXXXX"
                    className="flex-1 bg-mall-700 rounded-lg px-3 py-2.5 text-cream placeholder-cream/25 text-sm outline-none focus:ring-1 focus:ring-mall-accent transition"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-3.5 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50 shrink-0"
                  >
                    <Send size={12} /> {sending ? "Sending..." : "Send code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex gap-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="flex-1 bg-mall-700 rounded-lg px-3 py-2.5 text-cream placeholder-cream/25 text-sm outline-none focus:ring-1 focus:ring-mall-accent transition"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="bg-mall-accent text-mall-900 font-semibold text-xs px-3.5 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50 shrink-0"
                  >
                    {verifying ? "Verifying..." : "Verify"}
                  </button>
                </form>
              )
            )}

            {/* ── WhatsApp loop flow ───────────────────────────────── */}
            {channel === "whatsapp" && (
              !whatsappLink ? (
                <form onSubmit={handleSendOtp} className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 07XXXXXXXX"
                    className="flex-1 bg-mall-700 rounded-lg px-3 py-2.5 text-cream placeholder-cream/25 text-sm outline-none focus:ring-1 focus:ring-mall-accent transition"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-3.5 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50 shrink-0"
                  >
                    <Send size={12} /> {sending ? "Preparing..." : "Continue"}
                  </button>
                </form>
              ) : (
                <div>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366]/15 text-[#25D366] font-semibold py-3 rounded-xl hover:bg-[#25D366] hover:text-white transition text-sm mb-2.5"
                  >
                    Open WhatsApp & Tap Send <ExternalLink size={13} />
                  </a>
                  <p className="text-cream/30 text-[11px] text-center mb-3">
                    Your code: <span className="text-cream/60 font-mono-tag">{whatsappCode}</span>
                  </p>
                  {polling && (
                    <div className="flex items-center justify-center gap-2 text-cream/40 text-xs mb-3">
                      <div className="w-3 h-3 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
                      Waiting for confirmation...
                    </div>
                  )}
                  <div className="pt-3 border-t border-cream/8">
                    <p className="text-cream/25 text-[10px] mb-2">Not detected automatically? Enter the code manually:</p>
                    <form onSubmit={handleManualVerify} className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="6-digit code"
                        className="flex-1 bg-mall-700 rounded-lg px-3 py-2 text-cream placeholder-cream/25 text-sm outline-none focus:ring-1 focus:ring-mall-accent transition"
                      />
                      <button
                        type="submit"
                        disabled={verifying}
                        className="bg-cream/10 text-cream/70 font-medium text-xs px-3.5 rounded-lg hover:bg-cream/15 transition disabled:opacity-50 shrink-0"
                      >
                        {verifying ? "..." : "Verify"}
                      </button>
                    </form>
                  </div>
                </div>
              )
            )}

            {phoneMsg && <p className="text-cream/40 text-xs mt-2">{phoneMsg}</p>}
            {phoneError && <p className="text-red-400 text-xs mt-2">{phoneError}</p>}
            {otpSent && channel === "sms" && (
              <button
                type="button"
                onClick={() => { setOtpSent(false); setPhoneMsg(""); }}
                className="text-cream/30 hover:text-cream/50 text-xs mt-2 underline"
              >
                Use a different number
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}