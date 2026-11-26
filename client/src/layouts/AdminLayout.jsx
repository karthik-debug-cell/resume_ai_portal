import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="ra-shell">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && <div className="ra-scrim d-lg-none" onClick={() => setOpen(false)} />}
      <div className="ra-main d-flex flex-column min-vh-100">
        <Topbar onToggleSidebar={() => setOpen((o) => !o)} />
        <main className="flex-grow-1 p-3 p-lg-4"><Outlet /></main>
      </div>
    </div>
  );
}
