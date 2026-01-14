
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ServiceVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onDeny: () => void;
    providerName: string;
    isProcessing?: boolean;
}

const ServiceVerificationModal: React.FC<ServiceVerificationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onDeny,
    providerName,
    isProcessing = false,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirmação de Serviço</DialogTitle>
                    <DialogDescription>
                        O prestador <strong>{providerName}</strong> executou o serviço combinado?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex sm:justify-between sm:space-x-2">
                    <Button
                        variant="destructive"
                        onClick={onDeny}
                        disabled={isProcessing}
                    >
                        Não
                    </Button>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isProcessing}
                        >
                            Sim
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ServiceVerificationModal;
