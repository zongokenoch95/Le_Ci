import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Scale, ArrowLeft } from 'lucide-react';

export const LegalMentions: React.FC = () => {
  return (
    <div className="min-h-screen py-12 sm:py-16 bg-[#FDF8F2] text-[#2B1204]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#F8BE40]/20 text-[#2B1204] border border-[#F8BE40] uppercase tracking-wider">
            <Scale size={14} className="text-[#C20A0A]" /> Informations réglementaires
          </span>
          <h1 className="font-adapt text-3xl sm:text-4xl font-black text-[#2B1204] tracking-tight">
            Mentions Légales
          </h1>
          <p className="font-fredoka text-xs sm:text-sm text-[#2B1204]/75 max-w-xl mx-auto">
            Informations légales et conditions générales d'utilisation de la maison Les Douceurs de Lê-Ci.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#F8BE40] shadow-md space-y-7 text-xs sm:text-sm leading-relaxed font-fredoka">
          <section className="space-y-2">
            <h2 className="font-adapt text-base sm:text-lg font-extrabold text-[#2B1204] flex items-center gap-2">
              <FileText size={18} className="text-[#C20A0A]" />
              1. Éditeur du site
            </h2>
            <p className="text-[#2B1204]/85">
              Le présent site est édité par la maison artisanale <strong>Les Douceurs de Lê-Ci</strong>,
              spécialisée en pâtisserie fine, douceurs sucrées et salées, et gâteaux sur-mesure à Ouagadougou, Burkina Faso.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#2B1204]/80">
              <li><strong>Adresse :</strong> Les Douceurs de Lê-Ci, 01 BP 6131, Ouagadougou, Burkina Faso</li>
              <li><strong>Téléphone / WhatsApp :</strong> +226 70 00 00 01</li>
              <li><strong>Email :</strong> contact@lesdouceursdeleci.com</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-[#F6C58E]/50">
            <h2 className="font-adapt text-base sm:text-lg font-extrabold text-[#2B1204]">
              2. Hébergement
            </h2>
            <p className="text-[#2B1204]/85">
              Le site et son infrastructure applicative sont hébergés sur une plateforme cloud sécurisée garantissant la disponibilité des services et la protection des échanges via protocole HTTPS.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-[#F6C58E]/50">
            <h2 className="font-adapt text-base sm:text-lg font-extrabold text-[#2B1204]">
              3. Commandes, Paiement & Livraison
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#2B1204]/80">
              <li>Les prix sont exprimés en Francs CFA (FCFA), toutes taxes comprises hors frais éventuels de livraison convenus directement avec le livreur.</li>
              <li>Les paiements en ligne s'effectuent par Mobile Money (Orange Money, Moov Money, Wave).</li>
              <li>Les livraisons sont assurées du lundi au samedi de 09h00 à 18h00 et le dimanche de 10h30 à 12h00, avec possibilité de retrait directement en boutique.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-[#F6C58E]/50">
            <h2 className="font-adapt text-base sm:text-lg font-extrabold text-[#2B1204] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#5DBA68]" />
              4. Données personnelles & Confidentialité
            </h2>
            <p className="text-[#2B1204]/85">
              Les informations recueillies lors de la passation de commande ou de l'inscription au programme de fidélité (nom, numéro de téléphone, quartier de livraison) sont utilisées exclusivement pour la préparation, la livraison et le suivi de vos commandes. Elles ne sont ni cédées ni vendues à des tiers.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-[#F6C58E]/50">
            <h2 className="font-adapt text-base sm:text-lg font-extrabold text-[#2B1204]">
              5. Propriété intellectuelle
            </h2>
            <p className="text-[#2B1204]/85">
              L'ensemble des textes, photographies de créations, logos, éléments graphiques et vidéos présents sur ce site sont la propriété exclusive de <strong>Les Douceurs de Lê-Ci</strong>. Toute reproduction ou utilisation sans autorisation préalable est interdite.
            </p>
          </section>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] text-xs font-extrabold shadow-md transition"
          >
            <ArrowLeft size={14} />
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

