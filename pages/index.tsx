import { useState, useRef, useEffect, MouseEvent } from "react";
import { Star, Tv, Loader2 } from "lucide-react";
import Head from "next/head";
import React from "react";

// Types
interface ToastProps {
  message: string;
  type: "error" | "success";
  onClose: () => void;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  status: "Live" | "Scheduled" | "FT";
  display: string;
  time: Date;
  eventUrl: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}

interface MatchStatus {
  status: "Live" | "Scheduled" | "FT";
  display: string;
}

interface MatchesState {
  live: Match[];
  scheduled: Match[];
  finished: Match[];
}

interface ApiResponse {
  today: RawMatch[];
}

interface RawMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  time: string;
  eventUrl: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}

// Adsterra Native Banner Component
const AdsterraNativeBanner: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "//pl25846014.effectiveratecpm.com/db1b505556897740c7475f57aa733c5e/invoke.js";

    document.head.appendChild(script);

    return () => {
      script.remove();
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="container-db1b505556897740c7475f57aa733c5e" ref={adContainerRef} />
  );
};

// Toast Component
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div
    className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white transition-opacity duration-300 
    ${type === "error" ? "bg-red-500" : "bg-green-500"}`}
  >
    {message}
  </div>
);

// Team Logo Components
interface FallbackLogoProps {
  teamName: string;
}

const FallbackLogo: React.FC<FallbackLogoProps> = ({ teamName }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="1" />
      <text
        x="12"
        y="16"
        fontSize="11"
        textAnchor="middle"
        fill="#666"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="200"
        letterSpacing="0.5"
      >
        {teamName.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
};

interface TeamLogoProps {
  logoUrl: string;
  teamName: string;
  className?: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({
  logoUrl,
  teamName,
  className = "w-5 h-5 mr-2",
}) => {
  const [hasError, setHasError] = React.useState<boolean>(false);

  const handleError = (): void => {
    setHasError(true);
  };

  return hasError ? (
    <FallbackLogo teamName={teamName} />
  ) : (
    <div className="flex items-center justify-center overflow-hidden">
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={`object-contain ${className}`}
        onError={handleError}
      />
    </div>
  );
};

// Main HomePage Component
const HomePage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<
    "Football" | "Basketball" | "Others"
  >("Football");
  const [language, setLanguage] = useState<string>("English");
  const [matches, setMatches] = useState<MatchesState>({
    live: [],
    scheduled: [],
    finished: [],
  });
  const [liveGames, setLiveGames] = useState<Match[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Helper Functions
  const showToast = (
    message: string,
    type: "error" | "success" = "success"
  ): void => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    setIsDragging(true);
    if (sliderRef.current) {
      setStartX(e.pageX - sliderRef.current.offsetLeft);
      setScrollLeft(sliderRef.current.scrollLeft);
    }
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  const handleMouseLeave = (): void => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const formatMatchTime = (utcTime: string | Date): string => {
    let localTime: Date;

    if (utcTime instanceof Date) {
      localTime = new Date(
        utcTime.getTime() - utcTime.getTimezoneOffset() * 60000
      );
    } else if (typeof utcTime === "string") {
      const utcTimeISO = utcTime.replace(" ", "T") + "Z";
      localTime = new Date(utcTimeISO);

      if (isNaN(localTime.getTime())) {
        console.error("Invalid date format:", utcTime);
        return "Invalid time";
      }
    } else {
      console.error("Expected a string or Date but received:", typeof utcTime);
      return "Invalid time";
    }

    return localTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatStatusTime = (utcTime: string | Date): Date => {
    let localTime: Date;

    if (utcTime instanceof Date) {
      localTime = new Date(
        utcTime.getTime() - utcTime.getTimezoneOffset() * 60000
      );
    } else if (typeof utcTime === "string") {
      const utcTimeISO = utcTime.replace(" ", "T") + "Z";
      localTime = new Date(utcTimeISO);

      if (isNaN(localTime.getTime())) {
        console.error("Invalid date format:", utcTime);
        return localTime;
      }
    } else {
      console.error("Expected a string or Date but received:", typeof utcTime);
      return new Date();
    }

    return localTime;
  };

  const getMatchStatus = (matchTime: string | Date): MatchStatus => {
    let statusTime: Date;
    statusTime = formatStatusTime(matchTime);

    const now = new Date();
    const gameTime = new Date(statusTime);
    const diffInMinutes = Math.floor(
      (now.getTime() - gameTime.getTime()) / (1000 * 60) + 1
    );

    if (diffInMinutes < 0) {
      return { status: "Scheduled", display: formatMatchTime(matchTime) };
    } else if (diffInMinutes >= 0 && diffInMinutes <= 120) {
      return { status: "Live", display: `Live` };
    } else {
      return { status: "FT", display: "FINISHED" };
    }
  };

  const fetchMatches = async (showLoading = false): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/rotich-brian/LiveSports/refs/heads/main/sportsprog3.json"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data: ApiResponse = await response.json();

      const processedMatches: Match[] = data.today.map((match) => ({
        id: match.id,
        // `${match.homeTeam}-${match.awayTeam}`.replace(/\s/g, '')
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        tournament: match.competition,
        ...getMatchStatus(match.time),
        time: new Date(match.time),
        eventUrl: match.eventUrl,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
      }));

      const sortedMatches = processedMatches.sort(
        (a, b) => a.time.getTime() - b.time.getTime()
      );
      const live = sortedMatches.filter((m) => m.status === "Live");
      const scheduled = sortedMatches.filter((m) => m.status === "Scheduled");
      const finished = sortedMatches.filter((m) => m.status === "FT");

      setLiveGames([...live, ...scheduled].slice(0, 10));
      setMatches({ live, scheduled, finished });

      if (!showLoading) {
        showToast("Events refresh success");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching events:", error);
      if (!showLoading) {
        showToast("Failed to update events", "error");
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(true);

    const statusInterval = setInterval(() => {
      setMatches((prev) => ({
        live: prev.live.map((match) => ({
          ...match,
          ...getMatchStatus(match.time),
        })),
        scheduled: prev.scheduled.map((match) => ({
          ...match,
          ...getMatchStatus(match.time),
        })),
        finished: prev.finished.map((match) => ({
          ...match,
          ...getMatchStatus(match.time),
        })),
      }));
    }, 60000);

    const refreshInterval = setInterval(() => {
      fetchMatches(false);
    }, 300000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const sports = [
    { name: "Football" as const, icon: "⚽" },
    { name: "Basketball" as const, icon: "🏀" },
    { name: "Others" as const, icon: "•••" },
  ];

  const languages = [
    "English",
    "Africa",
    "Español",
    "Indonesia",
    "Português",
    "Русский",
    "Việt Nam",
    "ไทย",
    "中文",
    "日本語",
    "한국어",
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <meta charSet="utf-8" />
        <title>
          Livesports808 - Live Sport Streams, Watch Football Live, NBA and More
        </title>
        <meta
          name="description"
          content="Livesports808 is the comprehensive sports TV online, offering 100+ live schedules for football & basketball matches in over 10 languages."
        />
        <meta
          name="keywords"
          content="Live Sport Streams, Football Live, Livesports088, Livesports808, Score808, sports streaming free"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=1"
        />
        <meta name="theme-color" content="#032c63" />
        <meta name="apple-mobile-web-app-title" content="Livesports808" />
        <meta name="application-name" content="Livesports808" />
        <meta name="msapplication-TileColor" content="#03306b" />
        <meta
          name="facebook-domain-verification"
          content="rxzaq92a06htqv3lyohbqkby0zynob"
        />
        <meta name="monetag" content="5ec35a6074564ad0cb4ea605e79f3cc5" />

        <meta
          property="og:title"
          content="Livesports808 - Live Sport Streams, Watch Football Live, NBA and More"
        />
        <meta
          property="og:description"
          content="Livesports808 is the comprehensive sports TV online, offering 100+ live schedules for football & basketball matches in over 10 languages."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/android-chrome-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:url" content="https://www.livesports808.top" />
        <meta property="og:site_name" content="Livesports808" />

        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Livesports808 - Live Sport Streams, Watch Football Live, NBA and More"
        />
        <meta
          name="twitter:description"
          content="Livesports808 is the comprehensive sports TV online, offering 100+ live schedules for football & basketball matches in over 10 languages."
        />
        <meta name="twitter:image" content="/android-chrome-512x512.png" />
      </Head>

      <div className="max-w-[750px] mx-auto">
        {/* Header Section */}
        <div className="sticky top-0 z-10">
          <div className="max-w-[750px] bg-[#002157] mx-auto">
            <header className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-white text-lg">Live sports</h1>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-transparent text-white text-sm pl-2 pr-6 py-1 rounded border border-white/20 hover:border-white/40 transition-colors cursor-pointer appearance-none"
                    >
                      {languages.map((lang) => (
                        <option
                          key={lang}
                          value={lang}
                          className="text-gray-900"
                        >
                          {lang}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="text-white text-xs">▼</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-white">
                    <span className="sr-only">Messages</span>
                    💬
                  </button>
                  <button className="text-white">
                    <span className="sr-only">Settings</span>
                    ⚙️
                  </button>
                  <button className="text-white">
                    <span className="sr-only">Profile</span>
                    👤
                  </button>
                </div>
              </div>
            </header>
          </div>

          <div className="max-w-[750px] bg-white mx-auto">
            <nav>
              <div className="flex justify-center px-4 py-2 space-x-6">
                {sports.map((sport) => (
                  <button
                    key={sport.name}
                    onClick={() => setSelectedSport(sport.name)}
                    className={`flex items-center gap-2 px-4 py-2 ${
                      selectedSport === sport.name
                        ? "text-[#002157] border-b-2 border-[#002157]"
                        : "text-gray-600"
                    }`}
                  >
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : (
          <div className="max-w-[750px] mx-auto">
            <main className="py-4">
              {/* Live Games Slider */}
              {liveGames.length > 0 && (
                <div className="bg-blue-50/50 px-4 py-4 border-y border-blue-100/50 mb-4">
                  <div
                    ref={sliderRef}
                    className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex gap-3 min-w-min pb-2">
                      {liveGames.map((game) => (
                        <div
                          key={game.id}
                          className="bg-blue-50/50 rounded-lg p-3 hover:bg-gray-50 transition w-60 flex-shrink-0 shadow-sm border border-blue-100 min-h-[120px]"
                          // onClick={() => window.location.href = game.eventUrl}

                          onClick={() => {
                            // Create a slug with team names
                            const slug = `live-${game.homeTeam
                              .replace(/\s+/g, "-")
                              .toLowerCase()}-vs-${game.awayTeam
                              .replace(/\s+/g, "-")
                              .toLowerCase()}-live-stream`;

                            const url = `/watch/${game.id}`;
                            window.location.href = url;
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 text-xs">
                                {game.tournament}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-white">
                                {game.display}
                              </span>
                            </div>
                            <Tv size={18} className="text-orange-600" />
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="flex items-center text-gray-900">
                                <TeamLogo
                                  logoUrl={game.homeTeamLogo}
                                  teamName={game.homeTeam}
                                />
                                <span className="text-sm px-1">
                                  {game.homeTeam}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-900">
                                <TeamLogo
                                  logoUrl={game.awayTeamLogo}
                                  teamName={game.awayTeam}
                                />
                                <span className="text-sm px-1">
                                  {game.awayTeam}
                                </span>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-[#002157]">
                              <Star size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live and Scheduled Matches */}
              <div className="space-y-0.5 bg-blue-100/30">
                {[...matches.live, ...matches.scheduled].map((match) => (
                  <div
                    key={match.id}
                    className="bg-white p-4 hover:cursor-pointer border-b border-gray-100"
                    // onClick={() => window.location.href = match.eventUrl}
                    onClick={() => {
                      // Create a slug with team names
                      const slug = `live-${match.homeTeam
                        .replace(/\s+/g, "-")
                        .toLowerCase()}-vs-${match.awayTeam
                        .replace(/\s+/g, "-")
                        .toLowerCase()}-live-stream`;

                      const url = `/watch/${match.id}`;
                      window.location.href = url;
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-600/70 text-sm block mb-4 pl-1">
                          {match.tournament}
                        </span>
                        <div className="flex md:gap-16 sm:gap-12 gap-8">
                          <div className="flex items-center">
                            <button className="text-gray-400 hover:text-[#002157]">
                              <Star size={18} />
                            </button>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                match.status === "Live"
                                  ? "text-red-500"
                                  : "text-gray-500"
                              } self-center`}
                            >
                              {match.display}
                            </span>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center text-gray-900">
                              <span
                                className={`text-gray-600 font-bold mr-2 px-1 ${
                                  match.status === "Live"
                                    ? "bg-red-200/30"
                                    : "bg-gray-200/30"
                                }`}
                              >
                                -
                              </span>
                              <TeamLogo
                                logoUrl={match.homeTeamLogo}
                                teamName={match.homeTeam}
                              />
                              <span className="text-sm font-medium px-2">
                                {match.homeTeam}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span
                                className={`text-gray-600 font-bold mr-2 px-1 ${
                                  match.status === "Live"
                                    ? "bg-red-200/30"
                                    : "bg-gray-200/30"
                                }`}
                              >
                                -
                              </span>
                              <TeamLogo
                                logoUrl={match.awayTeamLogo}
                                teamName={match.awayTeam}
                              />
                              <span className="text-sm font-medium px-2">
                                {match.awayTeam}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`flex items-center text-xs px-3 py-1 rounded-lg font-bold ${
                          match.status === "Live"
                            ? "bg-blue-900 text-white"
                            : "bg-gray-300 text-gray-500/70 bg-opacity-50"
                        } self-center`}
                      >
                        <Tv className="mr-1" size={15} />
                        Live
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adsterra Native Banner */}
              <div className="my-6">
                <AdsterraNativeBanner />
              </div>

              {/* Finished Matches */}
              {matches.finished.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm text-gray-500 px-1 mb-2">
                    Finished
                  </div>
                  <div className="space-y-0.5 bg-blue-100/30">
                    {matches.finished.map((match) => (
                      <div
                        key={match.id}
                        className="bg-white p-4 hover:cursor-pointer border-b border-gray-100"
                        // onClick={() => window.location.href = match.eventUrl}
                        onClick={() => {
                          // Create a slug with team names
                          const slug = `live-${match.homeTeam
                            .replace(/\s+/g, "-")
                            .toLowerCase()}-vs-${match.awayTeam
                            .replace(/\s+/g, "-")
                            .toLowerCase()}-live-stream`;

                          const url = `/watch/${match.id}`;
                          window.location.href = url;
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-600/70 text-sm block mb-4 pl-1">
                              {match.tournament}
                            </span>
                            <div className="flex md:gap-16 sm:gap-12 gap-8">
                              <div className="flex items-center">
                                <button className="text-gray-400 hover:text-[#002157]">
                                  <Star size={18} />
                                </button>
                                <span className="text-xs px-2 py-0.5 rounded text-gray-500 self-center">
                                  FT
                                </span>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center text-gray-900">
                                  <span className="text-gray-600 font-bold mr-2 px-1 bg-gray-200/30">
                                    -
                                  </span>
                                  <TeamLogo
                                    logoUrl={match.homeTeamLogo}
                                    teamName={match.homeTeam}
                                  />
                                  <span className="text-sm font-medium px-2">
                                    {match.homeTeam}
                                  </span>
                                </div>
                                <div className="flex items-center text-gray-900">
                                  <span className="text-gray-600 font-bold mr-2 px-1 bg-gray-200/30">
                                    -
                                  </span>
                                  <TeamLogo
                                    logoUrl={match.awayTeamLogo}
                                    teamName={match.awayTeam}
                                  />
                                  <span className="text-sm font-medium px-2">
                                    {match.awayTeam}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-gray-500/70 font-bold text-sm self-center">
                            {match.display}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
