import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'

const Home: NextPage = () => {
  return (
    <div className="bg-gray-900 text-white font-sans">

      <Head>
        <title>Live Sports Streaming - Watch Football and More</title>
        <meta name="description" content="Stream live sports events and watch soccer games in real-time." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-black bg-opacity-80 p-4 z-50">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">
            <Image src="/logo.png" alt="SportsStream" width={150} height={50} />
          </div>
          <nav className="space-x-8 text-lg">
            <a href="#hero" className="hover:text-red-600">Home</a>
            <a href="#features" className="hover:text-red-600">Features</a>
            <a href="#cta" className="hover:text-red-600">Get Started</a>
            <a href="#footer" className="hover:text-red-600">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="bg-cover bg-center h-[80vh] flex justify-center items-center text-center bg-[url('/hero-background.jpg')]">
        <div className="text-white max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">Watch Football Live Anywhere</h1>
          <p className="text-lg sm:text-xl mb-6">
            Join the best platform to stream live soccer matches and sports events worldwide. No interruptions, just action.
          </p>
          <a href="#cta" className="bg-red-600 text-white py-3 px-8 text-lg rounded-full hover:bg-red-700 transition-all">Start Watching Now</a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-800 text-center">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-6">Why Choose Us?</h2>
          <p className="text-lg mb-8">We provide high-quality, uninterrupted live streaming of your favorite sports. Whether you're at home, at work, or on the go, never miss a match again.</p>
          <ul className="space-y-4 text-left max-w-2xl mx-auto text-lg">
            <li>⚽ Live Football Streaming</li>
            <li>📱 Watch on Any Device</li>
            <li>🌍 Global Coverage of Major Leagues</li>
            <li>🔒 Secure and Reliable Service</li>
          </ul>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="bg-red-600 text-white py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Get Started Now!</h2>
        <p className="text-lg mb-6">Sign up today and never miss another game.</p>
        <a href="/signup" className="bg-white text-red-600 py-3 px-8 text-lg rounded-full hover:bg-gray-200 transition-all">Join Now</a>
      </section>

      {/* Footer Section */}
      <footer id="footer" className="bg-gray-900 text-white py-8 text-center">
        <p>&copy; 2025 SportsStream. All Rights Reserved.</p>
        <a href="https://www.example.com/privacy-policy" className="text-red-600 hover:underline">Privacy Policy</a> |
        <a href="https://www.example.com/terms-of-service" className="text-red-600 hover:underline">Terms of Service</a>
      </footer>

    </div>
  )
}

export default Home
