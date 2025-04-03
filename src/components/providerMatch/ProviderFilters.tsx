
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export type FilterOption = 'distance' | 'price' | 'rating' | 'relevance';

interface ProviderFiltersProps {
  onFilterChange: (filter: FilterOption) => void;
  currentFilter: FilterOption;
}

const ProviderFilters: React.FC<ProviderFiltersProps> = ({ onFilterChange, currentFilter }) => {
  return (
    <div className="flex items-center gap-2 my-4">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
      <Select
        value={currentFilter}
        onValueChange={(value) => onFilterChange(value as FilterOption)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione um filtro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Relevância</SelectItem>
          <SelectItem value="distance">Distância</SelectItem>
          <SelectItem value="price">Preço</SelectItem>
          <SelectItem value="rating">Avaliação</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProviderFilters;
