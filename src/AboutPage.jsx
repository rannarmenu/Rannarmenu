import React from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChefHat, Heart, Lightbulb, ShieldCheck, Gamepad2, Sparkles, Target, Users } from 'lucide-react';
import './about-page.css';

const mediaSponsors = [
  { name:'Somoy TV', bangla:'সময় টিভি', description:'সমসাময়িক সংবাদ ও গুরুত্বপূর্ণ ঘটনাপ্রবাহ', site:'https://www.somoynews.tv/', logo:'https://thefe-bd.sgp1.cdn.digitaloceanspaces.com/posts/53385/somoy.jpg' },
  { name:'ATN News', bangla:'এটিএন নিউজ', description:'দিনব্যাপী সংবাদ ও চলমান ঘটনার আপডেট', site:'https://www.atnnewstv.com/', logo:'https://upload.wikimedia.org/wikipedia/commons/4/4b/ATN_News_logo.svg' },
  { name:'Boishakhi TV', bangla:'বৈশাখী টিভি', description:'সংবাদ, বিনোদন ও বিভিন্ন টেলিভিশন অনুষ্ঠান', site:'https://boishakhi.tv/', logo:'https://upload.wikimedia.org/wikipedia/commons/f/f2/Boishakhi_Tv_Logo.png' },
  { name:'Jamuna TV', bangla:'যমুনা টিভি', description:'জাতীয় ও আন্তর্জাতিক সংবাদ ও ঘটনাপ্রবাহ', site:'https://jamuna.tv/', logo:'https://commons.wikimedia.org/wiki/Special:FilePath/Jamuna_TV_logo.svg' },
  { name:'Maasranga TV', bangla:'মাছরাঙা টিভি', description:'সংবাদ, ক্রীড়া ও বিনোদনধর্মী অনুষ্ঠান', site:'https://maasranga.tv/', logo:'https://beyondtechbd.com/wp-content/uploads/2023/04/16.maasranga.png' },
  { name:'Channel 24', bangla:'চ্যানেল ২৪', description:'বাংলাদেশ ও বিশ্বের সমসাময়িক সংবাদ', site:'https://www.channel24bd.tv/', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Channel24logo.svg/1280px-Channel24logo.svg.png' },
];

const aboutOptions = [
  { key:'why', number:'01', title:'কেন আমরা', subtitle:'আমাদের উদ্দেশ্য, মূল্যবোধ ও সহজ রান্নার প্রতিশ্রুতি', Icon:Lightbulb },
  { key:'founder', number:'02', title:'প্রতিষ্ঠাতা ও চেয়ারম্যান', subtitle:'মেঘ চৌধুরী মাহফুজের নেতৃত্ব, উদ্যোগ ও দৃষ্টিভঙ্গি', Icon:Users },
  { key:'sponsors', number:'03', title:'আমাদের স্পনসর', subtitle:'আমাদের সঙ্গে যুক্ত স্পনসর, মিডিয়া ও ব্র্যান্ড পরিচিতি', Icon:Heart },
];

function BackToAbout({ onClick }) {
  return <button type="button" className="about-back-link" onClick={onClick}><ArrowLeft size={17} aria-hidden="true" />আমাদের কথা</button>;
}
function SectionIntro({ eyebrow, title, children }) {
  return <header className="about-detail-intro"><span className="about-kicker">{eyebrow}</span><h1>{title}</h1>{children && <p>{children}</p>}</header>;
}

function AboutHome({ onNavigate }) {
  return <section className="about-hub" aria-labelledby="about-hub-title">
    <div className="about-hub-heading">
      <span className="about-kicker"><Sparkles size={14} aria-hidden="true" /> RANNAR MENU</span>
      <h1 id="about-hub-title">আমাদের কথা</h1>
      <p>Rannar Menu-র উদ্দেশ্য, নেতৃত্ব ও সহযোগী ব্র্যান্ড সম্পর্কে জানুন। আপনার আগ্রহের বিভাগটি বেছে নিন—প্রতিটি পৃষ্ঠায় রয়েছে প্রাসঙ্গিক তথ্য, আমাদের দৃষ্টিভঙ্গি এবং সংশ্লিষ্ট লিংক।</p>
    </div>
    <nav className="about-option-list" aria-label="আমাদের কথা বিভাগের তালিকা">
      {aboutOptions.map(({key,number,title,subtitle,Icon}) => <button type="button" className="about-option-row" key={key} onClick={() => onNavigate(key)}>
        <span className="about-option-number">{number}</span>
        <span className="about-option-icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
        <span className="about-option-copy"><strong>{title}</strong><small>{subtitle}</small></span>
        <ArrowRight className="about-option-arrow" size={20} aria-hidden="true" />
      </button>)}
    </nav>
    <div className="about-option-row about-game-row">
      <span className="about-option-number">04</span>
      <span className="about-option-icon"><Gamepad2 size={21} strokeWidth={1.7} aria-hidden="true" /></span>
      <span className="about-option-copy"><strong>3D রান্নার গেম · Chef Challenge</strong><small>আসল 3D রান্নাঘর ঘোরান, উপকরণ হাঁড়িতে দিন, রান্না করে স্কোর বাড়ান।</small></span>
      <a className="about-game-play" href={import.meta.env.BASE_URL + "rannar-cooking-game.html"} aria-label="Rannar Menu 3D রান্নার গেম খেলুন">3D খেলুন <ArrowUpRight size={15} aria-hidden="true" /></a>
      <a className="about-game-download" href={import.meta.env.BASE_URL + "rannar-cooking-game.html"} download="Rannar-Menu-Cooking-Game.html" aria-label="3D রান্নার গেম ডাউনলোড করুন" title="3D রান্নার গেম ডাউনলোড"><ArrowDownToLine size={17} aria-hidden="true" /><span>ডাউনলোড</span></a>
    </div>
    <p className="about-app-download-note">3D গ্রাফিক্স চালাতে ইন্টারনেট ও WebGL-সমর্থিত ব্রাউজার প্রয়োজন। সেরা স্কোর আপনার নিজের ডিভাইসে সংরক্ষিত থাকবে।</p>
    <div className="about-hub-note"><ChefHat size={18} aria-hidden="true" /><p>বাংলা ভাষায় রান্নার তথ্যকে আরও সহজে খুঁজে পাওয়া, বুঝতে পারা এবং দৈনন্দিন জীবনে কাজে লাগানোর অভিজ্ঞতা তৈরি করাই Rannar Menu-র লক্ষ্য।</p></div>
  </section>;
}

function WhyUs({ onBack }) {
  return <article className="about-detail about-why-page">
    <BackToAbout onClick={onBack} />
    <SectionIntro eyebrow="OUR PURPOSE" title="কেন আমরা">
      Rannar Menu-র মূল দর্শন হলো রান্নাসংক্রান্ত তথ্যকে সহজলভ্য, সুসংগঠিত এবং ব্যবহারযোগ্য করে তোলা। আমরা চাই, পাঠক যেন প্রয়োজনীয় উপকরণ, পরিমাপ ও প্রস্তুতপ্রণালি স্পষ্টভাবে বুঝে আত্মবিশ্বাসের সঙ্গে নিজের রান্নাঘরে প্রয়োগ করতে পারেন।
    </SectionIntro>
    <div className="about-story-copy">
      <p>আমাদের কনটেন্টের কেন্দ্রে রয়েছেন বিভিন্ন অভিজ্ঞতার ব্যবহারকারী—নতুন রাঁধুনি থেকে শুরু করে প্রতিদিনের রান্নায় নতুন অনুপ্রেরণা খোঁজা মানুষ। পরিচিত উপকরণ, প্রাঞ্জল বাংলা এবং ধারাবাহিক নির্দেশনার মাধ্যমে রান্নাকে আরও বোধগম্য করে তোলাই আমাদের উদ্দেশ্য। খাবারের সঙ্গে জড়িয়ে থাকা সংস্কৃতি, স্মৃতি ও পারিবারিক বন্ধনও আমাদের অনুপ্রেরণা।</p>
      <p>কার্যকর ডিজিটাল অভিজ্ঞতার ভিত্তি হলো প্রয়োজনীয় তথ্য দ্রুত খুঁজে পাওয়া এবং সহজে ব্যবহার করতে পারা। এ কারণে সার্চ, ক্যাটাগরি ও রেসিপি সংরক্ষণের মতো সুবিধাকে গুরুত্ব দেওয়া হয়েছে। ব্যবহারকারীর প্রয়োজন, কনটেন্টের প্রাসঙ্গিকতা ও প্রযুক্তিগত মান বিবেচনায় প্ল্যাটফর্মটিকে ধারাবাহিকভাবে উন্নত করাই আমাদের লক্ষ্য।</p>
      <p>ব্যবহারকারীর আস্থার জন্য স্বচ্ছতা ও দায়িত্বশীলতা অপরিহার্য। তাই তথ্যের স্পষ্টতা, প্রাসঙ্গিক ছবি এবং ভুল শনাক্ত হলে সংশোধনের সুযোগকে গুরুত্ব দেওয়া হয়। কোনো তথ্য বা ছবির উৎস নিশ্চিত না হলে অনুমানকে সত্য হিসেবে উপস্থাপন না করাই আমাদের নীতি।</p>
    </div>
    <div className="about-values-list">
      <div><BookOpen size={20} /><span><strong>সহজে অনুসরণযোগ্য</strong><small>প্রাঞ্জল বাংলা, পরিমিত উপকরণ ও ধারাবাহিক ধাপ—যাতে রান্না করা হয় আরও স্বচ্ছন্দে।</small></span></div>
      <div><Target size={20} /><span><strong>দৈনন্দিন ব্যবহারে সুবিধা</strong><small>সার্চ, ক্যাটাগরি ও সংরক্ষণের সুবিধায় প্রয়োজনের রেসিপি দ্রুত খুঁজে নিন।</small></span></div>
      <div><ShieldCheck size={20} /><span><strong>দায়িত্বশীল প্রকাশনা</strong><small>তথ্যের স্বচ্ছতা, ছবির উৎস এবং ব্যবহারের অনুমতিকে গুরুত্ব দিয়ে এগিয়ে চলা।</small></span></div>
    </div>
    <a className="about-text-link" href="#/recipes">রেসিপি ঘুরে দেখুন <ArrowUpRight size={16} /></a>
  </article>;
}

function FounderPage({ onBack }) {
  return <article className="about-detail about-founder-page">
    <BackToAbout onClick={onBack} />
    <div className="about-founder-layout">
      <div className="about-founder-portrait">
        <img src="https://cdn.phototourl.com/member/2026-10-22-1ff40af4-df92-4e33-9c29-832af6b43f54.webp" alt="মেঘ চৌধুরী মাহফুজ" loading="lazy" onError={(event) => { event.currentTarget.style.display='none'; }} />
        <span className="about-portrait-caption"><span /> RANNAR MENU · LEADERSHIP</span>
      </div>
      <div className="about-founder-story">
        <span className="about-kicker">FOUNDER & CHAIRMAN</span>
        <h1>মেঘ চৌধুরী মাহফুজ</h1>
        <p className="about-founder-role">প্রতিষ্ঠাতা ও চেয়ারম্যান · Rannar Menu</p>
        <p className="about-founder-lead">মেঘ চৌধুরী মাহফুজ Rannar Menu-র প্রতিষ্ঠাতা ও চেয়ারম্যান। তাঁর উদ্যোক্তা-যাত্রায় ডিজিটাল ব্র্যান্ড নির্মাণ, অনলাইন ব্যবসা এবং ব্র্যান্ডের স্বতন্ত্র পরিচয় গড়ে তোলার বিষয়গুলো গুরুত্বপূর্ণ স্থান পেয়েছে। Rannar Menu-র নেতৃত্বে তাঁর দৃষ্টিভঙ্গি হলো—সুস্পষ্ট উদ্দেশ্য, ধারাবাহিক মানোন্নয়ন এবং ব্যবহারকারীর প্রয়োজনকে সিদ্ধান্তের কেন্দ্রে রাখা।</p>
        <p>SYLAÉ-কে কেন্দ্র করে প্রকাশিত সাক্ষাৎকার ও প্রোফাইলে তাঁকে Founder &amp; CEO হিসেবে পরিচয় করানো হয়েছে। ওই প্রকাশনাগুলোতে ব্র্যান্ড গঠন, অনলাইন উপস্থিতি, ব্র্যান্ডিং এবং সার্চ ইঞ্জিন অপটিমাইজেশন (SEO) বিষয়ে তাঁর অভিজ্ঞতা তুলে ধরা হয়েছে। পাঠকের স্বাধীন যাচাইয়ের সুবিধার্থে সংশ্লিষ্ট প্রকাশনার লিংক এই পৃষ্ঠায় সংযুক্ত রয়েছে।</p>
        <p>Rannar Menu-র লক্ষ্য বাংলা ভাষাভাষী মানুষের জন্য ঘরোয়া রান্নাকেন্দ্রিক একটি সুসংগঠিত ডিজিটাল প্ল্যাটফর্ম গড়ে তোলা। এখানে কনটেন্টের উপযোগিতা, সহজ নেভিগেশন এবং ব্যবহারকারীর বাস্তব প্রয়োজনকে একসঙ্গে বিবেচনা করা হয়। প্ল্যাটফর্মের পরবর্তী উন্নয়নেও প্রাসঙ্গিকতা, ব্যবহারযোগ্যতা ও দায়িত্বশীল উপস্থাপনাই আমাদের অগ্রাধিকার থাকবে।</p>
        <p>আমাদের কাছে নেতৃত্বের অর্থ হলো লক্ষ্য ও অগ্রাধিকার স্পষ্ট রাখা, সিদ্ধান্তের দায় নেওয়া এবং দীর্ঘমেয়াদি আস্থা গড়ে তোলার মতো মান বজায় রাখা। Rannar Menu-র প্রতিটি পর্যায়ে এই নীতিকে বাস্তব কাজে রূপ দেওয়াই আমাদের প্রত্যাশা—যাতে প্ল্যাটফর্মের বৃদ্ধি ব্যবহারকারীর জন্য সৃষ্ট মূল্যেও প্রতিফলিত হয়।</p>
        <div className="about-founder-credits"><span>প্রকাশিত পরিচিতি ও সাক্ষাৎকার</span>
          <a href="https://vocal.media/interview/megh-chowdhury-mahfuz-from-humble-beginnings-to-building-the-global-fashion-brand-sylae" target="_blank" rel="noopener noreferrer">Vocal · উদ্যোক্তার গল্প <ArrowUpRight size={14} /></a>
          <a href="https://www.prlog.org/13108606-syla-chairman-megh-chowdhury-mahfuz-shares-vision-branding-seo-in-bangladesh-fashion.html" target="_blank" rel="noopener noreferrer">PRLog · ব্র্যান্ডিং ও SEO <ArrowUpRight size={14} /></a>
        </div>
      </div>
    </div>
  </article>;
}

function SponsorsPage({ onBack }) {
  return <article className="about-detail about-sponsors-page">
    <BackToAbout onClick={onBack} />
    <SectionIntro eyebrow="OUR SPONSORS" title="আমাদের স্পনসর">
      একটি উদ্যোগের বিকাশে সহযোগিতা, পরিচিতি এবং পারস্পরিক আস্থার গুরুত্ব অপরিসীম। Rannar Menu-র সঙ্গে যুক্ত স্পনসর, মিডিয়া প্রতিষ্ঠান ও ব্র্যান্ডগুলোর পরিচিতি এখানে একত্র করা হয়েছে। সংশ্লিষ্ট প্রতিষ্ঠানের নিজস্ব ওয়েবসাইটে যেতে যে কোনো কার্ড নির্বাচন করুন।
    </SectionIntro>
    <div className="about-sponsor-grid">
      {mediaSponsors.map((brand) => <a className="about-sponsor-item" href={brand.site} target="_blank" rel="noopener noreferrer" key={brand.name} aria-label={brand.bangla + ' অফিসিয়াল ওয়েবসাইট খুলুন'}>
        <span className="about-sponsor-logo">
          <img src={brand.logo} alt={brand.name + ' লোগো'} loading="lazy" onError={(event) => { event.currentTarget.hidden=true; const fallback=event.currentTarget.nextElementSibling; if(fallback) fallback.hidden=false; }} />
          <strong className="about-sponsor-logo-fallback" hidden>{brand.bangla}</strong>
        </span>
        <span className="about-sponsor-name">{brand.bangla}</span>
        <span className="about-sponsor-description">{brand.description}</span>
        <span className="about-sponsor-visit">অফিসিয়াল ওয়েবসাইট <ArrowUpRight size={14} /></span>
      </a>)}
    </div>
    <section className="about-sylae-partner" aria-label="SYLAÉ Group Ltd">
      <div className="about-sylae-wordmark" aria-hidden="true"><span>SYLAÉ</span><small>GROUP LTD</small></div>
      <div className="about-sylae-copy">
        <span className="about-kicker">BRAND PARTNER</span>
        <h2>SYLAÉ Group Ltd</h2>
        <p>SYLAÉ Group Ltd-এর পরিচিতি Rannar Menu-র উদ্যোগী যাত্রার সঙ্গে যুক্ত একটি গুরুত্বপূর্ণ ব্র্যান্ড-সংযোগ হিসেবে এখানে তুলে ধরা হয়েছে। প্রতিষ্ঠানটির নিজস্ব কার্যক্রম, ব্র্যান্ড এবং প্রকাশিত তথ্য সম্পর্কে জানতে তাদের ওয়েবসাইটে যান।</p>
        <a href="https://sylaebd.shop/" target="_blank" rel="noopener noreferrer">sylaebd.shop দেখুন <ArrowUpRight size={15} /></a>
      </div>
    </section>
  </article>;
}

export default function AboutPage({ section = '', onNavigateAbout = () => {} }) {
  if (section === 'why') return <div className="about-page"><WhyUs onBack={() => onNavigateAbout('')} /></div>;
  if (section === 'founder') return <div className="about-page"><FounderPage onBack={() => onNavigateAbout('')} /></div>;
  if (section === 'sponsors') return <div className="about-page"><SponsorsPage onBack={() => onNavigateAbout('')} /></div>;
  return <div className="about-page"><AboutHome onNavigate={onNavigateAbout} /></div>;
}
