
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 to-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-20 z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 max-w-2xl"
          >
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block py-1 px-3 mb-6 rounded-full bg-primary/10 text-primary font-medium text-sm"
            >
              A forma mais simples de contratar serviços
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
            >
              Serviços profissionais em <span className="text-gradient">3 passos simples</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg mb-8 text-gray-600"
            >
              Encontre pedreiros, eletricistas, encanadores e outros profissionais qualificados para resolver seu problema. 
              Solicite orçamentos, compare preços e contrate sem complicações.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/request-quote">
                <Button size="lg" className="hover-scale">
                  Solicitar orçamento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="lg" className="hover-scale">
                  Ver todos os serviços
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex-1 relative max-w-md"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl glass-morphism bg-white/70">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 z-0"></div>
              
              <div className="relative z-10 p-8 flex flex-col h-full justify-center">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl">
                    3
                  </div>
                </div>

                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                    <div>
                      <h3 className="font-bold text-lg">Informações pessoais</h3>
                      <p className="text-gray-600">Preencha seus dados básicos para começar</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                    <div>
                      <h3 className="font-bold text-lg">Detalhes do serviço</h3>
                      <p className="text-gray-600">Explique o que você precisa</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                    <div>
                      <h3 className="font-bold text-lg">Seu endereço</h3>
                      <p className="text-gray-600">Informe onde o serviço será realizado</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Floating elements for decoration */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute w-24 h-24 bg-blue-100 rounded-lg -top-10 -right-10 shadow-lg"
            />
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: 1 }}
              className="absolute w-16 h-16 bg-primary/10 rounded-full -bottom-8 -left-8"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
