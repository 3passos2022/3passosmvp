import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import worker1 from "./../img/workers hero/worker1.png";
import worker2 from "./../img/workers hero/worker2.png";

interface HeroServicesProps {
  chipText?: string;
  headline?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

function HeroServices({
  chipText = "A forma mais simples de contratar serviços",
  headline = "Serviços profissionais em 3passos simples",
  description = "Encontre pedreiros, eletricistas, encanadores e outros profissionais qualificados para resolver seu problema. Solicite orçamentos, compare preços e contrate sem complicações.",
  imageAlt = "Prestador de serviços profissional trabalhando",
  primaryButtonText = "Solicitar orçamento",
  secondaryButtonText = "Como Funciona"
}: HeroServicesProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [worker1, worker2];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="w-full py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-2">
          <div className="flex gap-6 flex-col">
            {/* Chip */}
            <div>
              <Badge variant="outline" className="text-sm px-4 py-2">
                {chipText}
              </Badge>
            </div>

            {/* Content */}
            <div className="flex gap-6 flex-col">
              <h1 className="text-4xl md:text-6xl lg:text-7xl max-w-2xl tracking-tight text-left font-semibold text-foreground">
                {headline}
              </h1>
              <p className="text-lg md:text-xl leading-relaxed tracking-normal text-muted-foreground max-w-xl text-left">
                {description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/request-quote">
                <Button size="lg" className="gap-2">
                  <Search className="w-4 h-4" />
                  {primaryButtonText}
                </Button>
              </Link>

              <Button size="lg" variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                {secondaryButtonText}
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.8/5</span>
              </div>
              <div className="text-sm text-muted-foreground">
                +10.000 profissionais cadastrados
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={images[currentImageIndex]}
                alt={imageAlt}
                className="w-full h-[500px] lg:h-[600px] object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating cards */}
            <div className="absolute -bottom-6 -left-6 bg-background border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Profissionais Verificados</p>
                  <p className="text-xs text-muted-foreground">Documentos validados</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 bg-background border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">🕒</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Resposta Imediata</p>
                  <p className="text-xs text-muted-foreground">Orçamentos na hora!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Hero() {
  return <HeroServices />;
}
