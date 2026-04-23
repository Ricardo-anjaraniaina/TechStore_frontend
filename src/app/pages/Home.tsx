import { Link } from 'react-router';
import { formatPrice } from '../utils/formatPrice';
import { api } from '../utils/api';
import { Product } from '../contexts/CartContext';
import { motion } from 'motion/react';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, ChevronRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export function Home() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLast, setIsLast] = useState(false);

  useEffect(() => {
    api.get<PageResponse<Product>>(`/products?page=${page}&size=10`).then((data) => {
      const content = data?.content ?? [];
      setProducts(content);
      setTotalPages(data?.totalPages ?? 0);
      setIsLast(data?.last ?? true);
      const cats = Array.from(new Set(content.map((p) => p.categoryName)));
      setCategories(cats);
    }).catch(console.error);
  }, [page]);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categoryName === selectedCategory);

  return (
    <div>
      <section className="relative mx-6 mt-6 overflow-hidden rounded-3xl">
        {/* Image de fond - Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950 to-red-900">
          {/* L'image de fond sera ajoutée ici plus tard */}
        </div>

        {/* Overlay sombre pour la lisibilité du texte */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenu */}
        <div className="relative mx-auto max-w-7xl px-12 py-24 md:py-32 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-white"
          >
            <h1 className="mb-6 text-5xl font-bold leading-tight lg:text-6xl">
              Élevez Votre Expérience Technologique
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-gray-200">
              Découvrez notre collection exclusive d'ordinateurs haute performance. Des machines puissantes conçues pour les professionnels, créateurs et gamers exigeants.
            </p>
            <div className="flex gap-4">
              <motion.a
                href="#catalogue"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
              >
                Acheter
              </motion.a>
              <motion.a
                href="#catalogue"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                En savoir plus
              </motion.a>
            </div>
          </motion.div>

          <motion.img
            src="/apple-08.svg"
            alt=""
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden md:block rotate-45 pointer-events-none select-none shrink-0"
            style={{ width: '28rem', height: '28rem' }}
          />
        </div>
      </section>

      <section id="catalogue" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
              Nos Produits
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              key="all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg shadow-red-900/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-red-700 hover:text-red-700'
              }`}
            >
              Tous
            </motion.button>
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg shadow-red-900/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-red-700 hover:text-red-700'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-700 to-red-900 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />

              <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500">
                <Link to={`/produit/${product.id}`}>
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <span className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
                      {product.categoryName}
                    </span>
                  </div>

                  <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-white p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
                    />
                  </div>

                  <div className="p-6 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <Star className="w-4 h-4 fill-gray-300 text-gray-300" />
                      </div>
                      <span className="text-xs text-gray-500">(127)</span>
                    </div>

                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {product.categoryName}
                    </div>

                    <h3 className="mb-3 text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-red-700 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <span>{product.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <span>{product.stockQuantity} en stock</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
                          {formatPrice(product.price)} Ar
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-700 to-red-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-red-900/30 hover:shadow-xl hover:shadow-red-900/40 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Ajouter</span>
                      </motion.button>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun produit trouvé dans cette catégorie</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-red-700 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-10 h-10 rounded-lg font-medium transition ${
                  page === i
                    ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg'
                    : 'border border-gray-200 text-gray-700 hover:border-red-700 hover:text-red-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isLast}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-red-700 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Suivant
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Acheter par catégorie</h2>
          <div className="flex gap-2">
            <button className="flex size-10 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100">
              <ChevronRight className="size-5 rotate-180" />
            </button>
            <button className="flex size-10 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gray-50 p-6"
          >
            <h3 className="mb-2 text-xl font-bold text-gray-900">Gaming</h3>
            <p className="mb-4 text-sm text-gray-600">
              Ordinateurs haute performance pour une expérience de jeu ultime avec des graphismes époustouflants.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:gap-2 transition-all"
            >
              Voir accessoires <ChevronRight className="size-4" />
            </Link>
            <div className="mt-6 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1768766367333-c8b015e350d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                alt="Gaming"
                className="h-40 object-contain"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gray-50 p-6"
          >
            <h3 className="mb-2 text-xl font-bold text-gray-900">Professionnel</h3>
            <p className="mb-4 text-sm text-gray-600">
              Machines puissantes pour les créateurs de contenu, développeurs et professionnels exigeants.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:gap-2 transition-all"
            >
              Voir accessoires <ChevronRight className="size-4" />
            </Link>
            <div className="mt-6 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1606211105533-0439bfecce21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                alt="Professionnel"
                className="h-40 object-contain"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gray-50 p-6"
          >
            <h3 className="mb-2 text-xl font-bold text-gray-900">Portable</h3>
            <p className="mb-4 text-sm text-gray-600">
              Ordinateurs légers et compacts parfaits pour le travail en déplacement et les étudiants.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:gap-2 transition-all"
            >
              Voir accessoires <ChevronRight className="size-4" />
            </Link>
            <div className="mt-6 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1759668358660-0d06064f0f84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                alt="Portable"
                className="h-40 object-contain"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Découvrez Une Expérience d'Achat Simplifiée avec TechStore
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white">
                <svg className="size-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-gray-900">Livraison Gratuite</h3>
              <p className="text-sm text-gray-600">
                Profitez de la livraison gratuite sur toutes vos commandes sans minimum d'achat
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white">
                <svg className="size-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-gray-900">Retrait en Magasin</h3>
              <p className="text-sm text-gray-600">
                Commandez en ligne et récupérez vos produits en magasin rapidement
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white">
                <svg className="size-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-gray-900">Garantie</h3>
              <p className="text-sm text-gray-600">
                Tous nos produits sont garantis 2 ans pour votre tranquillité d'esprit
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-12 rounded-lg bg-red-700 px-8 py-3 font-semibold text-white hover:bg-red-800"
          >
            Acheter maintenant
          </motion.button>
        </div>
      </section>
    </div>
  );
}
