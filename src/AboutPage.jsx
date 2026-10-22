import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChefHat, Heart, Lightbulb, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
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
    <div className="about-hub-note"><ChefHat size={18} aria-hidden="true" /><p>বাংলা ভাষায় রান্নার তথ্যকে আরও সহজে খুঁজে পাওয়া, বুঝতে পারা এবং দৈনন্দিন জীবনে কাজে লাগানোর অভিজ্ঞতা তৈরি করাই Rannar Menu-র লক্ষ্য।</p></div>
  </section>;
}

function WhyUs({ onBack }) {
  return <article className="about-detail about-why-page">
    <BackToAbout onClick={onBack} />
    <SectionIntro eyebrow="OUR PURPOSE" title="কেন আমরা">
      Rannar Menu তৈরি হয়েছে ঘরোয়া রান্নার তথ্যকে আরও সহজে খুঁজে পাওয়া, বুঝতে পারা এবং কাজে লাগানোর অভিজ্ঞতা দিতে। ভালো রেসিপি শুধু উপকরণের তালিকা নয়—এর সঙ্গে দরকার নির্ভুল পরিমাপ, সুশৃঙ্খল ধাপ এবং রান্নার প্রতিটি পর্যায়ে আত্মবিশ্বাস জোগানো স্পষ্ট নির্দেশনা।
    </SectionIntro>
    <div className="about-story-copy">
      <p>আমাদের দৃষ্টিভঙ্গি হলো—রান্নায় নতুন, ব্যস্ত কর্মজীবী, কিংবা নিয়মিত পরিবারের জন্য রান্না করেন এমন প্রত্যেকের প্রয়োজনের পাশে থাকা। তাই আমরা পরিচিত উপকরণ, পরিষ্কার ভাষা এবং অনুসরণযোগ্য ধাপকে গুরুত্ব দিই। রান্না আমাদের কাছে কেবল একটি কাজ নয়; এটি পারিবারিক ঐতিহ্য, যত্ন ভাগ করে নেওয়া এবং প্রতিদিনের জীবনে আনন্দ তৈরি করার একটি উপায়।</p>
      <p>ক্যাটাগরি ও সার্চের মাধ্যমে রেসিপি খোঁজা, উপকরণ ও রান্নার ধাপ ধারাবাহিকভাবে দেখা, এবং পছন্দের রেসিপি পরে ব্যবহারের জন্য সংরক্ষণ—প্রতিটি সুবিধা তৈরি করা হয়েছে ব্যবহারকারীর সময় ও স্বাচ্ছন্দ্যের কথা বিবেচনা করে। ওয়েবসাইটের নকশা, কনটেন্ট ও ব্যবহার-অভিজ্ঞতা আমরা নিয়মিত উন্নত করার লক্ষ্য রাখি।</p>
      <p>আমরা অযাচাইকৃত নিখুঁততার দাবি করি না। বরং ব্যবহারকারীর অভিজ্ঞতা, তথ্যের স্পষ্টতা এবং খাবারের সঙ্গে ছবির প্রাসঙ্গিকতাকে গুরুত্ব দিয়ে কাজ করি। ছবির উৎস ও ব্যবহারের অনুমতির তথ্য পাওয়া গেলে তা সংরক্ষণ করি; যাচাই অসম্পূর্ণ থাকলে ভুল ছবি দেখানোর বদলে সতর্কভাবে তা সামলাই। বিশ্বাস গড়ে ওঠে ধারাবাহিক দায়িত্বশীলতা থেকে—আমাদের কাজের ভিত্তি সেটিই।</p>
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
        <p>মেঘ চৌধুরী মাহফুজ Rannar Menu-র প্রতিষ্ঠাতা ও চেয়ারম্যান। তাঁর উদ্যোক্তা-পরিচিতির একটি গুরুত্বপূর্ণ অংশ হলো ডিজিটাল ব্র্যান্ড নির্মাণ, অনলাইন ব্যবসা এবং একটি ব্র্যান্ডকে সুস্পষ্ট পরিচয়ে মানুষের কাছে পৌঁছে দেওয়ার কাজ। তাঁর উদ্যোগের দর্শন থেকে Rannar Menu-তে আমরা যে শিক্ষা নিতে চাই, তা হলো—পরিষ্কার লক্ষ্য, ধারাবাহিক উন্নয়ন এবং ব্যবহারকারীর প্রয়োজনকে সিদ্ধান্তের কেন্দ্রে রাখা।</p>
        <p>SYLAÉ-র প্রকাশিত সাক্ষাৎকারে তাঁকে প্রতিষ্ঠানটির Founder & CEO হিসেবে পরিচয় করানো হয়েছে। সেখানে ছোট পরিসরের উদ্যোগ থেকে একটি ব্র্যান্ড গড়ে তোলা, অনলাইন উপস্থিতি শক্তিশালী করা এবং ব্র্যান্ডিং, SEO ও ই-কমার্স নিয়ে তাঁর অভিজ্ঞতার কথা তুলে ধরা হয়েছে। এই পরিচিতির সঙ্গে সংশ্লিষ্ট প্রকাশিত উৎসগুলো নিচে দেওয়া আছে, যাতে পাঠক নিজেই বিস্তারিত দেখে নিতে পারেন।</p>
        <p>Rannar Menu-তে সেই উদ্যোগী মনোভাবের প্রয়োগ ঘটছে ভিন্ন একটি ক্ষেত্রে—বাংলা ভাষা, ঘরোয়া খাবার এবং প্রতিদিনের রান্নার প্রয়োজনকে সামনে রেখে। আমাদের লক্ষ্য এমন একটি স্বতন্ত্র ডিজিটাল প্ল্যাটফর্ম গড়ে তোলা, যেখানে সহজ রেসিপি, ব্যবহারবান্ধব প্রযুক্তি এবং দায়িত্বশীল কনটেন্ট একসঙ্গে কাজ করবে। সময়ের সঙ্গে ব্যবহারকারীর চাহিদা বুঝে এর মান ও কার্যকারিতা বাড়ানোই আমাদের অগ্রাধিকার।</p>
        <p>আমাদের কাছে নেতৃত্ব কেবল একটি পদবি নয়; এটি উদ্দেশ্য স্পষ্ট রাখা, কাজের মানের দায়িত্ব নেওয়া এবং ব্যবহারকারীর আস্থা অর্জনের ধারাবাহিক প্রক্রিয়া। Rannar Menu-র প্রতিটি উন্নয়নে আমরা কার্যকারিতা, সহজবোধ্যতা এবং দীর্ঘমেয়াদি বিশ্বাসকে অগ্রাধিকার দিতে চাই।</p>
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
