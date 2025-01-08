import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Live Sports Streaming - Watch Football and More</title>
        <meta name="description" content="Stream live sports events and watch soccer games in real-time." />
        <link rel="icon" href="/favicon.ico" />
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
