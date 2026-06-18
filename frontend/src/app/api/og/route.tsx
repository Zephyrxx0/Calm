import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const total = searchParams.get("total") || "0";
  const breakdown = searchParams.get("breakdown") || "";

  // Parse breakdown categories for display
  const categories = breakdown
    ? breakdown.split(",").map((item) => {
        const [name, value] = item.split(":");
        return { name, value };
      })
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#FAFAF8",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            fontSize: "18px",
            color: "#9A9A97",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          Calm
        </div>

        {/* Total */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "72px",
              fontWeight: "600",
              color: "#2C2C2A",
              letterSpacing: "-0.02em",
            }}
          >
            {total}t
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#6B6B68",
              marginTop: "8px",
            }}
          >
            CO₂e per year
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {categories.slice(0, 4).map((cat) => (
              <div
                key={cat.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "12px 20px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "1px solid #E5E5E2",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "14px",
                    color: "#6B6B68",
                    textTransform: "capitalize",
                  }}
                >
                  {cat.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#7A8B6F",
                  }}
                >
                  {cat.value}t
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: "40px",
            fontSize: "14px",
            color: "#9A9A97",
          }}
        >
          calm.app — Know your footprint
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
