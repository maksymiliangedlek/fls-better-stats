import Image from "next/image";

export function Crest({ size = 40, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <Image
      src="/crest.png"
      alt="Herb Ogniwo Bielany"
      width={size}
      height={size}
      priority={priority}
      style={{ objectFit: "contain", background: "transparent" }}
    />
  );
}
