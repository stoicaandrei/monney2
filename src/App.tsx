import { Routes, Route } from "react-router-dom";
import { ComponentExample } from "@/components/component-example";
import DashboardPage from "@/pages/dashboard/dahsboard-page";
import WalletsPage from "@/pages/wallets/wallets-page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/wallets" element={<WalletsPage />} />
      <Route path="/components" element={<ComponentExample />} />
    </Routes>
  );
}

export default App;
