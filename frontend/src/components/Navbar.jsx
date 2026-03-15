import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import logoWhite from "@/assets/svgs/SpendWiseLogoWhite.png";
import logoBlack from "@/assets/svgs/SpendWiseLogoBlack.png";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Mail,
  RefreshCw,
  BarChart3,
  LogOut,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

function Navbar({ onFetchEmails, loading, syncing, onLogout}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    onLogout();
    navigate("/login");
  };

  const connectGmail = () => {
    const token = localStorage.getItem("token");
    window.location.href = `${API_BASE_URL}/gmail/auth?token=${token}`;
  };

  const goDashboard = () => navigate("/dashboard");
  const isReport = location.pathname === "/report";
  const isDashboard = location.pathname === "/dashboard";

  const NavActions = ({ onAction }) => (
    <>
      <Button
        variant="outline"
        size="default"
        onClick={() => {
          connectGmail();
          onAction?.();
        }}
        className="cursor-pointer gap-2 px-4 py-2">
        <Mail className="h-4 w-4" />
        Connect Gmail
      </Button>

      <Button
        variant="secondary"
        size="default"
        onClick={() => {
          onFetchEmails();
          onAction?.();
        }}
        className="cursor-pointer gap-2 disabled:opacity-50 px-4 py-2">
        {loading || syncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {loading ? "Fetching..." : syncing ? "Syncing..." : "Fetch Emails"}
      </Button>

      <Button
        variant={isDashboard ? "default" : "ghost"}
        size="default"
        onClick={() => {
          goDashboard();
          onAction?.();
        }}
        className="cursor-pointer gap-2 px-4 py-2">
        <BarChart3 className="h-4 w-4" />
        Dashboard
      </Button>

      <Button
        variant={isReport ? "default" : "ghost"}
        size="default"
        onClick={() => {
          navigate("/report");
          onAction?.();
        }}
        className="cursor-pointer gap-2 px-4 py-2">
        <BarChart3 className="h-4 w-4" />
        Monthly Report
      </Button>

      <Button
        variant="ghost"
        size="default"
        onClick={() => {
          toggleTheme();
          onAction?.();
        }}
        className="cursor-pointer gap-2 px-4 py-2">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {isDark ? "Light Mode" : "Dark Mode"}
      </Button>

      <Button
        variant="destructive"
        size="default"
        onClick={() => {
          logout();
          onAction?.();
        }}
        className="cursor-pointer gap-2 px-4 py-2">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full shadow-lg bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={goDashboard}>
            <img src={isDark ? logoWhite : logoBlack} alt="SpendWise Logo" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">
              SpendWise <span>AI</span>
            </span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <NavActions />
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-64 pt-10 bg-background border-border">
                <div
                  className="flex items-center gap-2.5 mb-6 cursor-pointer"
                  onClick={() => {
                    goDashboard();
                    setMobileOpen(false);
                  }}>
                  <img src={isDark ? logoWhite : logoBlack} alt="SpendWise Logo" className="h-8 w-8" />
                  <span className="text-base font-bold">
                    SpendWise <span>AI</span>
                  </span>
                </div>
                <Separator className="mb-5 bg-border" />
                <div className="flex flex-col gap-3">
                  <NavActions onAction={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
