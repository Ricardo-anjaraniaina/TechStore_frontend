import { Outlet, Link } from 'react-router';
import { ShoppingCart, Laptop, User, LogOut, Shield } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Toaster } from './ui/sonner';

export function Layout() {
  const { totalItems } = useCart();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50">
      <header className="sticky top-0 z-50 border-b border-red-900/10 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-red-700 to-red-900 p-2">
                <Laptop className="size-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-2xl font-bold text-transparent">TechStore</span>
            </Link>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-2.5 text-white shadow-lg shadow-gray-900/30 hover:shadow-xl hover:shadow-gray-900/40"
                  >
                    <Shield className="size-5" />
                    <span className="font-medium">Admin</span>
                  </motion.div>
                </Link>
              )}

              <Link to="/panier" className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-700 to-red-900 px-5 py-2.5 text-white shadow-lg shadow-red-900/30 hover:shadow-xl hover:shadow-red-900/40"
                >
                  <ShoppingCart className="size-5" />
                  <span className="font-medium">Panier</span>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-red-700"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </motion.div>
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-white border border-red-900/10 px-4 py-2.5">
                    <User className="size-5 text-red-700" />
                    <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2.5 text-gray-700 hover:bg-gray-300"
                  >
                    <LogOut className="size-5" />
                    <span className="font-medium">Déconnexion</span>
                  </motion.button>
                </div>
              ) : (
                <Link to="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-full bg-white border border-red-900/10 px-5 py-2.5 text-red-700 hover:bg-red-50"
                  >
                    <User className="size-5" />
                    <span className="font-medium">Connexion</span>
                  </motion.div>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
      <Toaster position="top-right" richColors />

      <footer className="mt-20 border-t border-gray-800/10 bg-gradient-to-b from-gray-900 to-black py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-red-700 to-red-900 p-1.5">
                  <Laptop className="size-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text font-bold text-transparent">TechStore</span>
              </div>
              <p className="text-sm text-gray-400">
                Votre destination pour les meilleurs ordinateurs du marché.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-white">Informations</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="cursor-pointer hover:text-red-500">À propos</li>
                <li className="cursor-pointer hover:text-red-500">Contact</li>
                <li className="cursor-pointer hover:text-red-500">Livraison</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-white">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="cursor-pointer hover:text-red-500">FAQ</li>
                <li className="cursor-pointer hover:text-red-500">Garantie</li>
                <li className="cursor-pointer hover:text-red-500">Retours</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            © 2026 TechStore. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
