import { GetServerSideProps } from "next";
import { useState, useRef, useEffect, MouseEvent } from "react";
import {
  Star,
  Tv,
  Timer,
  CircleDashed,
  Send,
  Circle,
  User,
  MoreHorizontal,
} from "lucide-react";

import Head from "next/head";
import React from "react";
import Image from "next/image";

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
  byDate: Record<string, Match[]>;
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

  return hasError ? (
    <FallbackLogo teamName={teamName} />
  ) : (
    <div
      className="flex items-center justify-center overflow-hidden relative"
      style={{ width: 20, height: 20 }}
    >
      <Image
        src={logoUrl}
        alt={`${teamName} logo`}
        fill
        sizes="20px"
        className="object-contain"
        onError={() => setHasError(true)}
        priority={false}
        unoptimized
      />
    </div>
  );
};

const DateSectionHeader: React.FC<{ date: string }> = ({ date }) => {
  // Convert date string (DD-MM-YYYY) to a more readable format
  const formattedDate = (() => {
    const [day, month, year] = date.split("-");
    const dateObj = new Date(`${year}-${month}-${day}`);

    // Check if it's today
    const today = new Date();
    const isToday =
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();

    // Format: "Today" or "Thursday, 13 Mar 2025"
    // Use a specific locale and explicit formatting options to ensure server/client consistency
    return isToday
      ? "Today"
      : dateObj.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  })();

  return (
    <div className="sticky top-[76px] md:top-[92px] bg-gradient-to-r from-blue-50 to-white py-3 px-4 border-y border-blue-100/50 z-[5]">
      <h2 className="text-sm font-semibold text-blue-900">{formattedDate}</h2>
    </div>
  );
};

const MatchItem: React.FC<{ match: Match }> = ({ match }) => (
  <div
    className="bg-white p-2 hover:cursor-pointer border-b border-gray-100"
    onClick={() => {
      const url = match.id ? `/watch/${match.id}` : match.eventUrl;
      if (url) {
        window.location.href = url;
      }
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <span className="text-gray-600/70 text-sm block mb-4 pl-1">
          {match.tournament}
        </span>
        <div className="flex md:gap-16 sm:gap-12 gap-8 px-2">
          <div className="flex items-center">
            <button className="text-gray-400 hover:text-[#002157]">
              <Star size={22} />
            </button>
            <span
              className={`text-xs px-2 py-0.5 rounded min-w-[50px] md:min-w-[100px] text-center flex items-center gap-1 ${
                match.status === "Live" ? "text-red-600" : "text-gray-500"
              } self-center`}
            >
              {match.status === "Live" && (
                <Timer size={16} className="text-red-300" />
              )}
              {match.display}
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center text-gray-900">
              <span
                className={`text-gray-600 font-bold mr-2 px-1 ${
                  match.status === "Live" ? "bg-red-200/30" : "bg-gray-200/30"
                }`}
              >
                -
              </span>
              <TeamLogo
                logoUrl={match.homeTeamLogo}
                teamName={match.homeTeam}
              />
              <span className="text-sm font-medium px-2">{match.homeTeam}</span>
            </div>
            <div className="flex items-center text-gray-900">
              <span
                className={`text-gray-600 font-bold mr-2 px-1 ${
                  match.status === "Live" ? "bg-red-200/30" : "bg-gray-200/30"
                }`}
              >
                -
              </span>
              <TeamLogo
                logoUrl={match.awayTeamLogo}
                teamName={match.awayTeam}
              />
              <span className="text-sm font-medium px-2">{match.awayTeam}</span>
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
);

interface HomePageProps {
  initialMatches: MatchesState;
  initialLiveGames: Match[];
}

// Update the component to accept props
const HomePage: React.FC<HomePageProps> = ({
  initialMatches,
  initialLiveGames,
}) => {
  const [selectedSport, setSelectedSport] = useState<
    "Football" | "Basketball" | "Others" | null
  >(null);

  const [language, setLanguage] = useState<string>("English");

  // Initialize state with the provided props
  const [matches, setMatches] = useState<MatchesState>(initialMatches);
  const [liveGames, setLiveGames] = useState<Match[]>(initialLiveGames);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Changed from true to false
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make sure initial data from server is correctly processed
    if (initialMatches) {
      // Convert string dates back to Date objects for client-side processing
      const processInitialMatches = (matchGroup: Match[]): Match[] => {
        return matchGroup.map((match) => ({
          ...match,
          time: new Date(match.time),
          // Refresh status with local time calculation
          ...getMatchStatus(new Date(match.time)),
        }));
      };

      const processedByDate: Record<string, Match[]> = {};
      Object.keys(initialMatches.byDate).forEach((dateKey) => {
        processedByDate[dateKey] = processInitialMatches(
          initialMatches.byDate[dateKey]
        );
      });

      setMatches({
        live: processInitialMatches(initialMatches.live),
        scheduled: processInitialMatches(initialMatches.scheduled),
        finished: processInitialMatches(initialMatches.finished),
        byDate: processedByDate,
      });

      setLiveGames(
        processInitialMatches([
          ...initialMatches.live,
          ...initialMatches.scheduled.filter((m) =>
            isMatchToday(new Date(m.time))
          ),
        ]).slice(0, 10)
      );
    }
  }, [initialMatches]);

  useEffect(() => {
    console.log("Initial Matches:", initialMatches);
    console.log("Initial Live Games:", initialLiveGames);
  }, []); // Empty dependency array makes it run only on mount

  const openTelegram = () => {
    // Replace with your actual Telegram group/channel link
    window.open("https://t.me/futball_liveapp", "_blank");
  };

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
    let matchTime: Date;

    if (utcTime instanceof Date) {
      matchTime = utcTime;
    } else if (typeof utcTime === "string") {
      // Use a consistent approach to parse dates
      matchTime = new Date(utcTime);

      if (isNaN(matchTime.getTime())) {
        console.error("Invalid date format:", utcTime);
        return "Invalid time";
      }
    } else {
      console.error("Expected a string or Date but received:", typeof utcTime);
      return "Invalid time";
    }

    // Use the user's local timezone consistently
    return matchTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatStatusTime = (utcTime: string | Date): Date => {
    let matchTime: Date;

    if (utcTime instanceof Date) {
      matchTime = utcTime;
    } else if (typeof utcTime === "string") {
      // Check if the string is already in ISO format
      if (utcTime.includes("T") && utcTime.includes("Z")) {
        matchTime = new Date(utcTime);
      } else {
        // Only convert if not already in ISO format
        const utcTimeISO = utcTime.replace(" ", "T") + "Z";
        matchTime = new Date(utcTimeISO);
      }

      if (isNaN(matchTime.getTime())) {
        console.error("Invalid date format:", utcTime);
        return new Date();
      }
    } else {
      console.error("Expected a string or Date but received:", typeof utcTime);
      return new Date();
    }

    return matchTime;
  };

  // In getMatchStatus function on client side
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

  const getMatchDateKey = (matchTime: string | Date): string => {
    // Convert matchTime to a Date object if it's a string
    const matchTimeDate =
      typeof matchTime === "string" ? new Date(matchTime) : matchTime;

    // Format for display: DD-MM-YYYY using local time
    const day = String(matchTimeDate.getDate()).padStart(2, "0");
    const month = String(matchTimeDate.getMonth() + 1).padStart(2, "0");
    const year = matchTimeDate.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Update the isMatchToday function to handle both Date objects and ISO date strings
  const isMatchToday = (matchTime: string | Date): boolean => {
    const now = new Date();

    // Convert matchTime to a Date object if it's a string
    const matchTimeDate =
      typeof matchTime === "string" ? new Date(matchTime) : matchTime;

    // Compare local dates
    return (
      matchTimeDate.getDate() === now.getDate() &&
      matchTimeDate.getMonth() === now.getMonth() &&
      matchTimeDate.getFullYear() === now.getFullYear()
    );
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

      const processedMatches: Match[] = data.today.map((match) => {
        // Parse time string to ensure consistent Date object creation
        let matchTime: Date;

        try {
          if (match.time.includes(" ")) {
            // Format: "2025-03-05 14:30:00"
            const [datePart, timePart] = match.time.split(" ");
            matchTime = new Date(`${datePart}T${timePart}Z`); // Add Z to ensure UTC interpretation
          } else {
            // Already ISO format or similar
            matchTime = new Date(match.time);
          }

          // Check if valid
          if (isNaN(matchTime.getTime())) {
            console.error("Invalid date format:", match.time);
            matchTime = new Date(); // Fallback to now
          }
        } catch (e) {
          console.error("Error parsing date:", match.time, e);
          matchTime = new Date(); // Fallback to now
        }

        return {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          tournament: match.competition,
          ...getMatchStatus(matchTime),
          time: matchTime,
          eventUrl: match.eventUrl,
          homeTeamLogo: match.homeTeamLogo,
          awayTeamLogo: match.awayTeamLogo,
        };
      });

      const sortedMatches = processedMatches.sort(
        (a, b) => a.time.getTime() - b.time.getTime()
      );

      const live = sortedMatches.filter((m) => m.status === "Live");
      const scheduled = sortedMatches.filter((m) => m.status === "Scheduled");
      const finished = sortedMatches.filter((m) => m.status === "FT");

      // Group scheduled matches by date in UTC
      const byDate: Record<string, Match[]> = {};

      scheduled.forEach((match) => {
        // Skip today's matches as they're shown separately
        if (isMatchToday(match.time)) return;

        const dateKey = getMatchDateKey(match.time);
        if (!byDate[dateKey]) {
          byDate[dateKey] = [];
        }
        byDate[dateKey].push(match);
      });

      setMatches({ live, scheduled, finished, byDate });
      setLiveGames(
        [...live, ...scheduled.filter((m) => isMatchToday(m.time))].slice(0, 10)
      );

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

  // Update the statusInterval to include byDate in the state update
  useEffect(() => {
    // No need to fetch data immediately on mount since we have initial data
    // Just set up intervals for refreshes

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
        byDate: prev.byDate,
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
    { name: "Others" as const, icon: <MoreHorizontal size={18} /> },
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
    // <div className="min-h-screen bg-gray-50">
    <div className="min-h-screen bg-[rgb(237,238,238)]">
      <Head>
        <meta charSet="utf-8" />
        <title>
          Livesports808 - Score 808 Live Streams, Watch Football, NBA, and More
        </title>
        <meta property="og:site_name" content="Livesports808" />
        <meta
          name="description"
          content="Watch live sports with Livesports 808 & Score808. Stream 100+ football, NBA, and more matches in over 10 languages — fast, free, and reliable."
        />

        <meta
          name="keywords"
          content="Score 808, score808, Live Sport Streams, Football Live, Livesports808, Livesports 808,  sports streaming free"
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
        <link rel="canonical" href="https://livesports808.top" />

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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Livesports808",
              url: "https://livesports808.top",
            }),
          }}
        />
      </Head>

      <div className="max-w-[750px] mx-auto">
        {/* Header Section */}
        <div className="sticky top-0 z-10">
          <div className="max-w-[750px] bg-[#002157] mx-auto">
            <header className="px-4 py-1 md:py-3">
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
                  <button className="text-white" onClick={openTelegram}>
                    <span className="sr-only">Telegram</span>
                    <Send size={20} className="fill-current" />
                  </button>
                  <button className="text-white relative">
                    <span className="sr-only">Advert</span>
                    <div className="relative">
                      <Circle size={20} className="fill-current" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-black">
                        AD
                      </span>
                    </div>
                  </button>
                  <button className="text-white">
                    <span className="sr-only">Profile</span>
                    <User size={24} className="fill-current" />
                  </button>
                </div>
              </div>
            </header>
          </div>

          <div className="max-w-[750px] bg-[#f8f8f8] mx-auto">
            <nav>
              <div className="flex justify-evenly px-2 py-1">
                {sports.map((sport) => (
                  <button
                    key={sport.name}
                    onClick={() => setSelectedSport(sport.name)}
                    className={`inline-flex items-center gap-2 px-4 py-1 justify-center border-b-2 ${
                      selectedSport === sport.name && selectedSport
                        ? "text-black text-sm font-bold border-[#002157] w-fit"
                        : "text-gray-600 text-sm font-bold border-transparent"
                    }`}
                  >
                    {sport.icon}
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
            <CircleDashed className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : (
          <div className="max-w-[750px] mx-auto">
            <main>
              {/* Live Games Slider */}
              {liveGames.length > 0 && (
                <div className="bg-blue-50/50 px-4 py-4 border-y border-blue-100/50 m-0">
                  <div
                    ref={sliderRef}
                    className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex gap-3 min-w-min pb-0.5">
                      {liveGames.map((game) => (
                        <div
                          key={game.id}
                          className="bg-blue-50/50 rounded-lg p-3 hover:bg-gray-50 transition w-60 flex-shrink-0 shadow-sm border border-blue-300 min-h-[120px]"
                          onClick={() => {
                            const url = `/watch/${game.id}`;
                            window.location.href = url;
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 text-xs">
                                {game.tournament}
                              </span>
                              {game.status === "Live" ? (
                                <>
                                  <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                    Live
                                  </span>
                                  <Tv size={18} className="text-orange-600" />
                                </>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-white">
                                  {game.display}{" "}
                                  {/* Keep schedule time for non-live games */}
                                </span>
                              )}
                            </div>
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

              {/* Today's Live and Scheduled Matches */}
              <div className="space-y-0.4 bg-blue-100/30">
                {matches.live.map((match) => (
                  <MatchItem key={`live-${match.id}`} match={match} />
                ))}
                {matches.scheduled
                  .filter((match) => isMatchToday(match.time))
                  .map((match) => (
                    <MatchItem key={`today-${match.id}`} match={match} />
                  ))}
              </div>

              {/* Future Matches by Date */}
              {Object.keys(matches.byDate)
                .sort()
                .map((dateString) => (
                  <div key={dateString} className="mt-0.5">
                    <DateSectionHeader date={dateString} />
                    <div className="space-y-0.4 bg-blue-100/30">
                      {matches.byDate[dateString].map((match) => (
                        <MatchItem
                          key={`${dateString}-${match.id}`}
                          match={match}
                        />
                      ))}
                    </div>
                  </div>
                ))}

              {/* Adsterra Native Banner */}
              <div className="my-6">
                <AdsterraNativeBanner />
              </div>

              {/* Finished Matches */}
              {matches.finished.length > 0 && (
                <div className="mt-5">
                  <div className="text-sm text-gray-500 px-1 mb-2 text-center">
                    <h2 className="text-sm font-semibold text-gray-500">
                      Finished Matches
                    </h2>
                  </div>

                  <div className="space-y-0.4 bg-blue-100/30">
                    {matches.finished.map((match) => (
                      <div
                        key={match.id}
                        className="bg-white p-2 hover:cursor-pointer border-b border-gray-100"
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
                            <div className="flex md:gap-16 sm:gap-12 gap-8 ">
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

export const getServerSideProps: GetServerSideProps = async () => {
  // Fetch data on the server side
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/rotich-brian/LiveSports/refs/heads/main/sportsprog3.json"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data: ApiResponse = await response.json();

    // Process the fetched data
    const processedMatches: Match[] = data.today.map((match) => {
      let matchTime: Date;

      try {
        if (match.time.includes(" ")) {
          const [datePart, timePart] = match.time.split(" ");
          matchTime = new Date(`${datePart}T${timePart}Z`);
        } else {
          matchTime = new Date(match.time);
        }

        if (isNaN(matchTime.getTime())) {
          console.error("Invalid date format:", match.time);
          matchTime = new Date();
        }
      } catch (e) {
        console.error("Error parsing date:", match.time, e);
        matchTime = new Date();
      }

      // In getServerSideProps (server-side)
      const getMatchStatus = (matchTime: Date): MatchStatus => {
        const now = new Date();
        const gameTime = new Date(matchTime);
        const diffInMinutes = Math.floor(
          (now.getTime() - gameTime.getTime()) / (1000 * 60) + 1
        );

        if (diffInMinutes < 0) {
          // Ensure consistent formatting regardless of environment
          return {
            status: "Scheduled",
            // Format dates consistently using explicit UTC methods
            display: `${matchTime
              .getUTCHours()
              .toString()
              .padStart(2, "0")}:${matchTime
              .getUTCMinutes()
              .toString()
              .padStart(2, "0")}`,
          };
        } else if (diffInMinutes >= 0 && diffInMinutes <= 120) {
          return { status: "Live", display: `Live` };
        } else {
          return { status: "FT", display: "FINISHED" };
        }
      };

      return {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        tournament: match.competition,
        ...getMatchStatus(matchTime),
        time: matchTime,
        eventUrl: match.eventUrl,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
      };
    });

    const sortedMatches = processedMatches.sort(
      (a, b) => a.time.getTime() - b.time.getTime()
    );

    const live = sortedMatches.filter((m) => m.status === "Live");
    const scheduled = sortedMatches.filter((m) => m.status === "Scheduled");
    const finished = sortedMatches.filter((m) => m.status === "FT");

    // Helper function to check if a match is today
    const isMatchToday = (matchTime: Date): boolean => {
      const now = new Date();
      return (
        matchTime.getDate() === now.getDate() &&
        matchTime.getMonth() === now.getMonth() &&
        matchTime.getFullYear() === now.getFullYear()
      );
    };

    // Helper function to get date key
    const getMatchDateKey = (matchTime: Date): string => {
      const day = String(matchTime.getDate()).padStart(2, "0");
      const month = String(matchTime.getMonth() + 1).padStart(2, "0");
      const year = matchTime.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Group scheduled matches by date
    const byDate: Record<string, Match[]> = {};

    scheduled.forEach((match) => {
      // Skip today's matches as they're shown separately
      if (isMatchToday(match.time)) return;

      const dateKey = getMatchDateKey(match.time);
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(match);
    });

    // Live games for slider
    const liveGames = [
      ...live,
      ...scheduled.filter((m) => isMatchToday(m.time)),
    ].slice(0, 10);

    // Before returning, convert all Date objects to strings
    const serializableMatches = processedMatches.map((match) => ({
      ...match,
      time: match.time.toISOString(), // Convert Date to string
    }));

    const serializableLive = serializableMatches.filter(
      (m) => m.status === "Live"
    );
    const serializableScheduled = serializableMatches.filter(
      (m) => m.status === "Scheduled"
    );
    const serializableFinished = serializableMatches.filter(
      (m) => m.status === "FT"
    );

    // Create serializable byDate object
    const serializableByDate: Record<string, any[]> = {};
    Object.keys(byDate).forEach((dateKey) => {
      serializableByDate[dateKey] = byDate[dateKey].map((match) => ({
        ...match,
        time: match.time.toISOString(), // Convert Date to string
      }));
    });

    // Also convert dates in liveGames
    const serializableLiveGames = [
      ...serializableLive,
      ...serializableScheduled.filter((m) => {
        const matchTime = new Date(m.time);
        return isMatchToday(matchTime);
      }),
    ].slice(0, 10);

    return {
      props: {
        initialMatches: {
          live: serializableLive,
          scheduled: serializableScheduled,
          finished: serializableFinished,
          byDate: serializableByDate,
        },
        initialLiveGames: serializableLiveGames,
      },
    };
  } catch (error) {
    console.error("Server-side data fetching error:", error);

    // Return empty initial data in case of error
    return {
      props: {
        initialMatches: {
          live: [],
          scheduled: [],
          finished: [],
          byDate: {},
        },
        initialLiveGames: [],
      },
    };
  }
};
