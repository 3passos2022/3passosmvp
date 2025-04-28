
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureLimit {
  limit: number | null;
  [key: string]: any;
}

export const useFeatureFlags = () => {
  const { user } = useAuth();
  const [featureLimits, setFeatureLimits] = useState<Record<string, FeatureLimit>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getFeatureLimit = useCallback(async (featureName: string): Promise<FeatureLimit | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_feature_limit', { p_user_id: user.id, p_feature_name: featureName });

      if (error) throw error;
      
      return data as FeatureLimit;
    } catch (err) {
      console.error(`Erro ao buscar limite da feature ${featureName}:`, err);
      return null;
    }
  }, [user]);

  const loadAllFeatures = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const featureNames = [
        'portfolio_image_limit',
        'provider_services_limit',
        'visible_providers_limit'
      ];

      const limits: Record<string, FeatureLimit> = {};

      for (const name of featureNames) {
        const limit = await getFeatureLimit(name);
        if (limit) {
          limits[name] = limit;
        }
      }

      setFeatureLimits(limits);
    } catch (err) {
      console.error('Erro ao carregar feature flags:', err);
      setError('Falha ao carregar configurações de recursos');
    } finally {
      setLoading(false);
    }
  }, [user, getFeatureLimit]);

  useEffect(() => {
    loadAllFeatures();
  }, [loadAllFeatures]);

  return {
    loading,
    error,
    featureLimits,
    getFeatureLimit,
    refresh: loadAllFeatures
  };
};
