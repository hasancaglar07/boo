import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Book Generator";
  const description = searchParams.get("description") ?? "Produce books with AI";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#fafaf8",
          padding: "60px",
          flexDirection: "column",
          justifyContent: "flex-end",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#1a1a1a",
          }}
        />
        <p style={{ fontSize: 18, color: "#888", margin: "0 0 16px 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          bookgenerator.app
        </p>
        <h1
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: "#111",
            lineHeight: 1.15,
            margin: "0 0 20px 0",
            maxWidth: "900px",
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 24, color: "#555", margin: 0, maxWidth: "800px", lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
