import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './app/router';
import { CartProvider } from './features/shop/context/CartContext';
import './index.css';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
