// Conteúdo do botão de ajuda ("Como funciona?") presente no topo de cada
// aba do painel — ver src/components/dashboard/page-help.tsx.
//
// Fica num arquivo de configuração, e não espalhado nas páginas, por dois
// motivos práticos: dá para revisar o texto de todas as abas de uma vez
// (tom, tamanho, promessas) sem abrir sete arquivos, e evita que uma aba
// nova nasça sem ajuda — basta não achar a chave aqui para lembrar.
//
// Regras de escrita adotadas: falar com o dono do restaurante, não com o
// desenvolvedor; começar pelo PARA QUE SERVE antes do como; e cada passo
// ser uma ação que ele consegue fazer hoje, não um conceito.

export type PageHelp = {
  title: string;
  intro: string;
  steps: { title: string; description: string }[];
  tip?: string;
};

export const PAGE_HELP = {
  dashboard: {
    title: "Visão geral",
    intro:
      "É o resumo do seu dia: quanto entrou, quantos pedidos chegaram e o que está pendente agora.",
    steps: [
      {
        title: "Acompanhe os números do dia",
        description:
          "Faturamento, pedidos e ticket médio consideram apenas hoje, no horário de Brasília. Viram a partir da meia-noite.",
      },
      {
        title: "Fique de olho nos avisos",
        description:
          "Mesas que pediram a conta aparecem em destaque aqui, para ninguém ficar esperando sem ser atendido.",
      },
      {
        title: "Divulgue seu cardápio",
        description:
          "O link e o QR Code do seu cardápio estão nesta tela. Imprima o QR e coloque nas mesas ou no balcão.",
      },
    ],
    tip: "Deixe esta tela aberta durante o expediente: pedidos novos avisam sozinhos.",
  },

  menu: {
    title: "Cardápio",
    intro:
      "Aqui você monta o cardápio digital que seus clientes veem ao escanear o QR Code.",
    steps: [
      {
        title: "Crie categorias",
        description:
          "Comece pelos grupos do seu cardápio: Entradas, Pratos, Bebidas, Sobremesas. Use as setas para mudar a ordem em que aparecem para o cliente.",
      },
      {
        title: "Cadastre os produtos",
        description:
          "Dentro de cada categoria, adicione os itens com foto, descrição e preço. Fotos boas aumentam bastante o pedido médio.",
      },
      {
        title: "Controle a disponibilidade",
        description:
          "Acabou um item? Desative no botão ao lado dele. Ele some do cardápio do cliente na hora, sem precisar excluir.",
      },
    ],
    tip: "Use \"Venda mais\" no cadastro do produto para sugerir acompanhamentos na hora do pedido.",
  },

  orders: {
    title: "Pedidos",
    intro:
      "É o painel de produção. Todo pedido feito pelo cardápio digital cai aqui em tempo real.",
    steps: [
      {
        title: "Acompanhe as colunas",
        description:
          "O pedido caminha por Recebido, Em preparo, Pronto e Entregue. Clique no botão do card para avançar a etapa.",
      },
      {
        title: "O cliente vê o mesmo",
        description:
          "Cada mudança aqui aparece no celular do cliente na hora — o que reduz muito a pergunta \"já saiu meu pedido?\".",
      },
      {
        title: "Feche a conta da mesa",
        description:
          "Quando o cliente pede a conta, a mesa aparece em destaque. Registre a forma de pagamento e a mesa é liberada.",
      },
    ],
    tip: "Pedidos entregues podem ser arquivados para limpar o quadro sem perder o histórico.",
  },

  comanda: {
    title: "Comanda",
    intro:
      "Para lançar pedidos feitos no balcão ou anotados pelo garçom, sem passar pelo celular do cliente.",
    steps: [
      {
        title: "Escolha a mesa",
        description:
          "Informe o número da mesa ou comanda. Vários pedidos na mesma mesa se juntam numa conta só.",
      },
      {
        title: "Monte o pedido",
        description:
          "Toque nos produtos para adicionar. Só aparecem aqui os itens marcados como disponíveis no Cardápio.",
      },
      {
        title: "Envie para a cozinha",
        description:
          "O pedido entra na aba Pedidos exatamente como um pedido feito pelo cliente, no mesmo fluxo de produção.",
      },
    ],
  },

  caixa: {
    title: "Caixa",
    intro:
      "Controla o dinheiro em espécie do dia: quanto entrou, quanto saiu e se bate no fim do expediente.",
    steps: [
      {
        title: "Abra o turno",
        description:
          "No começo do dia, informe quanto tem de troco na gaveta. Esse é o valor de abertura.",
      },
      {
        title: "As vendas entram sozinhas",
        description:
          "Todo pedido pago em dinheiro é somado automaticamente ao caixa. Você não precisa lançar nada à mão.",
      },
      {
        title: "Feche e confira",
        description:
          "No fim do expediente, conte a gaveta e informe o valor. O sistema mostra se sobrou ou faltou dinheiro.",
      },
    ],
    tip: "Pagamentos em Pix e cartão aparecem nos relatórios, mas não entram na conferência da gaveta.",
  },

  customers: {
    title: "Clientes",
    intro:
      "Sua base de clientes, montada sozinha a partir dos pedidos — sem você precisar cadastrar ninguém.",
    steps: [
      {
        title: "Cadastro automático",
        description:
          "Cada pedido novo registra nome e WhatsApp do cliente aqui, junto do quanto ele já gastou.",
      },
      {
        title: "Descubra quem mais volta",
        description:
          "A lista mostra frequência e total gasto, então dá para ver rapidamente quem são seus melhores clientes.",
      },
      {
        title: "Fale pelo WhatsApp",
        description:
          "Cada cliente tem um atalho para o WhatsApp, útil para avisar de promoções ou recuperar quem sumiu.",
      },
    ],
  },

  reviews: {
    title: "Avaliações",
    intro:
      "O que seus clientes acharam. A avaliação é pedida automaticamente depois que o pedido é entregue.",
    steps: [
      {
        title: "Chegam sozinhas",
        description:
          "O cliente avalia pelo próprio celular, na tela de acompanhamento do pedido. Você não precisa pedir.",
      },
      {
        title: "Responda quem reclamou",
        description:
          "Avaliações baixas têm atalho direto para o WhatsApp do cliente, com mensagem pronta. Resolver rápido evita reclamação pública.",
      },
      {
        title: "Use como termômetro",
        description:
          "A média por período mostra se uma mudança no cardápio ou na equipe melhorou ou piorou a percepção.",
      },
    ],
  },

  settings: {
    title: "Configurações",
    intro:
      "A identidade do seu restaurante: é o que o cliente vê no topo do cardápio digital.",
    steps: [
      {
        title: "Preencha o essencial",
        description:
          "Nome, logo e uma descrição curta. É a primeira impressão de quem escaneia o QR Code na mesa.",
      },
      {
        title: "Confira o endereço do cardápio",
        description:
          "O link do seu cardápio é montado a partir do nome. Se mudar, o QR Code impresso antes para de funcionar.",
      },
      {
        title: "Abra e feche a loja",
        description:
          "Com a loja fechada, o cardápio continua visível mas ninguém consegue enviar pedido — útil fora do horário.",
      },
    ],
  },

  billing: {
    title: "Cobrança",
    intro: "Status da sua assinatura, plano atual e data da próxima renovação.",
    steps: [
      {
        title: "Acompanhe o status",
        description:
          "Mostra se a assinatura está ativa, vencendo ou com pagamento pendente, e até quando vale o período atual.",
      },
      {
        title: "Troque de plano quando quiser",
        description:
          "Em \"Ver planos\" você escolhe outro plano. A liberação é automática assim que o pagamento é aprovado.",
      },
      {
        title: "Cancelamento sem pegadinha",
        description:
          "Ao cancelar, o acesso continua até o fim do período já pago. Seus dados e pedidos permanecem salvos.",
      },
    ],
  },
  // Ajuda genérica das telas de módulo sob demanda. Cada módulo pode ter a
  // sua própria explicação dentro da própria tela; este texto responde a
  // dúvida que é comum a todos ("por que eu tenho isso e meu colega não?").
  module: {
    title: "Módulo adicional",
    intro:
      "Esta é uma ferramenta extra, liberada especificamente para a sua conta — ela não faz parte do painel padrão.",
    steps: [
      {
        title: "Exclusivo da sua conta",
        description:
          "Módulos são ativados um a um, conforme o combinado. Outros restaurantes não veem esta aba.",
      },
      {
        title: "Não interfere no resto",
        description:
          "Cada módulo é independente do painel base — cardápio, pedidos e caixa continuam funcionando igual, com ou sem ele.",
      },
      {
        title: "Precisa de ajuste?",
        description:
          "Fale com o suporte: dá para ativar novos módulos ou ajustar os atuais sem mexer no resto da sua operação.",
      },
    ],
  },
} as const satisfies Record<string, PageHelp>;

export type PageHelpKey = keyof typeof PAGE_HELP;
