import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Send,
  Sparkles,
  Zap
} from 'lucide-react';
import { getAdminOrders, validateOrder, finishOrder, simulateWebhook, Order } from '../services/api';
import { getSocket, joinAdmin } from '../services/socket';

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  // Formulaire Simulation SMS Test Webhook
  const [testAmount, setTestAmount] = useState('75');
  const [testPhone, setTestPhone] = useState('70123456');
  const [testCodeRef, setTestCodeRef] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    joinAdmin();
    const socket = getSocket();

    const handleNewOrder = (newOrder: Order) => {
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    };

    const handleValidated = (valOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === valOrder.id ? valOrder : o));
    };

    const handleStatusChanged = (data: { orderId: string; order: Order }) => {
      if (data.order) {
        setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:validated', handleValidated);
    socket.on('order:status_changed', handleStatusChanged);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:validated', handleValidated);
      socket.off('order:status_changed', handleStatusChanged);
    };
  }, []);

  const handleValidateManual = async (id: string) => {
    try {
      const res = await validateOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? res.order : o));
    } catch (e: any) {
      alert(e.message || 'Erreur validation');
    }
  };

  const handleFinish = async (id: string) => {
    try {
      const res = await finishOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? res.order : o));
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await simulateWebhook({
        amount: parseInt(testAmount, 10),
        phone: testPhone,
        codeReference: testCodeRef.trim().toUpperCase() || undefined
      });
      setSimResult(res);
      await fetchOrders();
    } catch (e: any) {
      alert('Erreur simulation: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const totalRevenue = orders
    .filter(o => o.statut === 'EN_PREPARATION' || o.statut === 'PRETE' || o.statut === 'LIVREE')
    .reduce((sum, o) => sum + (o.montantTotal || 0), 0);

  const pendingCount = orders.filter(o => o.statut === 'EN_ATTENTE_DE_PAIEMENT').length;
  const preparingCount = orders.filter(o => o.statut === 'EN_PREPARATION').length;

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') return o.statut === 'EN_ATTENTE_DE_PAIEMENT';
    if (activeTab === 'preparing') return o.statut === 'EN_PREPARATION';
    if (activeTab === 'ready') return o.statut === 'PRETE';
    return true;
  });

  return (
    <div className="min-h-screen py-10 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Entête */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Administration Resto & Pâtisserie</span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Tableau de Bord & Encaissements</h1>
          </div>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-sm transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Chiffre d'Affaires Encaissé</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{totalRevenue} FCFA / DT</div>
            <span className="text-[11px] text-emerald-600 font-semibold">100% sans commission tiers</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">En Cours de Préparation</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{preparingCount}</div>
            <span className="text-[11px] text-blue-600 font-semibold">Payées & Validées</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">En Attente de Paiement (TTL 10 min)</span>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{pendingCount}</div>
            <span className="text-[11px] text-orange-600 font-semibold">Écoute active SMS caisse</span>
          </div>
        </div>

        {/* WIDGET INTERACTIF : TESTEUR WEBHOOK ORANGE MONEY */}
        <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6600] text-white flex items-center justify-center font-black">
                <Zap size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Simulateur de Webhook Orange Money (MacroDroid Test)</h3>
                <p className="text-xs text-gray-400">Testez instantanément la validation automatique en simulant la réception d'un SMS de caisse.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Montant (FCFA / DT)</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Numéro Client</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Code Référence (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: 8X42"
                value={testCodeRef}
                onChange={(e) => setTestCodeRef(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] uppercase font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="w-full py-2.5 px-4 bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/30"
              >
                <Send size={14} />
                {simulating ? 'Envoi...' : 'Envoyer SMS Test'}
              </button>
            </div>
          </div>

          {simResult && (
            <div className={`mt-4 p-3 rounded-xl text-xs font-mono ${simResult.matched ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700' : 'bg-amber-950/80 text-amber-300 border border-amber-700'}`}>
              {simResult.matched ? '✅ SUCCÈS : ' : '⚠️ ATTENTION : '}{simResult.message}
            </div>
          )}
        </div>

        {/* Tableau des Commandes */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Onglets */}
          <div className="flex border-b border-gray-100 px-6 pt-4 gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-xs font-bold border-b-2 transition ${activeTab === 'all' ? 'border-[#D4AF37] text-gray-900' : 'border-transparent text-gray-400'}`}
            >
              Toutes ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xs font-bold border-b-2 transition ${activeTab === 'pending' ? 'border-[#D4AF37] text-gray-900' : 'border-transparent text-gray-400'}`}
            >
              En Attente ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('preparing')}
              className={`pb-3 text-xs font-bold border-b-2 transition ${activeTab === 'preparing' ? 'border-[#D4AF37] text-gray-900' : 'border-transparent text-gray-400'}`}
            >
              En Cuisine ({preparingCount})
            </button>
          </div>

          {/* Liste */}
          <div className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                Aucune commande dans cette section.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">{order.id}</span>
                      {order.codeReference && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5] text-[#D4AF37] border border-gray-200">
                          Réf: {order.codeReference}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Client : <span className="font-semibold text-gray-900">{order.customerName}</span> {order.customerPhone && `(${order.customerPhone})`}
                    </div>
                    {order.transactionRef && (
                      <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                        <Sparkles size={12} /> Trans ID : {order.transactionRef}
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-base font-extrabold text-gray-900">
                      {order.montantTotal} FCFA / DT
                    </div>
                    
                    {/* Badge statut */}
                    <div>
                      {order.statut === 'EN_ATTENTE_DE_PAIEMENT' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                          <Clock size={12} /> En attente de paiement
                        </span>
                      )}
                      {order.statut === 'EN_PREPARATION' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Payée • En préparation
                        </span>
                      )}
                      {order.statut === 'PRETE' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Prête à servir
                        </span>
                      )}
                      {order.statut === 'ANNULEE' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Annulée
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Caisse */}
                  <div className="flex gap-2">
                    {order.statut === 'EN_ATTENTE_DE_PAIEMENT' && (
                      <button
                        onClick={() => handleValidateManual(order.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Valider Caisse
                      </button>
                    )}
                    {order.statut === 'EN_PREPARATION' && (
                      <button
                        onClick={() => handleFinish(order.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Prête
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
