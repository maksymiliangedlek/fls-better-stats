import Image from "next/image";

export function Crest({
  size = 40,
  priority = false,
  src = "/crest.png",
}: {
  size?: number;
  priority?: boolean;
  src?: string;
}) {
  return (
    <Image
      src={src}
      alt="Herb Ogniwo Bielany"
      width={size}
      height={size}
      priority={priority}
      style={{ objectFit: "contain", background: "transparent" }}
    />
  );
}
