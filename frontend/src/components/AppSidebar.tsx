import { useState } from "react";
import type { ElementType, CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, FileText, Award, File,
  BookOpen, Headphones, Menu, X,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard" },
  { icon: User,            label: "Profile",      href: "/profile" },
  { icon: FileText,        label: "Applications", href: "#" },
  { icon: Award,           label: "Test Prep",    href: "#" },
  { icon: File,            label: "Documents",    href: "#" },
  { icon: BookOpen,        label: "Resources",    href: "#" },
];

const SIDEBAR_BG   = "#F1F5F9";
const BORDER_COLOR = "#E2E8F0";

// Design tokens
const DEFAULT_TEXT  = "#334155";
const DEFAULT_ICON  = "#94A3B8";
const ACTIVE_BG     = "rgba(47,128,237,0.15)";
const ACTIVE_COLOR  = "#2F80ED";
const HOVER_BG      = "rgba(47,128,237,0.08)";

function NavItem({
  icon: Icon, label, href, active,
  onClick,
}: {
  icon: ElementType;
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const bg    = active ? ACTIVE_BG   : hovered ? HOVER_BG  : "transparent";
  const color = active ? ACTIVE_COLOR : hovered ? ACTIVE_COLOR : DEFAULT_TEXT;
  const iconColor = active ? ACTIVE_COLOR : hovered ? ACTIVE_COLOR : DEFAULT_ICON;

  return (
    <Link
      to={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 12,
        padding: "10px 14px",
        background: bg,
        color,
        fontWeight: 500,
        fontSize: "0.875rem",
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
    >
      <Icon style={{ width: 20, height: 20, strokeWidth: 1.75, color: iconColor, flexShrink: 0, transition: "color 0.2s ease" }} />
      {label}
    </Link>
  );
}

function SidebarBody({ onNav }: { onNav?: () => void }) {
  const { pathname } = useLocation();

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      <nav style={{ flex: 1, padding: "20px 12px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(({ icon, label, href }) => (
          <NavItem
            key={label}
            icon={icon}
            label={label}
            href={href}
            active={isActive(href)}
            onClick={onNav}
          />
        ))}
      </nav>

      <div style={{ padding: "0 12px 28px" }}>
        <NavItem icon={Headphones} label="Support" href="#" active={false} onClick={onNav} />
      </div>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const [open, setOpen] = useState(false);

  const sidebarStyle: CSSProperties = {
    width: 260,
    height: "calc(100vh - 80px)",
    background: SIDEBAR_BG,
    borderRight: `1px solid ${BORDER_COLOR}`,
    display: "flex",
    flexDirection: "column",
  };

  return (
    <>
      {/* ── Desktop (md+) ── */}
      <aside
        className="hidden md:flex"
        style={{ ...sidebarStyle, position: "fixed", top: 80, left: 0, zIndex: 100 }}
      >
        <SidebarBody />
      </aside>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 499 }}
          className="md:hidden"
        >
          {/* backdrop */}
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", backdropFilter: "blur(2px)" }}
            onClick={() => setOpen(false)}
          />
          {/* drawer */}
          <aside
            style={{
              ...sidebarStyle,
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              paddingTop: 80,
              animation: "sidebarSlideIn 0.22s ease-out",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute", top: 86, right: 10,
                background: "none", border: "none", cursor: "pointer",
                borderRadius: 10, padding: "6px",
                color: DEFAULT_TEXT,
              }}
            >
              <X size={18} />
            </button>
            <SidebarBody onNav={() => setOpen(false)} />
          </aside>
          <style>{`@keyframes sidebarSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
        </div>
      )}

      {/* ── Mobile trigger (shown inside page, only on small screens) ── */}
      <button
        className="md:hidden"
        onClick={() => setOpen(true)}
        style={{
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          padding: "10px 18px",
          borderRadius: 12,
          border: `1px solid ${BORDER_COLOR}`,
          background: "#fff",
          color: DEFAULT_TEXT,
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          transition: "background 0.18s ease",
        }}
      >
        <Menu size={17} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
        Menu
      </button>
    </>
  );
}
