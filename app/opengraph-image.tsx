import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Gabriel Keller — CS @ UT Austin · Building agent infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f8fafc",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Gabriel Keller
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#94a3b8",
              lineHeight: 1.4,
            }}
          >
            CS @ UT Austin · Building agent infrastructure
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "#64748b",
                fontFamily: "monospace",
              }}
            >
              $ cat welcome.md
            </div>
            <div
              style={{
                width: "2px",
                height: "28px",
                backgroundColor: "#22d3ee",
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            fontSize: 22,
            color: "#475569",
          }}
        >
          keller.cv
        </div>
      </div>
    ),
    { ...size },
  );
}
