import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const totalFootprint = searchParams.get("totalFootprint") || "";
  const streakDays = searchParams.get("streakDays") || "0";
  const topCategory = searchParams.get("topCategory") || "";

  const hasData = totalFootprint !== "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#f4f3ef",
          padding: "56px 64px",
          fontFamily: "Geist, system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(194,133,107,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 600,
              color: "#1a1a1a",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Calm
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {hasData ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "80px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {totalFootprint}
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: 500,
                      color: "#6b6b68",
                      marginLeft: "6px",
                      alignSelf: "flex-end",
                      marginBottom: "8px",
                    }}
                  >
                    t
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "22px",
                    color: "#6b6b68",
                    fontWeight: 400,
                  }}
                >
                  tonnes CO₂ / year
                </div>
              </div>

              {topCategory && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    backgroundColor: "rgba(194,133,107,0.12)",
                    borderRadius: "100px",
                    border: "1px solid rgba(194,133,107,0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: "15px",
                      color: "#c2856b",
                      fontWeight: 500,
                    }}
                  >
                    {topCategory} is your top category
                  </div>
                </div>
              )}

              {streakDays !== "0" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "20px",
                    color: "#c2856b",
                    fontWeight: 600,
                  }}
                >
                  <span>🔥 {streakDays} day streak</span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "42px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  textAlign: "center",
                }}
              >
                Start Your Carbon Journey
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "20px",
                  color: "#6b6b68",
                  textAlign: "center",
                }}
              >
                Track your footprint and build your streak.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "15px",
            color: "#9a9a97",
            fontWeight: 400,
          }}
        >
          Track your carbon footprint at calm.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
