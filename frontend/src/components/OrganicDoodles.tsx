"use client";

import { memo } from "react";

// A collection of soft, nature-inspired SVG doodles to add organic texture.

export const DoodleLeaf = memo(({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`text-accent opacity-10 pointer-events-none ${className}`}
  >
    <path
      d="M20,80 C20,40 50,20 80,20 C80,60 50,80 20,80 Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20,80 L80,20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));

export const DoodleBranch = memo(({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`text-accent opacity-10 pointer-events-none ${className}`}
  >
    <path
      d="M10,110 C30,90 60,70 90,30"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M40,83 C40,60 25,50 15,45"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M70,55 C80,55 90,65 100,80"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M85,40 C95,30 110,25 115,20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));

export const DoodleSun = memo(({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`text-accent opacity-10 pointer-events-none ${className}`}
  >
    <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" />
    <path d="M50,15 L50,5 M50,95 L50,85 M85,50 L95,50 M5,50 L15,50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M75,25 L82,18 M25,75 L18,82 M25,25 L18,18 M75,75 L82,82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
));

export const DoodlePebbles = memo(({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`text-accent opacity-10 pointer-events-none ${className}`}
  >
    <ellipse cx="30" cy="40" rx="15" ry="10" stroke="currentColor" strokeWidth="2" transform="rotate(-20 30 40)" />
    <ellipse cx="65" cy="65" rx="20" ry="12" stroke="currentColor" strokeWidth="2" transform="rotate(15 65 65)" />
    <ellipse cx="75" cy="30" rx="8" ry="5" stroke="currentColor" strokeWidth="2" transform="rotate(-40 75 30)" />
  </svg>
));
