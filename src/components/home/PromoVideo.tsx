import React, { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function PromoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-black rounded-xl overflow-hidden shadow-xl">
        {/* Video Overlay - shown before play */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-fin-primary/80 to-fin-teal/80 flex flex-col items-center justify-center text-white p-8 transition-opacity duration-300 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Your Financial Journey Starts Here</h2>
          <p className="text-lg md:text-xl mb-8 text-center max-w-2xl">
            FinInsight provides comprehensive market data, personalized guidance, and financial education for retail investors
          </p>
          <Button 
            onClick={togglePlay} 
            size="lg" 
            className="bg-white text-fin-primary hover:bg-slate-100 flex items-center gap-2"
          >
            <Play className="h-5 w-5" /> Watch Video
          </Button>
        </div>

        {/* Video Player */}
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover"
          poster="/promo-thumbnail.jpg" 
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        >
          <source src="/promo/fin-insight-promo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Video Controls */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20" 
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20" 
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          See how FinInsight is revolutionizing financial education for retail investors
        </p>
        <div className="flex justify-center gap-4">
          <Button className="bg-fin-accent hover:bg-fin-accent-hover text-fin-dark">
            Start Free Trial
          </Button>
          <Button variant="outline" className="border-fin-teal text-fin-teal hover:bg-fin-teal/10">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
} 