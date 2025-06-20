
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
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
import { RoleUtils } from '@/lib/utils/RoleUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import './../components/customStylingfiles-and/profiletabs.css';
import ProfileImageEditor from '@/components/profile/ProfileImageEditor';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';

const Profile: React.FC = () => {
  const { user, loading, session, refreshUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingPicture, setLoadingPicture] = useState(false);

  // Effect to attempt profile refresh if session exists but no user
  useEffect(() => {
    if (!loading && session && !user) {
      refreshUser().catch(err => {
        toast.error('Falha ao carregar dados do usuário');
      });
    }
  }, [loading, session, user, refreshUser]);

  // Effect to redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
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

  // Check if user is provider or admin using our utility
  const isProvider = RoleUtils.isProvider(user);
  const isAdmin = RoleUtils.isAdmin(user);

  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
    }
  };

  const handleSaveImage = async (imageData: string) => {
    setLoadingPicture(true);
    try {
      const { error } = await updateProfile({
        avatar_url: imageData
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setLoadingPicture(false);
    }
  };


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
                  <div className="flex flex-row items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={() => setIsImageEditorOpen(true)}>
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar_url} alt={user.name || 'Avatar'} />
                      <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                        Editar
                      </span>
                    </div>
                  </div>
                    <h1 className="text-2xl font-bold">Olá, {user.name || user.email.split('@')[0]}</h1>
                    <p className="text-gray-600">{user.email}</p>
                  </div>

                  <div className="flex items-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {RoleUtils.getAccountTypeLabel(user)}
                    </span>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} >
                <TabsList className="mb-6 flex flex-wrap" id="profile-tabs">
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
                  {(isProvider || isAdmin) && (
                    <>
                      <TabsTrigger value="requested" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Orçamentos Recebidos
                      </TabsTrigger>

                      <TabsTrigger value="settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações de Serviço
                      </TabsTrigger>

                      <TabsTrigger value="portfolio" className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Portfólio
                      </TabsTrigger>

                      <TabsTrigger value="services" className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Meus Serviços
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

                {(isProvider || isAdmin) && (
                  <>
                    <TabsContent value="requested">
                      <RequestedQuotes />
                    </TabsContent>

                    <TabsContent value="settings">
                      <ProviderSettings />
                    </TabsContent>

                    <TabsContent value="portfolio">
                      <ProviderPortfolio />
                    </TabsContent>

                    <TabsContent value="services">
                      <ProviderServices />
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
      <ProfileImageEditor
        open={isImageEditorOpen}
        onClose={() => setIsImageEditorOpen(false)}
        onSave={handleSaveImage}
        initialImage={user.avatar_url}
      />

      <Footer />
    </div>
  );
};

export default Profile;
