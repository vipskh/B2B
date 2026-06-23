import { Navigate, Route, Routes } from "react-router";

import DashboardLayout from "./layouts/DashboardLayout";
import PageLoader from "./components/PageLoader";
import { useMe } from "./hooks/useMe";
import { getDevUserId } from "./lib/devUser";
import UserSwitcherPage from "./pages/UserSwitcherPage";

// platform admin pages
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import VendorsPage from "./pages/VendorsPage";

// seller-center pages
import SellerDashboardPage from "./pages/SellerDashboardPage";
import SellerProductsPage from "./pages/SellerProductsPage";
import SellerOrdersPage from "./pages/SellerOrdersPage";
import SellerRfqPage from "./pages/SellerRfqPage";
import ChatPage from "./pages/ChatPage";
import StoreProfilePage from "./pages/StoreProfilePage";

// buyer onboarding
import ApplyVendorPage from "./pages/ApplyVendorPage";

function AdminRoutes() {
  return (
    <Route path="/" element={<DashboardLayout />}>
      <Route index element={<Navigate to={"dashboard"} />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="vendors" element={<VendorsPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="*" element={<Navigate to={"dashboard"} />} />
    </Route>
  );
}

function SellerRoutes() {
  return (
    <Route path="/" element={<DashboardLayout />}>
      <Route index element={<Navigate to={"dashboard"} />} />
      <Route path="dashboard" element={<SellerDashboardPage />} />
      <Route path="products" element={<SellerProductsPage />} />
      <Route path="orders" element={<SellerOrdersPage />} />
      <Route path="rfqs" element={<SellerRfqPage />} />
      <Route path="chat" element={<ChatPage />} />
      <Route path="store" element={<StoreProfilePage />} />
      <Route path="*" element={<Navigate to={"dashboard"} />} />
    </Route>
  );
}

function App() {
  const devUserId = getDevUserId();
  const { data: me, isLoading, isError } = useMe();

  // auth is off — first choose which seeded user to act as
  if (!devUserId) return <UserSwitcherPage />;
  if (isLoading) return <PageLoader />;
  if (isError || !me) return <UserSwitcherPage />;

  if (me.role === "admin") return <Routes>{AdminRoutes()}</Routes>;
  if (me.role === "vendor") return <Routes>{SellerRoutes()}</Routes>;

  // buyer (or no role yet): invite them to open a store
  return (
    <Routes>
      <Route path="*" element={<ApplyVendorPage />} />
    </Routes>
  );
}

export default App;
