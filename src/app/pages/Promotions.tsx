import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const promotionalProducts = [
  {
    id: 1,
    name: 'Coffret Macarons Prestige',
    oldPrice: '65 DT',
    newPrice: '49 DT',
    image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWNhcm9uJTIwY29sb3JmdWwlMjBlbGVnYW50fGVufDF8fHx8MTc2MjYxNjExOXww&ixlib=rb-4.1.0&q=80&w=1080',
    discount: '-25%',
  },
  {
    id: 2,
    name: 'Gâteau Anniversaire Deluxe',
    oldPrice: '95 DT',
    newPrice: '75 DT',
    image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzYyNTEwNzg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    discount: '-20%',
  },
  {
    id: 3,
    name: 'Assortiment Pâtisserie Française',
    oldPrice: '55 DT',
    newPrice: '45 DT',
    image: 'https://images.unsplash.com/photo-1761594606868-1c577b10f69e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjBwYXN0cnklMjBsdXh1cnl8ZW58MXx8fHwxNzYyNjE2MTE4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    discount: '-18%',
  },
  {
    id: 4,
    name: 'Entremet Chocolat Premium',
    oldPrice: '85 DT',
    newPrice: '68 DT',
    image: 'https://images.unsplash.com/photo-1640794334523-b299f14d28db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwbHV4dXJ5fGVufDF8fHx8MTc2MjYxNDg3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    discount: '-20%',
  },
  {
    id: 5,
    name: 'Plateau Tradition Tunisienne',
    oldPrice: '75 DT',
    newPrice: '60 DT',
    image: 'https://images.unsplash.com/photo-1709798289100-7b46217e0325?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9pc3NhbnQlMjBmcmVzaCUyMGJha2VyeXxlbnwxfHx8fDE3NjI2MTYyNTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    discount: '-20%',
  },
  {
    id: 6,
    name: 'Mini Gâteaux Assortis',
    oldPrice: '50 DT',
    newPrice: '39 DT',
    image: 'https://images.unsplash.com/photo-1701357462333-4924d0ad6132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlcnklMjB3b3Jrc2hvcCUyMGFydGlzYW58ZW58MXx8fHwxNzYyNjE2MTE5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    discount: '-22%',
  },
];

export function Promotions() {
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 34,
    seconds: 56,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePreOrder = (productName: string) => {
    const phoneNumber = '21671123456';
    const message = `Bonjour, je souhaite précommander en promotion: ${productName}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="mb-4">Offres du Moment</h1>
          <p className="opacity-70">Profitez de nos promotions exceptionnelles</p>
        </motion.div>

        {/* Countdown Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[var(--beige-gold)] to-[#d4a574] text-white rounded-2xl p-8 mb-12 shadow-lg"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock size={28} />
            <h3 className="text-white">Offre limitée</h3>
          </div>
          <p className="text-center mb-6 text-lg opacity-90">
            Les promotions se terminent dans :
          </p>
          <div className="flex justify-center gap-4">
            {[
              { label: 'Jours', value: timeLeft.days },
              { label: 'Heures', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Secondes', value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[80px] text-center">
                <div className="text-3xl mb-1">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-sm opacity-80">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotionalProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full">
                {product.discount}
              </div>

              <div className="relative aspect-square overflow-hidden">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <button
                    onClick={() => handlePreOrder(product.name)}
                    className="px-6 py-3 bg-[var(--beige-gold)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Précommander
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h4 className="mb-3">{product.name}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 line-through">{product.oldPrice}</span>
                  <span className="text-[var(--beige-gold)] text-xl">{product.newPrice}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 bg-[var(--cream)] rounded-2xl p-12 text-center"
        >
          <h3 className="mb-4">Ne manquez pas ces offres exceptionnelles !</h3>
          <p className="opacity-70 mb-6">
            Commandez maintenant pour profiter de nos prix réduits
          </p>
          <a
            href="https://wa.me/21671123456"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-[var(--beige-gold)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Commander via WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
