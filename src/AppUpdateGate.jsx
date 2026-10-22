import { useEffect, useState } from 'react';
import { ArrowDownToLine, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import './app-update-gate.css';

const APK_URL = 'https://github.com/rannarmenu/Rannarmenu/releases/download/android-latest/Rannar-Menu.apk';
const UPDATE_INFO_URL = `${import.meta.env.BASE_URL || '/'}app-update.json`;

function getAndroidWebViewVersion() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/i.test(ua)
    && (/(?:;\s*wv\)|\bwv\b)/i.test(ua) || /Version\/4\.0.*Chrome/i.test(ua));
  if (!isAndroidWebView) return null;

  const match = ua.match(/RannarMenuApp\/[\d.]+\s+code\/(\d+)/i);
  return match ? Math.max(0, Number(match[1]) || 0) : 0;
}

export default function AppUpdateGate() {
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);
  const installedVersionCode = getAndroidWebViewVersion();

  useEffect(() => {
    if (installedVersionCode === null) return undefined;
    let active = true;
    const controller = new AbortController();
    setChecking(true);

    fetch(`${UPDATE_INFO_URL}?check=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) throw new Error('Update service unavailable');
        return response.json();
      })
      .then((info) => {
        if (!active) return;
        const minimumCode = Number(info.minimumVersionCode);
        if (Number.isFinite(minimumCode) && minimumCode > installedVersionCode) {
          setUpdate({
            version: String(info.latestVersion || 'নতুন সংস্করণ'),
            message: String(info.message || 'অ্যাপ ব্যবহার চালিয়ে যেতে নতুন সংস্করণ ইনস্টল করুন।'),
          });
        }
      })
      .catch(() => {
        // Do not lock out users when the update endpoint itself cannot be reached.
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [installedVersionCode]);

  if (!update) return null;

  return (
    <div className="app-update-gate" role="dialog" aria-modal="true" aria-labelledby="app-update-title">
      <section className="app-update-card">
        <div className="app-update-brand">
          <img src={`${import.meta.env.BASE_URL || '/'}rannar-menu-logo.svg`} alt="" width="64" height="64" />
          <div>
            <span>RANNAR MENU</span>
            <strong>অ্যাপ আপডেট</strong>
          </div>
          <span className="app-update-secure"><ShieldCheck size={17} aria-hidden="true" /></span>
        </div>

        <div className="app-update-icon" aria-hidden="true"><Smartphone size={27} /></div>
        <p className="app-update-eyebrow">নতুন সংস্করণ পাওয়া গেছে</p>
        <h1 id="app-update-title">অ্যাপ আপডেট করুন</h1>
        <p className="app-update-message">{update.message}</p>

        <div className="app-update-version">
          <span>সর্বশেষ সংস্করণ</span>
          <strong>{update.version}</strong>
        </div>

        <a className="app-update-download" href={APK_URL}>
          <ArrowDownToLine size={19} aria-hidden="true" />
          নতুন অ্যাপ ডাউনলোড করুন
        </a>
        <p className="app-update-instructions">
          ডাউনলোড শেষ হলে ফাইলটি খুলে Android-এর <strong>Update / Install</strong> নির্দেশনা অনুসরণ করুন।
        </p>
        <p className="app-update-note">অ্যাপ আপডেট না করা পর্যন্ত এই স্ক্রিন থেকে রেসিপি ব্যবহার করা যাবে না। ইনস্টল করতে ফোনের অনুমতি চাইতে পারে।</p>
        <p className="app-update-signing-note">এটি সরাসরি ডাউনলোডের টেস্ট APK। Android যদি পুরোনো অ্যাপের ওপর ইনস্টল নিতে না চায়, আগে পুরোনো অ্যাপ আনইনস্টল করতে হতে পারে। এতে অ্যাপের স্থানীয়ভাবে রাখা তথ্য মুছে যেতে পারে।</p>

        <button className="app-update-recheck" type="button" onClick={() => window.location.reload()}>
          <RefreshCw size={15} aria-hidden="true" />
          আপডেট ইনস্টল করেছি — আবার চেক করুন
        </button>
        {checking && <span className="app-update-checking" role="status">আপডেট যাচাই হচ্ছে…</span>}
      </section>
    </div>
  );
}
