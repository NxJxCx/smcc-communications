import clsx from "clsx";
import Image from "next/image";

export default function OBONavImageIconSmall({ width = 50, height = 50, priority = true, src = "/paboni.svg", alt = "Logo", textColor = 'text-lime-50', ...props }: { textColor?: string; alt?: string, width?: number, height?: number, priority?: boolean, src?: string }) {
  return (
    <div className="flex flex-col justify-start items-center">
      <Image  width={width} height={height} priority={priority} alt={alt} className="min-h-[50px] object-contain text-transparent" src={src} {...props} />
      <div className={clsx("font-bold text-[6px] whitespace-nowrap", textColor)}>OFFICE OF THE BUILDING OFFICIAL</div>
      <div className={clsx("font-semibold text-[4px] whitespace-nowrap", textColor)}>NASIPIT, AGUSAN DEL NORTE</div>
    </div>
  )
}