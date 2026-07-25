import { Routes, Route } from "react-router-dom";
import Shell from "./Shell.jsx";
import BoardPage from "./pages/BoardPage.jsx";
import KanbanPage from "./pages/KanbanPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/reset-password/:userId" element={<ResetPasswordPage />} />
      </Route>
    </Routes>
  );
}
