import Image from "next/image";

/**
 * Small animated lorikeet shown while a screen is loading.
 */
export function LorikeetLoader() {
  return (
    <Image
      alt="Loading"
      className="h-14 w-12"
      height={56}
      src="/lorikeet_loader.svg"
      width={48}
    />
  );
}
