import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../features/shop/pages/HomePage';
import { ProductPage } from '../features/shop/pages/ProductPage';
import { CartPage } from '../features/shop/pages/CartPage';

import { AdminLoginPage } from '../features/admin/pages/AdminLoginPage';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { AdminListingsPage } from '../features/admin/pages/AdminListingPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/listings" element={<AdminListingsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
