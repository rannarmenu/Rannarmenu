import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Camera, CheckCircle2, ChefHat, Clock3, Eye, EyeOff,
  KeyRound, LoaderCircle, LogOut, Mail, Phone, ShieldCheck, UserRound, Utensils, X
} from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import './account.css';

function authReturnUrl() {
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.set('account', '1');
  return url.toString();
}

function normalizeBangladeshPhone(value) {
  const raw = String(value || '').trim().replace(/[()\s-]/g, '');
  if (/^\+\d{8,15}$/.test(raw)) return raw;
  if (/^8801\d{9}$/.test(raw)) return '+' + raw;
  if (/^01\d{9}$/.test(raw)) return '+88' + raw;
  return '';
}

function formatDate(value) {
  if (!value) return 'তথ্য পাওয়া যায়নি';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'তথ্য পাওয়া যায়নি';
  return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function providerLabel(user) {
  const provider = user?.app_metadata?.provider || user?.identities?.[0]?.provider;
  return ({ google: 'Google', email: 'ইমেইল', phone: 'মোবাইল নম্বর' })[provider] || 'নিরাপদ অ্যাকাউন্ট';
}

function initials(name) {
  return String(name || 'RM').trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0] || '').join('').toUpperCase() || 'RM';
}

function GoogleMark() {
  return <span className="account-google-mark" aria-hidden="true">G</span>;
}

export default function AccountPage({
  user = null,
  profile = null,
  isVerified = false,
  authReady = false,
  notice = '',
  onProfileUpdated = () => {},
  onSignOut = () => {},
  recoveryMode = false,
  onPasswordResetComplete = () => {}
}) {
  const [mode, setMode] = useState('login');
  const [method, setMethod] = useState('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editName, setEditName] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    setFullName(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  }, [profile?.full_name, user?.id, user?.user_metadata?.full_name, user?.user_metadata?.name]);

  useEffect(() => {
    if (notice) setFeedback({ type: 'info', text: notice });
  }, [notice]);

  async function submitEmail(event) {
    event.preventDefault();
    if (!supabaseConfigured || !supabase) {
      setFeedback({ type: 'error', text: 'অ্যাকাউন্ট সার্ভার সংযুক্ত নেই। সাইটের Supabase environment configuration পরীক্ষা করতে হবে।' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;
    setBusy(true);
    setFeedback(null);
    try {
      if (mode === 'signup') {
        const name = fullName.trim();
        if (name.length < 2 || name.length > 80) {
          setFeedback({ type: 'error', text: 'আপনার নাম ২–৮০ অক্ষরের মধ্যে লিখুন।' });
          return;
        }
        if (password.length < 10) {
          setFeedback({ type: 'error', text: 'নিরাপত্তার জন্য কমপক্ষে ১০ অক্ষরের পাসওয়ার্ড দিন।' });
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: name }, emailRedirectTo: authReturnUrl() }
        });
        if (error) throw error;
        if (data?.session && !data?.user?.email_confirmed_at) {
          await supabase.auth.signOut();
        }
        setFeedback({
          type: 'success',
          text: 'রেজিস্ট্রেশনের অনুরোধ গ্রহণ করা হয়েছে। আপনার ইমেইলে পাঠানো verification link খুলে অ্যাকাউন্ট নিশ্চিত করুন; নিশ্চিত না হওয়া পর্যন্ত রেসিপির উপকরণ ও রান্নার ধাপ খোলা যাবে না।'
        });
        setPassword('');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        if (!data?.user?.email_confirmed_at) {
          await supabase.auth.signOut();
          setFeedback({ type: 'error', text: 'এই ইমেইল এখনো যাচাই করা হয়নি। আগে ইমেইলের verification link খুলুন, তারপর লগইন করুন।' });
          return;
        }
        setFeedback({ type: 'success', text: 'লগইন সফল হয়েছে। আপনার প্রোফাইল লোড হচ্ছে…' });
        setPassword('');
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'অনুরোধ সম্পন্ন হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!supabase || !email.trim()) {
      setFeedback({ type: 'error', text: 'যে ইমেইল দিয়ে অ্যাকাউন্ট খুলেছেন, সেটি আগে লিখুন।' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: authReturnUrl() }
      });
      if (error) throw error;
      setFeedback({ type: 'success', text: 'যাচাইকরণ ইমেইল পাঠানোর অনুরোধ করা হয়েছে। Inbox ও Spam ফোল্ডার দেখুন।' });
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'যাচাইকরণ ইমেইল পাঠানো যায়নি। কিছুক্ষণ পরে চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  }

  async function completePasswordReset(event) {
    event.preventDefault();
    if (!supabase) {
      setFeedback({ type: 'error', text: 'অ্যাকাউন্ট সার্ভার সংযুক্ত নেই।' });
      return;
    }
    if (newPassword.length < 10) {
      setFeedback({ type: 'error', text: 'নতুন পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFeedback({ type: 'error', text: 'দুটি পাসওয়ার্ড মেলেনি। আবার যাচাই করুন।' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmNewPassword('');
      setFeedback({ type: 'success', text: 'পাসওয়ার্ড পরিবর্তন হয়েছে। এখন আপনার অ্যাকাউন্ট নিরাপদে ব্যবহার করতে পারবেন।' });
      onPasswordResetComplete();
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি। নতুন reset link নিয়ে আবার চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!supabase || !email.trim()) {
      setFeedback({ type: 'error', text: 'পাসওয়ার্ড রিসেট লিংক পেতে আগে আপনার ইমেইল লিখুন।' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: authReturnUrl() });
      if (error) throw error;
      setFeedback({ type: 'success', text: 'ইমেইলটি থাকলে পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হবে। Inbox ও Spam দেখুন।' });
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'রিসেট ইমেইল পাঠানো যায়নি।' });
    } finally {
      setBusy(false);
    }
  }

  async function sendPhoneCode(event) {
    event.preventDefault();
    if (!supabase) {
      setFeedback({ type: 'error', text: 'অ্যাকাউন্ট সার্ভার সংযুক্ত নেই।' });
      return;
    }
    const normalized = normalizeBangladeshPhone(phoneNumber);
    if (!normalized) {
      setFeedback({ type: 'error', text: 'বাংলাদেশি নম্বর 01XXXXXXXXX বা আন্তর্জাতিক নম্বর +8801XXXXXXXXX আকারে লিখুন।' });
      return;
    }
    if (mode === 'signup' && fullName.trim().length < 2) {
      setFeedback({ type: 'error', text: 'আগে আপনার নাম লিখুন।' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: {
          channel: 'sms',
          shouldCreateUser: mode === 'signup',
          data: mode === 'signup' ? { full_name: fullName.trim() } : undefined
        }
      });
      if (error) throw error;
      setPhoneNumber(normalized);
      setOtpSent(true);
      setFeedback({ type: 'success', text: 'যদি SMS authentication provider সক্রিয় থাকে, ৬ সংখ্যার যাচাইকরণ কোড পাঠানো হয়েছে।' });
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'SMS কোড পাঠানো যায়নি। Supabase-এ phone auth ও SMS provider configuration যাচাই করুন।' });
    } finally {
      setBusy(false);
    }
  }

  async function verifyPhoneCode(event) {
    event.preventDefault();
    if (!supabase || otp.trim().length < 6) return;
    setBusy(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizeBangladeshPhone(phoneNumber),
        token: otp.trim(),
        type: 'sms'
      });
      if (error) throw error;
      if (!data?.user?.phone_confirmed_at) {
        await supabase.auth.signOut();
        setFeedback({ type: 'error', text: 'নম্বর যাচাই সম্পন্ন হয়নি। নতুন কোড নিয়ে আবার চেষ্টা করুন।' });
        return;
      }
      setFeedback({ type: 'success', text: 'ফোন যাচাই সফল হয়েছে। প্রোফাইল লোড হচ্ছে…' });
      setOtp('');
      setOtpSent(false);
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।' });
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    if (!supabase) {
      setFeedback({ type: 'error', text: 'অ্যাকাউন্ট সার্ভার সংযুক্ত নেই।' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authReturnUrl(), queryParams: { access_type: 'offline', prompt: 'select_account' } }
      });
      if (error) throw error;
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'Google sign-in চালু করা যায়নি। Supabase ও Google OAuth credentials পরীক্ষা করুন।' });
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!supabase || !user || !isVerified) return;
    const cleanName = fullName.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setFeedback({ type: 'error', text: 'নাম ২–৮০ অক্ষরের মধ্যে হতে হবে।' });
      return;
    }
    setSavingProfile(true);
    setFeedback(null);
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: cleanName } });
      if (authError) throw authError;
      const { data, error } = await supabase
        .from('customer_profiles')
        .update({ full_name: cleanName })
        .eq('user_id', user.id)
        .select('user_id,full_name,avatar_path,created_at,updated_at')
        .single();
      if (error) throw error;
      onProfileUpdated(data);
      setEditName(false);
      setFeedback({ type: 'success', text: 'প্রোফাইলের নাম সংরক্ষণ করা হয়েছে।' });
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !supabase || !user || !isVerified) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback({ type: 'error', text: 'ছবি JPG, PNG অথবা WebP হতে হবে।' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'ছবির আকার সর্বোচ্চ ৩ MB হতে পারবে।' });
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[file.type];
      const path = user.id + '/' + Date.now() + '.' + extension;
      const { error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: savedProfile, error: profileError } = await supabase
        .from('customer_profiles')
        .update({ avatar_path: path })
        .eq('user_id', user.id)
        .select('user_id,full_name,avatar_path,created_at,updated_at')
        .single();
      if (profileError) {
        await supabase.storage.from('customer-avatars').remove([path]);
        throw profileError;
      }
      const { data: signed, error: signedError } = await supabase.storage
        .from('customer-avatars')
        .createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      onProfileUpdated({ ...savedProfile, avatar_url: signed.signedUrl });
      setFeedback({ type: 'success', text: 'প্রোফাইলের ছবি আপলোড হয়েছে।' });
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'ছবি আপলোড করা যায়নি। Storage bucket ও permissions যাচাই করুন।' });
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onSignOut();
      setFeedback(null);
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'লগআউট সম্পন্ন হয়নি। আবার চেষ্টা করুন।' });
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) {
    return <section className="account-page-wrap wrap"><div className="account-loading"><LoaderCircle className="account-spin" size={25}/><span>অ্যাকাউন্টের নিরাপদ সংযোগ যাচাই হচ্ছে…</span></div></section>;
  }

  if (recoveryMode) {
    return (
      <section className="account-page-wrap wrap">
        <div className="account-page-heading"><span className="account-eyebrow"><KeyRound size={15}/> নিরাপদ পাসওয়ার্ড পরিবর্তন</span><h1>নতুন পাসওয়ার্ড সেট করুন</h1><p>ইমেইলে পাওয়া password-reset link দিয়ে এই পেজে এসেছেন। একটি নতুন, শক্তিশালী পাসওয়ার্ড বেছে নিন।</p></div>
        <form className="account-auth-card account-verification-card account-auth-form" onSubmit={completePasswordReset}>
          <label className="account-field"><span>নতুন পাসওয়ার্ড</span><input type="password" value={newPassword} onChange={event=>setNewPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} placeholder="কমপক্ষে ১০ অক্ষর" required/></label>
          <label className="account-field"><span>নতুন পাসওয়ার্ড আবার লিখুন</span><input type="password" value={confirmNewPassword} onChange={event=>setConfirmNewPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} placeholder="একই পাসওয়ার্ড আবার লিখুন" required/></label>
          {feedback && <div className={'account-feedback ' + feedback.type} role="status"><ShieldCheck size={17}/><span>{feedback.text}</span></div>}
          <button type="submit" className="account-primary-button account-full-button" disabled={busy || newPassword.length < 10 || newPassword !== confirmNewPassword}>{busy ? <LoaderCircle className="account-spin" size={17}/> : <CheckCircle2 size={17}/>} {busy ? 'পাসওয়ার্ড পরিবর্তন হচ্ছে…' : 'নতুন পাসওয়ার্ড সংরক্ষণ করুন'}</button>
        </form>
      </section>
    );
  }

  if (user && isVerified) {
    const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'রান্নাপ্রেমী';
    const avatar = profile?.avatar_url || '';
    const verifiedContact = user.email_confirmed_at ? 'ইমেইল যাচাই করা' : user.phone_confirmed_at ? 'মোবাইল নম্বর যাচাই করা' : 'যাচাইকৃত Google account';
    return (
      <section className="account-page-wrap wrap">
        <div className="account-page-heading"><span className="account-eyebrow"><UserRound size={15}/> আপনার ব্যক্তিগত জায়গা</span><h1>আমার প্রোফাইল</h1><p>আপনার তথ্য, পছন্দের রেসিপি ও অ্যাকাউন্ট এখানে নিরাপদে থাকবে।</p></div>
        <div className="account-profile-card">
          <div className="account-cover" aria-hidden="true"><span/><span/><span/></div>
          <div className="account-profile-top">
            <div className="account-avatar-wrap">
              {avatar ? <img src={avatar} alt={displayName + ' প্রোফাইল ছবি'} className="account-avatar"/> : <div className="account-avatar account-avatar-fallback" aria-label={displayName + ' initials'}>{initials(displayName)}</div>}
              <button type="button" className="account-camera-button" onClick={() => fileInput.current?.click()} disabled={uploading} aria-label="প্রোফাইল ছবি পরিবর্তন"><Camera size={16}/></button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} hidden/>
            </div>
            <div className="account-person-copy"><span className="account-status"><BadgeCheck size={15}/> Verified account</span><h2>{displayName}</h2><p>{user.email || user.phone || 'সাইন-ইন অ্যাকাউন্ট'}</p><span className="account-join-date"><Clock3 size={14}/> যোগ দিয়েছেন {formatDate(user.created_at)}</span></div>
            <button type="button" className="account-signout-button" onClick={signOut} disabled={busy}><LogOut size={16}/> লগআউট</button>
          </div>
          <div className="account-profile-content">
            {feedback && <div className={'account-feedback ' + feedback.type} role="status">{feedback.type === 'success' ? <CheckCircle2 size={17}/> : <ShieldCheck size={17}/>}<span>{feedback.text}</span><button type="button" onClick={() => setFeedback(null)} aria-label="বার্তা বন্ধ করুন"><X size={15}/></button></div>}
            <div className="account-section-title"><div><span className="account-section-kicker">ACCOUNT DETAILS</span><h3>ব্যক্তিগত তথ্য</h3></div><span className="account-private-note"><ShieldCheck size={15}/> শুধু আপনিই দেখতে পারবেন</span></div>
            <form className="account-details-form" onSubmit={saveProfile}>
              <label className="account-field"><span>আপনার নাম</span><div className="account-input-with-action"><input value={fullName} onChange={event => setFullName(event.target.value)} readOnly={!editName} minLength={2} maxLength={80} autoComplete="name" placeholder="আপনার নাম" required/><button type="button" className="account-edit-field" onClick={() => { setEditName(value => !value); setFeedback(null); }}>{editName ? 'সম্পাদনা বন্ধ' : 'পরিবর্তন'}</button></div></label>
              <label className="account-field"><span>ইমেইল ঠিকানা</span><div className="account-readonly-value"><Mail size={17}/><span>{user.email || 'ইমেইল যুক্ত করা হয়নি'}</span>{user.email_confirmed_at && <BadgeCheck className="account-inline-verified" size={17}/>}</div></label>
              <label className="account-field"><span>মোবাইল নম্বর</span><div className="account-readonly-value"><Phone size={17}/><span>{user.phone || 'মোবাইল নম্বর যুক্ত করা হয়নি'}</span>{user.phone_confirmed_at && <BadgeCheck className="account-inline-verified" size={17}/>}</div></label>
              <label className="account-field"><span>লগইন পদ্ধতি</span><div className="account-readonly-value"><KeyRound size={17}/><span>{providerLabel(user)}</span></div></label>
              <label className="account-field"><span>যাচাইকরণের অবস্থা</span><div className="account-readonly-value"><ShieldCheck size={17}/><span>{verifiedContact}</span><span className="account-verified-pill">সক্রিয়</span></div></label>
              <div className="account-form-actions">{editName && <button type="submit" className="account-primary-button" disabled={savingProfile}>{savingProfile ? <LoaderCircle className="account-spin" size={17}/> : <CheckCircle2 size={17}/>} নাম সংরক্ষণ করুন</button>}<button type="button" className="account-secondary-button" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle className="account-spin" size={17}/> : <Camera size={17}/>} {uploading ? 'ছবি আপলোড হচ্ছে…' : 'প্রোফাইল ছবি বদলান'}</button></div>
            </form>
          </div>
        </div>
        <div className="account-security-note"><ShieldCheck size={20}/><p><strong>আপনার অ্যাকাউন্ট সুরক্ষিত</strong><span>রেসিপির উপকরণ ও ধাপ দেখতে যাচাইকৃত অ্যাকাউন্ট প্রয়োজন। অ্যাকাউন্টের তথ্য database-এ সংরক্ষিত থাকে; শুধু browser storage-এর ওপর নির্ভর করে না।</span></p></div>
      </section>
    );
  }

  if (user && !isVerified) {
    return (
      <section className="account-page-wrap wrap">
        <div className="account-page-heading"><span className="account-eyebrow"><ShieldCheck size={15}/> নিরাপত্তা যাচাই</span><h1>অ্যাকাউন্ট যাচাই করুন</h1><p>ইমেইল বা ফোন নম্বর যাচাই না হওয়া পর্যন্ত রেসিপির পূর্ণ বিবরণ বন্ধ থাকবে।</p></div>
        <div className="account-auth-card account-verification-card">
          <div className="account-auth-emblem"><ShieldCheck size={29}/></div><h2>যাচাইকরণ এখনো সম্পূর্ণ হয়নি</h2><p>আপনার অ্যাকাউন্টে প্রবেশাধিকার সীমিত আছে। ইমেইলটি যাচাই করে আবার লগইন করুন।</p>
          {feedback && <div className={'account-feedback ' + feedback.type} role="status"><ShieldCheck size={17}/><span>{feedback.text}</span></div>}
          <label className="account-field"><span>আপনার ইমেইল</span><input type="email" value={email || user.email || ''} onChange={event=>setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email"/></label>
          <button type="button" className="account-primary-button account-full-button" onClick={resendVerification} disabled={busy}><Mail size={17}/> যাচাইকরণ ইমেইল আবার পাঠান</button>
          <button type="button" className="account-text-button" onClick={signOut} disabled={busy}><LogOut size={16}/> লগআউট করে পুনরায় চেষ্টা করুন</button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-page-wrap wrap">
      <div className="account-page-heading"><span className="account-eyebrow"><ChefHat size={15}/> Rannar Menu account</span><h1>{mode === 'signup' ? 'আপনার অ্যাকাউন্ট খুলুন' : 'আপনার রান্নার খাতা খুলুন'}</h1><p>রেসিপির সম্পূর্ণ উপকরণ, রান্নার ধাপ ও ব্যক্তিগত সংরক্ষণ পেতে আগে একটি যাচাইকৃত অ্যাকাউন্টে প্রবেশ করুন।</p></div>
      <div className="account-auth-layout">
        <aside className="account-benefits-panel">
          <div className="account-auth-emblem"><Utensils size={28}/></div><span className="account-section-kicker">YOUR KITCHEN, YOUR ACCOUNT</span><h2>আপনার পছন্দের রান্না, এক জায়গায়</h2>
          <div className="account-benefit-list"><div><CheckCircle2 size={18}/><span><strong>যাচাইকৃত প্রবেশাধিকার</strong><small>ইমেইল, ফোন OTP বা Google দিয়ে</small></span></div><div><CheckCircle2 size={18}/><span><strong>স্থায়ী প্রোফাইল</strong><small>নাম, ছবি ও অ্যাকাউন্ট তথ্য সংরক্ষিত</small></span></div><div><CheckCircle2 size={18}/><span><strong>নিজস্ব রান্নার সংগ্রহ</strong><small>একই অ্যাকাউন্টে saved recipes</small></span></div></div>
          <p className="account-privacy-copy"><ShieldCheck size={15}/> আমরা কখনো আপনার পাসওয়ার্ড সংরক্ষণ বা প্রকাশ করি না; নিরাপদ authentication service সেটি পরিচালনা করে।</p>
        </aside>
        <div className="account-auth-card">
          <div className="account-mode-switch" role="tablist" aria-label="অ্যাকাউন্টের কাজ"><button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setFeedback(null); setOtpSent(false); }}>লগইন</button><button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => { setMode('signup'); setFeedback(null); setOtpSent(false); }}>নতুন অ্যাকাউন্ট</button></div>
          <button type="button" className="account-google-button" onClick={continueWithGoogle} disabled={busy}><GoogleMark/> Google দিয়ে {mode === 'signup' ? 'অ্যাকাউন্ট খুলুন' : 'চালিয়ে যান'} <ArrowRight size={17}/></button>
          <div className="account-or-divider"><span>অথবা</span></div>
          <div className="account-method-switch" role="tablist" aria-label="লগইন পদ্ধতি"><button type="button" role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'is-active' : ''} onClick={() => { setMethod('email'); setFeedback(null); }}> <Mail size={16}/> ইমেইল</button><button type="button" role="tab" aria-selected={method === 'phone'} className={method === 'phone' ? 'is-active' : ''} onClick={() => { setMethod('phone'); setFeedback(null); }}> <Phone size={16}/> ফোন OTP</button></div>
          {method === 'email' ? (
            <form className="account-auth-form" onSubmit={submitEmail}>
              {mode === 'signup' && <label className="account-field"><span>আপনার পুরো নাম</span><input type="text" value={fullName} onChange={event=>setFullName(event.target.value)} autoComplete="name" maxLength={80} minLength={2} placeholder="যেমন: আয়েশা রহমান" required/></label>}
              <label className="account-field"><span>ইমেইল ঠিকানা</span><input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" inputMode="email" maxLength={254} placeholder="name@example.com" required/></label>
              <label className="account-field"><span>পাসওয়ার্ড</span><div className="account-password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event=>setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 10 : 1} maxLength={128} placeholder={mode === 'signup' ? 'কমপক্ষে ১০ অক্ষর' : 'আপনার পাসওয়ার্ড'} required/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
              {feedback && <div className={'account-feedback ' + feedback.type} role="status"><ShieldCheck size={17}/><span>{feedback.text}</span><button type="button" onClick={()=>setFeedback(null)} aria-label="বার্তা বন্ধ করুন"><X size={15}/></button></div>}
              <button type="submit" className="account-primary-button account-full-button" disabled={busy}>{busy ? <LoaderCircle className="account-spin" size={18}/> : <ArrowRight size={17}/>} {busy ? 'অপেক্ষা করুন…' : mode === 'signup' ? 'যাচাইকরণ ইমেইল পাঠান' : 'নিরাপদে লগইন করুন'}</button>
              {mode === 'login' && <div className="account-auth-links"><button type="button" onClick={resetPassword} disabled={busy}>পাসওয়ার্ড ভুলে গেছেন?</button><button type="button" onClick={resendVerification} disabled={busy}>ইমেইল যাচাই হয়নি?</button></div>}
            </form>
          ) : (
            <form className="account-auth-form" onSubmit={otpSent ? verifyPhoneCode : sendPhoneCode}>
              {mode === 'signup' && <label className="account-field"><span>আপনার পুরো নাম</span><input type="text" value={fullName} onChange={event=>setFullName(event.target.value)} autoComplete="name" maxLength={80} minLength={2} placeholder="যেমন: আয়েশা রহমান" required/></label>}
              <label className="account-field"><span>মোবাইল নম্বর</span><input type="tel" value={phoneNumber} onChange={event=>{setPhoneNumber(event.target.value);setOtpSent(false)}} autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX বা +8801XXXXXXXXX" required/><small>SMS OTP দিয়ে নম্বর যাচাই করা হবে।</small></label>
              {otpSent && <label className="account-field"><span>৬ সংখ্যার OTP</span><input type="text" value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} placeholder="••••••" required/></label>}
              {feedback && <div className={'account-feedback ' + feedback.type} role="status"><ShieldCheck size={17}/><span>{feedback.text}</span><button type="button" onClick={()=>setFeedback(null)} aria-label="বার্তা বন্ধ করুন"><X size={15}/></button></div>}
              <button type="submit" className="account-primary-button account-full-button" disabled={busy || (otpSent && otp.length !== 6)}>{busy ? <LoaderCircle className="account-spin" size={18}/> : otpSent ? <BadgeCheck size={17}/> : <Phone size={17}/>} {busy ? 'অপেক্ষা করুন…' : otpSent ? 'নম্বর যাচাই করুন' : 'SMS যাচাইকরণ কোড পাঠান'}</button>
              {otpSent && <button type="button" className="account-text-button" onClick={()=>{setOtpSent(false);setOtp('');setFeedback(null)}}>নম্বর পরিবর্তন করুন</button>}
            </form>
          )}
          <p className="account-auth-footnote"><ShieldCheck size={14}/> ভেরিফিকেশন ছাড়া রেসিপির পূর্ণ বিবরণ দেখানো হবে না। Google ও SMS sign-in চালাতে সংশ্লিষ্ট provider configuration সক্রিয় থাকতে হবে।</p>
        </div>
      </div>
    </section>
  );
}
