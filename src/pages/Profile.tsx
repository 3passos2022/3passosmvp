
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import ProviderSettings from '@/components/profile/ProviderSettings';
import ProviderPortfolio from '@/components/profile/ProviderPortfolio';
import ProviderServices from '@/components/profile/ProviderServices';
import QuotesList from '@/components/profile/QuotesList';
import RequestedQuotes from '@/components/profile/RequestedQuotes';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { user, loading, session, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quotes');

  console.log('Profile page rendered with:', {
    hasUser: !!user,
    hasSession: !!session,
    isLoading: loading
  });

  // Effect to attempt profile refresh if session exists but no user
  useEffect(() => {
    if (!loading && session && !user) {
      console.log('Session exists but no user profile, attempting to refresh');
      refreshUser().catch(err => {
        console.error('Failed to refresh user profile:', err);
        toast.error('Falha ao carregar dados do usuário');
      });
    }
  }, [loading, session, user, refreshUser]);

  // Effect to redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [loading, session, navigate]);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading || !user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Olá, {user.name || user.email.split('@')[0]}</h1>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {user.role === UserRole.CLIENT ? 'Cliente' : 
                       user.role === UserRole.PROVIDER ? 'Prestador de Serviços' : 
                       'Administrador'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 flex flex-wrap">
                  <TabsTrigger value="quotes">Meus Orçamentos</TabsTrigger>
                  
                  {user.role === UserRole.PROVIDER && (
                    <>
                      <TabsTrigger value="requested">Orçamentos Solicitados</TabsTrigger>
                      <TabsTrigger value="services">Meus Serviços</TabsTrigger>
                      <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                      <TabsTrigger value="settings">Configurações</TabsTrigger>
                    </>
                  )}
                </TabsList>
                
                <TabsContent value="quotes">
                  <QuotesList />
                </TabsContent>
                
                {user.role === UserRole.PROVIDER && (
                  <>
                    <TabsContent value="requested">
                      <RequestedQuotes />
                    </TabsContent>
                    
                    <TabsContent value="services">
                      <ProviderServices />
                    </TabsContent>
                    
                    <TabsContent value="portfolio">
                      <ProviderPortfolio />
                    </TabsContent>
                    
                    <TabsContent value="settings">
                      <ProviderSettings />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
