import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_SECTIONS } from '../../config/nav';
import { useUIStore } from '../../store/uiStore';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, isMobileDrawerOpen, closeMobileDrawer } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>('scans');

  // Auto-close mobile drawer on route change
  useEffect(() => {
    closeMobileDrawer();
  }, [location.pathname, closeMobileDrawer]);

  const sidebarContent = (isMobile: boolean) => {
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    return (
      <>
        {/* Toggle button — desktop only */}
        {!isMobile && (
          <div className="flex items-center justify-end p-2 border-b border-[var(--color-border-subtle)]">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl transition-all hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </motion.div>
            </button>
          </div>
        )}

        {/* Mobile drawer header */}
        {isMobile && (
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)]">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Navigation</span>
            <button
              onClick={closeMobileDrawer}
              className="p-2 rounded-xl hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] cursor-pointer"
              aria-label="Close menu"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-3" aria-label="Main navigation">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 pt-2 pb-0.5 block opacity-75">
                  {section.title}
                </span>
              ) : (
                sIdx > 0 && <div className="h-px bg-white/5 my-1 mx-2" />
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href + '/'));
                const hasChildren = !!item.children?.length;
                const isExpanded = expanded === item.id;

                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          setExpanded(isExpanded ? null : item.id);
                        } else {
                          navigate(item.href);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative min-h-[36px] ${
                        isActive
                          ? 'text-[var(--color-primary)] font-bold shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/10'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId={isMobile ? 'active-nav-mobile' : 'active-nav-bubble'}
                          className="absolute inset-0 bg-[var(--color-primary-glow)] border border-[var(--color-primary)] rounded-xl z-0"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}

                      <Icon size={15} className="flex-shrink-0 relative z-10" />

                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="flex-1 text-left truncate relative z-10"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {hasChildren && !isCollapsed && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative z-10"
                        >
                          <ChevronDown size={12} />
                        </motion.div>
                      )}
                    </button>

                    {/* Sub-items */}
                    {hasChildren && !isCollapsed && (
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-7 pt-1 space-y-0.5"
                          >
                            {item.children!.map((child) => (
                              <NavLink
                                key={child.id}
                                to={child.href}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-all min-h-[32px] ${
                                    isActive
                                      ? 'text-[var(--color-primary)] font-bold bg-white/10'
                                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                  }`
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                {child.label}
                              </NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 border-t border-[var(--color-border-subtle)] glass-panel m-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0">
                  VS
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate text-[var(--color-text-primary)]">VulnScan Admin</div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                    Posture Score: 88
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 230 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex fixed left-0 z-30 flex-col overflow-hidden backdrop-blur-xl border-r border-[var(--color-border)]"
        style={{
          top: 'var(--topbar-height)',
          height: 'calc(100vh - var(--topbar-height))',
          background: 'var(--color-surface)',
        }}
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* ── Mobile Drawer Overlay ───────────────────────── */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeMobileDrawer}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 z-50 w-[280px] max-w-[85vw] h-full flex flex-col overflow-hidden border-r border-[var(--color-border)]"
              style={{ background: 'var(--color-surface)' }}
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};