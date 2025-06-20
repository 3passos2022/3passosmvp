
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ProviderRatingProps {
  providerId?: string;
  showCount?: boolean;
}

const ProviderRating: React.FC<ProviderRatingProps> = ({ 
  providerId, 
  showCount = true 
}) => {
  const { user } = useAuth();
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const targetProviderId = providerId || user?.id;

  useEffect(() => {
    if (targetProviderId) {
      fetchProviderRating();
    }
  }, [targetProviderId]);

  const fetchProviderRating = async () => {
    if (!targetProviderId) return;

    try {
      const { data: ratings, error } = await supabase
        .from('provider_ratings')
        .select('rating')
        .eq('provider_id', targetProviderId);

      if (error) throw error;

      if (ratings && ratings.length > 0) {
        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        setAverageRating(Number(average.toFixed(1)));
        setTotalRatings(ratings.length);
      } else {
        setAverageRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 stroke-yellow-400"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-4 w-4 stroke-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 stroke-gray-300"
          />
        );
      }
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="animate-pulse flex space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {renderStars()}
      </div>
      <span className="text-sm font-medium">
        {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
      </span>
      {showCount && totalRatings > 0 && (
        <span className="text-sm text-muted-foreground">
          ({totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  );
};

export default ProviderRating;
