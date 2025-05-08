
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Shield, UserCheck, Clock, RefreshCw } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      title: 'Profissionais verificados',
      description: 'Todos os prestadores de serviço são avaliados e verificados antes de ingressar na plataforma.',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Avaliações transparentes',
      description: 'Veja avaliações reais de outros clientes antes de contratar um profissional.',
      icon: Star,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Rápido e eficiente',
      description: 'Receba orçamentos de múltiplos profissionais em poucas horas.',
      icon: Clock,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Serviço garantido',
      description: 'Oferecemos garantia de satisfação em todos os serviços contratados pela plataforma.',
      icon: Shield,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Pagamento seguro',
      description: 'Pague apenas quando o serviço for concluído e estiver satisfeito.',
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Suporte contínuo',
      description: 'Nosso time está disponível para ajudar durante todo o processo. ',
      icon: RefreshCw,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block py-1 px-3 mb-4 rounded-full bg-primary/10 text-primary font-medium text-sm">
            Por que escolher o 3passos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            A plataforma que simplifica a contratação de serviços
          </h2>
          <p className="text-lg text-gray-600">
            Conectamos você a profissionais qualificados para resolver qualquer problema em sua casa ou empresa.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
