import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, UserCircle, Home, Briefcase, 
  ClipboardList, LogIn, LogOut, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from '@/lib/types';
import logoMenu from './../img/Logos/LogotipoHorizontalPreto.png'
import ServiceNavBar from './ServiceNavBar';
import { Badge } from './ui/badge';
import { FileText, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 w-full ${
          scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
        } transition-all duration-300`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="font-bold text-xl"
            >
              <img src={logoMenu} id="logoMenu" alt="Logo" className="h-8" />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="story-link font-medium text-gray-700 hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/services" className="story-link font-medium text-gray-700 hover:text-primary transition-colors">
              Serviços
            </Link>
            <Link to="/request-quote" className="story-link font-medium text-gray-700 hover:text-primary transition-colors">
              Solicitar Orçamento
            </Link>
            {!user ? (
              <Link to="/login">
                <Button className="hover-scale">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hover-scale">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {user.name || 'Minha Conta'}
                    {user.subscribed && (
                      <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                        {user.subscription_tier === 'premium' ? 'Premium' : 'Básico'}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Minhas Informações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/quotes" className="w-full cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      Meus Orçamentos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/subscription" className="w-full cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Minha Assinatura
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === UserRole.PROVIDER || user.role === UserRole.ADMIN) && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/profile/requested" className="w-full cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          Orçamentos Recebidos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile/settings" className="w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações de Serviço
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === UserRole.ADMIN && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="w-full cursor-pointer">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white shadow-lg"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <Link to="/" className="flex items-center py-2 hover:text-primary transition-colors">
                  <Home className="mr-2 h-5 w-5" />
                  Início
                </Link>
                <Link to="/services" className="flex items-center py-2 hover:text-primary transition-colors">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Serviços
                </Link>
                <Link to="/request-quote" className="flex items-center py-2 hover:text-primary transition-colors">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Solicitar Orçamento
                </Link>
                {!user ? (
                  <Link to="/login" className="w-full">
                    <Button className="w-full">
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </Button>
                  </Link>
                ) : (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-500">Conta</p>
                    </div>
                    <Link to="/profile" className="flex items-center py-2 hover:text-primary transition-colors">
                      <User className="mr-2 h-5 w-5" />
                      Minhas Informações
                    </Link>
                    <Link to="/profile/quotes" className="flex items-center py-2 hover:text-primary transition-colors">
                      <FileText className="mr-2 h-5 w-5" />
                      Meus Orçamentos
                    </Link>
                    <Link to="/profile/subscription" className="flex items-center py-2 hover:text-primary transition-colors">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Minha Assinatura
                      {user.subscribed && (
                        <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20 text-xs">
                          {user.subscription_tier === 'premium' ? 'Premium' : 'Básico'}
                        </Badge>
                      )}
                    </Link>
                    {(user.role === UserRole.PROVIDER || user.role === UserRole.ADMIN) && (
                      <>
                        <Link to="/profile/requested" className="flex items-center py-2 hover:text-primary transition-colors">
                          <FileText className="mr-2 h-5 w-5" />
                          Orçamentos Recebidos
                        </Link>
                        <Link to="/profile/settings" className="flex items-center py-2 hover:text-primary transition-colors">
                          <Settings className="mr-2 h-5 w-5" />
                          Configurações de Serviço
                        </Link>
                      </>
                    )}
                    {user.role === UserRole.ADMIN && (
                      <Link to="/admin" className="flex items-center py-2 hover:text-primary transition-colors">
                        <Briefcase className="mr-2 h-5 w-5" />
                        Painel Admin
                      </Link>
                    )}
                    <Button 
                      variant="destructive" 
                      className="w-full mt-2" 
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      {/* Add ServiceNavBar with appropriate spacing */}
      <div className="pt-16">
        <ServiceNavBar />
      </div>
    </>
  );
};

export default Navbar;
