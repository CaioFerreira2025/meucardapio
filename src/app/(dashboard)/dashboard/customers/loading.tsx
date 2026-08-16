import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// a rota /dashboard/customers. Título e cabeçalho da tabela já aparecem de
// imediato — só as linhas (que dependem da agregação de pedidos por
// cliente feita em `page.tsx`) viram esqueleto enquanto carregam.
// Puramente visual: nenhuma consulta, rota ou lógica de negócio é alterada.
export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Clientes
        </h1>
        <p className="text-muted-foreground">
          Quem já pediu no seu cardápio, quanto gastou e quando voltou.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Pedidos</TableHead>
              <TableHead className="text-zinc-400">Total gasto</TableHead>
              <TableHead className="text-zinc-400">Ticket médio</TableHead>
              <TableHead className="text-zinc-400">Último pedido</TableHead>
              <TableHead className="text-right text-zinc-400">Histórico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-white/10">
                <TableCell>
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-6" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-14" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-7 w-7 rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
