import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChefHat, Heart, Lightbulb, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import './about-page.css';

const mediaSponsors = [
  { name:'Somoy TV', bangla:'সময় টিভি', description:'সংবাদ ও চলমান ঘটনাপ্রবাহ', site:'https://www.somoynews.tv/', logo:'https://thefe-bd.sgp1.cdn.digitaloceanspaces.com/posts/53385/somoy.jpg' },
  { name:'ATN News', bangla:'এটিএন নিউজ', description:'বাংলাদেশের ২৪ ঘণ্টার সংবাদ', site:'https://www.atnnewstv.com/', logo:'https://upload.wikimedia.org/wikipedia/commons/4/4b/ATN_News_logo.svg' },
  { name:'Boishakhi TV', bangla:'বৈশাখী টিভি', description:'বাংলা সংবাদ ও টেলিভিশন অনুষ্ঠান', site:'https://boishakhi.tv/', logo:'https://upload.wikimedia.org/wikipedia/commons/f/f2/Boishakhi_Tv_Logo.png' },
  { name:'Jamuna TV', bangla:'যমুনা টিভি', description:'জাতীয় ও আন্তর্জাতিক সংবাদ', site:'https://jamuna.tv/', logo:'https://commons.wikimedia.org/wiki/Special:FilePath/Jamuna_TV_logo.svg' },
  { name:'Maasranga TV', bangla:'মাছরাঙা টিভি', description:'সংবাদ, খেলাধুলা ও বিনোদন', site:'https://maasranga.tv/', logo:'https://beyondtechbd.com/wp-content/uploads/2023/04/16.maasranga.png' },
  { name:'Channel 24', bangla:'চ্যানেল ২৪', description:'বাংলাদেশ ও বিশ্বের সংবাদ', site:'https://www.channel24bd.tv/', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Channel24logo.svg/1280px-Channel24logo.svg.png' },
];

const aboutOptions = [
  { key:'why', number:'01', title:'কেন আমরা', subtitle:'Rannar Menu-র ভাবনা, লক্ষ্য ও আমাদের কাজের ধরন', Icon:Lightbulb },
  { key:'founder', number:'02', title:'প্রতিষ্ঠাতা ও চেয়ারম্যান', subtitle:'মেঘ চৌধুরী মাহফুজ এবং তাঁর উদ্যোগের গল্প', Icon:Users },
  { key:'sponsors', number:'03', title:'আমাদের স্পনসর', subtitle:'সংবাদমাধ্যম ও SYLAÉ Group Ltd', Icon:Heart },
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
      <p>আমাদের গল্প জানতে নিচের যে বিষয়টি দেখতে চান, সেটি বেছে নিন। প্রতিটি অপশনের জন্য আলাদা পেজ রাখা হয়েছে, যাতে তথ্যগুলো সহজে পড়া যায়।</p>
    </div>
    <nav className="about-option-list" aria-label="আমাদের কথা বিভাগের তালিকা">
      {aboutOptions.map(({key,number,title,subtitle,Icon}) => <button type="button" className="about-option-row" key={key} onClick={() => onNavigate(key)}>
        <span className="about-option-number">{number}</span>
        <span className="about-option-icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
        <span className="about-option-copy"><strong>{title}</strong><small>{subtitle}</small></span>
        <ArrowRight className="about-option-arrow" size={20} aria-hidden="true" />
      </button>)}
    </nav>
    <div className="about-hub-note"><ChefHat size={18} aria-hidden="true" /><p>ঘরোয়া রান্নার জন্য একটি সহজ, নির্ভরযোগ্য ও আপন বাংলা ডিজিটাল জায়গা তৈরি করাই আমাদের চেষ্টা।</p></div>
  </section>;
}

function WhyUs({ onBack }) {
  return <article className="about-detail about-why-page">
    <BackToAbout onClick={onBack} />
    <SectionIntro eyebrow="OUR PURPOSE" title="কেন আমরা">
      ভালো রান্নার জন্য সবসময় জটিল আয়োজন দরকার হয় না। অনেক সময় দরকার হয় ঠিক সময়ে পাওয়া একটি সহজ রেসিপি, পরিচিত উপকরণের পরিমাপ, আর ধাপগুলো স্পষ্ট করে বলা। Rannar Menu-র ভাবনা সেখান থেকেই।
    </SectionIntro>
    <div className="about-story-copy">
      <p>আমরা Rannar Menu-কে এমন একটি বাংলা রান্নার জায়গা হিসেবে গড়ে তুলতে চাই, যেখানে নতুন কেউ রান্না শিখতে এলেও অস্বস্তি বোধ করবেন না, আর অভিজ্ঞ রাঁধুনিও নতুন কোনো আইডিয়া খুঁজে পাবেন। আমাদের কাছে রেসিপি শুধু উপকরণের তালিকা নয়—এটা পরিবারের স্বাদ, প্রতিদিনের অভ্যাস, আর কাছের মানুষদের জন্য কিছু তৈরি করার আনন্দ।</p>
      <p>সেই কারণে আমরা রেসিপির তথ্য সহজ ভাষায় সাজাই, ক্যাটাগরি ও সার্চ দিয়ে খুঁজে পাওয়াকে সহজ করি, এবং পছন্দের রান্না সংরক্ষণের সুবিধা রাখি। সাইটের প্রতিটি অংশ আরও পরিষ্কার, ব্যবহারবান্ধব ও উপযোগী করে তোলার কাজ চলমান।</p>
      <p>আমরা নিখুঁত হওয়ার দাবি করছি না। বরং ব্যবহারকারীদের প্রয়োজন বুঝে নিয়মিত উন্নতি করা, খাবার ও ছবির মিলের দিকে যত্ন দেওয়া, এবং বাংলা ভাষায় রান্নার তথ্যকে আরও গোছানো করে তোলাই আমাদের প্রতিশ্রুতি।</p>
    </div>
    <div className="about-values-list">
      <div><BookOpen size={20} /><span><strong>সহজ ভাষা</strong><small>যেন নির্দেশনা বুঝে রান্না করা যায়।</small></span></div>
      <div><Target size={20} /><span><strong>দরকারি অভিজ্ঞতা</strong><small>খোঁজা, পড়া ও পরে আবার ফিরে পাওয়া সহজ করা।</small></span></div>
      <div><ShieldCheck size={20} /><span><strong>যত্ন ও দায়িত্ব</strong><small>তথ্যকে পরিষ্কারভাবে উপস্থাপন এবং ভুল হলে সংশোধনের চেষ্টা।</small></span></div>
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
        <p>একটি উদ্যোগের পেছনে থাকে অনেক ভাবনা, পরীক্ষা-নিরীক্ষা আর প্রতিদিন একটু ভালো করার চেষ্টা। মেঘ চৌধুরী মাহফুজ এমন একজন উদ্যোক্তা, যাঁর কাজের পরিচিতিতে ডিজিটাল ব্র্যান্ডিং, অনলাইন ব্যবসা এবং ব্র্যান্ডকে মানুষের কাছে পৌঁছে দেওয়ার বিষয়গুলো উঠে এসেছে।</p>
        <p>প্রকাশিত প্রোফাইল ও সাক্ষাৎকারে তাঁকে SYLAÉ-র প্রতিষ্ঠাতা ও CEO হিসেবে পরিচয় করানো হয়েছে। সেখানে নিজের ব্র্যান্ড গড়ে তোলা, অনলাইন উপস্থিতি শক্ত করা এবং SEO ও ডিজিটাল মার্কেটিং নিয়ে তাঁর কাজের কথা তুলে ধরা হয়েছে।</p>
        <p>Rannar Menu-র ক্ষেত্রেও আমরা সেই উদ্যোগী মনোভাবকে কাজে লাগাতে চাই—তবে একেবারে আলাদা একটি জগতে: বাংলা ভাষা, ঘরোয়া খাবার আর প্রতিদিনের রান্নার প্রয়োজনকে সামনে রেখে। Rannar Menu তাঁর উদ্যোগের চতুর্থ শাখা হিসেবে গড়ে উঠছে। এর নিজস্ব পরিচয় তৈরি করা এবং সময়ের সঙ্গে আরও কার্যকর করে তোলাই আমাদের লক্ষ্য।</p>
        <p>আমরা যারা Rannar Menu-র কাজ করছি, তাদের কাছে নেতৃত্ব মানে শুধু একটি পদ নয়। এর মানে হলো দলের ভাবনাকে দিক দেওয়া, কাজের মানের দায়িত্ব নেওয়া, এবং ব্যবহারকারীরা যেন সত্যিই উপকার পান—সেদিকে নজর রাখা।</p>
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
      Rannar Menu-র পাশে থাকা সংবাদমাধ্যম ও ব্র্যান্ডগুলোর প্রতি আমাদের কৃতজ্ঞতা। তাদের অফিসিয়াল ওয়েবসাইটে যেতে প্রতিটি লোগোতে চাপ দিন।
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
        <p>SYLAÉ-র সঙ্গে আমাদের সংযোগ Rannar Menu-র উদ্যোগী যাত্রার অংশ। ব্র্যান্ড ও ব্যবসা সম্পর্কে আরও জানতে তাদের ওয়েবসাইট দেখুন।</p>
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
