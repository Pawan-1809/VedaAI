"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home" },
  { icon: Users, label: "My Groups" },
  { icon: FileText, label: "Assignments" },
  { icon: BookOpen, label: "AI Teacher's Toolkit" },
  { icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-3 top-3 w-[280px] h-[calc(100vh-24px)] bg-white rounded-2xl shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)] flex flex-col justify-between p-6 z-50">
      <div className="flex flex-col gap-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-b from-[#E56820] to-[#D45E3E] flex items-center justify-center shadow-md">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
              <path d="M4.2 5.5L12.6 5.5L12.6 14.1L4.2 9.8V5.5Z" fill="white" />
              <path d="M15.4 5.5L23.8 5.5L23.8 14.1L15.4 9.8V5.5Z" fill="white" fillOpacity="0.7" />
            </svg>
          </div>
          <span className="text-[28px] font-bold leading-5 text-[#303030]" style={{ letterSpacing: "-0.06em" }}>
            VedaAI
          </span>
        </div>

        {/* Create Assignment Button */}
        <button className="w-full h-[42px] rounded-full bg-[#272727] text-white flex items-center justify-center gap-2 text-base font-medium shadow-[0px_16px_48px_rgba(255,255,255,0.12),0px_32px_48px_rgba(255,255,255,0.2),inset_0px_-1px_3.5px_rgba(177,177,177,0.6),inset_0px_0px_34.5px_rgba(255,255,255,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98]" style={{ fontFamily: "Inter, sans-serif" }}>
          <Sparkles size={18} />
          Create Assignment
        </button>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[rgba(94,94,94,0.8)] hover:bg-[#f6f6f6] transition-colors w-full text-left"
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-base font-normal">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom profile area */}
      <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#f6f6f6] transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-sm font-bold">
          V
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#303030]">VedaAI User</span>
          <span className="text-xs text-[rgba(94,94,94,0.55)]">Free Plan</span>
        </div>
      </div>
    </aside>
  );
}
