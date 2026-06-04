export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  createdAt: string;
  updatedAt: string;
}
