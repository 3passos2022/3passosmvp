
import React from 'react';
import { ProviderMatch, PriceDetail } from '@/lib/types/providerMatch';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProviderCardProps {
  provider: ProviderMatch;
  onViewDetails: (providerId: string) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onViewDetails }) => {
  const { provider: providerData, distance, totalPrice, isWithinRadius, priceDetails = [] } = provider;
  
  // Debug the price information with additional context
  console.log(`Provider ${providerData.name} (${providerData.userId}) price details:`, priceDetails);
  console.log(`Provider ${providerData.name} (${providerData.userId}) total price:`, totalPrice);
  
  // Helper function to display price breakdown
  const renderPriceBreakdown = () => {
    if (!priceDetails || priceDetails.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">Valor base (aproximado)</p>
      );
    }

    return (
      <p className="text-xs text-muted-foreground">Valor calculado</p>
    );
  };
  
  return (
    <Card className={`w-full overflow-hidden transition-all hover:shadow-md ${!isWithinRadius ? 'border-amber-300' : ''}`}>
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* Avatar placeholder */}
            <span className="text-2xl font-semibold text-gray-500">
              {providerData.name?.charAt(0) || "P"}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{providerData.name}</h3>
            {(providerData.city && providerData.neighborhood) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {`${providerData.neighborhood}, ${providerData.city}`}
                </span>
              </div>
            )}
            <div className="flex items-center mt-1">
              <Star className={`h-4 w-4 ${providerData.averageRating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              <span className="ml-1 text-sm">
                {providerData.averageRating > 0 
                  ? providerData.averageRating.toFixed(1) 
                  : 'Novo'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="text-sm line-clamp-2 text-muted-foreground mb-2">
          {providerData.bio || 'Este prestador não possui uma descrição.'}
        </div>
        
        {!isWithinRadius && (
          <div className="mb-3 p-2 bg-amber-50 rounded-md flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">
              Prestador a {distance !== null ? `${distance.toFixed(1)}km` : 'distância desconhecida'} de distância
              {providerData.serviceRadiusKm > 0 ? ` (raio: ${providerData.serviceRadiusKm}km)` : ''}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          {distance !== null && providerData.hasAddress && (
            <div>
              <p className="text-sm text-muted-foreground">Distância:</p>
              <p className={`font-medium ${isWithinRadius ? 'text-green-600' : 'text-amber-600'}`}>
                {distance.toFixed(1)} km
              </p>
            </div>
          )}
          
          <div className={`text-${(distance !== null && providerData.hasAddress) ? 'right' : 'left'}`}>
            <p className="text-sm text-muted-foreground">Valor estimado:</p>
            <p className="font-bold text-lg text-primary">{formatCurrency(totalPrice || 0)}</p>
            {renderPriceBreakdown()}
          </div>
        </div>

        {/* Price details section */}
        {priceDetails && priceDetails.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-1">Detalhes do preço:</p>
            <div className="space-y-1 text-xs">
              {priceDetails.map((detail, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>
                    {detail.itemName || `Item ${detail.itemId}`}
                    {detail.quantity > 0 ? ` (${detail.quantity}x)` : ''}
                    {detail.area ? ` (${detail.area.toFixed(1)} m²)` : ''}
                  </span>
                  <span>{formatCurrency(detail.total || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={() => onViewDetails(providerData.userId)}
        >
          Ver mais informações
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProviderCard;
