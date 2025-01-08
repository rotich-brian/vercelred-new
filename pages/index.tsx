import { type NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Calendar, Clock, Star } from 'lucide-react'

const Home: NextPage = () => {
  const liveMatches = [
    { id: 1, home: "Manchester United", away: "Chelsea", score: "2-1", time: "65'", league: "Premier League" },
    { id: 2, home: "Barcelona", away: "Real Madrid", score: "0-0", time: "32'", league: "La Liga" },
  ]

  const upcomingMatches = [
    { id: 3, home: "Liverpool", away: "Arsenal", time: "19:45", date: "Today", league: "Premier League" },
    { id: 4, home: "Bayern Munich", away: "Dortmund", time: "20:30", date: "Tomorrow", league: "Bundesliga" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>LiveSport - Live Soccer Streaming</title>
        <meta name="description" content="Watch live soccer matches" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative h-[60vh] rounded-2xl overflow-hidden mb-12">
          <Image 
            src="/api/placeholder/1920/1080"
            alt="Featured Match"
            className="object-cover brightness-50"
            fill
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black">
            <div className="flex items-center gap-2 text-red-500 mb-4">
              <div className="animate-pulse w-3 h-3 rounded-full bg-red-500" />
              LIVE NOW
            </div>
            <h1 className="text-4xl font-bold mb-4">Manchester United vs Chelsea</h1>
            <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center gap-2">
              <Play size={20} /> Watch Live
            </button>
          </div>
        </div>

        {/* Live Matches */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map(match => (
              <div key={match.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition">
                <div className="text-sm text-gray-400 mb-4">{match.league}</div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg">{match.home}</div>
                  <div className="text-2xl font-bold">{match.score}</div>
                  <div className="text-lg">{match.away}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-red-500">{match.time}</div>
                  <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">
                    Watch Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Matches */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} />
            Upcoming Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.map(match => (
              <div key={match.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition">
                <div className="text-sm text-gray-400 mb-4">{match.league}</div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg">{match.home}</div>
                  <div className="text-lg">vs</div>
                  <div className="text-lg">{match.away}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {match.time} • {match.date}
                  </div>
                  <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Star size={16} /> Remind Me
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
