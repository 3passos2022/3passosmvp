import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import logoMenu from './../img/Logos/LogotipoHorizontalPreto.png';

const ResetPassword: React.FC = () => {
    const { resetPassword, session, loading: authLoading, isRecoveringPassword } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Verificar se há uma sessão ou se estamos no fluxo de recuperação
    useEffect(() => {
        if (!authLoading && !session && !isRecoveringPassword) {
            const timer = setTimeout(() => {
                if (!session && !isRecoveringPassword) {
                    toast.error("Link inválido ou expirado. Por favor, solicite uma nova redefinição.");
                    navigate('/forgot-password');
                }
            }, 3000); // Dar um tempo maior para o Supabase processar o hash/code na URL

            return () => clearTimeout(timer);
        }
    }, [session, isRecoveringPassword, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("Por favor, insira uma nova senha");
            return;
        }

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await resetPassword(password);

            if (error) {
                toast.error(`Erro ao redefinir senha: ${error.message}`);
            } else {
                toast.success("Senha redefinida com sucesso!");
                navigate('/login');
            }
        } catch (error) {
            toast.error("Erro inesperado ao redefinir senha");
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
                            <CardTitle>Redefinir Senha</CardTitle>
                            <CardDescription>
                                Crie uma nova senha para sua conta
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nova Senha</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Sua nova senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirme sua nova senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Redefinindo..." : "Salvar Nova Senha"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
};

export default ResetPassword;
