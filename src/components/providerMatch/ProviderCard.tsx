
import React from 'react';
import { ProviderMatch } from '@/lib/types/providerMatch';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProviderCardProps {
  provider: ProviderMatch;
  onViewDetails: (providerId: string) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onViewDetails }) => {
  const { provider: providerData, distance, totalPrice, isWithinRadius } = provider;
  
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* Avatar placeholder, pode ser substituído por uma imagem real */}
            <span className="text-2xl font-semibold text-gray-500">
              {providerData.name?.charAt(0) || "P"}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{providerData.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {providerData.city && providerData.neighborhood 
                  ? `${providerData.neighborhood}, ${providerData.city}` 
                  : 'Localização não disponível'}
              </span>
            </div>
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
        
        <div className="flex justify-between items-center mt-4">
          {distance !== null && (
            <div>
              <p className="text-sm text-muted-foreground">Distância:</p>
              <p className={`font-medium ${isWithinRadius ? 'text-green-600' : 'text-amber-600'}`}>
                {distance.toFixed(1)} km
              </p>
            </div>
          )}
          
          <div className={`text-${distance !== null ? 'right' : 'left'}`}>
            <p className="text-sm text-muted-foreground">Valor estimado:</p>
            <p className="font-bold text-lg text-primary">{formatCurrency(totalPrice)}</p>
          </div>
        </div>
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
