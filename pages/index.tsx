import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Star, Tv, Loader2 } from 'lucide-react';
import Head from 'next/head';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  status: 'Live' | 'Scheduled' | 'FT';
  display: string;
  time: Date;
  eventUrl: string;
}

interface MatchStatus {
  status: 'Live' | 'Scheduled' | 'FT';
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
  homeTeam: string;
  awayTeam: string;
  competition: string;
  time: string;
  eventUrl: string;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div 
    className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white transition-opacity duration-300 
    ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
  >
    {message}
  </div>
);

const HomePage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<'Football' | 'Basketball' | 'Others'>('Football');
  const [language, setLanguage] = useState<string>('English');
  const [matches, setMatches] = useState<MatchesState>({ live: [], scheduled: [], finished: [] });
  const [liveGames, setLiveGames] = useState<Match[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'success'): void => {
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
  
    // If utcTime is a Date object, convert it to local time
    if (utcTime instanceof Date) {
      localTime = new Date(utcTime.getTime() - utcTime.getTimezoneOffset() * 60000); // Convert to local time
    } else if (typeof utcTime === "string") {
      // If it's a string, replace space with 'T' and append 'Z' to treat it as UTC
      const utcTimeISO = utcTime.replace(" ", "T") + "Z";
      
      // Parse the string as a Date object
      localTime = new Date(utcTimeISO);
      
      // Check if the Date object is valid
      if (isNaN(localTime.getTime())) {
        console.error("Invalid date format:", utcTime);
        return "Invalid time";
      }
    } else {
      console.error("Expected a string or Date but received:", typeof utcTime);
      return "Invalid time";
    }
  
    // Format the local time to HH:MM in the user's local time zone
    return localTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Set to false for 24-hour format
    });
  };
  

  const getMatchStatus = (matchTime: string | Date): MatchStatus => {
    const now = new Date();
    const gameTime = new Date(matchTime);
    const diffInMinutes = Math.floor((now.getTime() - gameTime.getTime()) / (1000 * 60)+1);

    if (diffInMinutes < 0) {
      return { status: 'Scheduled', display: formatMatchTime(matchTime) };
    } else if (diffInMinutes >= 0 && diffInMinutes <= 120) {
      // return { status: 'Live', display: `${diffInMinutes}'` };
      return { status: 'Live', display: `Live` };

    } else {
      return { status: 'FT', display: 'FT' };
    }
  };

  const fetchMatches = async (showLoading = false): Promise<void> => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch('https://raw.githubusercontent.com/rotich-brian/LiveSports/refs/heads/main/sportsprog1.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: ApiResponse = await response.json();

      const processedMatches: Match[] = data.today.map(match => ({
        id: `${match.homeTeam}-${match.awayTeam}`.replace(/\s/g, ''),
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        tournament: match.competition,
        ...getMatchStatus(match.time),
        time: new Date(match.time),
        eventUrl: match.eventUrl
      }));

      const sortedMatches = processedMatches.sort((a, b) => a.time.getTime() - b.time.getTime());
      const live = sortedMatches.filter(m => m.status === 'Live');
      const scheduled = sortedMatches.filter(m => m.status === 'Scheduled');
      const finished = sortedMatches.filter(m => m.status === 'FT');

      setLiveGames([...live, ...scheduled].slice(0, 10));
      setMatches({ live, scheduled, finished });

      if (!showLoading) {
        showToast('Events refresh success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching events:', error);
      if (!showLoading) {
        showToast('Failed to update events', 'error');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(true);

    const statusInterval = setInterval(() => {
      setMatches(prev => ({
        live: prev.live.map(match => ({ ...match, ...getMatchStatus(match.time) })),
        scheduled: prev.scheduled.map(match => ({ ...match, ...getMatchStatus(match.time) })),
        finished: prev.finished.map(match => ({ ...match, ...getMatchStatus(match.time) }))
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
    { name: 'Football' as const, icon: '⚽' },
    { name: 'Basketball' as const, icon: '🏀' },
    { name: 'Others' as const, icon: '•••' }
  ];

  const languages = [
    'English', 'Africa', 'Español', 'Indonesia', 'Português',
    'Русский', 'Việt Nam', 'ไทย', '中文', '日本語', '한국어'
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
        <Head>
            <meta charSet="utf-8" />
            <title>Livesports808 - Live Sport Streams, Watch Football Live, NBA and More</title>
            <meta
            name="description"
            content="Livesports808 is the comprehensive sports TV online, offering 100+ live schedules for football & basketball matches in over 10 languages."
            />
            <meta
            name="keywords"
            content="Live Sport Streams, Football Live, Livesports808, Score808, sports streaming free"
            />
            <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=1" />
            <meta name="theme-color" content="#032c63" />
            <meta name="apple-mobile-web-app-title" content="Livesports808" />
            <meta name="application-name" content="Livesports808" />
            <meta name="msapplication-TileColor" content="#03306b" />
            <meta
            name="facebook-domain-verification"
            content="rxzaq92a06htqv3lyohbqkby0zynob"
            />
            
            {/* Open Graph Metadata */}
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
            <meta property="og:url" content="https://www.livesports808.com" />
            <meta property="og:site_name" content="Livesports808" />
            
            {/* Favicons and Icons */}
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="manifest" href="/site.webmanifest" />
            
            {/* Twitter Card Metadata */}
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
        <div className="sticky top-0 z-10 ">
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
                        <option key={lang} value={lang} className="text-gray-900">
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
              <div className="flex justify-center px-4 py-2 space-x-6">  {/* Added space-x-4 */}
                {sports.map((sport) => (
                  <button
                    key={sport.name}
                    onClick={() => setSelectedSport(sport.name)}
                    className={`flex items-center gap-2 px-4 py-2 ${
                      selectedSport === sport.name ? 'text-[#002157] border-b-2 border-[#002157]' : 'text-gray-600'
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
            <main className="px-4 py-4">
              {/* Live Games Slider */}
              {liveGames.length > 0 && (
                <div className="bg-blue-50/50 -mx-4 px-4 py-4 border-y border-blue-100/50 mb-4">
                  <div 
                    ref={sliderRef}
                    className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className="flex gap-3 min-w-min pb-2">
                      {liveGames.map((game) => (
                        <div 
                          key={game.id}
                          className="bg-blue-50/50 rounded-lg p-3 hover:bg-gray-50 transition w-60 flex-shrink-0 shadow-sm border border-blue-100 min-h-[120px]"
                          onClick={() => window.location.href = game.eventUrl }
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 text-xs">{game.tournament}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-white">
                                {game.display}
                              </span>
                            </div>
                            <Tv size={18} className="text-orange-600" />
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-gray-900 text-sm">{game.homeTeam}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-900 text-sm">{game.awayTeam}</span>
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
              <div className="space-y-[1px] bg-blue-100/30">
                {[...matches.live, ...matches.scheduled].map((match) => (
                  <div 
                    key={match.id}
                    className="bg-white p-3 hover:cursor-pointer"
                    onClick={() => window.location.href = match.eventUrl}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-600 text-sm block mb-2">{match.tournament}</span>
                        <div className="flex gap-6">
                          <button className="text-gray-400 hover:text-[#002157]">
                            <Star size={18} />
                          </button>
                          
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            match.status === 'Live' ? 'text-red-500' : 'text-gray-500'
                          } self-center`}>
                            {match.display}
                          </span>

                          <div className="space-y-2">
                            <div className="text-gray-900">{match.homeTeam}</div>
                            <div className="text-gray-900">{match.awayTeam}</div>
                          </div>
                        </div>
                      </div>
                      
                      <span className={`flex items-center text-xs px-3 py-1 rounded-lg ${
                          match.status === 'Live' ? 'bg-blue-900 text-white' : 'bg-gray-300 text-gray-500 bg-opacity-50'
                        } self-center`}>
                        <Tv className="mr-1" size={15} /> {/* Add the TV icon */}
                        Live
                      </span>


                    </div>
                  </div>
                ))}
              </div>

              {/* Finished Matches */}
              {matches.finished.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm text-gray-500 px-1 mb-2">Finished</div>
                  <div className="space-y-[1px] bg-blue-100/30">
                    {matches.finished.map((match) => (
                      <div 
                        key={match.id}
                        className="bg-white p-3 hover:cursor-pointer"
                        onClick={() => window.location.href = match.eventUrl}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-600 text-sm block mb-2">{match.tournament}</span>
                            <div className="flex gap-6">
                              <button className="text-gray-400 hover:text-[#002157]">
                                <Star size={18} />
                              </button>
                              <div className="space-y-2">
                                <div className="text-gray-900">{match.homeTeam}</div>
                                <div className="text-gray-900">{match.awayTeam}</div>
                              </div>
                            </div>
                          </div>
                          <span className="text-gray-500 font-medium text-sm self-center">
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