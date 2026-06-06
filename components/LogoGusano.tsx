"use client";

import Image from "next/image";

interface LogoGusanoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export default function LogoGusano({
  size = 40,
  animated = false,
  className = "",
}: LogoGusanoProps) {
  return (
    <Image
      src="/icon-192.png"
      alt="Guzzi — BuscayCurra"
      width={size}
      height={size}
      className={`${animated ? "animate-float" : ""} ${className}`}
      style={{ borderRadius: "50%", objectFit: "cover" }}
      priority
    />
  );
}
