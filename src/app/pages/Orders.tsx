import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { api } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { useAuth } from '../contexts/AuthContext';
import { OrderResponse } from '../types/order';
import { motion } from 'motion/react';
import { Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    api.get<OrderResponse[]>('/orders')
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleCancel = async (orderId: number) => {
    toast('Annuler cette commande ?', {
      action: { label: 'Confirmer', onClick: async () => {
        try {
          const updated = await api.delete<OrderResponse>(`/orders/${orderId}`);
          setOrders(orders.map(o => o.id === orderId ? updated : o));
          toast.success('Commande annulée');
        } catch {
          toast.error('Impossible d\'annuler cette commande');
        }
      }},
      cancel: { label: 'Annuler', onClick: () => {} },
    });
  };

  if (loading) return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="text-xl text-gray-600">Chargement...</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-red-700 to-red-900 p-3">
          <Package className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
          Mes commandes
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de commandes.</p>
          <Link to="/" className="text-red-700 font-medium hover:underline">Découvrir nos produits</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-bold text-gray-900">#{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
                      {formatPrice(order.totalAmount)} Ar
                    </div>
                    <div className="text-xs text-gray-500">{order.items.length} article(s)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'PENDING' && (
                      <button onClick={() => handleCancel(order.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                      {expanded === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {expanded === order.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-t border-gray-100 p-6 space-y-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img src={item.productImage} alt={item.productName}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-100" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">Qté : {item.quantity} × {formatPrice(item.unitPrice)} Ar</div>
                        </div>
                        <div className="font-semibold text-gray-900">{formatPrice(item.subtotal)} Ar</div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Adresse de livraison</div>
                      <div className="text-gray-600">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                        {order.shippingAddress.street}, {order.shippingAddress.city} {order.shippingAddress.zipCode}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Paiement</div>
                      <div className="text-gray-600">{order.paymentMethod}</div>
                      {order.trackingNumber && (
                        <div className="mt-1">
                          <span className="font-medium text-gray-700">Suivi : </span>
                          <span className="text-gray-600">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
