import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { Home } from './pages/Home';
import { Catalogue } from './pages/Catalogue';
import { CustomOrder } from './pages/CustomOrder';
import { Promotions } from './pages/Promotions';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/AdminDashboard';
import { Payment } from './pages/Payment';
import { Loyalty } from './pages/Loyalty';
import '../styles/index.css';

export default function App() {
  return (
    <Router>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <CartDrawer />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/sur-commande" element={<CustomOrder />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/fidelite" element={<Loyalty />} />
              <Route path="/paiement/:orderId" element={<Payment />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </CartProvider>
    </Router>
  );
}
