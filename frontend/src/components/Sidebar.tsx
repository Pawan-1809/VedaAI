"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetForm } from "@/store/assignmentSlice";
import { logout } from "@/store/authSlice";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Settings,
  Sparkles,
  Bell,
  Library,
  Plus,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: FileText, label: "Assignments", path: "/assignments" },
  { icon: Users, label: "My Groups" },
  { icon: BookOpen, label: "AI Teacher's Toolkit" },
  { icon: Library, label: "My Library", badge: "NEW" },
  { icon: Settings, label: "Settings" },
];

const mobileNavItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: FileText, label: "Assignments", path: "/assignments" },
  { icon: Library, label: "Library" },
  { icon: BookOpen, label: "AI Tools" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreateAssignment = () => {
    dispatch(resetForm());
    setMobileMenuOpen(false);
    router.push("/create");
  };

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleAuthAction = () => {
    if (auth.token) {
      dispatch(logout());
    } else {
      router.push("/login");
    }
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex fixed left-3 top-3 w-[280px] h-[calc(100vh-24px)] bg-white rounded-2xl shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)] flex-col justify-between p-6 z-50">
        <div className="flex flex-col gap-14">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
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
          <button
            onClick={handleCreateAssignment}
            className="w-full h-[42px] rounded-full bg-[#272727] text-white flex items-center justify-center gap-2 text-base font-medium shadow-[0px_16px_48px_rgba(255,255,255,0.12),0px_32px_48px_rgba(255,255,255,0.2),inset_0px_-1px_3.5px_rgba(177,177,177,0.6),inset_0px_0px_34.5px_rgba(255,255,255,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Sparkles size={18} />
            Create Assignment
          </button>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map(({ icon: Icon, label, path, badge }) => {
              const isActive = path && pathname === path;
              const handleClick = () => {
                if (path) {
                  router.push(path);
                } else {
                  triggerToast(`"${label}" feature is coming soon in the next version!`);
                }
              };

              return (
                <button
                  key={label}
                  onClick={handleClick}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full text-left cursor-pointer ${
                    isActive
                      ? "bg-[#f6f6f6] text-[#303030]"
                      : "text-[rgba(94,94,94,0.8)] hover:bg-[#f6f6f6]"
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="text-base font-normal flex-1">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E56820] text-white">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom profile area */}
        <div
          onClick={handleAuthAction}
          className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-sm font-bold">
            {auth.user?.username?.slice(0, 1)?.toUpperCase() || "G"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#303030]">
              Delhi Public School
            </span>
            <span className="text-xs text-[rgba(94,94,94,0.55)]">
              Bokaro Steel City
            </span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-[#e8e8e8] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#E56820] to-[#D45E3E] flex items-center justify-center">
            <svg width="20" height="14" viewBox="0 0 28 20" fill="none">
              <path d="M4.2 5.5L12.6 5.5L12.6 14.1L4.2 9.8V5.5Z" fill="white" />
              <path d="M15.4 5.5L23.8 5.5L23.8 14.1L15.4 9.8V5.5Z" fill="white" fillOpacity="0.7" />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#303030]" style={{ letterSpacing: "-0.06em" }}>
            VedaAI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#303030]">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold">
            {auth.user?.username?.slice(0, 1)?.toUpperCase() || "G"}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#303030]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Slide-out Menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-14 right-0 w-72 max-h-[calc(100vh-56px)] bg-white rounded-bl-2xl shadow-xl p-5 flex flex-col gap-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCreateAssignment}
              className="w-full h-[42px] rounded-full bg-[#272727] text-white flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Sparkles size={16} />
              Create Assignment
            </button>
            <nav className="flex flex-col gap-1">
              {navItems.map(({ icon: Icon, label, path, badge }) => {
                const isActive = path && pathname === path;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      if (path) {
                        router.push(path);
                        setMobileMenuOpen(false);
                      } else {
                        triggerToast(`"${label}" feature is coming soon!`);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${
                      isActive ? "bg-[#f6f6f6] text-[#303030]" : "text-[rgba(94,94,94,0.8)]"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm flex-1">{label}</span>
                    {badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E56820] text-white">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-[#e8e8e8] pt-3">
              <button
                onClick={() => { handleAuthAction(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold">
                  {auth.user?.username?.slice(0, 1)?.toUpperCase() || "G"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#303030]">
                    {auth.user?.username || "Guest"}
                  </span>
                  <span className="text-xs text-[rgba(94,94,94,0.55)]">
                    {auth.token ? "Log out" : "Log in"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e8e8e8] flex items-center justify-around z-50">
        {mobileNavItems.map(({ icon: Icon, label, path }) => {
          const isActive = path && pathname === path;
          return (
            <button
              key={label}
              onClick={() => {
                if (path) {
                  router.push(path);
                } else {
                  triggerToast(`"${label}" feature is coming soon!`);
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? "text-[#303030]" : "text-[rgba(94,94,94,0.55)]"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
            </button>
          );
        })}
        {/* Floating + button */}
        <button
          onClick={handleCreateAssignment}
          className="absolute -top-5 right-5 w-12 h-12 rounded-full bg-[#E56820] text-white shadow-lg flex items-center justify-center"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </nav>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[100] bg-[#181818] border border-white/10 text-white rounded-2xl shadow-xl px-5 py-3.5 flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Bell size={16} className="text-orange-400" />
          </div>
          <p className="text-sm font-medium text-white/90 leading-tight">
            {toastMessage}
          </p>
        </div>
      )}
    </>
  );
}
