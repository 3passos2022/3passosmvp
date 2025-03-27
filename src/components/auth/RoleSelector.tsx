
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { User, Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Como você deseja usar a plataforma?</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          type="button"
          variant={selectedRole === UserRole.CLIENT ? "default" : "outline"}
          className={`h-auto py-6 ${
            selectedRole === UserRole.CLIENT ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
          onClick={() => onSelectRole(UserRole.CLIENT)}
        >
          <div className="flex flex-col items-center text-center">
            <User className="h-8 w-8 mb-2" />
            <span className="text-lg font-medium">Cliente</span>
            <span className="text-sm font-normal mt-1">
              Estou procurando por profissionais
            </span>
          </div>
        </Button>
        
        <Button
          type="button"
          variant={selectedRole === UserRole.PROVIDER ? "default" : "outline"}
          className={`h-auto py-6 ${
            selectedRole === UserRole.PROVIDER ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
          onClick={() => onSelectRole(UserRole.PROVIDER)}
        >
          <div className="flex flex-col items-center text-center">
            <Briefcase className="h-8 w-8 mb-2" />
            <span className="text-lg font-medium">Prestador de Serviços</span>
            <span className="text-sm font-normal mt-1">
              Quero oferecer meus serviços
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default RoleSelector;
