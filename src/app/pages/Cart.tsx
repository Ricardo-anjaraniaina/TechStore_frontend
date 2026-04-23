import { Link, useNavigate } from 'react-router';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../contexts/CartContext';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export function Cart() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200">
            <ShoppingBag className="size-12 text-red-700" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Votre panier est vide
          </h1>
          <p className="mb-8 text-gray-600">
            Découvrez notre catalogue et trouvez l'ordinateur parfait pour vous
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-700 to-red-900 px-8 py-4 font-semibold text-white shadow-xl shadow-red-900/30 hover:shadow-2xl hover:shadow-red-900/50"
          >
            <ArrowLeft className="size-5" />
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-red-700"
        >
          <ArrowLeft className="size-5" />
          Continuer mes achats
        </Link>

        <h1 className="mb-8 bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-4xl font-bold text-transparent">Mon panier</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cart.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
                >
                  <Link
                    to={`/produit/${item.id}`}
                    className="shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-red-50"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="size-32 object-cover transition-transform hover:scale-105"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                          {item.categoryName}
                        </span>
                      </div>
                      <Link to={`/produit/${item.id}`}>
                        <h3 className="mb-2 text-lg font-bold text-gray-900 hover:text-red-700">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="text-sm text-gray-600">
                        {item.description}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex size-8 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-red-100"
                        >
                          <Minus className="size-4" />
                        </motion.button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex size-8 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-red-100"
                        >
                          <Plus className="size-4" />
                        </motion.button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-xl font-bold text-transparent">
                          {formatPrice(item.price * item.quantity)} Ar
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Résumé</h2>

              <div className="mb-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Articles ({totalItems})</span>
                  <span className="font-semibold text-gray-900">
                    {totalPrice.toLocaleString('fr-FR')} Ar
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-semibold text-emerald-600">Gratuite</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-2xl font-bold text-transparent">
                      {totalPrice.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/checkout')}
                className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-4 font-semibold text-white shadow-xl shadow-red-900/30 hover:shadow-2xl hover:shadow-red-900/50"
              >
                Procéder au paiement
              </motion.button>

              <div className="mt-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 text-sm text-red-900">
                <p className="font-medium">✓ Livraison gratuite</p>
                <p className="font-medium">✓ Garantie 2 ans</p>
                <p className="font-medium">✓ Retour sous 30 jours</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
