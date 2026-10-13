import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import MaintenancePage from "./components/MaintenancePage";
import { useSettings } from "./context/SettingsContext";
import Home from "./legacy-pages/Home";
import Directory from "./legacy-pages/Directory";
import Floor from "./legacy-pages/Floor";
import Shop from "./legacy-pages/Shop";
import Product from "./legacy-pages/Product";
import Search from "./legacy-pages/Search";
import Cart from "./legacy-pages/Cart";
import OrderSuccess from "./legacy-pages/OrderSuccess";
import PaymentCallback from "./legacy-pages/PaymentCallback";
import TrackOrder from "./legacy-pages/TrackOrder";
import VerifyEmail from "./legacy-pages/VerifyEmail";
import Login from "./legacy-pages/Login";
import Signup from "./legacy-pages/Signup";
import ForgotPassword from "./legacy-pages/ForgotPassword";
import ResetPassword from "./legacy-pages/ResetPassword";
import Dashboard from "./legacy-pages/Dashboard";
import AttributeProducts from "./legacy-pages/AttributeProducts";
import HowItWorks from "./legacy-pages/HowItWorks";
import FAQ from "./legacy-pages/FAQ";
import Contact from "./legacy-pages/Contact";
import Returns from "./legacy-pages/Returns";
import Delivery from "./legacy-pages/Delivery";
import Privacy from "./legacy-pages/Privacy";
import Terms from "./legacy-pages/Terms";
import Cookies from "./legacy-pages/Cookies";
import NotFound from "./legacy-pages/NotFound";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./legacy-pages/admin/AdminOverview";
import AdminFloors from "./legacy-pages/admin/AdminFloors";
import AdminShops from "./legacy-pages/admin/AdminShops";
import AdminCategories from "./legacy-pages/admin/AdminCategories";
import AdminBrands from "./legacy-pages/admin/AdminBrands";
import AdminBadges from "./legacy-pages/admin/AdminBadges";
import AdminHomeSections from "./legacy-pages/admin/AdminHomeSections";
import AdminProducts from "./legacy-pages/admin/AdminProducts";
import AdminOrders from "./legacy-pages/admin/AdminOrders";
import AdminCustomers from "./legacy-pages/admin/AdminCustomers";
import AdminSettings from "./legacy-pages/admin/AdminSettings";
import AdminAnalytics from "./legacy-pages/admin/AdminAnalytics";

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
