/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArcadeCabinet } from './components/ArcadeCabinet.tsx';

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      <ArcadeCabinet />

      {/* Subtle Bottom Credit & Copyright */}
      <footer className="w-full text-center py-3 text-[11px] text-slate-600 font-tech">
        GALAXY ARCADE · 1980s SPACE SHOOTER TRIBUTE · NAMCO GALAXIAN & GALAGA INSPIRED
      </footer>
    </main>
  );
}
