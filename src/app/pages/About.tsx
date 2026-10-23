import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, Clock, ArrowRight, Award } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen bg-[#FAF7F5] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#7E22CE] bg-purple-100 px-4 py-1.5 rounded-full inline-block mb-3">
            Notre Histoire & Vision
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Les Douceurs de Lê Ci
          </h1>
          <p className="font-barcelony text-2xl sm:text-3xl text-[#581C87] mb-6">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-[#581C87] to-purple-400 mx-auto rounded-full" />
        </motion.div>

        {/* Section Présentation & Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-purple-100/70 mb-14"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#581C87] mb-5">
                Une pâtisserie d'art engagée
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                Chez <strong>Les Douceurs de Lê Ci</strong>, nous réinventons la pâtisserie pour qu'elle devienne une source d'émerveillement et de bien-être. 
              </p>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                Chaque création naît d’une volonté farouche : allier la finesse des techniques pâtissières les plus exigeantes à des ingrédients locaux rigoureusement choisis, dans une démarche de santé consciente et de valorisation de notre terroir.
              </p>
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-3">
                <Sparkles size={20} className="text-[#581C87] shrink-0 mt-0.5" />
                <p className="text-xs text-purple-900 font-medium leading-relaxed">
                  Moins de sucre raffiné, zéro conservateurs superflus : rien que la pureté des goûts authentiques et la passion de la table.
                </p>
              </div>
            </div>

            <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl group">
              <img
                src="/tarte-cover.png"
                alt="Création gourmande signature Les Douceurs de Lê Ci"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[11px] font-bold uppercase tracking-widest text-purple-200">Excellence Artisanale</span>
                <p className="text-sm font-extrabold">Préparé chaque matin avec amour</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3 Piliers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-7 rounded-3xl border border-purple-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#581C87] flex items-center justify-center mb-5">
              <Heart size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Santé Consciente</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Des douceurs pensées pour vous régaler sans culpabilité : dosage subtil du sucre, matières premières naturelles et digestes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white p-7 rounded-3xl border border-purple-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#581C87] flex items-center justify-center mb-5">
              <Award size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fierté Locale</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Mise en lumière de notre richesse agricole locale : fruits frais de saison, saveurs d’ici sublimées par notre savoir-faire.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white p-7 rounded-3xl border border-purple-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#581C87] flex items-center justify-center mb-5">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">100% Frais & Fait Main</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Aucune production industrielle. Chaque douceur est confectionnée à la commande pour garantir une fraîcheur absolue.
            </p>
          </motion.div>
        </div>

        {/* Appel à l'action */}
        <div className="text-center bg-gradient-to-r from-[#581C87] to-[#3B0764] text-white p-10 sm:p-14 rounded-3xl shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Prêt à savourer l’excellence ?
          </h2>
          <p className="text-purple-200 text-sm max-w-xl mx-auto mb-8 font-light">
            Commandez vos douceurs salées ou sucrées en ligne et profitez d'une livraison soignée avec paiement direct Orange Money.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/nos-douceurs"
              className="px-8 py-3.5 rounded-2xl bg-white text-[#581C87] hover:bg-purple-50 font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Découvrir la carte</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/sur-commande"
              className="px-8 py-3.5 rounded-2xl bg-purple-800/60 hover:bg-purple-800 text-white font-bold text-sm border border-purple-400/30 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Gâteaux sur mesure</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
