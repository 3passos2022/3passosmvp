
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, Briefcase } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UserRole } from '@/lib/types';
import { toast } from "sonner";
import logoMenu from '../img/Logos/LogotipoHorizontalPreto.png';

interface SignUpCardProps {
  onSignUp: (name: string, email: string, phone: string, password: string, role: UserRole) => Promise<void>;
  onLoginClick: () => void;
  isLoading: boolean;
}

const SignUpCard: React.FC<SignUpCardProps> = ({ onSignUp, onLoginClick, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // For 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]); 
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    await onSignUp(name, email, phone, password, role);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-sm relative z-10"
      style={{ perspective: 1500 }}
    >
      <motion.div
        className="relative"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <div className="relative group">
          {/* Card glow effect */}
          <motion.div 
            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
            animate={{
              boxShadow: [
                "0 0 10px 2px rgba(255,255,255,0.03)",
                "0 0 15px 5px rgba(255,255,255,0.05)",
                "0 0 10px 2px rgba(255,255,255,0.03)"
              ],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut", 
              repeatType: "mirror" 
            }}
          />

          {/* Traveling light beam effect */}
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
            {/* Top light beam */}
            <motion.div 
              className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              initial={{ filter: "blur(2px)" }}
              animate={{ 
                left: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
              }}
              transition={{ 
                left: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror"
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }
              }}
            />
            
            {/* Right, Bottom and Left light beams */}
            <motion.div 
              className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
              initial={{ filter: "blur(2px)" }}
              animate={{ 
                top: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
              }}
              transition={{ 
                top: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 0.6
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.6
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.6
                }
              }}
            />
            
            <motion.div 
              className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              initial={{ filter: "blur(2px)" }}
              animate={{ 
                right: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
              }}
              transition={{ 
                right: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 1.2
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.2
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.2
                }
              }}
            />
            
            <motion.div 
              className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
              initial={{ filter: "blur(2px)" }}
              animate={{ 
                bottom: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
              }}
              transition={{ 
                bottom: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 1.8
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.8
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.8
                }
              }}
            />
            
            {/* Corner glow spots */}
            <motion.div 
              className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "mirror"
              }}
            />
            <motion.div 
              className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ 
                duration: 2.4, 
                repeat: Infinity,
                repeatType: "mirror",
                delay: 0.5
              }}
            />
            <motion.div 
              className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ 
                duration: 2.2, 
                repeat: Infinity,
                repeatType: "mirror",
                delay: 1
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ 
                duration: 2.3, 
                repeat: Infinity,
                repeatType: "mirror",
                delay: 1.5
              }}
            />
          </div>

          {/* Card border glow */}
          <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
          
          {/* Glass card background */}
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
            {/* Subtle card inner patterns */}
            <div className="absolute inset-0 opacity-[0.03]" 
              style={{
                backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                backgroundSize: '30px 30px'
              }}
            />

            {/* Logo and header */}
            <div className="text-center space-y-1 mb-5">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mx-auto flex items-center justify-center relative overflow-hidden"
              >
                <img src={logoMenu} alt="Logo" className="h-8" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
              >
                Crie sua conta
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-xs"
              >
                Preencha os campos para se cadastrar
              </motion.p>
            </div>

            {/* Signup form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div className="space-y-3">
                {/* Name input */}
                <motion.div 
                  className={`relative ${focusedInput === "name" ? 'z-10' : ''}`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "name" ? 'text-white' : 'text-white/40'
                    }`} />
                    
                    <Input
                      type="text"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedInput("name")}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                    />
                    
                    {/* Input highlight effect */}
                    {focusedInput === "name" && (
                      <motion.div 
                        layoutId="input-highlight"
                        className="absolute inset-0 bg-white/5 -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
                
                {/* Email input */}
                <motion.div 
                  className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "email" ? 'text-white' : 'text-white/40'
                    }`} />
                    
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                    />
                    
                    {/* Input highlight effect */}
                    {focusedInput === "email" && (
                      <motion.div 
                        layoutId="input-highlight"
                        className="absolute inset-0 bg-white/5 -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Phone input */}
                <motion.div 
                  className={`relative ${focusedInput === "phone" ? 'z-10' : ''}`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Phone className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "phone" ? 'text-white' : 'text-white/40'
                    }`} />
                    
                    <Input
                      type="tel"
                      placeholder="Telefone (opcional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocusedInput("phone")}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                    />
                    
                    {/* Input highlight effect */}
                    {focusedInput === "phone" && (
                      <motion.div 
                        layoutId="input-highlight"
                        className="absolute inset-0 bg-white/5 -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Password input */}
                <motion.div 
                  className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "password" ? 'text-white' : 'text-white/40'
                    }`} />
                    
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10"
                    />
                    
                    {/* Toggle password visibility */}
                    <div 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 cursor-pointer"
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                      )}
                    </div>
                    
                    {/* Input highlight effect */}
                    {focusedInput === "password" && (
                      <motion.div 
                        layoutId="input-highlight"
                        className="absolute inset-0 bg-white/5 -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
                
                {/* User role selection */}
                <div className="pt-2">
                  <Label className="text-white/70 mb-2 block text-xs">Tipo de conta</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value) => setRole(value as UserRole)}
                    className="grid grid-cols-2 gap-4 mt-2"
                  >
                    <div>
                      <RadioGroupItem
                        value={UserRole.CLIENT}
                        id="client"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="client"
                        className="flex flex-col items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 hover:bg-white/10 hover:border-white/20 transition-colors peer-data-[state=checked]:border-white/40 [&:has([data-state=checked])]:border-white/40"
                      >
                        <User className="mb-2 h-4 w-4 text-white/70" />
                        <span className="text-xs text-white/70">Cliente</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value={UserRole.PROVIDER}
                        id="provider"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="provider"
                        className="flex flex-col items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 hover:bg-white/10 hover:border-white/20 transition-colors peer-data-[state=checked]:border-white/40 [&:has([data-state=checked])]:border-white/40"
                      >
                        <Briefcase className="mb-2 h-4 w-4 text-white/70" />
                        <span className="text-xs text-white/70">Prestador</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </motion.div>

              {/* Sign up button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full relative group/button mt-5"
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />
                
                <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                  {/* Button background animation */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                    animate={{ 
                      x: ['-100%', '100%'],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      ease: "easeInOut", 
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    style={{ 
                      opacity: isLoading ? 1 : 0,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                  
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="button-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-1 text-sm font-medium"
                      >
                        Criar Conta
                        <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              {/* Sign in link */}
              <motion.p 
                className="text-center text-xs text-white/60 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Já tem uma conta?{' '}
                <a 
                  href="#" 
                  className="relative inline-block group/signin"
                  onClick={(e) => {
                    e.preventDefault();
                    onLoginClick();
                  }}
                >
                  <span className="relative z-10 text-white group-hover/signin:text-white/70 transition-colors duration-300 font-medium">
                    Entrar
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/signin:w-full transition-all duration-300" />
                </a>
              </motion.p>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SignUpCard;
