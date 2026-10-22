import React from 'react';
import { ArrowUpRight, BookOpen, Bookmark, ChefHat, Globe2, Heart, Search, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import './about-page.css';

const mediaBrands = [
  {
    name: 'Somoy TV',
    bangla: 'সময় টিভি',
    role: '২৪ ঘণ্টার সংবাদ ও চলতি ঘটনা',
    site: 'https://www.somoynews.tv/',
    logo: 'https://thefe-bd.sgp1.cdn.digitaloceanspaces.com/posts/53385/somoy.jpg',
    source: 'https://www.somoynews.tv/',
  },
  {
    name: 'NTV',
    bangla: 'এনটিভি',
    role: 'সংবাদ, অনুষ্ঠান ও বিনোদন',
    site: 'https://www.ntvbd.com/',
    logo: 'https://cdn.jvectors.com/upload/photos/2024/03/PPOeXLNVad5v2ZG6avan_05_df80842812ab480999f0b657f73bc5d1_jvectors.webp?updated=1743062758',
    source: 'https://www.ntvbd.com/',
  },
  {
    name: 'Boishakhi TV',
    bangla: 'বৈশাখী টিভি',
    role: 'বাংলা সংবাদ ও টেলিভিশন অনুষ্ঠান',
    site: 'https://boishakhi.tv/',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Boishakhi_Tv_Logo.png',
    source: 'https://commons.wikimedia.org/wiki/File:Boishakhi_Tv_Logo.png',
  },
  {
    name: 'Jamuna TV',
    bangla: 'যমুনা টিভি',
    role: 'জাতীয় ও আন্তর্জাতিক সংবাদ',
    site: 'https://jamuna.tv/',
    logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jamuna_TV_logo.svg',
    source: 'https://commons.wikimedia.org/wiki/File:Jamuna_TV_logo.svg',
  },
  {
    name: 'Maasranga Television',
    bangla: 'মাছরাঙা টেলিভিশন',
    role: 'সংবাদ, খেলাধুলা ও বিনোদন',
    site: 'https://maasranga.tv/',
    logo: 'https://beyondtechbd.com/wp-content/uploads/2023/04/16.maasranga.png',
    source: 'https://beyondtechbd.com/case-study-maasranga-television-mobile-app-and-content-management-system-development/',
  },
];

const siteFeatures = [
  { Icon: BookOpen, title: 'রেসিপি সংগ্রহ', text: 'দেশি রান্না থেকে প্রতিদিনের সহজ পদ—ধাপে ধাপে রান্নার নির্দেশনা এক জায়গায়।' },
  { Icon: Search, title: 'সহজে খুঁজুন', text: 'রেসিপির নাম, উপকরণ বা ক্যাটাগরি ধরে পছন্দের খাবার খুঁজে নিন।' },
  { Icon: Bookmark, title: 'নিজের রান্নার খাতা', text: 'পছন্দের রেসিপি সংরক্ষণ করে পরে দ্রুত আবার দেখে নিতে পারবেন।' },
  { Icon: ShieldCheck, title: 'বিশ্বাসযোগ্য উপস্থাপনা', text: 'রেসিপির তথ্য, উপকরণ ও ছবির মিলকে গুরুত্ব দিয়ে পরিষ্কারভাবে কনটেন্ট সাজানোর লক্ষ্য।' },
];

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="about-section-heading">
      <span className="about-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <span className="about-eyebrow"><Sparkles size={14} aria-hidden="true" /> RANNAR MENU · আমাদের পরিচয়</span>
          <h1 id="about-title">রান্নার আনন্দ,<br /><em>সবার জন্য।</em></h1>
          <p>Rannar Menu হলো ঘরোয়া রান্নার অনুপ্রেরণা খুঁজে নেওয়ার একটি বাংলা রেসিপি প্ল্যাটফর্ম। পরিচিত উপকরণ, সহজ নির্দেশনা আর নিজের পছন্দের রেসিপি গুছিয়ে রাখার সুবিধা—সবকিছু সহজভাবে উপস্থাপন করাই আমাদের লক্ষ্য।</p>
          <div className="about-hero-actions">
            <a className="about-primary-link" href="#about-site">ওয়েবসাইট সম্পর্কে <ArrowUpRight size={16} /></a>
            <a className="about-secondary-link" href="#about-founder">প্রতিষ্ঠাতার পরিচিতি</a>
          </div>
        </div>
        <div className="about-hero-art" aria-label="Rannar Menu-এর রান্নার অনুপ্রেরণা">
          <div className="about-art-ring about-art-ring-one" />
          <div className="about-art-ring about-art-ring-two" />
          <div className="about-art-center"><span className="about-art-mark"><ChefHat size={44} strokeWidth={1.3} /></span><strong>Rannar Menu</strong><small>প্রতিদিনের রান্নার অনুপ্রেরণা</small></div>
          <span className="about-art-caption"><Heart size={15} fill="currentColor" /> ঘরোয়া স্বাদ, যত্নে সাজানো</span>
        </div>
      </section>

      <nav className="about-local-nav" aria-label="আমাদের কথা পেজের বিভাগ">
        <a href="#about-site"><Globe2 size={16} /> ওয়েবসাইট সম্পর্কে</a>
        <a href="#about-media"><Users size={16} /> সংবাদমাধ্যম</a>
        <a href="#about-founder"><ChefHat size={16} /> চেয়ারম্যান ও প্রতিষ্ঠাতা</a>
      </nav>

      <section className="about-content-section" id="about-site">
        <SectionHeading eyebrow="ABOUT THE WEBSITE" title="Rannar Menu কী এবং কেন?" text="রান্না শেখা, রেসিপি খোঁজা এবং পছন্দের পদ আবার খুঁজে পাওয়া—এই কাজগুলোকে আরও সহজ ও গোছানো করার জন্য Rannar Menu তৈরি।" />
        <div className="about-feature-grid">
          {siteFeatures.map(({ Icon, title, text }, index) => (
            <article className="about-feature" key={title}>
              <span className="about-feature-icon"><Icon size={21} strokeWidth={1.8} /></span>
              <span className="about-feature-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="about-mission-strip">
          <span className="about-mission-icon"><Target size={22} /></span>
          <div><strong>আমাদের লক্ষ্য</strong><p>বাংলা ভাষায় রান্নার তথ্যকে সহজবোধ্য, পরিপাটি এবং মোবাইল-ফ্রেন্ডলি করে সবার কাছে পৌঁছে দেওয়া।</p></div>
        </div>
      </section>

      <section className="about-content-section about-media-section" id="about-media">
        <SectionHeading eyebrow="MEDIA & BROADCASTERS" title="বাংলাদেশের সংবাদমাধ্যম" text="আপনার উল্লেখ করা সংবাদমাধ্যমগুলোর পরিচিতি ও তাদের ওয়েবসাইটের লিংক নিচে দেওয়া হলো। প্রতিটি লোগো নিজ নিজ প্রতিষ্ঠানের ব্র্যান্ড পরিচিতি।" />
        <div className="about-media-grid">
          {mediaBrands.map((brand) => (
            <article className="about-media-card" key={brand.name}>
              <a className="about-media-logo" href={brand.site} target="_blank" rel="noopener noreferrer" aria-label={brand.name + ' অফিসিয়াল ওয়েবসাইট'}>
                <img src={brand.logo} alt={brand.name + ' লোগো'} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; const fallback = event.currentTarget.nextElementSibling; if (fallback) fallback.hidden = false; }} />
                <span className="about-media-fallback" hidden>{brand.bangla}</span>
              </a>
              <div className="about-media-copy">
                <span className="about-media-kicker">BANGLADESH · MEDIA</span>
                <h3>{brand.bangla}</h3>
                <p>{brand.role}</p>
                <a href={brand.site} target="_blank" rel="noopener noreferrer">অফিসিয়াল সাইট <ArrowUpRight size={14} /></a>
              </div>
              <a className="about-logo-credit" href={brand.source} target="_blank" rel="noopener noreferrer">লোগো/তথ্যের উৎস</a>
            </article>
          ))}
        </div>
        <p className="about-media-disclaimer"><ShieldCheck size={16} /> নোট: সংবাদমাধ্যমগুলোর সঙ্গে Rannar Menu-এর আনুষ্ঠানিক স্পনসরশিপ বা অংশীদারত্বের কোনো প্রকাশ্য ঘোষণা অনলাইনে যাচাই করা যায়নি। তাই এখানে তাদের পরিচিতি ও লোগো দেখানো হয়েছে, কিন্তু আনুষ্ঠানিক স্পনসর হিসেবে নিশ্চিত দাবি করা হয়নি। স্পনসরশিপ নিশ্চিত হলে এই অংশটি সেই অনুযায়ী হালনাগাদ করা যাবে।</p>
      </section>

      <section className="about-founder-section" id="about-founder">
        <div className="about-founder-photo-wrap">
          <img className="about-founder-photo" src="https://cdn.phototourl.com/member/2026-10-22-1ff40af4-df92-4e33-9c29-832af6b43f54.webp" alt="মেঘ চৌধুরী মাহফুজ" loading="lazy" />
          <span className="about-founder-photo-caption"><span /> RANNAR MENU LEADERSHIP</span>
        </div>
        <div className="about-founder-copy">
          <span className="about-eyebrow">CHAIRMAN & FOUNDER</span>
          <h2>মেঘ চৌধুরী মাহফুজ</h2>
          <p className="about-founder-role">চেয়ারম্যান ও প্রতিষ্ঠাতা · Rannar Menu</p>
          <p>মেঘ চৌধুরী মাহফুজ একজন বাংলাদেশি উদ্যোক্তা। অনলাইনে প্রকাশিত পরিচিতিতে তাঁকে SYLAÉ ব্র্যান্ডের প্রতিষ্ঠাতা ও CEO হিসেবে উল্লেখ করা হয়েছে; সেখানে ব্র্যান্ড গঠন, ডিজিটাল উপস্থিতি এবং অনলাইন ব্যবসার বিকাশের বিষয়ে তাঁর কাজের কথা বলা হয়েছে।</p>
          <p>Rannar Menu-তে তাঁর ভূমিকা হলো প্ল্যাটফর্মটির পরিচয়, দিকনির্দেশনা এবং দীর্ঘমেয়াদি উন্নয়নের নেতৃত্ব দেওয়া। আমাদের লক্ষ্য হলো বাংলা ভাষাভাষী রান্নাপ্রেমীদের জন্য একটি কার্যকর, সহজে ব্যবহারযোগ্য এবং পরিচ্ছন্ন ডিজিটাল অভিজ্ঞতা গড়ে তোলা।</p>
          <div className="about-founder-tags"><span><Users size={14} /> উদ্যোক্তা</span><span><Target size={14} /> ব্র্যান্ড ও ডিজিটাল উন্নয়ন</span></div>
          <a className="about-founder-source" href="https://www.prlog.org/13108606-syla-chairman-megh-chowdhury-mahfuz-shares-vision-branding-seo-in-bangladesh-fashion.html" target="_blank" rel="noopener noreferrer">প্রকাশিত পরিচিতি পড়ুন <ArrowUpRight size={15} /></a>
        </div>
      </section>

      <section className="about-closing">
        <span className="about-closing-icon"><ChefHat size={23} /></span>
        <div><strong>চলুন, রান্নার গল্প আরও সমৃদ্ধ করি।</strong><p>নতুন রেসিপি খুঁজুন, পছন্দের পদ সেভ করুন, আর নিজের রান্নার তালিকা গুছিয়ে রাখুন।</p></div>
        <a href="#/recipes">রেসিপি দেখুন <ArrowUpRight size={15} /></a>
      </section>
    </div>
  );
}
