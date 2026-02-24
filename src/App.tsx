import { Routes, Route, Navigate } from "react-router-dom";
import { ComponentExample } from "@/components/component-example";
import DashboardPage from "@/pages/dashboard/dahsboard-page";
import WalletsPage from "@/pages/wallets/wallets-page";
import CategoriesPage from "@/pages/categories/categories-page";
import TagsPage from "@/pages/tags/tags-page";
import TransactionsPage from "@/pages/transactions/transactions-page";
import SettingsPage from "@/pages/settings/settings-page";

export function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/wallets" element={<WalletsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/tags" element={<TagsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/components" element={<ComponentExample />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
