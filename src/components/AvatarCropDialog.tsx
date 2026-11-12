import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/** Crops the chosen area to a 256px square JPEG data URL. */
function cropToDataUrl(src: string, area: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 256, canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Couldn't read that image"));
    img.src = src;
  });
}

export function AvatarCropDialog({ src, onCancel, onDone }: { src: string | null; onCancel: () => void; onDone: (url: string) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  return (
    <Dialog open={!!src} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Crop your photo</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Drag to move, and use the slider to zoom.</p>
        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-muted">
          {src && <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />}
        </div>
        <div className="flex items-center gap-3"><span className="text-sm">Zoom</span>
          <Slider aria-label="Zoom" min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0] ?? 1)} /></div>
        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={onCancel}>Cancel</Button>
          <Button className="rounded-full" disabled={!area} onClick={async () => { if (src && area) onDone(await cropToDataUrl(src, area)); }}>Use photo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
