import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, Share2, Star, ExternalLink } from "lucide-react";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";

interface Event {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  commentator: string;
  channel: string;
  competition: string;
  urls: string[];
  eventUrl: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  eventBanner?: string;
}

interface TeamInfo {
  name: string;
  logo: string;
  score?: number;
}

interface MatchDetails {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  tournament: string;
  status: "Live" | "Scheduled" | "Finished";
  statusDisplay: string;
  urls: string[];
  commentator: string;
  channel: string;
  startTime?: string;
}

interface RelatedStream {
  id: string;
  homeTeam: string;
  awayTeam: string;
  bannerImage: string;
  isLive: boolean;
  startTime?: string;
  statusDisplay?: string;
}

interface MatchStatus {
  status: "Live" | "Scheduled" | "FT";
  display: string;
}

interface ToastProps {
  message: string;
  onClose: () => void;
}

const AdsterraNativeBanner: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      process.env.NEXT_PUBLIC_ADSTERRA_SCRIPT ||
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

const Toast: React.FC<ToastProps> = ({ message, onClose }) => (
  <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white bg-red-600 transition-opacity duration-300">
    {message}
  </div>
);

const getMatchStatus = (
  matchTime: string | Date | null | undefined
): MatchStatus => {
  if (!matchTime) {
    return { status: "Scheduled", display: "Invalid time" };
  }
  const gameTime = matchTime instanceof Date ? matchTime : new Date(matchTime);

  if (isNaN(gameTime.getTime())) {
    return { status: "Scheduled", display: "Invalid time" };
  }

  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - gameTime.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 0) {
    return {
      status: "Scheduled",
      display: gameTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  } else if (diffInMinutes <= 120) {
    return { status: "Live", display: "LIVE" };
  }
  return { status: "FT", display: "FINISHED" };
};

const formatMatchTime = (utcTime: string | Date | null | undefined): string => {
  if (!utcTime) {
    return "Invalid time";
  }
  let localTime: Date;
  if (utcTime instanceof Date) {
    localTime = new Date(
      utcTime.getTime() - utcTime.getTimezoneOffset() * 60000
    );
  } else {
    const utcTimeISO = utcTime.replace(" ", "T") + "Z";
    localTime = new Date(utcTimeISO);
    if (isNaN(localTime.getTime())) {
      return "Invalid time";
    }
  }
  return localTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatStatusTime = (utcTime: string | Date | null | undefined): Date => {
  if (!utcTime) {
    return new Date();
  }
  let localTime: Date;
  if (utcTime instanceof Date) {
    localTime = new Date(
      utcTime.getTime() - utcTime.getTimezoneOffset() * 60000
    );
  } else {
    const utcTimeISO = utcTime.replace(" ", "T") + "Z";
    localTime = new Date(utcTimeISO);
    if (isNaN(localTime.getTime())) {
      return new Date();
    }
  }
  return localTime;
};

const WatchPage: React.FC<{
  initialMatchData: Event | null;
  initialRelatedStreams: Event[];
}> = ({ initialMatchData, initialRelatedStreams }) => {
  const router = useRouter();
  const { slug } = router.query;
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [relatedStreams, setRelatedStreams] = useState<RelatedStream[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
      }
    };

    let devToolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          setToast("Developer tools detected. Please close to continue.");
        }
      } else {
        devToolsOpen = false;
        setToast(null);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    const devToolsInterval = setInterval(checkDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  const changeStream = (index: number) => {
    if (!match?.urls[index]) return;

    setActiveUrlIndex(index);

    if (iframeContainerRef.current) {
      while (iframeContainerRef.current.firstChild) {
        iframeContainerRef.current.removeChild(
          iframeContainerRef.current.firstChild
        );
      }

      const newIframe = document.createElement("iframe") as HTMLIFrameElement;
      newIframe.src = match.urls[index];
      newIframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newIframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      newIframe.allowFullscreen = true;

      iframeContainerRef.current.appendChild(newIframe);
    }
  };

  const openHDStream = () => {
    if (match && match.urls.length > 0) {
      window.open(
        process.env.NEXT_PUBLIC_HD_STREAM_URL ||
          "https://chilsihooveek.net/4/8916857",
        "_blank"
      );
    }
  };

  useEffect(() => {
    const handleBackButton = () => {};

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  useEffect(() => {
    if (!slug || !router.isReady) return;

    const fetchMatchDetails = async () => {
      if (initialMatchData && !match) {
        const matchStatus = getMatchStatus(initialMatchData.time);

        const matchData: MatchDetails = {
          id: initialMatchData.id,
          homeTeam: {
            name: initialMatchData.homeTeam,
            logo: initialMatchData.homeTeamLogo || "/api/placeholder/40/40",
          },
          awayTeam: {
            name: initialMatchData.awayTeam,
            logo: initialMatchData.awayTeamLogo || "/api/placeholder/40/40",
          },
          tournament: initialMatchData.competition,
          status:
            matchStatus.status === "FT"
              ? "Finished"
              : matchStatus.status === "Live"
              ? "Live"
              : "Scheduled",
          statusDisplay: matchStatus.display,
          urls: initialMatchData.urls || [
            "https://sportzonline.si/channels/hd/hd9.php",
          ],
          commentator: initialMatchData.commentator || "Unknown",
          channel: initialMatchData.channel || "Unknown",
          startTime: initialMatchData.time,
        };

        setMatch(matchData);

        if (typeof window !== "undefined") {
          const savedFavorites = localStorage.getItem("favoriteMatches");
          if (savedFavorites) {
            const favorites = JSON.parse(savedFavorites);
            setIsFavorite(favorites.includes(matchData.id));
          }
        }

        if (initialRelatedStreams.length > 0) {
          const relatedStreamsData = initialRelatedStreams.map((event) => {
            const status = getMatchStatus(event.time);
            return {
              id: event.id,
              homeTeam: event.homeTeam,
              awayTeam: event.awayTeam,
              bannerImage: event.eventBanner || "/api/placeholder/300/150",
              isLive: status.status === "Live",
              startTime: event.time,
              statusDisplay: status.display,
            };
          });

          setRelatedStreams(relatedStreamsData);
        }

        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const primaryEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
        const fallbackEndpoint = process.env.NEXT_PUBLIC_FALLBACK_ENDPOINT;

        if (!primaryEndpoint || !fallbackEndpoint) {
          setToast("Configuration error. Please try again later.");
          setIsLoading(false);
          return;
        }

        let response = await fetch(primaryEndpoint);
        if (!response.ok) {
          response = await fetch(fallbackEndpoint);
          if (!response.ok) {
            setToast("Failed to load match data. Please try again.");
            setIsLoading(false);
            return;
          }
        }
        const data = await response.json();

        const allEvents = [
          ...(data.yesterday || []),
          ...(data.today || []),
          ...(data.upcoming || []),
        ];

        const slugString = Array.isArray(slug) ? slug[0] : slug;
        const eventData = allEvents.find((ev: Event) => ev.id === slugString);

        if (!eventData) {
          setToast("Match not found.");
          setIsLoading(false);
          return;
        }

        const matchStatus = getMatchStatus(eventData.time);

        const matchData: MatchDetails = {
          id: eventData.id,
          homeTeam: {
            name: eventData.homeTeam,
            logo: eventData.homeTeamLogo || "/api/placeholder/Amsterdam/40",
          },
          awayTeam: {
            name: eventData.awayTeam,
            logo: eventData.awayTeamLogo || "/api/placeholder/40/40",
          },
          tournament: eventData.competition,
          status:
            matchStatus.status === "FT"
              ? "Finished"
              : matchStatus.status === "Live"
              ? "Live"
              : "Scheduled",
          statusDisplay: matchStatus.display,
          urls: eventData.urls || [
            "https://sportzonline.si/channels/hd/hd9.php",
          ],
          commentator: eventData.commentator || "Unknown",
          channel: eventData.channel || "Unknown",
          startTime: eventData.time,
        };

        setMatch(matchData);

        const savedFavorites = localStorage.getItem("favoriteMatches");
        if (savedFavorites) {
          const favorites = JSON.parse(savedFavorites);
          setIsFavorite(favorites.includes(matchData.id));
        }

        const filteredEvents = allEvents.filter((event) => {
          if (event.id === slugString) return false;

          const status = getMatchStatus(event.time);
          return status.status !== "FT";
        });

        const sortedEvents = filteredEvents.sort((a, b) => {
          const aStatus = getMatchStatus(a.time);
          const bStatus = getMatchStatus(b.time);

          const aIsLive = aStatus.status === "Live";
          const bIsLive = bStatus.status === "Live";

          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;

          return (
            formatStatusTime(a.time).getTime() -
            formatStatusTime(b.time).getTime()
          );
        });

        const relatedEvents = sortedEvents.slice(0, 12);

        const relatedStreamsData = relatedEvents.map((event) => {
          const status = getMatchStatus(event.time);
          return {
            id: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            bannerImage: event.eventBanner || "/api/placeholder/300/150",
            isLive: status.status === "Live",
            startTime: event.time,
            statusDisplay: status.display,
          };
        });

        setRelatedStreams(relatedStreamsData);
      } catch {
        setToast("Failed to load match data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchDetails();
  }, [slug, router.isReady, initialMatchData, initialRelatedStreams]);

  useEffect(() => {
    if (!match) return;

    const statusInterval = setInterval(() => {
      if (match && match.startTime) {
        const matchStatus = getMatchStatus(match.startTime);
        setMatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status:
              matchStatus.status === "FT"
                ? "Finished"
                : matchStatus.status === "Live"
                ? "Live"
                : "Scheduled",
            statusDisplay: matchStatus.display,
          };
        });
      }
    }, 60000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [match]);

  const toggleFavorite = () => {
    if (!match) return;

    const savedFavorites = localStorage.getItem("favoriteMatches");
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];

    if (isFavorite) {
      favorites = favorites.filter((id: string) => id !== match.id);
    } else {
      favorites.push(match.id);
    }

    localStorage.setItem("favoriteMatches", JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const shareMatch = () => {
    if (navigator.share) {
      navigator.share({
        title: `${match?.homeTeam.name} vs ${match?.awayTeam.name}`,
        text: `Watch ${match?.homeTeam.name} vs ${match?.awayTeam.name} live!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const placeholderMatch: MatchDetails = {
    id: "",
    homeTeam: {
      name: "",
      logo: "/api/placeholder/40/40",
    },
    awayTeam: {
      name: "",
      logo: "/api/placeholder/40/40",
    },
    tournament: "",
    status: "Live",
    statusDisplay: "",
    urls: [""],
    commentator: "",
    channel: "",
    startTime: "",
  };

  const displayMatch = match || placeholderMatch;

  useEffect(() => {
    if (
      !isLoading &&
      displayMatch.urls.length > 0 &&
      iframeContainerRef.current
    ) {
      while (iframeContainerRef.current.firstChild) {
        iframeContainerRef.current.removeChild(
          iframeContainerRef.current.firstChild
        );
      }

      const initialIframe = document.createElement(
        "iframe"
      ) as HTMLIFrameElement;
      initialIframe.src = displayMatch.urls[activeUrlIndex];
      initialIframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      initialIframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      initialIframe.allowFullscreen = true;

      iframeContainerRef.current.appendChild(initialIframe);
    }
  }, [isLoading, displayMatch.urls, activeUrlIndex]);

  useEffect(() => {
    if (!slug || !router.isReady) return;

    const refreshRelatedStreams = async () => {
      try {
        const primaryEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
        const fallbackEndpoint = process.env.NEXT_PUBLIC_FALLBACK_ENDPOINT;

        if (!primaryEndpoint || !fallbackEndpoint) {
          setToast("Configuration error. Please try again later.");
          return;
        }

        let response = await fetch(primaryEndpoint);
        if (!response.ok) {
          response = await fetch(fallbackEndpoint);
          if (!response.ok) {
            setToast("Failed to load related streams. Please try again.");
            return;
          }
        }
        const data = await response.json();

        const allEvents = [
          ...(data.yesterday || []),
          ...(data.today || []),
          ...(data.upcoming || []),
        ];

        const slugString = Array.isArray(slug) ? slug[0] : slug;
        const filteredEvents = allEvents.filter((event) => {
          if (event.id === slugString) return false;

          const status = getMatchStatus(event.time);
          return status.status !== "FT";
        });

        const sortedEvents = filteredEvents.sort((a, b) => {
          const aStatus = getMatchStatus(a.time);
          const bStatus = getMatchStatus(b.time);

          const aIsLive = aStatus.status === "Live";
          const bIsLive = bStatus.status === "Live";

          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;

          return (
            formatStatusTime(a.time).getTime() -
            formatStatusTime(b.time).getTime()
          );
        });

        const relatedEvents = sortedEvents.slice(0, 12);

        const relatedStreamsData = relatedEvents.map((event) => {
          const status = getMatchStatus(event.time);
          return {
            id: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            bannerImage: event.eventBanner || "/api/placeholder/300/150",
            isLive: status.status === "Live",
            startTime: event.time,
            statusDisplay: status.display,
          };
        });

        setRelatedStreams(relatedStreamsData);
      } catch {
        setToast("Failed to load related streams. Please try again.");
      }
    };

    refreshRelatedStreams();

    const refreshInterval = setInterval(refreshRelatedStreams, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [slug, router.isReady]);

  return (
    <>
      <Head>
        <title>
          {match
            ? `${match.homeTeam.name} vs ${match.awayTeam.name} - Live Stream`
            : initialMatchData
            ? `${initialMatchData.homeTeam} vs ${initialMatchData.awayTeam} - Live Stream`
            : "Sports808 - Live Sports"}
        </title>
        <meta
          name="description"
          content={
            match
              ? `Watch ${match.homeTeam.name} vs ${match.awayTeam.name} live stream`
              : initialMatchData
              ? `Watch ${initialMatchData.homeTeam} vs ${initialMatchData.awayTeam} live stream`
              : "Live sports streaming"
          }
        />
        <style>{`
          .video-container-custom11 {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            height: 0;
            background-color: black;
          }
          .video-container-custom11 iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            background-color: black;
          }
          .shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .url-button {
            background-color: #dc2626;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .url-button:hover {
            background-color: #b91c1c;
          }
          .url-button.active {
            background-color: #7f1d1d;
            box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
          }
          .hd-stream-button {
            background-color: #15803d;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 0.375rem;
          }
          .hd-stream-button:hover {
            background-color: #166534;
          }
          .score-display {
            background-color: rgba(128, 128, 128, 0.1);
            padding: 0.25rem 0.75rem;
            border-radius: 0.25rem;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="mx-auto max-w-[750px] px-4 py-3 flex items-center justify-between">
            <div className="text-xl font-bold text-white">Sports808</div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-1 rounded bg-blue-500 text-white text-sm">
                Android
              </button>
              <button className="px-4 py-1 rounded border border-white text-white text-sm">
                Advertise
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-700"></div>
            </div>
          </div>
        </div>

        <div className="mx-auto py-5 max-w-[750px] px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button className="text-gray-400" onClick={() => router.push("/")}>
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 text-center">
              {isLoading ? (
                <span className="text-gray-300 shimmer h-6 w-36 rounded inline-block">
                   
                </span>
              ) : (
                <span className="text-gray-300">{displayMatch.tournament}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400" onClick={toggleFavorite}>
                <Star
                  size={20}
                  className={isFavorite ? "text-yellow-500" : ""}
                />
              </button>
              <button className="text-gray-400" onClick={shareMatch}>
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="flex mx-10 justify-between items-center mb-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                {isLoading ? (
                  <div className="w-12 h-12 rounded-full shimmer"></div>
                ) : (
                  <img
                    src={displayMatch.homeTeam.logo}
                    alt={`${displayMatch.homeTeam.name} logo`}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/api/placeholder/40/40";
                    }}
                  />
                )}
              </div>
              {isLoading ? (
                <div className="h-4 w-20 shimmer rounded"></div>
              ) : (
                <h2 className="text-sm font-medium text-center">
                  {displayMatch.homeTeam.name}
                </h2>
              )}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold">
                <span className="text-white score-display">-</span>
                <span className="text-gray-400 mx-2">-</span>
                <span className="text-white score-display">-</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {isLoading ? (
                  <div className="h-4 w-12 shimmer rounded mx-auto"></div>
                ) : (
                  displayMatch.statusDisplay
                )}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                {isLoading ? (
                  <div className="w-12 h-12 rounded-full shimmer"></div>
                ) : (
                  <img
                    src={displayMatch.awayTeam.logo}
                    alt={`${displayMatch.awayTeam.name} logo`}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/api/placeholder/40/40";
                    }}
                  />
                )}
              </div>
              {isLoading ? (
                <div className="h-4 w-20 shimmer rounded"></div>
              ) : (
                <h2 className="text-sm font-medium text-center">
                  {displayMatch.awayTeam.name}
                </h2>
              )}
            </div>
          </div>

          <div className="bg-black rounded-lg overflow-hidden mb-4">
            <div className="video-container-custom11">
              {!isLoading && displayMatch.urls.length > 0 ? (
                <div
                  ref={iframeContainerRef}
                  className="absolute inset-0 bg-black"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-600 border-t-gray-200 animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {!isLoading && displayMatch.urls.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-wrap gap-3">
                {displayMatch.urls.map((url, index) => (
                  <button
                    key={index}
                    className={`url-button ${
                      activeUrlIndex === index ? "active" : ""
                    }`}
                    onClick={() => changeStream(index)}
                  >
                    LINK {index + 1}
                  </button>
                ))}
              </div>
              <button className="hd-stream-button" onClick={openHDStream}>
                Stream HD <ExternalLink size={16} />
              </button>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-3 mb-4 flex justify-between items-center">
            <button className="px-3 py-1 rounded-full bg-green-500 text-xs font-medium">
              Indonesia
            </button>
            <div className="flex space-x-2">
              <button className="text-gray-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8.25V12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15.75H12.008"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button className="text-amber-500">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9V12.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.7002 3.74993L3.25023 17.25C2.91839 17.8095 2.91323 18.4905 3.23596 19.0546C3.55868 19.6187 4.17479 19.9999 4.85023 19.9999H19.7502C20.4256 19.9999 21.0417 19.6187 21.3645 19.0546C21.6872 18.4905 21.682 17.8095 21.3502 17.25L13.9002 3.74993C13.5707 3.19608 12.9579 2.81824 12.2877 2.81824C11.6175 2.81824 11.0047 3.19608 10.6752 3.74993H10.7002Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 16.5H12.008"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="my-6">
            <AdsterraNativeBanner />
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold py-3 mb-3 text-center">
              • More LIVE Events •
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {relatedStreams.slice(0, 15).map((stream) => (
                <a
                  href={`/watch/${stream.id}`}
                  key={stream.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    window.location.href = `/watch/${stream.id}`;
                  }}
                >
                  <div className="bg-gray-800 rounded-lg overflow-hidden h-full cursor-pointer">
                    <div className="relative">
                      <img
                        src={stream.bannerImage}
                        alt={`${stream.homeTeam} vs ${stream.awayTeam}`}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://raw.githubusercontent.com/devk-sudo/LiveSports/refs/heads/main/stadium.jpg";
                        }}
                      />
                      {stream.isLive ? (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          LIVE
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {stream.statusDisplay ||
                            formatMatchTime(stream.startTime || "")}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium">
                        {stream.homeTeam} vs {stream.awayTeam}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 h-16 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">Score808</span>
              <span className="text-white mx-3">is now</span>
              <span className="text-2xl font-bold text-yellow-500">
                808ball
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 py-4">
            Score808 does not store any files on our server, we only linked to
            the media which is hosted on 3rd party services.
          </div>
        </div>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    </>
  );
};

export default WatchPage;

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>
) {
  // Safely access params
  if (!context.params || !context.params.slug) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const slug = context.params.slug;

  try {
    const primaryEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
    const fallbackEndpoint = process.env.NEXT_PUBLIC_FALLBACK_ENDPOINT;

    if (!primaryEndpoint || !fallbackEndpoint) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    let response = await fetch(primaryEndpoint);

    if (!response.ok) {
      response = await fetch(fallbackEndpoint);
      if (!response.ok) {
        return {
          redirect: {
            destination: "/",
            permanent: false,
          },
        };
      }
    }

    const data = await response.json();

    const allEvents = [
      ...(data.yesterday || []),
      ...(data.today || []),
      ...(data.upcoming || []),
    ];

    const eventData = allEvents.find((ev) => ev.id === slug);

    const relatedEvents = allEvents
      .filter((event) => {
        if (event.id === slug) return false;

        const status = getMatchStatus(event.time);
        return status.status !== "FT";
      })
      .slice(0, 12);

    if (!eventData) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        initialMatchData: eventData || null,
        initialRelatedStreams: relatedEvents || [],
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
}
