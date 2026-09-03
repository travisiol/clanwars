import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The mark: a hex with one edge drawn heavy — the side somebody is on. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#081426",
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path
            d="M17 5.42 22 12l-5 6.58H7L2 12l5-6.58Z"
            fill="none"
            stroke="#f2a71b"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M17 5.42 22 12l-5 6.58"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
