import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../features/shop/pages/HomePage';
import { ProductPage } from '../features/shop/pages/ProductPage';
import { CartPage } from '../features/shop/pages/CartPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { SubscriptionPage } from '../features/subscription/pages/SubscriptionPage';
import { RequireAdmin } from '../features/admin/components/RequireAdmin';

// Admin pages (and their chart library) load only when an admin opens them,
// so shoppers don't download them.
const AdminLoginPage = lazy(() =>
  import('../features/admin/pages/AdminLoginPage').then((m) => ({
    default: m.AdminLoginPage,
  }))
);
const AdminDashboardPage = lazy(() =>
  import('../features/admin/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminListingsPage = lazy(() =>
  import('../features/admin/pages/AdminListingPage').then((m) => ({
    default: m.AdminListingsPage,
  }))
);
const AdminOrdersPage = lazy(() =>
  import('../features/admin/pages/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  }))
);

const AdminSubscriptionsPage = lazy(() =>
  import('../features/admin/pages/AdminSubscriptionsPage').then((m) => ({
    default: m.AdminSubscriptionsPage,
  }))
);

const admin = (page: ReactNode) => <RequireAdmin>{page}</RequireAdmin>;

export default function AppRouter() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={admin(<AdminDashboardPage />)}
        />
        <Route path="/admin/listings" element={admin(<AdminListingsPage />)} />
        <Route path="/admin/orders" element={admin(<AdminOrdersPage />)} />
        <Route
          path="/admin/subscriptions"
          element={admin(<AdminSubscriptionsPage />)}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
