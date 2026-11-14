import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRegisteredUsers } from "@/lib/admin-stats.functions";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString() : "Never";

export function AdminUsers({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const fetchUsers = useServerFn(getRegisteredUsers);
  const users = useQuery({ queryKey: ["admin-users", page], queryFn: () => fetchUsers({ data: { page } }), staleTime: 30_000 });
  const pages = Math.max(1, Math.ceil((users.data?.total ?? 0) / 50));
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Registered users{users.data ? ` (${users.data.total.toLocaleString()})` : ""}</DialogTitle></DialogHeader>
      {users.isPending ? <p className="animate-pulse text-muted-foreground">Loading users…</p>
        : users.isError ? <div className="space-y-3"><p role="alert" className="text-destructive">Couldn't load registered users.</p><Button variant="outline" onClick={() => users.refetch()}><RefreshCw className="h-4 w-4" /> Retry</Button></div>
        : <>
          {users.data.users.length === 0 ? <p className="text-muted-foreground">No registered users.</p> : <ul className="divide-y divide-border">{users.data.users.map((user) => <li key={user.id} className="space-y-2 py-4">
            <div className="min-w-0"><p className="break-words font-bold">{user.displayName || user.username || "Unnamed learner"}</p>{user.username && <p className="break-words text-sm text-muted-foreground">@{user.username}</p>}<p className="break-all text-sm">{user.email || "No email"}</p></div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span>Registered: {date(user.registeredAt)}</span><span>Last sign-in: {date(user.lastSignInAt)}</span><span>{user.confirmed ? "Email confirmed" : "Email not confirmed"}</span></div>
          </li>)}</ul>}
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3"><Button size="sm" variant="outline" disabled={page === 1 || users.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button><span className="text-sm tabular-nums">{page} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages || users.isFetching} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button></div>
        </>}
    </DialogContent>
  </Dialog>;
}