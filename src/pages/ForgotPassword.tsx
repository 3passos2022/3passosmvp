import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from 'lucide-react';
import logoMenu from './../img/Logos/LogotipoHorizontalPreto.png';

const ForgotPassword: React.FC = () => {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Por favor, insira seu e-mail");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await forgotPassword(email);

            if (error) {
                toast.error(`Erro ao enviar e-mail: ${error.message}`);
            } else {
                setIsSubmitted(true);
                toast.success("E-mail de recuperação enviado com sucesso!");
            }
        } catch (error) {
            toast.error("Erro inesperado ao enviar e-mail");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full"
                >
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block">
                            <img src={logoMenu} id="logoMenu" alt="Logo" className="h-8" />
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recuperar Senha</CardTitle>
                            <CardDescription>
                                {isSubmitted
                                    ? "Verifique sua caixa de entrada"
                                    : "Digite seu e-mail para receber um link de redefinição de senha"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isSubmitted ? (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-gray-600">
                                        Enviamos um e-mail para <strong>{email}</strong> com instruções para redefinir sua senha.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Se não receber o e-mail em alguns minutos, verifique sua pasta de spam.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        onClick={() => setIsSubmitted(false)}
                                    >
                                        Tentar outro e-mail
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E-mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Link
                                to="/login"
                                className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar para o Login
                            </Link>
                        </CardFooter>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
};

export default ForgotPassword;
