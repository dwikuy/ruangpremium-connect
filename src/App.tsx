import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductEdit from "./pages/admin/AdminProductEdit";

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
          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductEdit />} />
          <Route path="/admin/products/:productId" element={<AdminProductEdit />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
