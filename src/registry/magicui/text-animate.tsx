"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"

type AnimationType = "text" | "word" | "character" | "line"
type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown"

interface TextAnimateProps {
  children: string
  className?: string
  segmentClassName?: string
  delay?: number
  duration?: number
  by?: AnimationType
  animation?: AnimationVariant
}

const TextAnimateBase = ({
  children,
  delay = 0,
  duration = 0.5,
  className,
  segmentClassName,
  by = "word",
  animation = "fadeIn",
}: TextAnimateProps) => {
  if (typeof children !== "string") {
    return <span className={className}>{children}</span>
  }

  let segments: string[] = []
  if (by === "word") {
    segments = children.split(/(\s+)/)
  } else if (by === "character") {
    segments = children.split("")
  } else if (by === "line") {
    segments = children.split("\n")
  } else {
    segments = [children]
  }

  // Map the animation variant to our CSS classes
  const animationClass = 
    animation === "slideUp" ? "animate-text-slide-up" :
    animation === "slideDown" ? "animate-text-slide-down" :
    animation === "slideLeft" ? "animate-text-slide-left" :
    animation === "slideRight" ? "animate-text-slide-right" :
    animation === "scaleUp" ? "animate-text-scale-up" :
    animation === "scaleDown" ? "animate-text-scale-down" :
    animation === "blurIn" ? "animate-text-blur-in" :
    animation === "blurInUp" ? "animate-text-blur-in-up" :
    "animate-text-fade-in"

  // Stagger calculations
  const staggerDelay = duration / Math.max(segments.length, 1)

  return (
    <span className={cn("inline-flex flex-wrap", className)}>
      {segments.map((segment, i) => {
        const isWhitespace = segment.trim() === ""
        return (
          <span
            key={i}
            className={cn(
              by === "line" ? "block" : "inline-block",
              !isWhitespace && animationClass,
              segmentClassName
            )}
            style={{
              animationDelay: `${delay + i * staggerDelay}s`,
              animationDuration: `${duration}s`,
              animationFillMode: "both",
              whiteSpace: "pre-wrap",
            }}
          >
            {segment}
          </span>
        )
      })}
    </span>
  )
}

export const TextAnimate = memo(TextAnimateBase)
