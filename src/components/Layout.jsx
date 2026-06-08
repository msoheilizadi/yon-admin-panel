import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import UsersManager from "./UsersManager";
import FileManager from "./FileManager";
import FeaturedCards from "./FeaturedCards";
import PersonalizationsManager from "./PersonalizationsManager";

const menuItems = [
  { id: "users", label: "مدیریت کاربران", icon: "👥" },
  { id: "files", label: "مدیریت فایل‌ها", icon: "📁" },
  { id: "featuredCards", label: "کارت‌های خانه", icon: "🃏" },
  { id: "personalizations", label: "درخواست‌های شخصی", icon: "🧠" },
];

export default function Layout({ activeTab, setActiveTab }) {
  const { admin, logout } = useAuth();

  return (
    <div className="layout">
      {/* سایدبار ثابت راست */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>پنل ادمین</h3>
          <div className="admin-name">{admin?.name}</div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={logout} className="logout-sidebar">
          🚪 خروج
        </button>
      </aside>

      {/* محتوای اصلی */}
      <main className="main-content">
        {activeTab === "users" && <UsersManager />}
        {activeTab === "files" && <FileManager />}
        {activeTab === "featuredCards" && <FeaturedCards />}
        {activeTab === "personalizations" && <PersonalizationsManager />}{" "}
      </main>
    </div>
  );
}
