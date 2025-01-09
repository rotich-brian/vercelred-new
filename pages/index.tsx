import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <meta data-n-head="ssr" charset="utf-8">
        <title>Livesports808 - Live Sport Streams, Watch Football Live, NBA and More</title>
        <meta name="description" content="Livesports808 is the comprehensive sports TV online, live sports 808, offering 100+ live schedules for football & basketball matches in over 10 languages. It connects to free live streaming score808 and sport808, score808 live, soccer 808, livescore, 808. It was also named livesports808, livesports." />

        <meta data-n-head="ssr" name="viewport" content="width=device-width, initial-scale=1, user-scalable=0">
        <meta data-n-head="ssr" name="theme-color" content="#032c63">
        <meta data-n-head="ssr" name="apple-mobile-web-app-title" content="Livesports808">
        <meta data-n-head="ssr" name="application-name" content="Livesports808">
        <meta data-n-head="ssr" name="msapplication-TileColor" content="#03306b">

        {/*Open Graph Meta */}
        <meta data-n-head="ssr" name="og:title" content="Livesports808 - Live Sport Streams, Watch Football Live, NBA and More">
        <meta data-n-head="ssr" name="og:description" content="Livesports808 is the comprehensive sports TV online, live sports 808, offering 100+ live schedules for football &amp; basketball matches in over 10 languages. It connects to free live streaming score808 and sport808, score808 live, soccer 808, livescore, 808. It was also named livesports808, livesports.">
        <meta data-n-head="ssr" name="og:type" content="website">
        <meta data-n-head="ssr" name="og:image" content="/android-chrome-512x512.png">
        <meta data-n-head="ssr" name="og:image:width" content="512">
        <meta data-n-head="ssr" name="og:image:height" content="512">

        {/* Description and Keywords */}
        <meta data-n-head="ssr" name="description" content="Livesports088 is the comprehensive sports TV online, live sports 808, offering 100+ live schedules for football &amp; basketball matches in over 10 languages. It connects to free live streaming score808 and sport808, score808 live, soccer 808, livescore, 808. It was also named livesports808, livesports.">
        <meta data-n-head="ssr" name="keywords" content="Live Sport Streams,Football Live,Livesports808,Score808,score808pro,sports streaming free">
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

      </Head>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="SportsStream" width={150} height={50} />
        </div>
        <nav className={styles.nav}>
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#cta">Get Started</a>
          <a href="#footer">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Watch Football Live Anywhere</h1>
          <p className={styles.heroSubtitle}>
            Join the best platform to stream live soccer matches and sports events worldwide. No interruptions, just action.
          </p>
          <a href="/signup" className={styles.heroBtn}>Start Watching Now</a>
        </div>
      </section>

      {/* Description Section */}
      <section id="features" className={styles.features}>
        <div className={styles.featuresContent}>
          <h2>Why Choose Us?</h2>
          <p>
            We provide high-quality, uninterrupted live streaming of your favorite sports. Whether you're at home, at work, or on the go, never miss a match again. 
          </p>
          <ul>
            <li>⚽ Live Football Streaming</li>
            <li>📱 Watch on Any Device</li>
            <li>🌍 Global Coverage of Major Leagues</li>
            <li>🔒 Secure and Reliable Service</li>
          </ul>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className={styles.cta}>
        <h2>Get Started Now!</h2>
        <p>Sign up today and never miss another game.</p>
        <a href="/signup" className={styles.ctaBtn}>Join Now</a>
      </section>

      {/* Footer Section */}
      <footer id="footer" className={styles.footer}>
        <p>&copy; 2025 SportsStream. All Rights Reserved.</p>
        <a href="https://www.example.com/privacy-policy">Privacy Policy</a> | 
        <a href="https://www.example.com/terms-of-service">Terms of Service</a>
      </footer>
    </div>
  )
}

export default Home
