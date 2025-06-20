import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import motion3passos from "../img/motion3passos.mp4";
import "../components/customStylingfiles-and/home.css";

export default function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation>
      <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
       {/*  <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
          O jeito mais fácil de contratar serviços
        </p> */}
        <div   id="motionvideo" className="relative w-full h-full flex items-center justify-center">
          <video
          
            src={motion3passos}
            autoPlay
            loop
            muted
            playsInline
            className="w-[80%] h-[100%] object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              mixBlendMode: "color-burn",
              pointerEvents: "none"
            }}
          />
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}
