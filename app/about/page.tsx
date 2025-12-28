import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | TeluguVibes',
  description: 'About TeluguVibes - Your trusted source for Telugu entertainment news, gossip, sports, and trending stories.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-[#eab308] mb-8">
          About TeluguVibes
        </h1>
        
        <div className="space-y-8 text-[#ededed]">
          {/* Hero Section */}
          <section className="bg-[#141414] rounded-xl p-6 md:p-8 border border-[#262626]">
            <h2 className="text-2xl font-semibold text-white mb-4">
              🎬 మీ నంబర్ 1 తెలుగు వినోద వార్తల వేదిక
            </h2>
            <p className="text-[#a3a3a3] leading-relaxed text-lg">
              TeluguVibes is your premier destination for Telugu entertainment news, celebrity gossip, 
              sports updates, and trending stories. We bring you the latest from Tollywood, politics, 
              cricket, and beyond - all in Telugu, for Telugu audiences worldwide.
            </p>
          </section>

          {/* Mission */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🎯 Our Mission
            </h2>
            <p className="text-[#a3a3a3] leading-relaxed">
              To be the most trusted and engaging Telugu entertainment news platform, delivering 
              accurate, timely, and entertaining content that connects with Telugu-speaking audiences 
              across the globe. We combine cutting-edge AI technology with human editorial oversight 
              to bring you quality content 24/7.
            </p>
          </section>

          {/* What We Cover */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📰 What We Cover
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: '🎬', title: 'Entertainment', desc: 'Movies, OTT, TV shows' },
                { icon: '💫', title: 'Gossip', desc: 'Celebrity news & updates' },
                { icon: '🏏', title: 'Sports', desc: 'Cricket, IPL, athletes' },
                { icon: '🗳️', title: 'Politics', desc: 'Telugu states politics' },
                { icon: '📈', title: 'Trending', desc: 'Viral stories & topics' },
                { icon: '❤️', title: 'Love & Life', desc: 'Relationships & quotes' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-[#141414] rounded-lg p-4 border border-[#262626] hover:border-[#eab308]/50 transition-colors"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-[#737373]">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why TeluguVibes */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              ⭐ Why TeluguVibes?
            </h2>
            <ul className="space-y-3">
              {[
                { title: 'Telugu First', desc: 'Content written in Telugu, for Telugu audiences' },
                { title: '24/7 Updates', desc: 'Round-the-clock news coverage and breaking stories' },
                { title: 'AI-Powered', desc: 'Smart content curation with human editorial oversight' },
                { title: 'Mobile Friendly', desc: 'Optimized for reading on any device' },
                { title: 'Community Driven', desc: 'Engage with fellow Telugu entertainment fans' },
                { title: 'No Clickbait', desc: 'Authentic, verified news without sensationalism' },
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-[#eab308] mt-1">✓</span>
                  <div>
                    <span className="font-semibold text-white">{item.title}:</span>
                    <span className="text-[#a3a3a3] ml-2">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Team */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              👥 Our Team
            </h2>
            <p className="text-[#a3a3a3] leading-relaxed">
              TeluguVibes is built by a passionate team of Telugu entertainment enthusiasts, 
              journalists, and technologists. We combine our love for Telugu culture with modern 
              technology to bring you the best entertainment news experience.
            </p>
          </section>

          {/* Contact CTA */}
          <section className="bg-gradient-to-r from-[#eab308]/20 to-[#eab308]/5 rounded-xl p-6 md:p-8 border border-[#eab308]/30">
            <h2 className="text-xl font-semibold text-white mb-4">
              📧 Get In Touch
            </h2>
            <p className="text-[#a3a3a3] mb-4">
              Have a tip? Want to collaborate? We&apos;d love to hear from you!
            </p>
            <a 
              href="/contact"
              className="inline-block bg-[#eab308] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#ca9b07] transition-colors"
            >
              Contact Us →
            </a>
          </section>

          {/* Social Links */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🌐 Follow Us
            </h2>
            <div className="flex gap-4">
              {[
                { name: 'Twitter', icon: '𝕏', href: '#' },
                { name: 'Instagram', icon: '📸', href: '#' },
                { name: 'YouTube', icon: '▶️', href: '#' },
                { name: 'Telegram', icon: '📱', href: '#' },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-2 hover:border-[#eab308]/50 transition-colors flex items-center gap-2"
                >
                  <span>{social.icon}</span>
                  <span className="text-[#a3a3a3]">{social.name}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

