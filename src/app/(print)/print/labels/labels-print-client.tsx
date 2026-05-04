"use client";

import { useEffect } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

type LabelItem = {
  id: string;
  name: string;
  sku: string | null;
  sellPriceCents: number | null;
  category: string | null;
  barcodeValue: string;
  priceFormatted: string | null;
};

export function LabelsPrintClient({ items }: { items: LabelItem[] }) {
  useEffect(() => {
    document.title = `Etichette magazzino — ${items.length} prodotti`;
  }, [items.length]);

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
        }

        .labels-grid {
          display: grid;
          grid-template-columns: repeat(4, 62mm);
          gap: 2mm;
          width: fit-content;
          margin: 0 auto;
        }

        .label-card {
          width: 62mm;
          height: 29mm;
          border: 0.5pt solid #ccc;
          border-radius: 2mm;
          padding: 1.5mm 2mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          background: white;
          page-break-inside: avoid;
        }

        .label-name {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 6pt;
          font-weight: bold;
          line-height: 1.2;
          max-height: 14pt;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          color: #111;
        }

        .label-sku {
          font-family: monospace;
          font-size: 5pt;
          color: #666;
          margin-top: 0.5mm;
        }

        .label-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1mm;
        }

        .label-barcode svg {
          display: block;
          max-width: 36mm;
          height: 10mm !important;
        }

        .label-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5mm;
        }

        .label-price {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #111;
          white-space: nowrap;
        }

        .label-qr {
          display: block;
        }
      `}</style>

      {/* Barra schermo */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div className="text-sm text-muted-foreground">
          Etichette magazzino — <strong>{items.length}</strong> {items.length === 1 ? "prodotto" : "prodotti"}
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Stampa etichette
        </button>
      </div>

      {/* Anteprima schermo */}
      <div className="no-print mt-16 mb-8 px-4 text-center text-xs text-muted-foreground">
        Anteprima — 4 etichette per riga, formato 62×29mm su A4
      </div>

      {/* Griglia etichette */}
      <div className="labels-grid">
        {items.map((item) => (
          <div key={item.id} className="label-card">
            <div>
              <div className="label-name">{item.name}</div>
              {item.sku && <div className="label-sku">SKU: {item.sku}</div>}
            </div>
            <div className="label-bottom">
              <div className="label-barcode">
                <Barcode
                  value={item.barcodeValue}
                  format="CODE128"
                  width={1}
                  height={28}
                  fontSize={6}
                  margin={0}
                  displayValue={true}
                  textMargin={1}
                />
              </div>
              <div className="label-right">
                {item.priceFormatted && (
                  <div className="label-price">{item.priceFormatted}</div>
                )}
                <QRCodeSVG
                  value={item.barcodeValue}
                  size={24}
                  className="label-qr"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
