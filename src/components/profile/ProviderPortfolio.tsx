
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UploadCloud, X, Image as ImageIcon, Lock } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ProviderPortfolio: React.FC = () => {
  const { user } = useAuth();
  const { featureLimits, loading: loadingFeatures } = useFeatureFlags();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [description, setDescription] = useState('');

  // Obter o limite de imagens baseado na assinatura
  const imageLimit = featureLimits?.portfolio_image_limit?.limit ?? 5;
  const isLimitExceeded = imageLimit !== null && portfolio.length >= imageLimit;
  const isLimitReached = imageLimit !== null && portfolio.length >= imageLimit;
  const isUnlimited = imageLimit === null;

  useEffect(() => {
    async function loadPortfolio() {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('provider_portfolio')
          .select('*')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPortfolio(data || []);
      } catch (error) {
        console.error('Error loading portfolio:', error);
        toast.error('Erro ao carregar portfólio');
      } finally {
        setLoading(false);
      }
    }
    
    loadPortfolio();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if we've reached the maximum number of images
    if (isLimitReached) {
      toast.error(`Você atingiu o limite de ${imageLimit} imagens. Faça upgrade para adicionar mais.`);
      return;
    }
    
    const file = files[0];
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('O arquivo é muito grande. O tamanho máximo é 5MB.');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas.');
      return;
    }
    
    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;
      
      // For now, we'll simulate storage since we don't have a storage bucket configured
      // In a real application, this would upload to Supabase Storage
      // const { data: uploadData, error: uploadError } = await supabase.storage
      //   .from('portfolio')
      //   .upload(filePath, file);
      // 
      // if (uploadError) throw uploadError;
      
      // Instead, we'll use a data URL for demo purposes
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        // Save the image URL to the database
        const { error: insertError } = await supabase
          .from('provider_portfolio')
          .insert({
            provider_id: user.id,
            image_url: dataUrl, // In a real app, this would be a Supabase storage URL
            description: description
          });
        
        if (insertError) throw insertError;
        
        // Reload the portfolio
        const { data: newPortfolio, error: reloadError } = await supabase
          .from('provider_portfolio')
          .select('*')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });
        
        if (reloadError) throw reloadError;
        
        setPortfolio(newPortfolio || []);
        setDescription('');
        toast.success('Imagem adicionada com sucesso');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('provider_portfolio')
        .delete()
        .eq('id', id)
        .eq('provider_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setPortfolio(portfolio.filter(item => item.id !== id));
      toast.success('Imagem removida com sucesso');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  if (loading || loadingFeatures) {
    return <div className="p-4 text-center">Carregando portfólio...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <CardTitle>Meu Portfólio</CardTitle>
            {!isUnlimited && (
              <div className="text-sm text-muted-foreground">
                {portfolio.length} / {imageLimit} imagens
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLimitReached && !isUnlimited && (
              <Alert className="bg-amber-50 border-amber-200">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertTitle>Limite de imagens atingido</AlertTitle>
                <AlertDescription>
                  Você atingiu o limite de {imageLimit} imagens no seu plano atual.{' '}
                  <Link to="/subscription" className="font-medium underline text-amber-600">
                    Faça upgrade para adicionar mais imagens
                  </Link>.
                </AlertDescription>
              </Alert>
            )}
            
            {portfolio.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Você ainda não possui imagens no seu portfólio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.map((item) => (
                  <div key={item.id} className="relative group overflow-hidden rounded-lg border">
                    <img 
                      src={item.image_url} 
                      alt="Portfolio" 
                      className="w-full h-48 object-cover"
                    />
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {item.description && (
                      <div className="p-3 text-sm">
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {(!isLimitReached || isUnlimited) && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {portfolio.length > 0 && !isUnlimited
                    ? `Você pode adicionar mais ${imageLimit - portfolio.length} imagens ao seu portfólio.` 
                    : isUnlimited
                      ? 'Seu plano permite adicionar imagens ilimitadas ao seu portfólio.'
                      : `Adicione até ${imageLimit} imagens ao seu portfólio para mostrar seus trabalhos.`}
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva o trabalho realizado nesta imagem..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label 
                      htmlFor="image-upload" 
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Clique para fazer upload</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <Input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderPortfolio;
