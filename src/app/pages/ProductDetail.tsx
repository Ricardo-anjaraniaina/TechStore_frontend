import { useParams, Link, useNavigate } from 'react-router';
import { formatPrice } from '../utils/formatPrice';
import { api } from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { Product } from '../contexts/CartContext';
import { motion } from 'motion/react';
import { ShoppingCart, ArrowLeft, Star, Package, Shield, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Product>(`/products/${id}`)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound || (!product && !notFound)) {
    if (notFound) return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Produit introuvable</h1>
        <Link to="/" className="text-red-700 hover:underline">Retour au catalogue</Link>
      </div>
    );
    return <div className="mx-auto max-w-7xl px-6 py-20 text-center text-gray-500">Chargement...</div>;
  }

  const handleAddToCart = () => {
    addToCart(product);
    const timer = setTimeout(() => {
      navigate('/panier');
    }, 800);
    return () => clearTimeout(timer);
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-red-700"
        >
          <ArrowLeft className="size-5" />
          Retour au catalogue
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-2xl"
          >
            <div className="absolute top-6 left-6 z-10">
              <span className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                {product.categoryName}
              </span>
            </div>
            <div className="p-12 flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-full object-contain"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-3 inline-block bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-sm font-semibold uppercase tracking-wider text-transparent">
              {product.categoryName}
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-gray-300 text-gray-300" />
              </div>
              <span className="text-sm text-gray-600">({product.stockQuantity} en stock)</span>
            </div>

            <div className="mb-8 bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-5xl font-bold text-transparent">
              {formatPrice(product.price)} Ar
            </div>

            <p className="mb-8 text-lg text-gray-700">
              {product.description}
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-4 text-lg font-semibold text-white shadow-2xl shadow-red-900/40 hover:shadow-red-900/60"
            >
              <ShoppingCart className="size-6" />
              Ajouter au panier
            </motion.button>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <Truck className="w-6 h-6 text-red-700" />
                <span className="text-xs text-center text-gray-600 font-medium">Livraison gratuite</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <Shield className="w-6 h-6 text-red-700" />
                <span className="text-xs text-center text-gray-600 font-medium">Garantie 2 ans</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <Package className="w-6 h-6 text-red-700" />
                <span className="text-xs text-center text-gray-600 font-medium">En stock</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Description</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
