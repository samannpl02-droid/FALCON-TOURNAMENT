
import React, { useState, useEffect } from 'react';

interface BannerCarouselProps {
  banners: string[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="w-full relative overflow-hidden rounded-xl aspect-[2/1] bg-gray-800 shadow-lg border border-gray-700">
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((img, idx) => (
          <img key={idx} src={img} alt="Ad" className="w-full h-full object-cover flex-shrink-0" />
        ))}
      </div>
      
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {banners.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-accent' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
