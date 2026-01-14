
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface EmailConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
    isOpen,
    onClose,
    email,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Verifique seu e-mail</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Enviamos um link de confirmação para <br />
                        <span className="font-semibold text-foreground">{email}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 text-center text-sm text-muted-foreground">
                    <p>
                        Por favor, verifique sua caixa de entrada (e também a pasta de spam) e clique no link para ativar sua conta.
                    </p>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button type="button" onClick={onClose} className="w-full sm:w-auto min-w-[120px]">
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmailConfirmationModal;
