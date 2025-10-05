'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  autoSlide?: boolean;
  slideInterval?: number;
}

export default function TestimonialSlider({ 
  testimonials, 
  autoSlide = true, 
  slideInterval = 5000 
}: TestimonialSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoSlide || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, slideInterval, testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
  };

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      {/* Main Testimonial Card */}
      <div className="rounded-2xl p-6 mb-8 transition-all duration-500 ease-in-out">
        <div className="flex items-start mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 overflow-hidden">
            {currentTestimonial.avatar ? (
              <img 
                src={currentTestimonial.avatar} 
                alt={currentTestimonial.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-white font-semibold">{currentTestimonial.name}</p>
            <p className="text-blue-100 text-sm">{currentTestimonial.role}</p>
          </div>
        </div>
        <p className="text-white text-lg leading-relaxed">
          &ldquo;{currentTestimonial.quote}&rdquo;
        </p>
      </div>
    </div>
  );
}

// Static testimonial data
export const memberTestimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    role: "Society Secretary",
    quote: "I was able to streamline my society management by 40% using Arthyaa's comprehensive platform.",
    avatar: "/api/placeholder/48/48"
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Society Member",
    quote: "The OTP login system is so convenient! I can access all society services with just my phone number.",
    avatar: "/api/placeholder/48/48"
  },
  {
    id: 3,
    name: "Amit Patel",
    role: "Treasurer",
    quote: "Managing finances and tracking payments has never been easier. The dashboard gives me complete visibility.",
    avatar: "/api/placeholder/48/48"
  },
  {
    id: 4,
    name: "Sunita Reddy",
    role: "Committee Member",
    quote: "The announcement system keeps all members informed instantly. Communication is seamless now.",
    avatar: "/api/placeholder/48/48"
  }
];

export const adminTestimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    role: "Society Administrator",
    quote: "I was able to streamline my society management by 40% using Arthyaa's comprehensive platform.",
    avatar: "/api/placeholder/48/48"
  },
  {
    id: 2,
    name: "Dr. Meera Singh",
    role: "Multi-Society Manager",
    quote: "Managing multiple societies is now effortless. The centralized dashboard gives me complete control.",
    avatar: "/api/placeholder/48/48"
  },
  {
    id: 3,
    name: "Vikram Joshi",
    role: "Regional Coordinator",
    quote: "The analytics and reporting features help me make data-driven decisions for better society management.",
    avatar: "/api/placeholder/48/48"
  },
  {
    id: 4,
    name: "Anita Desai",
    role: "Compliance Officer",
    quote: "Ensuring regulatory compliance across all societies is now automated and stress-free.",
    avatar: "/api/placeholder/48/48"
  }
];
