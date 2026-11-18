import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isAdmin } from '../../../shared/auth';

// Admin pages need an admin login. The API enforces this on every request;
// this just sends people to the login page instead of a broken, empty panel.
export const RequireAdmin = ({ children }: { children: ReactNode }) =>
  isAdmin() ? <>{children}</> : <Navigate to="/admin/login" replace />;
