import { motion } from 'motion/react';
import { Award, Heart, Users } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const timeline = [
  { year: '1998', event: 'Fondation de Les Douceurs de Lê Ci' },
  { year: '2005', event: "Ouverture de l'atelier de La Marsa" },
  { year: '2012', event: 'Prix de la meilleure pâtisserie artisanale' },
  { year: '2018', event: 'Expansion avec service traiteur' },
  { year: '2025', event: 'Lancement de la plateforme en ligne' },
];

const team = [
  { name: 'Karim Ben Salah', role: 'Chef Pâtissier', signature: 'Spécialiste des créations françaises' },
  { name: 'Amira Trabelsi', role: 'Chef de Production', signature: 'Experte en pâtisserie tunisienne' },
  { name: 'Mehdi Gharbi', role: 'Maître Chocolatier', signature: 'Passionné de chocolat artisanal' },
];

const values = [
  {
    icon: Heart,
    title: 'Passion',
    description: 'Chaque création est réalisée avec amour et dévouement',
  },
  {
    icon: Award,
    title: 'Qualité',
    description: 'Ingrédients de première qualité, sélectionnés avec soin',
  },
  {
    icon: Users,
    title: 'Savoir-faire',
    description: 'Un héritage artisanal transmis de génération en génération',
  },
];

export function About() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwcGFzdHJ5JTIwa2l0Y2hlbnxlbnwxfHx8fDE3NjI2MTYyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Notre Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--brown-deep)]/70 to-[var(--brown-deep)]/50"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center text-white px-4"
        >
          <h1 className="text-white mb-6">Notre Histoire</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Depuis 1998, notre maison marie savoir-faire et passion.
          </p>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1701357462333-4924d0ad6132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlcnklMjB3b3Jrc2hvcCUyMGFydGlzYW58ZW58MXx8fHwxNzYyNjE2MTE5fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Atelier"
              className="w-full rounded-2xl shadow-lg"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6">L'excellence artisanale</h2>
            <p className="mb-4 opacity-80 leading-relaxed">
              Depuis plus de 25 ans, Les Douceurs de Lê Ci perpétue la tradition de la grande pâtisserie
              en alliant techniques françaises et saveurs tunisiennes authentiques.
            </p>
            <p className="mb-4 opacity-80 leading-relaxed">
              Chaque création est réalisée à la main, avec des ingrédients de première qualité
              soigneusement sélectionnés. Notre engagement : vous offrir des moments de pur plaisir.
            </p>
            <p className="opacity-80 leading-relaxed">
              Chaque détail compte — du goût à la présentation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">Nos Valeurs</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-lg bg-[var(--cream)]"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--beige-gold)] text-white rounded-full mb-6">
                  <value.icon size={28} />
                </div>
                <h3 className="mb-3">{value.title}</h3>
                <p className="opacity-70">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="mb-4">Notre Évolution</h2>
        </motion.div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-[var(--beige-gold)]"></div>

          {/* Timeline Items */}
          <div className="space-y-12">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="bg-white p-6 rounded-lg shadow-sm inline-block">
                    <h4 className="text-[var(--beige-gold)] mb-2">{item.year}</h4>
                    <p className="opacity-80">{item.event}</p>
                  </div>
                </div>
                <div className="w-4 h-4 bg-[var(--beige-gold)] rounded-full relative z-10"></div>
                <div className="w-1/2"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-[var(--cream)] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="mb-4">Notre Équipe</h2>
            <p className="opacity-70">Des artisans passionnés à votre service</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm"
              >
                <div className="aspect-square bg-[var(--grey-light)] flex items-center justify-center">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwcGFzdHJ5JTIwa2l0Y2hlbnxlbnwxfHx8fDE3NjI2MTYyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h4 className="mb-1">{member.name}</h4>
                  <p className="text-[var(--beige-gold)] mb-2">{member.role}</p>
                  <p className="text-sm opacity-60 italic">{member.signature}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-6">Merci pour votre confiance.</h2>
          <p className="text-xl opacity-70">
            Nous sommes honorés de participer à vos moments les plus précieux.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
