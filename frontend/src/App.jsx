import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import MaintenancePage from "./components/MaintenancePage";
import { useSettings } from "./context/SettingsContext";
import Home from "./pages/Home";
import Directory from "./pages/Directory";
import Floor from "./pages/Floor";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import OrderSuccess from "./pages/OrderSuccess";
import PaymentCallback from "./pages/PaymentCallback";
import TrackOrder from "./pages/TrackOrder";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AttributeProducts from "./pages/AttributeProducts";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Returns from "./pages/Returns";
import Delivery from "./pages/Delivery";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminFloors from "./pages/admin/AdminFloors";
import AdminShops from "./pages/admin/AdminShops";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminBadges from "./pages/admin/AdminBadges";
import AdminHomeSections from "./pages/admin/AdminHomeSections";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

export default function App() {
  const { settings } = useSettings();
  const location = useLocation();

  // Maintenance mode blocks every public route, but never the admin panel
  // or login — otherwise whoever turned it on would have no way back in.
  const isAdminOrLogin = location.pathname.startsWith("/admin") || location.pathname === "/login";
  if (settings.maintenanceMode && !isAdminOrLogin) {
    return <MaintenancePage />;
  }

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/floor/:slug" element={<Floor />} />
        <Route path="/shop/:slug" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/search" element={<Search />} />
        <Route path="/brand/:name" element={<AttributeProducts attribute="brand" label="Brand" />} />
        <Route path="/category/:name" element={<AttributeProducts attribute="subcategory" label="Category" />} />
        <Route path="/collection/:name" element={<AttributeProducts attribute="category" label="Collection" />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/track-order/:id" element={<TrackOrder />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wishlist" element={<Navigate to="/dashboard#wishlist" replace />} />
        <Route path="/account" element={<Navigate to="/dashboard#settings" replace />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="floors" element={<AdminFloors />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="badges" element={<AdminBadges />} />
          <Route path="homepage" element={<AdminHomeSections />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
