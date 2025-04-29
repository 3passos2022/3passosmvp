
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { useNavigate, Link } from 'react-router-dom';
import ProviderSettings from '@/components/profile/ProviderSettings';
import ProviderPortfolio from '@/components/profile/ProviderPortfolio';
import ProviderServices from '@/components/profile/ProviderServices';
import QuotesList from '@/components/profile/QuotesList';
import RequestedQuotes from '@/components/profile/RequestedQuotes';
import { toast } from 'sonner';
import UserProfile from '@/components/profile/UserProfile';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import { User, CreditCard, FileText, Settings, Briefcase } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, loading, session, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  console.log('Profile page rendered with:', {
    hasUser: !!user,
    hasSession: !!session,
    isLoading: loading,
    userRole: user?.role,
    userRoleType: user ? typeof user.role : 'undefined'
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

  // Extract path from URL to set active tab
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/profile/quotes')) {
      setActiveTab('quotes');
    } else if (path.includes('/profile/requested')) {
      setActiveTab('requested');
    } else if (path.includes('/profile/subscription')) {
      setActiveTab('subscription');
    } else if (path.includes('/profile/settings')) {
      setActiveTab('settings');
    } else if (path.includes('/profile/services')) {
      setActiveTab('services');
    } else if (path.includes('/profile/portfolio')) {
      setActiveTab('portfolio');
    } else {
      setActiveTab('profile');
    }
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    let path = '/profile';
    switch (value) {
      case 'quotes':
        path = '/profile/quotes';
        break;
      case 'requested':
        path = '/profile/requested';
        break;
      case 'subscription':
        path = '/profile/subscription';
        break;
      case 'settings':
        path = '/profile/settings';
        break;
      case 'services':
        path = '/profile/services';
        break;
      case 'portfolio':
        path = '/profile/portfolio';
        break;
      default:
        path = '/profile';
    }
    
    navigate(path);
  };

  // Helper function to check if user is provider
  const isProvider = () => {
    if (!user) return false;
    
    // Check both enum and string value to be safe
    return user.role === UserRole.PROVIDER || user.role === 'provider';
  };
  
  // Helper function to check if user is admin
  const isAdmin = () => {
    if (!user) return false;
    
    // Check both enum and string value to be safe
    return user.role === UserRole.ADMIN || user.role === 'admin';
  };

  console.log("User role checks:", {
    roleValue: user.role,
    roleType: typeof user.role,
    isProvider: isProvider(),
    isAdmin: isAdmin(),
    UserRoleEnum: UserRole,
    matchesProviderEnum: user.role === UserRole.PROVIDER,
    matchesAdminEnum: user.role === UserRole.ADMIN
  });

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
                      {isProvider() ? 'Prestador de Serviços' : 
                       isAdmin() ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-6 flex flex-wrap">
                  {/* Tabs comuns a todos os tipos de usuário */}
                  <TabsTrigger value="profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Minhas Informações
                  </TabsTrigger>
                  
                  <TabsTrigger value="quotes" className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Meus Orçamentos
                  </TabsTrigger>
                  
                  {/* Tabs para prestadores e admins */}
                  {(isProvider() || isAdmin()) && (
                    <>
                      <TabsTrigger value="requested" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Orçamentos Recebidos
                      </TabsTrigger>
                      
                      <TabsTrigger value="settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações de Serviço
                      </TabsTrigger>
                    </>
                  )}
                  
                  {/* Tab de assinatura para todos */}
                  <TabsTrigger value="subscription" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Minha Assinatura
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <UserProfile />
                </TabsContent>
                
                <TabsContent value="quotes">
                  <QuotesList />
                </TabsContent>
                
                {(isProvider() || isAdmin()) && (
                  <>
                    <TabsContent value="requested">
                      <RequestedQuotes />
                    </TabsContent>
                    
                    <TabsContent value="settings">
                      <ProviderSettings />
                    </TabsContent>
                  </>
                )}
                
                <TabsContent value="subscription">
                  <SubscriptionManager />
                </TabsContent>
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
