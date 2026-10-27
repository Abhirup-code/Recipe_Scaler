"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { formatFraction } from "@/lib/format";
import { shareUrl } from "@/lib/share";
import type { UnitSystem } from "@/lib/types";
import { QrCode } from "./QrCode";

type Status = "idle" | "copied" | "failed";

/** Share this recipe at the current servings and units: the phone's share sheet, a copied link, or a QR code. */
export function ShareRecipe({ name, servings, system }: { name: string; servings: number; system: UnitSystem }) {
  const [status, setStatus] = useState<Status>("idle");
  const [showQr, setShowQr] = useState(false);
  const current = () => shareUrl(window.location.href, servings, system);
  // Only built in the browser, after a click, so it always matches the servings on screen.
  const url = showQr || status === "failed" ? current() : null;
  const amount = Number.isInteger(servings) ? String(servings) : `about ${formatFraction(Math.round(servings * 4) / 4)}`;
  const text = `${name}, scaled for ${amount} ${servings === 1 ? "serving" : "servings"}`;

  async function share() {
    const link = current();
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: name, text, url: link });
        track("share_recipe", { method: "share_sheet" });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return; // They closed the share sheet.
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setStatus("copied");
      track("share_recipe", { method: "copy" });
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="share">
      <div className="actions">
        <button type="button" className="button" onClick={share}>
          Share
        </button>
        <button
          type="button"
          className="button"
          aria-expanded={showQr}
          onClick={() => {
            setShowQr((v) => !v);
            if (!showQr) track("share_recipe", { method: "qr" });
          }}
        >
          {showQr ? "Hide QR code" : "QR code"}
        </button>
      </div>
      <p className="muted share-status" role="status">
        {status === "copied" && "Link copied. It opens at these servings and units."}
        {status === "failed" && "Could not copy. Select the link below and copy it."}
      </p>
      {status === "failed" && url && (
        <input className="share-link" readOnly value={url} aria-label="Link to share" onFocus={(e) => e.target.select()} />
      )}
      {showQr && url && (
        <figure className="share-qr">
          <QrCode text={url} label={`QR code linking to ${text}`} />
          <figcaption className="muted">Scan with your phone to open {text}.</figcaption>
        </figure>
      )}
    </div>
  );
}
