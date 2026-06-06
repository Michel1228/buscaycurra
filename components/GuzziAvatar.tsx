import Image from "next/image";

interface GuzziAvatarProps {
  size?: number;
  className?: string;
}

export default function GuzziAvatar({ size = 40, className = "" }: GuzziAvatarProps) {
  return (
    <Image
      src="/icon-192.png"
      alt="Guzzi"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "50%", objectFit: "cover" }}
      priority
    />
  );
}
