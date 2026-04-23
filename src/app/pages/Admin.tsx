import { useState, useEffect } from 'react';
import { formatPrice } from '../utils/formatPrice';
import { api } from '../utils/api';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { OrderResponse } from '../types/order';
import { Package, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockQuantity: number;
  categoryName: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  stockQuantity: string;
  categoryId: string;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  stockQuantity: '',
  categoryId: '',
};

export function Admin() {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'products' | 'stock' | 'orders' | 'payments'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  interface Payment {
    id: number; orderId: number; orderNumber: string; paymentMethod: string;
    senderNumber: string; senderName: string; amount: number;
    proofImagePath: string; status: string; adminNote: string; createdAt: string;
  }
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    loadProducts();
    loadOrders();
    loadPayments();
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) loadProducts();
  }, [page]);

  const loadProducts = async () => {
    try {
      const data = await api.get<{ content: Product[]; totalPages: number; last: boolean }>(`/products?page=${page}&size=10`);
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setIsLast(data.last);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await api.get<OrderResponse[]>('/orders/status/PENDING');
      const all = await Promise.all([
        api.get<OrderResponse[]>('/orders/status/PENDING'),
        api.get<OrderResponse[]>('/orders/status/PROCESSING'),
        api.get<OrderResponse[]>('/orders/status/SHIPPED'),
        api.get<OrderResponse[]>('/orders/status/DELIVERED'),
        api.get<OrderResponse[]>('/orders/status/CANCELLED'),
      ]);
      setOrders(all.flat());
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const data = await api.get<Payment[]>('/payments/pending');
      setPayments(data);
    } catch (e) { console.error(e); }
    finally { setPaymentsLoading(false); }
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      const query = adminNote ? `?adminNote=${encodeURIComponent(adminNote)}` : '';
      await api.patch(`/payments/${paymentId}/verify${query}`, {});
      toast.success('Paiement validé');
      setPayments(payments.filter(p => p.id !== paymentId));
      setAdminNote('');
    } catch (e) { toast.error('Erreur lors de la validation'); }
  };

  const handleRejectPayment = async (paymentId: number) => {
    try {
      const query = adminNote ? `?adminNote=${encodeURIComponent(adminNote)}` : '';
      await api.patch(`/payments/${paymentId}/reject${query}`, {});
      toast.success('Paiement rejeté');
      setPayments(payments.filter(p => p.id !== paymentId));
      setAdminNote('');
    } catch (e) { toast.error('Erreur lors du rejet'); }
  };

  const handleUpdateOrderStatus = async (orderId: number) => {
    try {
      const updated = await api.put<OrderResponse>(`/orders/${orderId}/status`, {
        status: orderStatus,
        trackingNumber: trackingNumber || undefined,
      });
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      toast.success('Statut mis à jour');
      setEditingOrderId(null);
    } catch (e) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const newProduct = await api.post<Product>('/products', {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl,
        stockQuantity: parseInt(form.stockQuantity),
        categoryId: parseInt(form.categoryId),
      });
      setProducts([...products, newProduct]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStock = async (productId: number) => {
    try {
      await api.patch(`/products/${productId}`, { stockQuantity: editStock });
      setProducts(products.map(p => p.id === productId ? { ...p, stockQuantity: editStock } : p));
      toast.success('Stock mis à jour');
      setEditingId(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    toast('Supprimer ce produit ?', {
      action: { label: 'Confirmer', onClick: async () => {
        try {
          await api.delete(`/products/${productId}`);
          setProducts(products.filter(p => p.id !== productId));
          toast.success('Produit supprimé');
        } catch {
          toast.error('Erreur lors de la suppression du produit');
        }
      }},
      cancel: { label: 'Annuler', onClick: () => {} },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] px-6 py-12">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-red-700 to-red-900 p-3">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
                Administration
              </h1>
              <p className="text-gray-600">Gérez vos produits et votre inventaire</p>
            </div>
          </div>
          {tab === 'products' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-700 to-red-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Ajouter un produit
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['products', 'stock', 'orders', 'payments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                tab === t
                  ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-red-700 hover:text-red-700'
              }`}
            >
              {t === 'products' ? 'Produits' : t === 'stock' ? 'Stock' : t === 'orders' ? 'Commandes' : (
                <span className="flex items-center gap-1.5">
                  Paiements
                  {payments.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {payments.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Formulaire ajout */}
        {tab === 'products' && showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-red-900/10 p-8 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nouveau produit</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  placeholder="Nom du produit"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (Ar)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Catégorie</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  placeholder="1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Image</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none resize-none"
                  placeholder="Description du produit"
                />
              </div>
              <div className="col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-lg font-medium shadow-lg disabled:opacity-50"
                >
                  {formLoading ? 'Ajout...' : 'Ajouter'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Table produits/stock */}
        {tab !== 'orders' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-red-900/10 border border-red-900/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-700 to-red-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Image</th>
                  <th className="px-6 py-4 text-left font-semibold">Produit</th>
                  <th className="px-6 py-4 text-left font-semibold">Catégorie</th>
                  <th className="px-6 py-4 text-left font-semibold">Prix</th>
                  {tab === 'stock' && <th className="px-6 py-4 text-left font-semibold">Stock</th>}
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{product.categoryName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-red-700">{formatPrice(product.price)} Ar</div>
                    </td>
                    {tab === 'stock' && (
                      <td className="px-6 py-4">
                        {editingId === product.id ? (
                          <input
                            type="number"
                            min="0"
                            value={editStock}
                            onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                          />
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                            product.stockQuantity > 10 ? 'bg-green-100 text-green-700'
                            : product.stockQuantity > 0 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                            <span className="font-medium">{product.stockQuantity}</span>
                            <span className="text-sm">unités</span>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tab === 'stock' && editingId === product.id ? (
                          <>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateStock(product.id)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                              <Save className="w-4 h-4" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                              <X className="w-4 h-4" />
                            </motion.button>
                          </>
                        ) : (
                          <>
                            {tab === 'stock' && (
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => { setEditingId(product.id); setEditStock(product.stockQuantity); }}
                                className="p-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition">
                                <Edit2 className="w-4 h-4" />
                              </motion.button>
                            )}
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {tab !== 'orders' && products.length === 0 && (
          <div className="text-center py-12 text-gray-500">Aucun produit à afficher</div>
        )}

        {tab !== 'orders' && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
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
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-red-900/10 border border-red-900/10 overflow-hidden">
            {ordersLoading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucune commande</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-700 to-red-900 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">N° Commande</th>
                      <th className="px-6 py-4 text-left font-semibold">Date</th>
                      <th className="px-6 py-4 text-left font-semibold">Statut</th>
                      <th className="px-6 py-4 text-left font-semibold">Total</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">#{order.orderNumber}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          {editingOrderId === order.id ? (
                            <div className="flex flex-col gap-2">
                              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none">
                                {['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="N° suivi (optionnel)"
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none" />
                            </div>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700'
                              : order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-700'
                              : order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700'
                              : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}>{order.status}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-red-700">{formatPrice(order.totalAmount)} Ar</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {editingOrderId === order.id ? (
                              <>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => handleUpdateOrderStatus(order.id)}
                                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                  <Save className="w-4 h-4" />
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => setEditingOrderId(null)}
                                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </>
                            ) : (
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => { setEditingOrderId(order.id); setOrderStatus(order.status); setTrackingNumber(order.trackingNumber ?? ''); }}
                                className="p-2 bg-red-700 text-white rounded-lg hover:bg-red-800">
                                <Edit2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Onglet paiements */}
        {tab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-red-900/10 border border-red-900/10 overflow-hidden">
            {paymentsLoading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucun paiement en attente</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <motion.div key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">#{payment.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            {payment.paymentMethod.replace('MOBILE_MONEY_', '')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">Envoyeur : <span className="font-medium">{payment.senderName}</span> — {payment.senderNumber}</div>
                        <div className="text-sm font-bold text-red-700">{formatPrice(payment.amount)} Ar</div>
                        <div className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {payment.proofImagePath && (
                        <a href={`${import.meta.env.VITE_API_URL}/${payment.proofImagePath}`} target="_blank" rel="noreferrer"
                          className="shrink-0">
                          <img src={`${import.meta.env.VITE_API_URL}/${payment.proofImagePath}`}
                            alt="Preuve" className="w-24 h-24 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition" />
                        </a>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Note admin (optionnel)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none" />
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleVerifyPayment(payment.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                        <Check className="w-4 h-4" /> Valider
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectPayment(payment.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                        <X className="w-4 h-4" /> Rejeter
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
