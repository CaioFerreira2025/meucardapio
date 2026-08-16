"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// O QR Code é gerado 100% no navegador (qrcode.react, SVG) em vez de uma
// API pública — assim funciona sem depender de um serviço de terceiros no
// ar (e sem vazar a URL do cardápio pra fora a cada carregamento da
// página). O SVG já existente na tela é reaproveitado tanto para o
// download em SVG (serializado direto) quanto em PNG (desenhado num
// <canvas> em resolução maior, boa o suficiente pra imprimir).
const PREVIEW_SIZE = 144;
const EXPORT_SIZE = 1024;

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function QrCodeCard({ url, slug }: { url: string; slug: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  function getSvgMarkup() {
    const svg = svgRef.current;
    if (!svg) return null;
    // Clona pra poder anotar o namespace do SVG sem mexer no elemento que
    // está na tela.
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  }

  function handleDownloadSvg() {
    const markup = getSvgMarkup();
    if (!markup) {
      toast.error("Não foi possível gerar o QR Code. Tente novamente.");
      return;
    }
    downloadBlob(
      new Blob([markup], { type: "image/svg+xml" }),
      `qrcode-cardapio-${slug}.svg`
    );
  }

  function handleDownloadPng() {
    const markup = getSvgMarkup();
    if (!markup) {
      toast.error("Não foi possível gerar o QR Code. Tente novamente.");
      return;
    }

    const svgBlob = new Blob([markup], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        toast.error("Não foi possível gerar o QR Code. Tente novamente.");
        return;
      }
      // Fundo branco explícito — sem isso, canvas exporta com transparência
      // e o PNG pode ficar ilegível ao imprimir em papel colorido.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      ctx.drawImage(image, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Não foi possível gerar o QR Code. Tente novamente.");
          return;
        }
        downloadBlob(blob, `qrcode-cardapio-${slug}.png`);
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      toast.error("Não foi possível gerar o QR Code. Tente novamente.");
    };
    image.src = svgUrl;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4 text-orange-300" />
          QR Code do cardápio
        </CardTitle>
        <CardDescription>
          Imprima e cole nas mesas — seus clientes escaneiam e caem direto no
          cardápio digital.
        </CardDescription>
      </CardHeader>

      <div className="flex flex-col items-center gap-4 px-(--card-spacing) sm:flex-row sm:items-center">
        <div className="flex size-36 shrink-0 items-center justify-center rounded-xl bg-white p-3 ring-1 ring-white/10">
          <QRCodeSVG
            ref={svgRef}
            value={url}
            size={PREVIEW_SIZE}
            level="M"
            // 4 módulos de margem = "quiet zone" mínima recomendada pela
            // especificação do QR Code. Sem ela, o PNG/SVG baixado (que vai
            // parar impresso numa mesa, sem a caixa branca de fundo que
            // envolve a pré-visualização aqui na tela) pode falhar ao ser
            // escaneado se a mesa/papel ao redor não for branca.
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#18181b"
          />
        </div>

        <div className="flex w-full flex-1 flex-col gap-2 sm:items-start">
          <p className="text-sm text-muted-foreground">
            Aponte a câmera do celular para o código ou baixe a imagem para
            imprimir.
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
                />
              }
            >
              <Download className="size-4" />
              Baixar QR Code
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleDownloadPng}>
                Baixar em PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadSvg}>
                Baixar em SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
