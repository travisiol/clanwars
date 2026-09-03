import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";
import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN } from "@/lib/rules";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

/**
 * The card is the roster: fifty squares, most of them filled.
 *
 * A shared link has one job, which is to make the cap legible before anybody
 * reads a word — and fifty squares does that faster than the sentence does.
 */
export default function OpengraphImage() {
  const seats = Array.from({ length: SEATS_PER_CLAN }, (_, i) => i);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#081426",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#ffffff",
            }}
          >
            {siteConfig.name}
          </div>
          {/* One text node per div: Satori refuses a div with two children
              unless it is told how to lay them out. */}
          <div style={{ fontSize: 20, letterSpacing: 4, color: "#7d97b3" }}>
            {`${HEX_COUNT} HEXES`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 660, gap: 10 }}>
            {seats.map((i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  background: i < 41 ? "#f2a71b" : "transparent",
                  border: i < 41 ? "none" : "2px solid rgba(140,185,230,0.34)",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 76, color: "#ffffff", letterSpacing: -3, lineHeight: 1 }}>
            {siteConfig.tagline}
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#b6c9dd", maxWidth: 900, lineHeight: 1.4 }}>
          Power is counted in seats, not tokens. Every war is declared twelve hours
          before it lands.
        </div>
      </div>
    ),
    { ...size },
  );
}
