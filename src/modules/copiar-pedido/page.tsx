import { ClipboardCopy } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

// MÓDULO: Copiar pedido (chave "copiar-pedido")
//
// Este módulo não tem tela de verdade: ele injeta um botão em cada card da
// Central de pedidos (ver src/components/orders/order-card.tsx). Marcado
// como `hidden` no registro, então não vira item de menu.
//
// Esta página existe apenas porque o registro exige um componente por
// módulo, e para quem acessar a URL direto entender o que aconteceu em vez
// de ver uma tela em branco.
export default async function CopiarPedidoModule() {
  return (
    <EmptyState
      icon={ClipboardCopy}
      title="Este módulo funciona dentro da Central de pedidos"
      description="Com ele ligado, cada pedido ganha um botão de copiar que monta o resumo formatado — itens, quantidades, mesa, observações e total — pronto para colar no WhatsApp da cozinha. Não há nada para configurar aqui."
      action={{ label: "Ir para a Central de pedidos", href: "/dashboard/orders" }}
    />
  );
}
