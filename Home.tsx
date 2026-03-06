import React from 'react';
import { LogIn, Monitor, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onLoginClick: () => void;
}

export function Home({ onLoginClick }: HomeProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Monitor className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">এল এস কম্পিউটার</h1>
        </div>
        <button 
          onClick={onLoginClick}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <LogIn className="w-4 h-4" />
          স্টাফ লগইন
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100 mb-4">
            দোকান ম্যানেজমেন্ট সিস্টেম v2.0
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
            আপনার ব্যবসার সহজ সমাধান <br />
            <span className="text-emerald-600">এল এস কম্পিউটার</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            মোবাইল ব্যাংকিং, রিচার্জ, প্রিন্টিং এবং অন্যান্য সকল সেবার হিসাব রাখুন এক জায়গায়। 
            দ্রুত, নিরাপদ এবং সহজ।
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onLoginClick}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
            >
              ড্যাশবোর্ডে প্রবেশ করুন
              <LogIn className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full">
          <FeatureCard 
            icon={Zap} 
            title="দ্রুত লেনদেন" 
            desc="বিকাশ, নগদ, রকেট এবং রিচার্জের হিসাব রাখুন নিমিষেই।" 
          />
          <FeatureCard 
            icon={Monitor} 
            title="ইনভেন্টরি ট্র্যাকিং" 
            desc="দোকানের মালামাল এবং স্টকের সঠিক হিসাব।" 
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="নিরাপদ ডাটা" 
            desc="আপনার সকল তথ্য সুরক্ষিত এবং ব্যাকআপ সুবিধাসহ।" 
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} এল এস কম্পিউটার। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
