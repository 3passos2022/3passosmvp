
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Wrench, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import BackgroundGradientAnimationDemo from '@/components/Gradient';

const Index: React.FC = () => {
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stats = [
    { label: 'Prestadores de serviço', value: '1.500+', icon: Wrench, color: 'bg-blue-50 text-blue-600' },
    { label: 'Clientes satisfeitos', value: '10.000+', icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Avaliação média', value: '4.8/5', icon: Star, color: 'bg-amber-50 text-amber-600' },
  ];

  const testimonials = [
    {
      quote: "Encontrei um ótimo eletricista em menos de 1 hora. O serviço foi realizado no mesmo dia e com preço justo!",
      author: "Carlos Silva",
      role: "Cliente",
      rating: 5,
    },
    {
      quote: "Como prestador de serviços, a plataforma me ajudou a conquistar novos clientes e expandir meu negócio.",
      author: "Maria Oliveira",
      role: "Pintora Profissional",
      rating: 5,
    },
    {
      quote: "O processo de orçamento é muito simples e rápido. Consegui resolver meu problema na torneira em poucas horas.",
      author: "João Pereira",
      role: "Cliente",
      rating: 4,
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />

        <Features />
        <BackgroundGradientAnimationDemo />
       
        {/* How it works section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <span className="inline-block py-1 px-3 mb-4 rounded-full bg-primary/10 text-primary font-medium text-sm">
                Como funciona
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Solicite, compare e contrate em minutos
              </h2>
              <p className="text-lg text-gray-600">
                Nosso processo foi desenhado para ser simples, rápido e eficiente.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative p-8 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4 mt-4">Solicite orçamentos</h3>
                <p className="text-gray-600 mb-4">
                  Preencha o formulário de solicitação em 3 passos simples descrevendo o que você precisa.
                </p>
                <Link to="/request-quote" className="text-primary font-medium hover:underline inline-flex items-center">
                  Solicitar agora
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative p-8 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4 mt-4">Compare propostas</h3>
                <p className="text-gray-600 mb-4">
                  Receba e compare orçamentos de diferentes profissionais qualificados em sua região.
                </p>
                <span className="text-primary font-medium inline-flex items-center">
                  Escolha o melhor
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative p-8 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4 mt-4">Contrate e avalie</h3>
                <p className="text-gray-600 mb-4">
                  Contrate o profissional escolhido e avalie o serviço realizado para ajudar outros clientes.
                </p>
                <span className="text-primary font-medium inline-flex items-center">
                  Avalie o serviço
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </motion.div>
            </div>
            
            <div className="text-center">
              <Link to="/request-quote">
                <Button size="lg" className="hover-scale">
                  Solicitar orçamento agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Stats section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-8"
                >
                  <div className={`w-16 h-16 ${stat.color} rounded-full mx-auto flex items-center justify-center mb-4`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Testimonials section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <span className="inline-block py-1 px-3 mb-4 rounded-full bg-primary/10 text-primary font-medium text-sm">
                Depoimentos
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O que nossos usuários dizem
              </h2>
              <p className="text-lg text-gray-600">
                Histórias reais de clientes e prestadores de serviço que utilizam nossa plataforma.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pronto para simplificar a busca por serviços?
              </h2>
              <p className="text-lg mb-8 text-blue-100">
                Solicite um orçamento hoje e conecte-se com os melhores profissionais da sua região.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/request-quote">
                  <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-blue-50 hover-scale">
                    Solicitar orçamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="ghost" className="text-white hover:bg-primary/80 hover-scale">
                    Explorar serviços
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
