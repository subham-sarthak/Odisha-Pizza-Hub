import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import "./layout.css";

export default function Layout() {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-layout-sidebar">
        <Sidebar />
      </aside>

      <main className="dashboard-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
