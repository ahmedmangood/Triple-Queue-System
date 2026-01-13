"use client";

import React, { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/dummy-logo.png",
  className,
  containerClassName,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    if (hasError) {
      setHasError(false);
    }
  };

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <img
        src={`/uploads/images${imgSrc}`}
        alt={alt}
        className={cn(
          "transition-opacity duration-200",
          hasError && "opacity-75",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
          <span className="text-center px-2">Logo</span>
        </div>
      )}
    </div>
  );
}
