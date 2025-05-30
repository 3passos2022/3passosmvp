
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Star, Phone, Mail, Send, User, Portfolio, Calculator } from 'lucide-react';
import { ProviderDetails } from '@/lib/types/providerMatch';
import { QuoteDetails } from '@/lib/types/providerMatch';

interface ProviderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderDetails | null;
  quoteDetails: QuoteDetails;
  onSendQuote: (providerId: string) => void;
}

export const ProviderDetailsModal: React.FC<ProviderDetailsModalProps> = ({
  isOpen,
  onClose,
  provider,
  quoteDetails,
  onSendQuote
}) => {
  const [activeTab, setActiveTab] = useState('price');

  if (!provider) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDistance = (distance: number | null) => {
    if (distance === null) return 'Distância não calculada';
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {provider.provider.name}
            <div className="flex items-center gap-1 ml-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">
                {provider.rating > 0 ? provider.rating.toFixed(1) : 'Sem avaliações'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da área de cobertura */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm text-gray-600">
                {formatDistance(provider.distance)} de você
              </span>
            </div>
            <Badge 
              variant={provider.isWithinRadius ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {provider.isWithinRadius ? "Dentro da área de cobertura" : "Fora da área de cobertura"}
            </Badge>
          </div>

          {/* Abas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="price" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Preço & Detalhes
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <Portfolio className="h-4 w-4" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="provider" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Prestador
              </TabsTrigger>
            </TabsList>

            {/* Aba Preço & Detalhes */}
            <TabsContent value="price" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detalhes do serviço solicitado */}
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">Serviço Solicitado</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Serviço:</strong> {quoteDetails.serviceName}</p>
                      {quoteDetails.subServiceName && (
                        <p><strong>Categoria:</strong> {quoteDetails.subServiceName}</p>
                      )}
                      {quoteDetails.specialtyName && (
                        <p><strong>Especialidade:</strong> {quoteDetails.specialtyName}</p>
                      )}
                      {quoteDetails.description && (
                        <p><strong>Descrição:</strong> {quoteDetails.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento dos preços */}
                  {provider.priceDetails && provider.priceDetails.length > 0 && (
                    <div className="border-b pb-4">
                      <h4 className="font-medium mb-2">Detalhamento dos Preços</h4>
                      <div className="space-y-2">
                        {provider.priceDetails.map((detail, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{detail.itemName || `Item ${detail.itemId}`}</span>
                              {detail.quantity && (
                                <span className="text-gray-500 ml-2">
                                  {detail.quantity} x {formatPrice(detail.pricePerUnit)}
                                </span>
                              )}
                              {detail.area && (
                                <span className="text-gray-500 ml-2">
                                  {detail.area.toFixed(2)}m² x {formatPrice(detail.pricePerUnit)}/m²
                                </span>
                              )}
                            </div>
                            <span className="font-medium">{formatPrice(detail.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Estimado:</span>
                    <span className="text-green-600">{formatPrice(provider.totalPrice)}</span>
                  </div>

                  {/* Informações sobre o orçamento */}
                  <div className="text-xs text-gray-500 mt-2">
                    * Este é um valor estimado. O preço final pode variar após avaliação presencial.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Portfolio */}
            <TabsContent value="portfolio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio de Trabalhos</CardTitle>
                </CardHeader>
                <CardContent>
                  {provider.portfolioItems && provider.portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {provider.portfolioItems.map((item) => (
                        <div key={item.id} className="space-y-2">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.description || 'Portfolio item'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Portfolio className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Este prestador ainda não adicionou trabalhos ao portfolio.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Dados do Prestador */}
            <TabsContent value="provider" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Prestador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Biografia */}
                  {provider.provider.bio && (
                    <div>
                      <h4 className="font-medium mb-2">Sobre</h4>
                      <p className="text-sm text-gray-600">{provider.provider.bio}</p>
                    </div>
                  )}

                  {/* Localização */}
                  <div>
                    <h4 className="font-medium mb-2">Localização</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {provider.provider.neighborhood && provider.provider.city
                          ? `${provider.provider.neighborhood}, ${provider.provider.city}`
                          : provider.provider.city || 'Localização não informada'}
                      </span>
                    </div>
                    {provider.provider.serviceRadiusKm && (
                      <p className="text-xs text-gray-500 mt-1">
                        Atende em um raio de {provider.provider.serviceRadiusKm}km
                      </p>
                    )}
                  </div>

                  {/* Contato */}
                  <div>
                    <h4 className="font-medium mb-2">Contato</h4>
                    <div className="space-y-2">
                      {provider.provider.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{provider.provider.phone}</span>
                        </div>
                      )}
                      {provider.provider.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{provider.provider.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div>
                    <h4 className="font-medium mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.provider.specialties.map((specialty) => (
                        <Badge key={specialty.id} variant="secondary">
                          {specialty.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Avaliação */}
                  <div>
                    <h4 className="font-medium mb-2">Avaliação</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= provider.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {provider.rating > 0 
                          ? `${provider.rating.toFixed(1)} de 5.0`
                          : 'Sem avaliações ainda'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botão de ação */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => onSendQuote(provider.provider.userId)}
              disabled={!provider.isWithinRadius}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {provider.isWithinRadius ? 'Enviar Solicitação' : 'Fora da Área de Cobertura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
