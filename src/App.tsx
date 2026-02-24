import { Routes, Route, Navigate } from "react-router-dom";
import { ComponentExample } from "@/components/component-example";
import DashboardPage from "@/pages/dashboard/dahsboard-page";
import WalletsPage from "@/pages/wallets/wallets-page";
import CategoriesPage from "@/pages/categories/categories-page";
import TransactionsPage from "@/pages/transactions/transactions-page";

export function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/wallets" element={<WalletsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/components" element={<ComponentExample />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
