'use client';

import { useState, useEffect } from 'react';
import { Shield, Sparkles, Lock, Zap, ArrowRight, Github, Star, Check, TrendingUp, Coins } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function LandingPage({ onEnterApp }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate consistent particle positions
  const particles = mounted ? [...Array(100)].map((_, i) => ({
    size: Math.random() * 3,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.5 + 0.2
  })) : [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        ></div>
        <div 
          className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" 
          style={{
            animationDelay: '2s',
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`
          }}
        ></div>
        <div 
          className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" 
          style={{
            animationDelay: '4s',
            transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`
          }}
        ></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

      {/* Stars/Particles */}
      {mounted && (
        <div className="absolute inset-0">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                top: `${particle.top}%`,
                left: `${particle.left}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                opacity: particle.opacity,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-fade-in-up">
            <div className="relative">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 animate-pulse-glow" />
              <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Heirloom
            </span>
          </div>
          <div className="flex gap-2 sm:gap-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-white/10 text-sm sm:text-base px-2 sm:px-4">
              <Github className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">GitHub</span>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
          <div className="max-w-6xl mx-auto text-center w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-dark border border-purple-500/30 mb-6 sm:mb-8 animate-scale-in hover:scale-110 transition-transform cursor-pointer">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 animate-pulse" />
              <span className="text-xs sm:text-sm text-purple-300 font-medium">Powered by Stellar Blockchain</span>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 animate-pulse" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 animate-fade-in-up leading-tight px-4" style={{animationDelay: '0.1s'}}>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                Secure Your
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">Digital Legacy</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-4 sm:mb-6 max-w-3xl mx-auto animate-fade-in-up leading-relaxed px-4" style={{animationDelay: '0.2s'}}>
              The world's first <span className="text-purple-300 font-semibold">blockchain-powered</span> digital will.
              <br className="hidden sm:block" />
              <span className="text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text font-semibold">
                Trustless • Automated • Eternal
              </span>
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-8 mb-8 sm:mb-12 animate-fade-in-up px-4" style={{animationDelay: '0.3s'}}>
              <div className="glass-dark px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-105 min-w-[120px] sm:min-w-[160px]">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 justify-center sm:justify-start">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">$100B+</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">Lost Crypto</div>
              </div>
              <div className="glass-dark px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105 min-w-[120px] sm:min-w-[160px]">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 justify-center sm:justify-start">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">3-5s</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">Speed</div>
              </div>
              <div className="glass-dark px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-pink-500/20 hover:border-pink-500/40 transition-all hover:scale-105 min-w-[120px] sm:min-w-[160px]">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 justify-center sm:justify-start">
                  <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">~$0.00</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">Fee</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center animate-fade-in-up mb-6 sm:mb-8 px-4" style={{animationDelay: '0.4s'}}>
              <Button
                size="lg"
                className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden group w-full sm:w-auto"
                onClick={onEnterApp}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <Zap className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 transition-transform ${isHovered ? 'rotate-12 scale-110' : ''}`} />
                <span className="font-bold">Launch App</span>
                <ArrowRight className={`h-5 w-5 sm:h-6 sm:w-6 ml-2 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-purple-500/50 text-white hover:bg-purple-500/10 px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg rounded-full backdrop-blur-sm hover:border-purple-400 transition-all hover:scale-105 w-full sm:w-auto"
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-400 animate-fade-in-up px-4" style={{animationDelay: '0.5s'}}>
              <div className="flex items-center gap-1.5 sm:gap-2 glass-dark px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-green-500/20">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                <span className="whitespace-nowrap">Contract Verified</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 glass-dark px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-blue-500/20">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <span className="whitespace-nowrap">Open Source</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 glass-dark px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-purple-500/20">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                <span className="whitespace-nowrap">Stellar Testnet</span>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
              Why Choose <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Heirloom</span>?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4">
              Built with cutting-edge blockchain technology to ensure your digital assets are protected
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="glass-dark p-6 sm:p-8 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 animate-fade-in-up group" style={{animationDelay: '0.6s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Trustless Security</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Smart contracts ensure your assets are protected without intermediaries or lawyers. Pure code, pure trust.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-dark p-6 sm:p-8 rounded-2xl border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 animate-fade-in-up group" style={{animationDelay: '0.7s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Powered by Stellar blockchain with 3-5 second transaction finality. No more waiting hours or days.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-dark p-6 sm:p-8 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 animate-fade-in-up group sm:col-span-2 md:col-span-1" style={{animationDelay: '0.8s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Fully Automated</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Check-in system ensures automated asset transfer when you can't. Set it and forget it.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-gray-500 border-t border-gray-800">
          <p className="text-xs sm:text-sm">Built with ❤️ on Stellar Blockchain • <span className="font-mono text-xs">CDHB...3RE5</span></p>
        </footer>
      </div>
    </div>
  );
}
