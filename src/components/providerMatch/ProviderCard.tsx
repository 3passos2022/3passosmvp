
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProviderMatch } from '@/lib/types/providerMatch';
import { CheckCircle } from 'lucide-react';

interface ProviderCardProps {
  provider: ProviderMatch;
  onViewDetails: (providerId: string) => void;
  quoteId?: string;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onViewDetails, quoteId }) => {
  const { userId, name, averageRating, city, neighborhood, avatar_url } = provider.provider;
  const { totalPrice, distance, isWithinRadius } = provider;

  return (
    <Card className="relative">
      {/* Badge indicating if the quote has been sent */}
      {/* {quoteSent && (
        <Badge variant="outline" className="absolute top-2 right-2 bg-green-50 text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Orçamento enviado
        </Badge>
      )} */}

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
            {avatar_url ? (
              <AvatarImage src={avatar_url} alt={name || 'Provider'} />
            ) : null}
            <AvatarFallback>{name?.charAt(0) || 'P'}</AvatarFallback>
          </Avatar>
          {name}
          {averageRating > 0 && (
            <Badge variant="secondary" className="ml-2 flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {city && neighborhood ? `${neighborhood}, ${city}` : 'Localização não informada'}
          {distance !== null && `, ${distance.toFixed(2)} km`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold text-primary">
          {formatCurrency(totalPrice)}
        </div>
        <p className="text-sm text-muted-foreground">
          *Preço estimado para o serviço solicitado
        </p>
        {isWithinRadius ? (
          <Badge variant="outline" className="mt-2 bg-green-50 text-green-600 border-green-200">
            Atende na sua região
          </Badge>
        ) : (
          <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-600 border-amber-200">
            Fora da área de atendimento
          </Badge>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {quoteId ? (
          <Button asChild variant="link">
            <Link to={`/request-quote?quoteId=${quoteId}&providerId=${userId}`}>
              Editar Orçamento
            </Link>
          </Button>
        ) : (
          <div></div>
        )}
        <Button onClick={() => onViewDetails(userId)}>Ver Detalhes</Button>
      </CardFooter>
    </Card>
  );
};

export default ProviderCard;
