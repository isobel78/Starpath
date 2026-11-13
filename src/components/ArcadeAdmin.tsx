import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, EyeOff, Eye, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { arcadeQuery, ARCADE_CATEGORIES, type ArcadeGame } from "@/lib/arcade";

const blank: ArcadeGame = { id: "", title: "", description: "", url: "https://", emoji: "🕹️", category: "Logic", difficulty: "Beginner", platform: "", is_free: true, hidden: false, sort_order: 100 };

export function ArcadeAdmin() {
  const qc = useQueryClient();
  const games = useQuery(arcadeQuery).data ?? [];
  const [edit, setEdit] = useState<ArcadeGame | null>(null);
  const reload = () => qc.invalidateQueries({ queryKey: ["arcade"] });
  const save = async (g: ArcadeGame) => {
    const { id, ...rest } = g;
    const { error } = id ? await supabase.from("arcade_games").update(rest).eq("id", id) : await supabase.from("arcade_games").insert(rest);
    if (error) { toast.error(error.message); return; }
    toast.success("Game saved"); setEdit(null); reload();
  };
  const del = async (g: ArcadeGame) => {
    if (!window.confirm(`Delete "${g.title}"?`)) return;
    const { error } = await supabase.from("arcade_games").delete().eq("id", g.id);
    if (error) toast.error(error.message); else reload();
  };
  return (
    <div className="mt-4 space-y-2">
      <Button className="rounded-full" onClick={() => setEdit(blank)}><Plus className="h-4 w-4" /> New game</Button>
      {games.map((g) => (
        <div key={g.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 ${g.hidden ? "opacity-60" : ""}`}>
          <span className="text-2xl">{g.emoji}</span>
          <div className="min-w-0 flex-1"><div className="font-semibold">{g.title} {g.hidden && <span className="text-xs">· hidden</span>}</div><div className="truncate text-xs text-muted-foreground">#{g.sort_order} · {g.category} · {g.difficulty} · {g.url}</div></div>
          <Button size="sm" variant="ghost" onClick={() => setEdit(g)}><Pencil className="h-4 w-4" /> Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => save({ ...g, hidden: !g.hidden })}>{g.hidden ? <><Eye className="h-4 w-4" /> Show</> : <><EyeOff className="h-4 w-4" /> Hide</>}</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(g)}><Trash2 className="h-4 w-4" /> Delete</Button>
        </div>
      ))}
      {edit && <GameForm game={edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}

function GameForm({ game, onClose, onSave }: { game: ArcadeGame; onClose: () => void; onSave: (g: ArcadeGame) => void }) {
  const [f, setF] = useState(game);
  const submit = () => {
    if (!f.title.trim()) return toast.error("Title is required");
    if (!/^https:\/\/\S+\.\S+/.test(f.url)) return toast.error("Use a full https:// link");
    onSave({ ...f, title: f.title.trim(), url: f.url.trim(), sort_order: Number(f.sort_order) || 0 });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{game.id ? `Edit ${game.title}` : "New game"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div><Label>Emoji</Label><Input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} /></div>
            <div className="col-span-3"><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          </div>
          <div><Label>Game link</Label><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input list="arcade-cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
            <div><Label>Platform / author</Label><Input value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} /></div>
          </div>
          <datalist id="arcade-cats">{ARCADE_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Difficulty</Label><select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
            <div><Label>Order</Label><Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></div>
            <label className="mt-6 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.is_free} onChange={(e) => setF({ ...f, is_free: e.target.checked })} /> Free</label>
          </div>
          <Button onClick={submit} className="w-full rounded-full">Save game</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
