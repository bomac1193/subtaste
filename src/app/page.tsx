'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Compass, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          {/* Logo/Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Subtaste
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral-400 mb-8 leading-relaxed">
            Discover your taste constellation.
            <br />
            One unified profile across images, music, and culture.
          </p>

          {/* CTA Button */}
          <motion.button
            onClick={() => router.push('/quiz')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full font-semibold text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/25"
          >
            Take the Subtaste Test
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <p className="text-neutral-600 text-sm mt-4">~24 questions • 3 minutes</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full"
        >
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Psychometric Mapping"
            description="Validated Big Five traits + aesthetic sensitivity create your unique taste vector."
          />
          <FeatureCard
            icon={<Compass className="w-6 h-6" />}
            title="Cross-Modal Scoring"
            description="One profile that works across images, music, and cultural artifacts."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Constellation Identity"
            description="Get matched to 27 taste archetypes with creative prompts and scene tags."
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-neutral-600 text-sm">
        <p>Subtaste • Where psychology meets aesthetics</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
