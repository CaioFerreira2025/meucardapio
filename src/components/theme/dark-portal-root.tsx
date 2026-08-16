"use client";

import * as React from "react";

/**
 * Componentes com portal (Dialog, Sheet, Select, DropdownMenu, AlertDialog)
 * renderizam seu conteúdo direto em `document.body` por padrão — o que os
 * tira de dentro de qualquer wrapper com a classe `dark`, quebrando o tema
 * escuro do painel e do cardápio público (a variante `dark:` do Tailwind e
 * os tokens de `.dark` em globals.css dependem de um ancestral `.dark` no
 * DOM). Este contexto expõe o próprio nó raiz "escuro" como `container`
 * para esses portais, mantendo o conteúdo dentro da árvore com tema escuro
 * mesmo saindo da árvore de layout normal via portal.
 */
const DarkPortalContext = React.createContext<HTMLElement | null>(null);

export function useDarkPortalContainer() {
  return React.useContext(DarkPortalContext);
}

export function DarkPortalRoot({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  return (
    <div ref={setContainer} className={className}>
      <DarkPortalContext.Provider value={container}>
        {children}
      </DarkPortalContext.Provider>
    </div>
  );
}
