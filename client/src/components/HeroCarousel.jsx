import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { newsItems } from "../pages/data/mockData";

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    const interval = setInterval(() => emblaApi.scrollNext(), 5500);
    return () => {
      clearInterval(interval);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {newsItems.map((item) => (
            <div key={item.id} className="relative flex-none w-full">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-[420px] md:h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full mb-3">
                  {item.badge}
                </span>
                <h2 className="text-white text-2xl md:text-4xl mb-2 max-w-2xl leading-tight">
                  {item.title}
                </h2>
                <p className="text-gray-200 text-sm md:text-base max-w-xl mb-4 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 text-sm">{item.date}</span>
                  <button className="bg-white text-blue-900 text-sm px-4 py-2 rounded-full hover:bg-blue-50 transition-colors">
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2.5 rounded-full transition-all duration-200 border border-white/30"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2.5 rounded-full transition-all duration-200 border border-white/30"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 right-8 flex gap-2">
        {newsItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === selectedIndex ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
