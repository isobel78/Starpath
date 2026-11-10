import { cn } from "@/lib/utils";

/** Shows an uploaded avatar photo, or the chosen emoji avatar on a colorful bubble. */
export function UserAvatar({ url, emoji, className }: { url?: string | null; emoji: string; className?: string }) {
  if (url) return <img src={url} alt="" className={cn("h-12 w-12 shrink-0 rounded-full object-cover", className)} />;
  return <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun text-3xl", className)}>{emoji}</span>;
}
