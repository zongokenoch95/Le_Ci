import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ScrollToTop } from './components/ScrollToTop';
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';
import { Home } from './pages/Home';
import { Catalogue } from './pages/Catalogue';
import { CustomOrder } from './pages/CustomOrder';
import { Promotions } from './pages/Promotions';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { Payment } from './pages/Payment';
import { Loyalty } from './pages/Loyalty';
import { About } from './pages/About';
import { Cart } from './pages/Cart';
import '../styles/index.css';

export default function App() {
  return (
    <Router>
      <CartProvider>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/nos-douceurs" element={<Catalogue />} />
              <Route path="/nos-produits" element={<Catalogue />} />
              <Route path="/sur-commande" element={<CustomOrder />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/panier" element={<Cart />} />
              
              {/* Espace Administration Isolé (Authentification Forte & RBAC) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Fidélité & Paiement */}
              <Route path="/fidelite" element={<Loyalty />} />
              <Route path="/fidelisation" element={<Loyalty />} />
              <Route path="/paiement/:orderId" element={<Payment />} />

              {/* Redirections des anciennes pages supprimées */}
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
                  </div>
      </CartProvider>
    </Router>
  );
}
