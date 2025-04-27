import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { Home, Search, Calendar, Upload, User, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/AuthContext";

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || "Guest User";
  const sidebarClasses = isOpen
    ? "translate-x-0"
    : isMobile
    ? "-translate-x-full"
    : "max-lg:-translate-x-full";

  return (
    <>
      {/* Sidebar backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar flex flex-col border-r border-border z-30 transition-transform duration-300 ${sidebarClasses}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-skill-purple flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-lg font-semibold">SkillCoin</span>
          </div>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1 rounded-md hover:bg-accent"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={isMobile ? toggleSidebar : undefined}
              >
                <Home size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={isMobile ? toggleSidebar : undefined}
              >
                <Search size={20} />
                <span>Search</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={isMobile ? toggleSidebar : undefined}
              >
                <Calendar size={20} />
                <span>Bookings</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={isMobile ? toggleSidebar : undefined}
              >
                <Upload size={20} />
                <span>Upload Course</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={isMobile ? toggleSidebar : undefined}
              >
                <User size={20} />
                <span>Profile</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              {!currentUser ? (
                <Link
                  to="/signin"
                  className="text-xs text-skill-purple hover:underline"
                >
                  Sign in
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">Signed in</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
