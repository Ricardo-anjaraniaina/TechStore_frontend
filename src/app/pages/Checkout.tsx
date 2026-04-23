import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { api } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AddressResponse, OrderResponse } from '../types/order';
import { motion } from 'motion/react';
import { Plus, MapPin, ArrowLeft, Check, Upload, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface AddressForm {
  firstName: string; lastName: string; street: string; city: string;
  state: string; zipCode: string; country: string; phoneNumber: string;
  addressType: string; isDefault: boolean; instructions: string;
}

const emptyAddress: AddressForm = {
  firstName: '', lastName: '', street: '', city: '', state: '',
  zipCode: '', country: '', phoneNumber: '', addressType: 'SHIPPING',
  isDefault: false, instructions: '',
};

const MOBILE_MONEY_METHODS = [
  { value: 'MOBILE_MONEY_MVOLA', label: 'MVola', number: '038 12 345 67', name: 'Jean Pierre', color: 'from-green-500 to-green-700' },
  { value: 'MOBILE_MONEY_ORANGE', label: 'Orange Money', number: '037 12 345 67', name: 'Jean Pierre', color: 'from-orange-500 to-orange-700' },
  { value: 'MOBILE_MONEY_AIRTEL', label: 'Airtel Money', number: '033 12 345 67', name: 'Jean Pierre', color: 'from-red-500 to-red-700' },
];

const ALL_PAYMENT_METHODS = [
  { value: 'CREDIT_CARD', label: 'Carte de crédit', isMobileMoney: false },
  ...MOBILE_MONEY_METHODS.map(m => ({ ...m, isMobileMoney: true })),
];

export function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [billingId, setBillingId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY_MVOLA');
  const [notes, setNotes] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [senderNumber, setSenderNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedMobileMethod = MOBILE_MONEY_METHODS.find(m => m.value === paymentMethod);
  const isMobileMoney = ALL_PAYMENT_METHODS.find(m => m.value === paymentMethod)?.isMobileMoney ?? false;

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (cart.length === 0) { navigate('/panier'); return; }
    api.get<AddressResponse[]>('/addresses').then((data) => {
      setAddresses(data);
      const def = data.find(a => a.isDefault);
      if (def) { setShippingId(def.id); setBillingId(def.id); }
    }).catch(console.error);
  }, [isAuthenticated, cart.length]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    const zip = addressForm.zipCode.trim();
    if (!/^[0-9]{3}$/.test(zip)) {
      toast.error('Le code postal doit contenir exactement 3 chiffres (ex: 301)');
      return;
    }
    setAddressLoading(true);
    try {
      const newAddr = await api.post<AddressResponse>('/addresses', addressForm);
      setAddresses([...addresses, newAddr]);
      setShippingId(newAddr.id);
      setBillingId(newAddr.id);
      toast.success('Adresse ajoutée !');
      setShowAddressForm(false);
      setAddressForm(emptyAddress);
    } catch {
      toast.error('Erreur lors de l\'ajout de l\'adresse. Vérifiez les informations.');
    } finally {
      setAddressLoading(false);
    }
  };

  // Étape 1 → 2 : créer la commande
  const handleCreateOrder = async () => {
    if (!shippingId || !billingId) { toast.error('Veuillez sélectionner une adresse'); return; }
    setLoading(true);
    try {
      const order = await api.post<OrderResponse>('/orders', {
        shippingAddressId: shippingId,
        billingAddressId: billingId,
        paymentMethod,
        notes,
        useCartItems: true,
      });
      setCreatedOrder(order);
      if (isMobileMoney) {
        setStep(2);
      } else {
        clearCart();
        setStep(4);
      }
    } catch {
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 → 3 : soumettre infos paiement
  const handleSubmitPayment = async () => {
    if (!senderNumber || !senderName) { toast.error('Veuillez remplir tous les champs'); return; }
    setLoading(true);
    try {
      await api.post('/payments', {
        orderId: createdOrder!.id,
        paymentMethod,
        senderNumber,
        senderName,
      });
      setStep(3);
    } catch {
      toast.error('Erreur lors de la soumission du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : upload preuve
  const handleUploadProof = async () => {
    if (!proofFile) { toast.error('Veuillez sélectionner une preuve de paiement'); return; }
    setLoading(true);
    try {
      // Récupérer le paymentId
      const payment = await api.get<{ id: number }>(`/payments/order/${createdOrder!.id}`);
      const formData = new FormData();
      formData.append('file', proofFile);
      await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${payment.id}/proof`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: formData,
      });
      toast.success('Preuve envoyée ! En attente de validation.');
      clearCart();
      setStep(4);
    } catch {
      toast.error('Erreur lors de l\'upload de la preuve');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  // ── Étape 4 : succès ──
  if (step === 4) return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-green-100">
          <Check className="size-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Commande soumise !</h1>
        <p className="text-gray-600 mb-2">
          {isMobileMoney
            ? 'Votre preuve de paiement a été envoyée. L\'admin va vérifier et confirmer votre commande.'
            : 'Votre commande a été passée avec succès.'}
        </p>
        <p className="text-sm text-gray-500 mb-8">Vous pouvez suivre l'état dans "Mes commandes".</p>
        <div className="flex gap-3 justify-center">
          <Link to="/commandes" className="px-6 py-3 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-xl font-medium shadow-lg">
            Voir mes commandes
          </Link>
          <Link to="/" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
            Continuer mes achats
          </Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link to="/panier" className="mb-8 inline-flex items-center gap-2 text-gray-600 hover:text-red-700 transition-colors">
        <ArrowLeft className="size-5" /> Retour au panier
      </Link>

      <h1 className="mb-8 text-4xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
        Finaliser la commande
      </h1>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-10">
        {['Livraison & Paiement', 'Infos Mobile Money', 'Preuve de paiement'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              step > i + 1 ? 'bg-green-500 text-white'
              : step === i + 1 ? 'bg-gradient-to-r from-red-700 to-red-900 text-white'
              : 'bg-gray-200 text-gray-500'
            }`}>
              {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden md:block ${step === i + 1 ? 'text-red-700' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < 2 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          {/* ── ÉTAPE 1 : Adresse + méthode de paiement ── */}
          {step === 1 && (
            <>
              {/* Adresses */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-700" /> Adresse de livraison
                  </h2>
                  <button onClick={() => setShowAddressForm(!showAddressForm)}
                    className="flex items-center gap-1.5 text-sm text-red-700 font-medium hover:text-red-800">
                    <Plus className="w-4 h-4" /> Nouvelle adresse
                  </button>
                </div>

                {showAddressForm && (
                  <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddAddress} className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                    {[
                      { key: 'firstName', label: 'Prénom', col: 1 },
                      { key: 'lastName', label: 'Nom', col: 1 },
                      { key: 'street', label: 'Rue', col: 2 },
                      { key: 'city', label: 'Ville', col: 1 },
                      { key: 'state', label: 'Région', col: 1 },
                      { key: 'zipCode', label: 'Code postal', col: 1 },
                      { key: 'country', label: 'Pays', col: 1 },
                      { key: 'phoneNumber', label: 'Téléphone', col: 2 },
                    ].map(({ key, label, col }) => (
                      <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                        <input required={key !== 'phoneNumber'}
                          value={addressForm[key as keyof AddressForm] as string}
                          onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                        />
                      </div>
                    ))}
                    <div className="col-span-2 flex gap-2 justify-end">
                      {addressError && (
                        <p className="col-span-2 text-sm text-red-600 w-full">{addressError}</p>
                      )}
                      <button type="button" onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Annuler</button>
                      <button type="submit" disabled={addressLoading}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-red-700 to-red-900 text-white rounded-lg disabled:opacity-50">
                        {addressLoading ? 'Ajout...' : 'Ajouter'}
                      </button>
                    </div>
                  </motion.form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune adresse enregistrée. Ajoutez-en une.</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        shippingId === addr.id ? 'border-red-700 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input type="radio" name="shipping" checked={shippingId === addr.id}
                          onChange={() => { setShippingId(addr.id); setBillingId(addr.id); }}
                          className="mt-1 accent-red-700" />
                        <div>
                          <div className="font-medium text-gray-900">{addr.firstName} {addr.lastName}</div>
                          <div className="text-sm text-gray-600">{addr.street}, {addr.city} {addr.zipCode}, {addr.country}</div>
                          {addr.phoneNumber && <div className="text-sm text-gray-500">{addr.phoneNumber}</div>}
                          {addr.isDefault && <span className="text-xs text-red-700 font-medium">Adresse par défaut</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Méthode de paiement */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Smartphone className="w-5 h-5 text-red-700" /> Méthode de paiement
                </h2>
                <div className="space-y-3">
                  {ALL_PAYMENT_METHODS.map((m) => (
                    <label key={m.value} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === m.value ? 'border-red-700 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="payment" checked={paymentMethod === m.value}
                        onChange={() => setPaymentMethod(m.value)} className="accent-red-700" />
                      <span className="font-medium text-gray-900">{m.label}</span>
                      {'isMobileMoney' in m && m.isMobileMoney && (
                        <span className="ml-auto text-xs text-gray-500">Mobile Money</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Notes (optionnel)</h2>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none resize-none"
                  placeholder="Instructions spéciales pour la livraison..." />
              </div>
            </>
          )}

          {/* ── ÉTAPE 2 : Infos Mobile Money ── */}
          {step === 2 && selectedMobileMethod && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Informations de paiement</h2>

              {/* Numéro marchand */}
              <div className={`bg-gradient-to-r ${selectedMobileMethod.color} rounded-2xl p-6 text-white`}>
                <p className="text-sm font-medium opacity-80 mb-1">Envoyez le paiement à ce numéro</p>
                <p className="text-3xl font-bold tracking-wider mb-1">{selectedMobileMethod.number}</p>
                <p className="text-sm opacity-90">Nom : <span className="font-semibold">{selectedMobileMethod.name}</span></p>
                <p className="text-sm opacity-90 mt-1">Montant : <span className="font-bold">{formatPrice(totalPrice)} Ar</span></p>
              </div>

              {/* Formulaire envoyeur */}
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Entrez les informations du numéro qui va envoyer l'argent :</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro envoyeur</label>
                  <input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="ex: 038 00 000 00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet du titulaire</label>
                  <input value={senderName} onChange={(e) => setSenderName(e.target.value)}
                    placeholder="ex: Marie Dupont"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none" />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-1">📱 Étapes suivantes :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Notez le numéro marchand ci-dessus</li>
                  <li>Effectuez le transfert depuis votre téléphone</li>
                  <li>Revenez ici et uploadez la capture d'écran de confirmation</li>
                </ol>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmitPayment} disabled={loading || !senderNumber || !senderName}
                className="w-full py-4 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">
                {loading ? 'Traitement...' : 'J\'ai noté le numéro, continuer →'}
              </motion.button>
            </motion.div>
          )}

          {/* ── ÉTAPE 3 : Upload preuve ── */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Preuve de paiement</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                Après avoir effectué le transfert, uploadez la capture d'écran de confirmation de votre application mobile.
              </div>

              <div>
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  proofPreview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}>
                  {proofPreview ? (
                    <img src={proofPreview} alt="Preuve" className="h-full w-full object-contain rounded-2xl p-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload className="w-10 h-10" />
                      <span className="font-medium">Cliquez pour uploader</span>
                      <span className="text-xs">PNG, JPG, JPEG</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {proofPreview && (
                <button onClick={() => { setProofFile(null); setProofPreview(null); }}
                  className="text-sm text-red-600 hover:underline">
                  Changer la photo
                </button>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleUploadProof} disabled={loading || !proofFile}
                className="w-full py-4 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">
                {loading ? 'Envoi...' : 'Confirmer et envoyer la preuve'}
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Résumé commande */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé</h2>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)} Ar</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Livraison</span>
                <span className="text-green-600 font-medium">Gratuite</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
                  {formatPrice(totalPrice)} Ar
                </span>
              </div>
            </div>

            {step === 1 && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleCreateOrder} disabled={loading || !shippingId}
                className="mt-6 w-full py-4 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">
                {loading ? 'Traitement...' : isMobileMoney ? 'Continuer vers le paiement →' : 'Confirmer la commande'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
