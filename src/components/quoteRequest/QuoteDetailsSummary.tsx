
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { format } from "date-fns";

interface QuoteDetailsProps {
  formData: {
    fullName?: string;
    serviceId?: string;
    serviceName?: string;
    subServiceId?: string;
    subServiceName?: string;
    specialtyId?: string;
    specialtyName?: string;
    description?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    answers?: {[key: string]: string};
    questions?: {[questionId: string]: { question: string, answer: string }};
    itemQuantities?: {[key: string]: number};
    itemNames?: {[key: string]: string};
    measurements?: {
      id: string;
      roomName: string;
      width: number;
      length: number;
      height?: number;
      measurementType?: 'square_meter' | 'linear_meter';
    }[];
    serviceDate?: Date;
    serviceEndDate?: Date;
    serviceTimePreference?: string;
  };
  compact?: boolean;
}

const QuoteDetailsSummary: React.FC<QuoteDetailsProps> = ({ formData, compact = false }) => {
  // Helper function to format time preference
  const formatTimePreference = (preference?: string) => {
    switch(preference) {
      case 'morning': return 'Manhã';
      case 'afternoon': return 'Tarde';
      case 'evening': return 'Noite';
      case 'business': return 'Horário comercial';
      default: return '-';
    }
  };

  return (
    <div className={`space-y-${compact ? '4' : '6'}`}>
      {/* Serviço */}
      <Card>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{formData.fullName}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Serviço</p>
              <p className="font-medium">{formData.serviceName}</p>
            </div>
            
            {formData.subServiceName && (
              <div>
                <p className="text-sm text-gray-500">Tipo de Serviço</p>
                <p className="font-medium">{formData.subServiceName}</p>
              </div>
            )}
            
            {formData.specialtyName && (
              <div>
                <p className="text-sm text-gray-500">Especialidade</p>
                <p className="font-medium">{formData.specialtyName}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-medium">
                {formData.serviceDate ? format(formData.serviceDate, "dd/MM/yyyy") : '-'}
                {formData.serviceEndDate && formData.serviceEndDate !== formData.serviceDate && 
                 ` até ${format(formData.serviceEndDate, "dd/MM/yyyy")}`}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Horário preferencial</p>
              <p className="font-medium">{formatTimePreference(formData.serviceTimePreference)}</p>
            </div>
          </div>
          
          {formData.description && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Descrição</p>
              <p className="text-sm border rounded-md p-3 bg-gray-50">{formData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Endereço */}
      <Card>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {formData.street}, {formData.number}
            {formData.complement && ` - ${formData.complement}`}
          </p>
          <p>{formData.neighborhood}</p>
          <p>{formData.city} - {formData.state}</p>
          <p>CEP: {formData.zipCode}</p>
        </CardContent>
      </Card>

      {/* Perguntas e Respostas */}
      {formData.questions && Object.keys(formData.questions).length > 0 && (
        <Card>
          <CardHeader className={compact ? "pb-2" : undefined}>
            <CardTitle>Respostas do Questionário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.values(formData.questions).map((item, index) => (
                <div key={index} className="pb-2 border-b last:border-b-0 last:pb-0">
                  <p className="font-medium">{item.question}</p>
                  <p className="text-sm mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itens e Quantidades */}
      {formData.itemQuantities && Object.keys(formData.itemQuantities).length > 0 && (
        <Card>
          <CardHeader className={compact ? "pb-2" : undefined}>
            <CardTitle>Itens do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(formData.itemQuantities).map(([itemId, quantity]) => (
                quantity > 0 && (
                  <div key={itemId} className="flex justify-between pb-2 border-b last:border-b-0 last:pb-0">
                    <p>{formData.itemNames?.[itemId] || `Item #${itemId.substring(0, 8)}`}</p>
                    <p className="font-medium">{quantity}</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medições */}
      {formData.measurements && formData.measurements.length > 0 && (
        <Card>
          <CardHeader className={compact ? "pb-2" : undefined}>
            <CardTitle>Medições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.measurements.map((measurement, index) => (
                <div key={measurement.id} className="p-3 border rounded-md">
                  <div className="flex justify-between mb-2">
                    <p className="font-medium">
                      {measurement.roomName || `Ambiente ${index + 1}`}
                    </p>
                    <span className="text-sm text-gray-500">
                      {measurement.measurementType === 'linear_meter' 
                        ? 'Metros Lineares' 
                        : 'Metros Quadrados'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Largura</p>
                      <p>{measurement.width} m</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Comprimento</p>
                      <p>{measurement.length} m</p>
                    </div>
                    {measurement.height && (
                      <div>
                        <p className="text-gray-500">Altura</p>
                        <p>{measurement.height} m</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 pt-2 border-t">
                    {measurement.measurementType === 'linear_meter' ? (
                      <p className="text-sm font-medium">
                        Perímetro total: {((measurement.width * 2) + (measurement.length * 2)).toFixed(2)} m
                      </p>
                    ) : (
                      <p className="text-sm font-medium">
                        Área total: {(measurement.width * measurement.length).toFixed(2)} m²
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuoteDetailsSummary;
