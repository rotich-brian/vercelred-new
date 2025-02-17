import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Bot detection function
const isBot = (userAgent: string): boolean => {
  const botPatterns = [
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'slurp',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'slackbot',
    'vkShare',
    'W3C_Validator',
    'crawler',
    'spider',
    'bot'
  ];
  
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUA.includes(pattern));
};

const Home: NextPage = () => {
  const widgetRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the browser and not a bot
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      
      if (!isBot(userAgent)) {
        const baseUrl = process.env.BLOGGER_BASE_URL;
        if (baseUrl) {
          window.location.href = baseUrl;
          return; // Stop further execution for redirecting users
        }
      }
    }

    // Load external scripts
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    // Load external styles
    const loadStyle = (href: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) {
          resolve();
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject();
        document.head.appendChild(link);
      });
    };

    const initWidget = async () => {
      try {
        await Promise.all([
          loadStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'),
          loadStyle('https://cdnjs.cloudflare.com/ajax/libs/Swiper/8.4.7/swiper-bundle.min.css'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/luxon/3.4.3/luxon.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/Swiper/8.4.7/swiper-bundle.min.js')
        ]);

        // Initialize widget functionality
        const CONFIG = {
          DATA_SOURCE: 'https://raw.githubusercontent.com/rotich-brian/LiveSports/refs/heads/main/sportsprog1.json',
          REFRESH_INTERVAL: 300000,
          LIVE_DURATION_HOURS: 2,
          TIME_FORMAT: { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          }
        };

        class TimeHandler {
          DateTime: any;
          userTimeZone: string;
          TIME_FORMAT: Intl.DateTimeFormatOptions;

          constructor() {
            this.DateTime = (window as any).luxon.DateTime;
            this.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.TIME_FORMAT = { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            };
          }

          formatMatchTime(timestamp: number) {
            const matchTime = this.DateTime.fromMillis(timestamp)
              .setZone(this.userTimeZone);
            return matchTime.toLocaleString(this.TIME_FORMAT);
          }

          isLive(startTime: number) {
            const now = this.DateTime.now();
            const matchStart = this.DateTime.fromMillis(startTime);
            const hoursSinceStart = now.diff(matchStart, 'hours').hours;
            return hoursSinceStart >= 0 && hoursSinceStart <= CONFIG.LIVE_DURATION_HOURS;
          }
        }

        class SportsWidget {
          private config: typeof CONFIG;
          private timeHandler: TimeHandler;
          private refreshInterval: NodeJS.Timeout | null;
          private statusCheckInterval: NodeJS.Timeout | null;
          private swiper: any;

          constructor(config: typeof CONFIG) {
            this.config = config;
            this.timeHandler = new TimeHandler();
            this.refreshInterval = null;
            this.statusCheckInterval = null;
            this.swiper = null;
          }

          async initialize() {
            await this.fetchAndDisplayMatches();
            this.initializeSwiper();
            this.startRefreshInterval();
          }

          private async fetchAndDisplayMatches() {
            try {
              const response = await fetch(this.config.DATA_SOURCE);
              const data = await response.json();
              
              let matches: any[] = [];
              if (Array.isArray(data)) {
                matches = data;
              } else if (data.matches && Array.isArray(data.matches)) {
                matches = data.matches;
              } else if (typeof data === 'object') {
                matches = Object.values(data).flat();
              }
          
              matches = matches.filter(match => 
                match && 
                typeof match === 'object' && 
                'time' in match &&
                ('homeTeam' in match || 'team1' in match) &&
                ('awayTeam' in match || 'team2' in match)
              );
          
              if (matches.length === 0) {
                this.showToast('No matches available at the moment.', 'error');
                this.displayNoMatches();
                return;
              }
          
              this.displayMatches(matches);
            } catch (error) {
              console.error('Error fetching matches:', error);
              this.showToast('Error loading matches. Please try again later.', 'error');
              this.displayNoMatches();
            }
          }

          private displayMatches(matches: any[]) {
            const container = document.querySelector('.matches-container');
            if (!container) return;

            if (matches.length === 0) {
              this.displayNoMatches();
              return;
            }

            const matchesHtml = matches.map(match => this.createMatchElement(match)).join('');
            container.innerHTML = matchesHtml;
          }

          private displayNoMatches() {
            const container = document.querySelector('.matches-container');
            if (!container) return;

            container.innerHTML = `
              <div class="no-matches">
                <p>No matches available at the moment.</p>
                <p>Please check back later.</p>
              </div>
            `;
          }

          private createMatchElement(match: any) {
            const isLive = this.timeHandler.isLive(match.startTime);
            const timeString = this.timeHandler.formatMatchTime(match.startTime);
            
            const homeTeam = match.homeTeam || match.team1 || 'TBA';
            const awayTeam = match.awayTeam || match.team2 || 'TBA';
            
            return `
              <div class="match-card ${isLive ? 'live' : ''}">
                <div class="match-time">${timeString}</div>
                <div class="teams">
                  <div class="team home">${homeTeam}</div>
                  <div class="team away">${awayTeam}</div>
                </div>
                <div class="match-status">
                  ${isLive ? '<span class="live-indicator">LIVE</span>' : 'Upcoming'}
                </div>
                ${match.league ? `<div class="league-name">${match.league}</div>` : ''}
              </div>
            `;
          }

          private initializeSwiper() {
            this.swiper = new (window as any).Swiper('.featured-matches-swiper', {
              slidesPerView: 'auto',
              spaceBetween: 20,
              navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }
            });
          }

          private startRefreshInterval() {
            this.refreshInterval = setInterval(() => {
              this.fetchAndDisplayMatches();
            }, this.config.REFRESH_INTERVAL);

            this.statusCheckInterval = setInterval(() => {
              this.updateMatchStatuses();
            }, 60000);
          }

          private updateMatchStatuses() {
            document.querySelectorAll('.match-card').forEach((card: Element) => {
              const timeString = card.querySelector('.match-time')?.textContent;
              if (timeString) {
                const timestamp = this.timeHandler.DateTime.fromFormat(timeString, 'HH:mm').toMillis();
                const isLive = this.timeHandler.isLive(timestamp);
                card.classList.toggle('live', isLive);
                const statusEl = card.querySelector('.match-status');
                if (statusEl) {
                  statusEl.textContent = isLive ? 'LIVE' : 'Upcoming';
                }
              }
            });
          }

          private showToast(message: string, type: 'success' | 'error') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            const container = document.getElementById('toast-container');
            if (container) {
              container.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);
            }
          }

          cleanup() {
            if (this.refreshInterval) clearInterval(this.refreshInterval);
            if (this.statusCheckInterval) clearInterval(this.statusCheckInterval);
            if (this.swiper) this.swiper.destroy();
          }
        }

        if (!widgetRef.current) {
          widgetRef.current = new SportsWidget(CONFIG);
          await widgetRef.current.initialize();
        }
      } catch (error) {
        console.error('Error initializing widget:', error);
      }
    };

    initWidget();

    return () => {
      if (widgetRef.current?.cleanup) {
        widgetRef.current.cleanup();
      }
    };
  }, [router]);

  return (
    <div>

      <header className="header">
        <div className="logo">
          <Image src="android-chrome-512x512.png" alt="SportsStream" width={50} height={50} priority />
        </div>
        <nav className="nav">
          <a href="#hero">Home</a>
          <a href="#features">Live Matches</a>
          <a href="#matches">Telegram</a>
          <a href="#footer">Our App</a>
        </nav>
      </header>

      <section id="hero" className="hero">
        <div className="heroContent">
          <h1 className="heroTitle">Watch Football Live Anywhere</h1>
          <p className="heroSubtitle">
            Join the best platform to stream live soccer matches and sports events worldwide.
          </p>
          <a href="/signup" className="heroBtn">Start Watching Now</a>
        </div>
      </section>

      <section id="matches" className="matches-section">
        <div className="sports-widget-container">
          <div className="sports-widget">
            <div className="swiper featured-matches-swiper">
              <div className="swiper-wrapper"></div>
              <div className="swiper-button-next"></div>
              <div className="swiper-button-prev"></div>
            </div>
            <div className="matches-container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <div>Loading matches...</div>
              </div>
            </div>
            <div id="toast-container" className="toast-container"></div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="featuresContent">
          <h2>Why Choose Us?</h2>
          <p>
            We provide high-quality, uninterrupted live streaming of your favorite sports.
          </p>
          <ul>
            <li>⚽ Live Football Streaming</li>
            <li>📱 Watch on Any Device</li>
            <li>🌍 Global Coverage of Major Leagues</li>
            <li>🔒 Secure and Reliable Service</li>
          </ul>
        </div>
      </section>

      <footer id="footer" className="footer">
        <p>&copy; 2025 FooTV by Dev K. All Rights Reserved.</p>
        <div>
          <a href="/privacy">Privacy Policy</a> |
          <a href="/terms">Terms of Service</a>
        </div>
      </footer>

      <style jsx global>{`
        /* Your existing styles remain the same */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .nav {
          display: flex;
          gap: 2rem;
        }

        .nav a {
          color: #333;
          text-decoration: none;
          font-weight: 500;
        }

        .nav a:hover {
          color: #0066cc;
        }

        .hero {
          text-align: center;
          padding: 4rem 2rem;
          background: linear-gradient(45deg, #032c63, #0066cc);
          color: white;
        }

        .heroTitle {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .heroSubtitle {
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }

        .heroBtn {
          display: inline-block;
          padding: 1rem 2rem;
          background: #fff;
          color: #0066cc;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          transition: transform 0.2s;
        }

        .heroBtn:hover {
          transform: translateY(-2px);
        }

        .features {
          padding: 4rem 2rem;
          background: #f8f9fa;
        }

        .featuresContent {
          max-width: 800px;
          margin: 0 auto;
        }

        .featuresContent h2 {
          text-align: center;
          margin-bottom: 2rem;
        }

        .featuresContent ul {
          list-style: none;
          padding: 0;
        }

        .featuresContent li {
          margin: 1rem 0;
          padding: 1rem;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .footer {
          text-align: center;
          padding: 2rem;
          background: #032c63;
          color: white;
        }

        .footer a {
          color: white;
          text-decoration: none;
          margin: 0 1rem;
        }

        .sports-widget-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .match-card {
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 1rem;
          background: white;
        }

        .match-card.live {
          border-color: #0066cc;
        }

        .match-time {
          font-weight: bold;
          color: #666;
        }

        .teams {
          margin: 0.5rem 0;
        }

        .team {
          padding: 0.25rem 0;
        }

        .match-status {
          font-size: 0.875rem;
          color: #0066cc;
        }

        .loading-container {
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0066cc;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .toast {
          padding: 1rem;
          margin: 0.5rem;
          border-radius: 4px;
          color: white;
          animation: fadeIn 0.3s ease-in;
        }

        .toast.success {
          background: #28a745;
        }

        .toast.error {
          background: #dc3545;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .nav {
            gap: 1rem;
          }
          
          .heroTitle {
            font-size: 2rem;
          }
          
          .heroSubtitle {
            font-size: 1rem;
          }

          .sports-widget-container {
            padding: 1rem;
          }

          .match-card {
            padding: 0.75rem;
          }
        }

        .swiper {
          width: 100%;
          padding: 20px 0;
        }

        .swiper-slide {
          width: auto;
          max-width: 300px;
        }

        .swiper-button-next,
        .swiper-button-prev {
          color: #0066cc;
        }

        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 1.5rem;
        }

        .matches-section {
          padding: 2rem 0;
          background: #f8f9fa;
        }

        .no-matches {
          text-align: center;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .live-indicator {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: #dc3545;
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .league-name {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .match-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .match-card:hover {
          transform: translateY(-2px);
        }

        .match-card.live {
          border-left: 4px solid #dc3545;
        }
      `}</style>
    </div>
  );
};

export default Home;
