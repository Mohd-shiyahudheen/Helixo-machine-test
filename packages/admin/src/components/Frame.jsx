import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", url: "/", icon: DashboardIcon },
  { label: "Timers", url: "/timers", icon: TimerIcon },
  { label: "Analytics", url: "/analytics", icon: ChartIcon },
];

function DashboardIcon() {
  return (
    <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="admin-nav-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

export default function Frame({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-title">
            <span style={{ fontSize: "22px" }}>⏱</span>
            Countdown
          </div>
          <div className="admin-sidebar-brand-sub">Timer Admin</div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => {
            const isSelected =
              location.pathname === item.url ||
              (item.url !== "/" && location.pathname.startsWith(item.url));
            const Icon = item.icon;
            return (
              <button
                key={item.url}
                type="button"
                className={`admin-nav-item ${isSelected ? "active" : ""}`}
                onClick={() => navigate(item.url)}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
