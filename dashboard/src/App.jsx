import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";
const API_KEY = "your_api_key_here";

const api = axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${API_KEY}` },
});

// Helper functions
const formatPercent = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return Math.round(value * 100);
};

const getManipulationColor = (score) => {
  if (score < 0.2) return "#06d6a0";
  if (score < 0.5) return "#ffd166";
  return "#ff6b6b";
};

const getRiskLevel = (score) => {
  if (score < 0.2) return { text: "Low Risk", color: "#06d6a0", icon: "🟢" };
  if (score < 0.5)
    return { text: "Moderate Risk", color: "#ffd166", icon: "🟡" };
  if (score < 0.75) return { text: "High Risk", color: "#ff8c42", icon: "🟠" };
  return { text: "Critical Risk", color: "#ff6b6b", icon: "🔴" };
};

const formatTopTactic = (tactic) => {
  if (!tactic || tactic === "none" || tactic === "no data") {
    return "Not enough data";
  }
  if (tactic === "pending") {
    return "Analyzing...";
  }
  return tactic;
};

function App() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    weekly_total: 0,
    weekly_manipulative: 0,
    manipulation_rate: 0,
    top_manipulation: "no data",
    avg_manipulation_score: 0,
  });
  const [echoScore, setEchoScore] = useState(50);
  const [sentimentData, setSentimentData] = useState({
    anger: 0,
    fear: 0,
    surprise: 0,
    joy: 0,
    trust: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topicClusters, setTopicClusters] = useState([]);
  const [otherSideText, setOtherSideText] = useState("");
  const [otherSideResults, setOtherSideResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [platformStats, setPlatformStats] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState(() => {
    const saved = localStorage.getItem("mindmirror_accounts");
    return saved
      ? JSON.parse(saved)
      : { instagram: [], youtube: [], tiktok: [], twitter: [] };
  });

  useEffect(() => {
    localStorage.setItem(
      "mindmirror_accounts",
      JSON.stringify(connectedAccounts),
    );
  }, [connectedAccounts]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        api.get("/api/history", { params: { limit: 200 } }),
        api.get("/api/stats"),
      ]);

      const historyData = historyRes.data?.history || [];
      setHistory(historyData);
      setStats(
        statsRes.data || {
          weekly_total: 0,
          weekly_manipulative: 0,
          manipulation_rate: 0,
          top_manipulation: "no data",
          avg_manipulation_score: 0,
        },
      );

      const manipulativeCount = historyData.filter(
        (h) => h.manipulation_score > 0.2,
      ).length;
      const echoScoreCalc = Math.min(
        100,
        Math.round((manipulativeCount / Math.max(historyData.length, 1)) * 100),
      );
      setEchoScore(echoScoreCalc);

      const emotions = { anger: 0, fear: 0, surprise: 0, joy: 0, trust: 0 };
      historyData.forEach((h) => {
        if (h.manipulation_type === "outrage") emotions.anger += 1;
        else if (h.manipulation_type === "fear") emotions.fear += 1;
        else if (h.manipulation_type === "urgency") emotions.surprise += 1;
        else if (h.sentiment === "positive") emotions.joy += 1;
        else emotions.trust += 0.5;
      });
      const total = historyData.length || 1;
      setSentimentData({
        anger: Math.round((emotions.anger / total) * 100),
        fear: Math.round((emotions.fear / total) * 100),
        surprise: Math.round((emotions.surprise / total) * 100),
        joy: Math.round((emotions.joy / total) * 100),
        trust: Math.round((emotions.trust / total) * 100),
      });

      const last7Days = [...Array(7)]
        .map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split("T")[0];
        })
        .reverse();

      const trend = last7Days.map((day) => {
        const dayData = historyData.filter((h) => h.timestamp?.startsWith(day));
        const dayManip = dayData.filter(
          (h) => h.manipulation_score > 0.2,
        ).length;
        return {
          day: day.substring(5),
          score: dayData.length ? (dayManip / dayData.length) * 100 : 0,
          count: dayData.length,
        };
      });
      setTrendData(trend);

      const topics = {};
      historyData.forEach((h) => {
        const text = h.text?.toLowerCase() || "";
        let topic = "other";
        if (
          text.includes("politic") ||
          text.includes("trump") ||
          text.includes("biden")
        )
          topic = "Politics";
        else if (text.includes("climate") || text.includes("weather"))
          topic = "Climate";
        else if (
          text.includes("tech") ||
          text.includes("ai") ||
          text.includes("apple")
        )
          topic = "Technology";
        else if (
          text.includes("health") ||
          text.includes("covid") ||
          text.includes("vaccine")
        )
          topic = "Health";
        else if (
          text.includes("sport") ||
          text.includes("football") ||
          text.includes("cricket")
        )
          topic = "Sports";
        else if (
          text.includes("celebrity") ||
          text.includes("movie") ||
          text.includes("star")
        )
          topic = "Entertainment";

        if (!topics[topic]) topics[topic] = { total: 0, manipulative: 0 };
        topics[topic].total++;
        if (h.manipulation_score > 0.2) topics[topic].manipulative++;
      });

      const topicArray = Object.entries(topics)
        .map(([name, data]) => ({
          name,
          rate: (data.manipulative / data.total) * 100,
          count: data.total,
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 6);
      setTopicClusters(topicArray);

      const platforms = {};
      historyData.forEach((h) => {
        const platform = h.platform || "unknown";
        if (!platforms[platform])
          platforms[platform] = { total: 0, manipulative: 0 };
        platforms[platform].total++;
        if (h.manipulation_score > 0.2) platforms[platform].manipulative++;
      });
      setPlatformStats(platforms);

      const alerts = historyData
        .filter((h) => h.manipulation_score > 0.3)
        .slice(0, 8)
        .map((h) => ({
          type: h.manipulation_type || "none",
          score: h.manipulation_score || 0,
          text: h.text?.substring(0, 120) || "",
          timestamp: h.timestamp,
          platform: h.platform,
        }));
      setRecentAlerts(alerts);

      const recs = [];
      if (sentimentData.anger > 40)
        recs.push(
          "Your feed is high in anger-triggering content. Try following 2-3 positive news sources.",
        );
      if (echoScoreCalc > 70)
        recs.push(
          "You're in a strong echo chamber. Search for opposing viewpoints on 1-2 topics this week.",
        );
      if (statsRes.data?.top_manipulation === "urgency")
        recs.push(
          "Urgency tactics are common in your feed. Pause before acting on 'limited time' claims.",
        );
      if (statsRes.data?.top_manipulation === "fear")
        recs.push(
          "Fear-based content dominates your feed. Fact-check scary claims before sharing.",
        );
      if (Object.keys(platforms).length < 2)
        recs.push(
          "Connect more social media platforms for a complete picture of your digital diet.",
        );
      if (historyData.length < 20)
        recs.push(
          "Scroll through more content to get better insights about your feed patterns.",
        );
      setRecommendations(recs.slice(0, 4));

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      setWeeklyReport({
        weekStart: weekStart.toLocaleDateString(),
        weekEnd: new Date().toLocaleDateString(),
        totalPosts: historyData.length,
        manipulativePosts: historyData.filter((h) => h.manipulation_score > 0.2)
          .length,
        avgScore: statsRes.data?.avg_manipulation_score || 0,
        topTactic: statsRes.data?.top_manipulation || "no data",
        echoScore: echoScoreCalc,
      });

      setLoading(false);
    } catch (err) {
      console.error("Load error:", err);
      setLoading(false);
    }
  };

  const connectAccount = (platform, value) => {
    if (!value) return;
    setConnectedAccounts((prev) => ({
      ...prev,
      [platform]: [...new Set([...prev[platform], value])],
    }));
  };

  const removeAccount = (platform, index) => {
    setConnectedAccounts((prev) => ({
      ...prev,
      [platform]: prev[platform].filter((_, i) => i !== index),
    }));
  };

  const getOtherSide = async () => {
    if (!otherSideText.trim()) return;
    try {
      const response = await api.post("/api/other-side", {
        text: otherSideText,
        limit: 4,
      });
      setOtherSideResults(response.data?.perspectives || []);
    } catch (err) {
      console.error("Other side error:", err);
      setOtherSideResults([
        {
          text: "Consider seeking alternative perspectives on this topic from multiple sources.",
          metadata: { source: "MindMirror" },
        },
        {
          text: "Fact-check this claim using Google Fact Check Explorer or Snopes.",
          metadata: { source: "Recommendation" },
        },
        {
          text: "Look for experts with opposing views to understand the full picture.",
          metadata: { source: "Media Literacy" },
        },
      ]);
    }
  };

  const exportData = () => {
    const data = {
      history,
      stats,
      weeklyReport,
      echoScore,
      sentimentData,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindmirror_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter((h) => {
    if (filterPlatform !== "all" && h.platform !== filterPlatform) return false;
    if (filterType !== "all" && h.manipulation_type !== filterType)
      return false;
    return true;
  });

  const riskLevel = getRiskLevel(stats.manipulation_rate);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#05080f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#4f7aff" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧠</div>
          <div style={{ fontSize: "1.2rem" }}>Loading MindMirror...</div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#8892b0",
              marginTop: "0.5rem",
            }}
          >
            Analyzing your feed patterns
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#05080f",
        color: "#e8ecf8",
        fontFamily: "'DM Sans', sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "5rem 2rem 3rem",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(79,122,255,0.1)",
            border: "1px solid rgba(79,122,255,0.3)",
            borderRadius: "100px",
            padding: "0.35rem 1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#4f7aff",
              animation: "pulse 2s infinite",
            }}
          ></div>
          AI-Powered Social Media Shield
        </div>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "1rem",
          }}
        >
          Mind
          <span
            style={{
              background: "linear-gradient(135deg, #4f7aff, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Mirror
          </span>
        </h1>
        <p
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            color: "#8892b0",
            fontSize: "1rem",
          }}
        >
          {stats.weekly_total} posts analyzed • {stats.weekly_manipulative}{" "}
          manipulative • Top: {formatTopTactic(stats.top_manipulation)}
        </p>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          background: "#0f1525",
          borderTop: "1px solid rgba(100,130,255,0.12)",
          borderBottom: "1px solid rgba(100,130,255,0.12)",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "center",
          gap: "3rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#4f7aff" }}
          >
            {stats.weekly_total}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8892b0" }}>
            Total Analyzed
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ff6b6b" }}
          >
            {stats.weekly_manipulative}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8892b0" }}>
            Manipulative
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: riskLevel.color,
            }}
          >
            {formatPercent(stats.manipulation_rate)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8892b0" }}>
            {riskLevel.text}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#06d6a0" }}
          >
            100%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8892b0" }}>
            Local Privacy
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(100,130,255,0.12)",
            paddingBottom: "1rem",
          }}
        >
          {[
            "dashboard",
            "alerts",
            "otherside",
            "analytics",
            "accounts",
            "report",
            "settings",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "#4f7aff" : "transparent",
                border: `1px solid ${activeTab === tab ? "#4f7aff" : "rgba(100,130,255,0.2)"}`,
                color: activeTab === tab ? "#fff" : "#8892b0",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              {tab === "dashboard" && "📊 Dashboard"}
              {tab === "alerts" && "⚠️ Alerts"}
              {tab === "otherside" && "🔄 Other Side"}
              {tab === "analytics" && "📈 Analytics"}
              {tab === "accounts" && "🔗 Accounts"}
              {tab === "report" && "📋 Report"}
              {tab === "settings" && "⚙️ Settings"}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            <div
              style={{
                background: "#0f1525",
                borderRadius: "16px",
                border: "1px solid rgba(100,130,255,0.12)",
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#8892b0",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Your Manipulation Risk Level
                  </div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: riskLevel.color,
                    }}
                  >
                    {riskLevel.icon} {riskLevel.text}
                  </div>
                </div>
                <div style={{ flex: 1, maxWidth: "300px" }}>
                  <div
                    style={{
                      height: "8px",
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: "100px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${formatPercent(stats.manipulation_rate)}%`,
                        height: "100%",
                        background: riskLevel.color,
                        borderRadius: "100px",
                      }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={exportData}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(100,130,255,0.3)",
                    color: "#4f7aff",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  📥 Export Report
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  background: "#0f1525",
                  borderRadius: "12px",
                  padding: "1rem",
                  border: "1px solid rgba(100,130,255,0.12)",
                }}
              >
                <div style={{ color: "#8892b0", fontSize: "0.75rem" }}>
                  Echo Chamber Score
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color:
                      echoScore > 70
                        ? "#ff6b6b"
                        : echoScore > 40
                          ? "#ffd166"
                          : "#06d6a0",
                  }}
                >
                  {echoScore}/100
                </div>
              </div>
              <div
                style={{
                  background: "#0f1525",
                  borderRadius: "12px",
                  padding: "1rem",
                  border: "1px solid rgba(100,130,255,0.12)",
                }}
              >
                <div style={{ color: "#8892b0", fontSize: "0.75rem" }}>
                  Top Manipulation
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}
                >
                  {formatTopTactic(stats.top_manipulation)}
                </div>
              </div>
              <div
                style={{
                  background: "#0f1525",
                  borderRadius: "12px",
                  padding: "1rem",
                  border: "1px solid rgba(100,130,255,0.12)",
                }}
              >
                <div style={{ color: "#8892b0", fontSize: "0.75rem" }}>
                  Dominant Emotion
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {Object.entries(sentimentData).sort(
                    (a, b) => b[1] - a[1],
                  )[0]?.[0] || "Neutral"}
                </div>
              </div>
              <div
                style={{
                  background: "#0f1525",
                  borderRadius: "12px",
                  padding: "1rem",
                  border: "1px solid rgba(100,130,255,0.12)",
                }}
              >
                <div style={{ color: "#8892b0", fontSize: "0.75rem" }}>
                  Platforms Active
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {Object.keys(platformStats).length}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#0f1525",
                borderRadius: "16px",
                border: "1px solid rgba(100,130,255,0.12)",
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "1rem" }}>
                📈 Manipulation Trend (Last 7 Days)
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "0.5rem",
                  height: "150px",
                }}
              >
                {trendData.map((day, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        background: "#090d18",
                        borderRadius: "4px",
                        height: "120px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          width: "100%",
                          height: `${day.score}%`,
                          background: getManipulationColor(day.score / 100),
                          borderRadius: "4px",
                          transition: "height 0.5s",
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#8892b0" }}>
                      {day.day}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#4a5578" }}>
                      {day.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#0f1525",
                borderRadius: "16px",
                border: "1px solid rgba(100,130,255,0.12)",
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "1rem" }}>
                🏷️ Topics with Highest Manipulation
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1rem",
                }}
              >
                {topicClusters.map((topic, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem" }}>{topic.name}</span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: getManipulationColor(topic.rate / 100),
                        }}
                      >
                        {Math.round(topic.rate)}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${topic.rate}%`,
                          height: "100%",
                          background: getManipulationColor(topic.rate / 100),
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#4a5578",
                        marginTop: "0.25rem",
                      }}
                    >
                      {topic.count} posts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "rgba(79,122,255,0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(79,122,255,0.2)",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  color: "#4f7aff",
                }}
              >
                💡 Personalized Recommendations
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.85rem",
                      color: "#8892b0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>•</span> {rec}
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <div style={{ color: "#8892b0", fontSize: "0.85rem" }}>
                    Keep scrolling to get personalized insights!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === "alerts" && (
          <div
            style={{
              background: "#0f1525",
              borderRadius: "16px",
              border: "1px solid rgba(100,130,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#141c30",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(100,130,255,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  ⚠️ Live Manipulation Alerts
                </div>
                <div style={{ fontSize: "0.8rem", color: "#8892b0" }}>
                  Detected in real-time while you scroll
                </div>
              </div>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                style={{
                  background: "#090d18",
                  border: "1px solid rgba(100,130,255,0.2)",
                  color: "#e8ecf8",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                }}
              >
                <option value="all">All Platforms</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="reddit">Reddit</option>
              </select>
            </div>
            <div style={{ padding: "1.5rem" }}>
              {recentAlerts.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#8892b0",
                    padding: "2rem",
                  }}
                >
                  No alerts yet. Scroll through social media to see detection in
                  action!
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {recentAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "flex-start",
                        background: "#090d18",
                        borderRadius: "12px",
                        padding: "1rem",
                        border: "1px solid rgba(100,130,255,0.12)",
                        borderLeft: `3px solid ${getManipulationColor(alert.score)}`,
                      }}
                    >
                      <div style={{ fontSize: "1.3rem" }}>
                        {alert.type === "urgency"
                          ? "⚡"
                          : alert.type === "fear"
                            ? "😨"
                            : alert.type === "outrage"
                              ? "😤"
                              : "⚠️"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              textTransform: "uppercase",
                              fontSize: "0.85rem",
                            }}
                          >
                            {alert.type}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#4a5578" }}>
                            {alert.platform} •{" "}
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div
                          style={{
                            color: "#8892b0",
                            fontSize: "0.82rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {alert.text}...
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.4rem",
                            marginTop: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "100px",
                              background: "rgba(79,122,255,0.12)",
                              color: "#4f7aff",
                            }}
                          >
                            {alert.type}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "100px",
                              background: "rgba(255,107,107,0.12)",
                              color: "#ff6b6b",
                            }}
                          >
                            {Math.round(alert.score * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OTHER SIDE TAB */}
        {activeTab === "otherside" && (
          <div
            style={{
              background: "#0f1525",
              borderRadius: "16px",
              border: "1px solid rgba(100,130,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#141c30",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(100,130,255,0.12)",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                🔄 The Other Side - Counter Perspectives
              </div>
              <div style={{ fontSize: "0.8rem", color: "#8892b0" }}>
                Get balanced viewpoints on any claim or post
              </div>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <textarea
                rows="4"
                value={otherSideText}
                onChange={(e) => setOtherSideText(e.target.value)}
                placeholder="Paste a manipulative post, headline, or claim here..."
                style={{
                  width: "100%",
                  background: "#090d18",
                  border: "1px solid rgba(100,130,255,0.12)",
                  color: "#e8ecf8",
                  padding: "1rem",
                  borderRadius: "12px",
                  fontFamily: "inherit",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              ></textarea>
              <button
                onClick={getOtherSide}
                style={{
                  background: "#4f7aff",
                  color: "#fff",
                  border: "none",
                  padding: "0.7rem 1.5rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                  marginBottom: "1.5rem",
                }}
              >
                Find Counter-Perspectives →
              </button>

              {otherSideResults.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#06d6a0",
                      marginBottom: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    📰 BALANCED PERSPECTIVES:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {otherSideResults.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#090d18",
                          borderRadius: "10px",
                          padding: "1rem",
                          border: "1px solid rgba(100,130,255,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "#06d6a0",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Source: {item.metadata?.source || "MindMirror"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#8892b0",
                            lineHeight: 1.6,
                          }}
                        >
                          {item.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  background: "#0f1525",
                  borderRadius: "16px",
                  border: "1px solid rgba(100,130,255,0.12)",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "1rem" }}>
                  🧠 Emotion Breakdown
                </div>
                {[
                  {
                    name: "Anger",
                    value: sentimentData.anger,
                    color: "#ff6b6b",
                  },
                  { name: "Fear", value: sentimentData.fear, color: "#ff8c42" },
                  {
                    name: "Surprise",
                    value: sentimentData.surprise,
                    color: "#ffd166",
                  },
                  { name: "Joy", value: sentimentData.joy, color: "#06d6a0" },
                  {
                    name: "Trust",
                    value: sentimentData.trust,
                    color: "#4f7aff",
                  },
                ].map((em) => (
                  <div key={em.name} style={{ marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span>{em.name}</span>
                      <span>{em.value}%</span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${em.value}%`,
                          height: "100%",
                          background: em.color,
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#0f1525",
                  borderRadius: "16px",
                  border: "1px solid rgba(100,130,255,0.12)",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "1rem" }}>
                  📱 Platform Analysis
                </div>
                {Object.entries(platformStats).map(([platform, data]) => (
                  <div key={platform} style={{ marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {platform}
                      </span>
                      <span>
                        {Math.round((data.manipulative / data.total) * 100)}%
                        manipulative
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(data.manipulative / data.total) * 100}%`,
                          height: "100%",
                          background: getManipulationColor(
                            data.manipulative / data.total,
                          ),
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#4a5578",
                        marginTop: "0.25rem",
                      }}
                    >
                      {data.total} posts analyzed
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#0f1525",
                borderRadius: "16px",
                border: "1px solid rgba(100,130,255,0.12)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#141c30",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid rgba(100,130,255,0.12)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ fontWeight: 700 }}>📜 Detection History</div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    style={{
                      background: "#090d18",
                      border: "1px solid rgba(100,130,255,0.2)",
                      color: "#e8ecf8",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="all">All Platforms</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="reddit">Reddit</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{
                      background: "#090d18",
                      border: "1px solid rgba(100,130,255,0.2)",
                      color: "#e8ecf8",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="urgency">Urgency</option>
                    <option value="fear">Fear</option>
                    <option value="outrage">Outrage</option>
                    <option value="scarcity">Scarcity</option>
                  </select>
                </div>
              </div>
              <div style={{ maxHeight: "400px", overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#0f1525",
                    }}
                  >
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(100,130,255,0.12)",
                      }}
                    >
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          color: "#8892b0",
                        }}
                      >
                        Time
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          color: "#8892b0",
                        }}
                      >
                        Platform
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          color: "#8892b0",
                        }}
                      >
                        Content
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          color: "#8892b0",
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          color: "#8892b0",
                        }}
                      >
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.slice(0, 50).map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid rgba(100,130,255,0.06)",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.75rem",
                            fontSize: "0.7rem",
                            color: "#4a5578",
                          }}
                        >
                          {new Date(item.timestamp).toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            fontSize: "0.8rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.platform || "unknown"}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            fontSize: "0.8rem",
                            maxWidth: "300px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#8892b0",
                          }}
                        >
                          {item.text?.substring(0, 60)}...
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            fontSize: "0.8rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.manipulation_type || "none"}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              background: `rgba(${item.manipulation_score > 0.5 ? "255,107,107" : item.manipulation_score > 0.25 ? "255,209,102" : "6,214,160"},0.15)`,
                              color:
                                item.manipulation_score > 0.5
                                  ? "#ff6b6b"
                                  : item.manipulation_score > 0.25
                                    ? "#ffd166"
                                    : "#06d6a0",
                            }}
                          >
                            {Math.round(item.manipulation_score * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === "accounts" && (
          <div
            style={{
              background: "#0f1525",
              borderRadius: "16px",
              border: "1px solid rgba(100,130,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#141c30",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(100,130,255,0.12)",
              }}
            >
              <div style={{ fontWeight: 700 }}>🔗 Connected Accounts</div>
              <div style={{ fontSize: "0.8rem", color: "#8892b0" }}>
                Your data stays on your device — we don't store anything
              </div>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {["instagram", "youtube", "tiktok", "twitter"].map(
                  (platform) => (
                    <div
                      key={platform}
                      style={{
                        background: "#090d18",
                        borderRadius: "12px",
                        padding: "1rem",
                        border: "1px solid rgba(100,130,255,0.12)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            background:
                              platform === "instagram"
                                ? "linear-gradient(135deg,#f9a825,#e91e63,#9c27b0)"
                                : platform === "youtube"
                                  ? "#ff0000"
                                  : platform === "tiktok"
                                    ? "#000"
                                    : "#1da1f2",
                          }}
                        >
                          {platform === "instagram"
                            ? "📸"
                            : platform === "youtube"
                              ? "▶️"
                              : platform === "tiktok"
                                ? "🎵"
                                : "🐦"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {platform}
                          </div>
                          <div
                            style={{ fontSize: "0.75rem", color: "#4a5578" }}
                          >
                            {connectedAccounts[platform].length} accounts
                            connected
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <input
                          id={`${platform}-input`}
                          type="text"
                          placeholder={`@${platform}handle`}
                          style={{
                            flex: 1,
                            background: "#05080f",
                            border: "1px solid rgba(100,130,255,0.2)",
                            color: "#e8ecf8",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                          }}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(
                              `${platform}-input`,
                            ).value;
                            if (val) connectAccount(platform, val);
                          }}
                          style={{
                            background: "#4f7aff",
                            color: "#fff",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {connectedAccounts[platform].map((acc, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "rgba(79,122,255,0.1)",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "100px",
                              fontSize: "0.75rem",
                            }}
                          >
                            <span>{acc}</span>
                            <button
                              onClick={() => removeAccount(platform, idx)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ff6b6b",
                                cursor: "pointer",
                                fontSize: "0.7rem",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === "report" && weeklyReport && (
          <div
            style={{
              background: "#0f1525",
              borderRadius: "16px",
              border: "1px solid rgba(100,130,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(79,122,255,0.15), rgba(124,58,237,0.1))",
                padding: "1.5rem 2rem",
                borderBottom: "1px solid rgba(100,130,255,0.12)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
              <div style={{ fontWeight: 800, fontSize: "1.3rem" }}>
                Weekly Manipulation Report
              </div>
              <div style={{ fontSize: "0.85rem", color: "#8892b0" }}>
                {weeklyReport.weekStart} - {weeklyReport.weekEnd}
              </div>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    background: "#090d18",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: "#4f7aff",
                    }}
                  >
                    {weeklyReport.totalPosts}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#8892b0" }}>
                    Total Posts
                  </div>
                </div>
                <div
                  style={{
                    background: "#090d18",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: "#ff6b6b",
                    }}
                  >
                    {weeklyReport.manipulativePosts}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#8892b0" }}>
                    Manipulative Posts
                  </div>
                </div>
                <div
                  style={{
                    background: "#090d18",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: getManipulationColor(weeklyReport.avgScore),
                    }}
                  >
                    {Math.round(weeklyReport.avgScore * 100)}%
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#8892b0" }}>
                    Avg Manipulation Score
                  </div>
                </div>
                <div
                  style={{
                    background: "#090d18",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      textTransform: "capitalize",
                    }}
                  >
                    {formatTopTactic(weeklyReport.topTactic)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#8892b0" }}>
                    Top Tactic
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(6,214,160,0.06)",
                  border: "1px solid rgba(6,214,160,0.15)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                    color: "#06d6a0",
                  }}
                >
                  ✅ Week in Review
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#8892b0",
                    lineHeight: 1.6,
                  }}
                >
                  This week, you were exposed to{" "}
                  <strong>{weeklyReport.manipulativePosts}</strong> manipulative
                  posts out of <strong>{weeklyReport.totalPosts}</strong> total
                  (
                  {weeklyReport.totalPosts > 0
                    ? Math.round(
                        (weeklyReport.manipulativePosts /
                          weeklyReport.totalPosts) *
                          100,
                      )
                    : 0}
                  % manipulation rate). Your echo chamber score is{" "}
                  <strong>{weeklyReport.echoScore}/100</strong>, and the most
                  common manipulation tactic was{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {formatTopTactic(weeklyReport.topTactic)}
                  </strong>
                  .
                </div>
              </div>

              <button
                onClick={exportData}
                style={{
                  width: "100%",
                  background: "#4f7aff",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                  marginTop: "0.5rem",
                }}
              >
                📥 Export Full Report (JSON)
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div
            style={{
              background: "#0f1525",
              borderRadius: "16px",
              border: "1px solid rgba(100,130,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#141c30",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(100,130,255,0.12)",
              }}
            >
              <div style={{ fontWeight: 700 }}>⚙️ Settings</div>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  🗑️ Data Management
                </div>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear all local data? This will remove all connected accounts.",
                      )
                    ) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  style={{
                    background: "rgba(255,107,107,0.2)",
                    border: "1px solid rgba(255,107,107,0.3)",
                    color: "#ff6b6b",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginRight: "0.5rem",
                  }}
                >
                  Clear Local Data
                </button>
                <button
                  onClick={() => {
                    loadData();
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(100,130,255,0.3)",
                    color: "#4f7aff",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Refresh Data
                </button>
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  ℹ️ About
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#8892b0",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>MindMirror</strong> - AI-powered manipulation
                  detection for social media.
                  <br />
                  Runs 100% locally on your device. No data leaves your
                  computer.
                  <br />
                  Built with FastAPI, React, and HuggingFace Transformers.
                  <br />
                  <span
                    style={{
                      color: "#4a5578",
                      marginTop: "0.5rem",
                      display: "inline-block",
                    }}
                  >
                    Version 2.0.0 • Open Source • Privacy First
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        * { scrollbar-width: thin; scrollbar-color: #4f7aff #0f1525; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f1525; }
        ::-webkit-scrollbar-thumb { background: #4f7aff; border-radius: 3px; }
      `}</style>
    </div>
  );
}

export default App;
