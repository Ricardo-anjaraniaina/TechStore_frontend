import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Admin } from './pages/Admin';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'produit/:id', Component: ProductDetail },
      { path: 'panier', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'commandes', Component: Orders },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'admin', Component: Admin },
    ],
  },
]);
