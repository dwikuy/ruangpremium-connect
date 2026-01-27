import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Invoice from "./pages/Invoice";
import Track from "./pages/Track";
import Account from "./pages/Account";
import AccountOrders from "./pages/AccountOrders";
import AccountOrderDetail from "./pages/AccountOrderDetail";
import AccountPoints from "./pages/AccountPoints";
import AccountSettings from "./pages/AccountSettings";
// Reseller Pages
import ResellerDashboard from "./pages/reseller/ResellerDashboard";
import ResellerOrders from "./pages/reseller/ResellerOrders";
import ResellerProducts from "./pages/reseller/ResellerProducts";
import ResellerWallet from "./pages/reseller/ResellerWallet";
import ResellerApiKeys from "./pages/reseller/ResellerApiKeys";
import ResellerApiDocs from "./pages/reseller/ResellerApiDocs";
import ResellerCheckout from "./pages/reseller/ResellerCheckout";
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminStock from "./pages/admin/AdminStock";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminFulfillment from "./pages/admin/AdminFulfillment";
import AdminResellers from "./pages/admin/AdminResellers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/checkout/:productId" element={<Checkout />} />
          <Route path="/invoice/:orderId" element={<Invoice />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:orderId" element={<Track />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Member Dashboard Routes */}
          <Route path="/account" element={<Account />} />
          <Route path="/account/orders" element={<AccountOrders />} />
          <Route path="/account/orders/:orderId" element={<AccountOrderDetail />} />
          <Route path="/account/points" element={<AccountPoints />} />
          <Route path="/account/settings" element={<AccountSettings />} />
          {/* Reseller Panel Routes */}
          <Route path="/reseller" element={<ResellerDashboard />} />
          <Route path="/reseller/orders" element={<ResellerOrders />} />
          <Route path="/reseller/products" element={<ResellerProducts />} />
          <Route path="/reseller/wallet" element={<ResellerWallet />} />
          <Route path="/reseller/api" element={<ResellerApiKeys />} />
          <Route path="/reseller/docs" element={<ResellerApiDocs />} />
          <Route path="/reseller/checkout/:productId" element={<ResellerCheckout />} />
          <Route path="/forbidden" element={<Forbidden />} />
          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductEdit />} />
          <Route path="/admin/products/:productId" element={<AdminProductEdit />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/stock" element={<AdminStock />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/fulfillment" element={<AdminFulfillment />} />
          <Route path="/admin/resellers" element={<AdminResellers />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
