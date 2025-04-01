
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

const ProvidersFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado para controlar os prestadores encontrados
  const [providers, setProviders] = useState<ProviderMatch[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ProviderMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetails | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterOption>('');
  
  // Carregamento da API do Google Maps
  const googleMapsApiKey = 'SUBSTITUA_PELA_SUA_API_KEY'; // Substitua pela sua chave API
  const isMapsLoaded = useGoogleMaps(googleMapsApiKey);
  
  // Efeito para carregar detalhes do orçamento da sessão ou URL
  useEffect(() => {
    const fetchQuoteDetails = async () => {
      setIsLoading(true);
      
      try {
        // Verificar se há detalhes do orçamento na URL (state do react-router)
        if (location.state?.quoteDetails) {
          setQuoteDetails(location.state.quoteDetails);
          return;
        }
        
        // Verificar se há detalhes do orçamento no sessionStorage
        const storedQuote = sessionStorage.getItem('currentQuote');
        if (storedQuote) {
          setQuoteDetails(JSON.parse(storedQuote));
          return;
        }
        
        // Se não houver detalhes, redirecionar para a página de orçamento
        toast({
          title: "Informações insuficientes",
          description: "Por favor, complete o formulário de orçamento primeiro.",
          variant: "destructive",
        });
        
        navigate('/request-quote');
      } catch (error) {
        console.error('Erro ao carregar detalhes do orçamento:', error);
        toast({
          title: "Erro ao carregar orçamento",
          description: "Ocorreu um erro ao processar seu orçamento.",
          variant: "destructive",
        });
        
        navigate('/request-quote');
      }
    };
    
    fetchQuoteDetails();
  }, [location, navigate, toast]);
  
  // Efeito para buscar prestadores quando o Google Maps estiver carregado e tivermos os detalhes do orçamento
  useEffect(() => {
    const fetchProviders = async () => {
      if (!isMapsLoaded || !quoteDetails) return;
      
      setIsLoading(true);
      
      try {
        const matchingProviders = await findMatchingProviders(quoteDetails);
        setProviders(matchingProviders);
        setFilteredProviders(matchingProviders);
      } catch (error) {
        console.error('Erro ao buscar prestadores:', error);
        toast({
          title: "Erro ao buscar prestadores",
          description: "Não foi possível encontrar prestadores para seu orçamento.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProviders();
  }, [isMapsLoaded, quoteDetails, toast]);
  
  // Efeito para carregar detalhes do prestador selecionado
  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (!selectedProviderId) return;
      
      try {
        const details = await getProviderDetails(selectedProviderId);
        if (details) {
          // Adicionar informações de distância e preço do prestador original
          const originalProvider = providers.find(p => p.provider.userId === selectedProviderId);
          if (originalProvider) {
            details.distance = originalProvider.distance;
            details.totalPrice = originalProvider.totalPrice;
            details.isWithinRadius = originalProvider.isWithinRadius;
          }
          
          setSelectedProvider(details);
          setIsModalOpen(true);
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
  
  // Função para lidar com a mudança de filtros
  const handleFilterChange = (filter: FilterOption) => {
    setCurrentFilter(filter);
    
    if (!filter || filter === '') {
      // Ordenar por relevância (prestadores no raio primeiro, depois por distância)
      setFilteredProviders([...providers].sort((a, b) => {
        if (a.isWithinRadius && !b.isWithinRadius) return -1;
        if (!a.isWithinRadius && b.isWithinRadius) return 1;
        return a.distance - b.distance;
      }));
      return;
    }
    
    let sorted = [...providers];
    
    switch (filter) {
      case 'distance':
        sorted = sorted.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        sorted = sorted.sort((a, b) => a.totalPrice - b.totalPrice);
        break;
      case 'rating':
        sorted = sorted.sort((a, b) => b.provider.averageRating - a.provider.averageRating);
        break;
    }
    
    setFilteredProviders(sorted);
  };
  
  // Função para lidar com a visualização de detalhes do prestador
  const handleViewDetails = (providerId: string) => {
    setSelectedProviderId(providerId);
  };
  
  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProviderId(null);
    setSelectedProvider(null);
  };
  
  // Renderizar mensagem de prestadores não encontrados
  const renderNoProvidersMessage = () => {
    const inRadiusProviders = providers.filter(p => p.isWithinRadius);
    
    if (providers.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">Nenhum prestador encontrado</h3>
          <p className="text-muted-foreground">
            Não encontramos prestadores disponíveis para este serviço no momento.
          </p>
        </div>
      );
    }
    
    if (inRadiusProviders.length === 0) {
      return (
        <div className="text-center py-6 mb-4 bg-amber-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Não foram encontrados prestadores de serviço que atendam sua região</h3>
          <p className="text-muted-foreground">
            Confira abaixo outros prestadores próximos que talvez possam atender seu orçamento.
          </p>
        </div>
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
          
          {isLoading ? (
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
                    onFilterChange={handleFilterChange} 
                    currentFilter={currentFilter} 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProviders.map((provider) => (
                      <ProviderCard 
                        key={provider.provider.userId} 
                        provider={provider} 
                        onViewDetails={handleViewDetails} 
                      />
                    ))}
                  </div>
                </>
              )}
              
              {selectedProvider && quoteDetails && (
                <ProviderDetailsModal 
                  provider={selectedProvider} 
                  isOpen={isModalOpen} 
                  onClose={handleCloseModal} 
                  quoteDetails={quoteDetails} 
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
