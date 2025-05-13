import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProviderMatch, ProviderDetails, QuoteDetails } from '@/lib/types/providerMatch';
import { findMatchingProviders, getProviderDetails } from '@/lib/services/providerMatchService';
import { useGoogleMaps } from '@/lib/services/googleMapsService';
import ProviderCard from '@/components/providerMatch/ProviderCard';
import ProviderDetailsModal from '@/components/providerMatch/ProviderDetailsModal';
import ProviderFilters, { FilterOption } from '@/components/providerMatch/ProviderFilters';
import { toast as sonnerToast } from 'sonner';
import { ENV } from '@/env';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { retrieveQuoteData } from '@/lib/utils/quoteStorage';

// Definindo a variável de ambiente do Google Maps
declare global {
  interface Window {
    ENV_GOOGLE_MAPS_API_KEY?: string;
  }
}

const ProvidersFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { featureLimits, loading: loadingFeatures } = useFeatureFlags();
  
  const [providers, setProviders] = useState<ProviderMatch[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ProviderMatch[]>([]);
  const [displayedProviders, setDisplayedProviders] = useState<ProviderMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetails | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterOption>('relevance');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Obter o limite de prestadores visíveis baseado na assinatura
  const providersLimit = featureLimits?.visible_providers_limit?.limit ?? 3;
  const isUnlimited = providersLimit === null;
  
  const googleMapsApiKey = ENV.GOOGLE_MAPS_API_KEY;
  const isMapsLoaded = useGoogleMaps(googleMapsApiKey);
  
  useEffect(() => {
    const fetchQuoteDetails = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        console.log('Starting to load quote details from location state or sessionStorage');
        
        // First try to get quote details from location state
        if (location.state?.quoteDetails) {
          console.log('Quote details found in router state:', location.state.quoteDetails);
          setQuoteDetails(location.state.quoteDetails);
          return;
        }
        
        // If not in location state, try to get from sessionStorage using our utility
        const storedQuote = retrieveQuoteData();
        if (storedQuote) {
          console.log('Quote details found in sessionStorage:', storedQuote);
          setQuoteDetails(storedQuote);
          return;
        }
        
        // If we reach here, no quote details were found
        console.error('No quote details found in location state or sessionStorage');
        
        toast({
          title: "Informações insuficientes",
          description: "Por favor, complete o formulário de orçamento primeiro.",
          variant: "destructive",
        });
        
        navigate('/request-quote');
      } catch (error) {
        console.error('Error loading quote details:', error);
        setErrorMessage("Erro ao carregar detalhes do orçamento");
        
        toast({
          title: "Erro ao carregar orçamento",
          description: "Ocorreu um erro ao processar seu orçamento.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuoteDetails();
  }, [location, navigate, toast]);
  
  useEffect(() => {
    const fetchProviders = async () => {
      if (!quoteDetails) {
        console.log('Waiting for quote details');
        return;
      }
      
      setIsLoading(true);
      setErrorMessage(null);
      console.log('Searching providers for quote:', quoteDetails);
      
      try {
        console.log('Starting provider search with quote details');
        console.log(`Service: ${quoteDetails.serviceName} (${quoteDetails.serviceId})`);
        console.log(`Subservice: ${quoteDetails.subServiceName || 'None'} (${quoteDetails.subServiceId || 'None'})`);
        console.log(`Specialty: ${quoteDetails.specialtyName || 'None'} (${quoteDetails.specialtyId || 'None'})`);
        
        // Validate quote data before searching
        if (!quoteDetails.serviceId) {
          throw new Error('Service ID not provided');
        }
        
        if (!quoteDetails.address || !quoteDetails.address.city) {
          console.warn('Address information incomplete, this may affect provider matching');
        }
        
        // Search for all available providers with improved error handling
        try {
          console.log('Calling findMatchingProviders with quote details');
          const matchingProviders = await findMatchingProviders(quoteDetails);
          console.log('Providers found:', matchingProviders?.length || 0);
          
          if (!matchingProviders || matchingProviders.length === 0) {
            console.warn('No providers found for the given criteria');
            sonnerToast.warning('Nenhum prestador encontrado', {
              description: 'Não conseguimos encontrar prestadores para este serviço no momento. Estamos trabalhando para adicionar mais prestadores.',
              duration: 5000
            });
          } else {
            console.log('Matched providers sample:');
            matchingProviders.slice(0, 2).forEach((provider, index) => {
              console.log(`[${index + 1}] ${provider.provider.name}: price=${provider.totalPrice}, distance=${provider.distance}, within radius=${provider.isWithinRadius}`);
            });
          }
          
          // Store all providers
          setProviders(matchingProviders || []);
          
          // Apply initial filter to all providers (even if empty)
          handleFilterChange('relevance', matchingProviders || []);
        } catch (providerError: any) {
          console.error('Specific error when searching providers:', providerError);
          
          // Additional logging for debugging
          if (providerError.code) {
            console.error('Error code:', providerError.code);
          }
          if (providerError.details) {
            console.error('Error details:', providerError.details);
          }
          
          throw new Error(`Failed to find providers: ${providerError.message}`);
        }
      } catch (error: any) {
        console.error('Error searching for providers:', error);
        
        // Show specific error message
        setErrorMessage("Não foi possível encontrar prestadores. Por favor, verifique sua conexão e tente novamente.");
        
        toast({
          title: "Erro ao buscar prestadores",
          description: error.message || "Não foi possível encontrar prestadores para seu orçamento.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProviders();
  }, [quoteDetails, toast]);
  
  useEffect(() => {
    // Aplicar o limite de prestadores exibidos com base no plano de assinatura
    if (!isUnlimited && providersLimit !== null && filteredProviders.length > providersLimit) {
      setDisplayedProviders(filteredProviders.slice(0, providersLimit));
    } else {
      setDisplayedProviders(filteredProviders);
    }
  }, [filteredProviders, providersLimit, isUnlimited]);
  
  const handleFilterChange = (filter: FilterOption, providersToFilter = providers) => {
    setCurrentFilter(filter);
    
    if (!providersToFilter.length) {
      setFilteredProviders([]);
      return;
    }
    
    let sorted = [...providersToFilter];
    
    switch (filter) {
      case 'distance':
        sorted = sorted.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        break;
      case 'price':
        sorted = sorted.sort((a, b) => {
          if (a.totalPrice === 0 && b.totalPrice > 0) return 1;
          if (a.totalPrice > 0 && b.totalPrice === 0) return -1;
          return a.totalPrice - b.totalPrice;
        });
        break;
      case 'rating':
        sorted = sorted.sort((a, b) => b.provider.averageRating - a.provider.averageRating);
        break;
      case 'relevance':
      default:
        sorted = sorted.sort((a, b) => {
          if (a.isWithinRadius && !b.isWithinRadius) return -1;
          if (!a.isWithinRadius && b.isWithinRadius) return 1;
          
          // Sort by relevance score if present
          const relevanceA = a.provider.relevanceScore || 0;
          const relevanceB = b.provider.relevanceScore || 0;
          if (relevanceA !== relevanceB) {
            return relevanceB - relevanceA;  // Higher score first
          }
          
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance;
          }
          
          return 0;
        });
        break;
    }
    
    console.log(`Applied filter '${filter}', showing ${sorted.length} providers`);
    setFilteredProviders(sorted);
  };
  
  const handleViewDetails = (providerId: string) => {
    if (!providerId) {
      console.error('ID do prestador não fornecido');
      return;
    }
    setSelectedProviderId(providerId);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProviderId(null);
    setSelectedProvider(null);
  };

  const handleLoginRedirect = () => {
    if (quoteDetails) {
      try {
        sessionStorage.setItem('currentQuote', JSON.stringify(quoteDetails));
      } catch (storageError) {
        console.error('Erro ao armazenar orçamento:', storageError);
      }
      
      sessionStorage.setItem('redirectAfterLogin', '/prestadoresencontrados');
      
      if (selectedProviderId) {
        sessionStorage.setItem('selectedProviderId', selectedProviderId);
      }
    }
    navigate('/login');
  };
  
  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (!selectedProviderId) return;
      
      try {
        const details = await getProviderDetails(selectedProviderId);
        if (details) {
          const originalProvider = providers.find(p => p.provider.userId === selectedProviderId);
          if (originalProvider) {
            details.distance = originalProvider.distance;
            details.totalPrice = originalProvider.totalPrice;
            details.isWithinRadius = originalProvider.isWithinRadius;
            details.priceDetails = originalProvider.priceDetails;
          }
          
          setSelectedProvider(details);
          setIsModalOpen(true);
        } else {
          throw new Error('Não foi possível obter detalhes do prestador');
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do prestador:', error);
        toast({
          title: "Erro ao carregar detalhes",
          description: "Não foi possível carregar as informações do prestador.",
          variant: "destructive",
        });
      }
    };
    
    fetchProviderDetails();
  }, [selectedProviderId, providers, toast]);
  
  const renderNoProvidersMessage = () => {
    if (errorMessage) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">Erro</h3>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
      );
    }
    
    if (providers.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">Nenhum prestador encontrado</h3>
          <p className="text-muted-foreground">
            Estamos ainda expandindo nossa rede de prestadores de serviço.
            Por favor, tente novamente mais tarde ou tente outro serviço.
          </p>
        </div>
      );
    }
    
    const inRadiusProviders = providers.filter(p => p.isWithinRadius);
    
    if (inRadiusProviders.length === 0 && providers.length > 0) {
      return (
        <div className="text-center py-6 mb-4 bg-amber-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Nenhum prestador de serviço foi encontrado que atenda a sua região</h3>
          <p className="text-muted-foreground">
            Veja abaixo outros prestadores próximos que podem atender seu orçamento.
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Renderizar a mensagem de limite de prestadores
  const renderLimitMessage = () => {
    if (!isUnlimited && providersLimit !== null && filteredProviders.length > providersLimit) {
      return (
        <Alert className="mt-4 mb-6 bg-amber-50 border-amber-200">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertTitle>Visualização limitada</AlertTitle>
          <AlertDescription>
            Você está visualizando {providersLimit} de {filteredProviders.length} prestadores disponíveis.{' '}
            <Link to="/subscription" className="font-medium underline text-amber-600">
              Faça upgrade para ver todos os prestadores
            </Link>.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2">Prestadores Encontrados</h1>
          
          {isLoading || loadingFeatures ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-muted-foreground">Buscando prestadores de serviço...</p>
            </div>
          ) : (
            <>
              {renderNoProvidersMessage()}
              
              {filteredProviders.length > 0 && (
                <>
                  <ProviderFilters 
                    onFilterChange={(filter) => handleFilterChange(filter)} 
                    currentFilter={currentFilter} 
                  />
                  
                  {renderLimitMessage()}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedProviders.map((provider) => (
                      <ProviderCard 
                        key={provider.provider.userId} 
                        provider={provider} 
                        onViewDetails={handleViewDetails} 
                      />
                    ))}
                  </div>
                  
                  {!isUnlimited && providersLimit !== null && filteredProviders.length > providersLimit && (
                    <div className="mt-8 text-center">
                      <Button 
                        onClick={() => navigate('/subscription')} 
                        className="px-8"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Fazer upgrade para ver todos os prestadores
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {selectedProvider && quoteDetails && (
                <ProviderDetailsModal 
                  provider={selectedProvider} 
                  isOpen={isModalOpen} 
                  onClose={handleCloseModal} 
                  quoteDetails={{
                    ...quoteDetails,
                    clientId: user?.id || undefined
                  }}
                  onLoginRequired={handleLoginRedirect}
                  isLoggedIn={!!user}
                />
              )}
            </>
          )}
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProvidersFound;
