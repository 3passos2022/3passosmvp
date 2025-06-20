import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, RotateCw, Crop } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileImageEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (imageData: string) => void;
  initialImage?: string;
}

const ProfileImageEditor: React.FC<ProfileImageEditorProps> = ({
  open,
  onClose,
  onSave,
  initialImage
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Process new file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setSelectedFile(file);
        setRotation(0);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        renderCanvas(img, 0, 1, { x: 0, y: 0 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  // Handle initial image if provided
  useEffect(() => {
    if (initialImage && open) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setRotation(0);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        renderCanvas(img, 0, 1, { x: 0, y: 0 });
      };
      img.src = initialImage;
    }
  }, [initialImage, open]);
  
  // Reset component when closed
  useEffect(() => {
    if (!open) {
      setImage(null);
      setSelectedFile(null);
      setRotation(0);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setFileInputKey(Date.now());
    }
  }, [open]);
  
  // Render canvas with current settings
  const renderCanvas = (
    img: HTMLImageElement | null,
    rotationValue: number, 
    scaleValue: number,
    positionValue: { x: number, y: number }
  ) => {
    if (!img || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Save context state
    ctx.save();
    
    // Move to center of canvas, rotate, then move back
    ctx.translate(centerX + positionValue.x, centerY + positionValue.y);
    ctx.rotate((rotationValue * Math.PI) / 180);
    ctx.scale(scaleValue, scaleValue);
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    
    // Restore context state
    ctx.restore();
  };
  
  // Update canvas when parameters change
  useEffect(() => {
    renderCanvas(image, rotation, scale, position);
  }, [image, rotation, scale, position]);
  
  // Handle rotation
  const rotateLeft = () => {
    const newRotation = (rotation - 90) % 360;
    setRotation(newRotation);
  };
  
  const rotateRight = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
  };
  
  // Handle scale change
  const handleScaleChange = (value: number[]) => {
    setScale(value[0]);
  };
  
  // Handle dragging for repositioning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPosition({
      x: position.x + dx,
      y: position.y + dy
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle save
  const handleSave = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    
    // Draw a circular crop
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a temporary canvas for the circular crop
    const tempCanvas = document.createElement('canvas');
    const size = Math.min(canvas.width, canvas.height);
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Create circular clipping path
    tempCtx.beginPath();
    tempCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();
    
    // Draw the original canvas content centered in the circular crop
    const offsetX = (canvas.width - size) / 2;
    const offsetY = (canvas.height - size) / 2;
    tempCtx.drawImage(canvas, offsetX, offsetY, size, size, 0, 0, size, size);
    
    // Convert to data URL and compress
    const imageData = tempCanvas.toDataURL('image/jpeg', 0.9);
    onSave(imageData);
    onClose();
    toast.success('Foto de perfil atualizada com sucesso!');
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar foto de perfil</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          <input
            key={fileInputKey}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {!image && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Button onClick={() => fileInputRef.current?.click()}>
                Selecionar imagem
              </Button>
              <p className="text-sm text-gray-500">
                Formatos recomendados: JPEG, PNG (máx. 5MB)
              </p>
            </div>
          )}
          
          {image && (
            <>
              <div
                className="relative overflow-hidden bg-slate-100 rounded-full w-[250px] h-[250px] flex items-center justify-center"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <canvas
                  ref={canvasRef}
                  width="250"
                  height="250"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              
              <div className="w-full space-y-4">
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={rotateLeft}
                    title="Girar para a esquerda"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={rotateRight}
                    title="Girar para a direita"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Escolher nova imagem"
                  >
                    Nova imagem
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Zoom:</span>
                  </div>
                  <Slider
                    value={[scale]}
                    min={0.5}
                    max={3}
                    step={0.01}
                    onValueChange={handleScaleChange}
                  />
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Arraste a imagem para ajustar a posição
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!image}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileImageEditor;
