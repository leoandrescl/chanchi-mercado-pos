const SILK = 'bg-gradient-to-b from-transparent via-slate-300 to-slate-400/70';

export default function HalloweenAmbient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden select-none"
    >
      {/* Araña colgando — izquierda */}
      <div className="absolute left-2 top-0 hidden flex-col items-center hv-swing sm:flex">
        <div className={`h-20 w-px ${SILK}`} />
        <span className="text-xl leading-none drop-shadow-sm">🕷️</span>
      </div>

      {/* Telaraña colgando — derecha */}
      <div className="absolute right-3 top-0 flex flex-col items-center hv-swing hv-delay-2">
        <div className={`h-14 w-px ${SILK}`} />
        <span className="text-lg leading-none drop-shadow-sm">🕸️</span>
      </div>

      {/* Murciélago */}
      <span className="absolute right-8 top-24 hidden text-2xl hv-float opacity-80 md:block">
        🦇
      </span>

      {/* Calabaza */}
      <span className="absolute left-3 top-44 hidden text-2xl hv-float hv-delay-2 opacity-80 md:block">
        🎃
      </span>

      {/* Fantasmita */}
      <span className="absolute right-5 bottom-32 hidden text-2xl hv-float opacity-70 lg:block">
        👻
      </span>

      {/* Dulce */}
      <span className="absolute left-6 bottom-44 hidden text-xl hv-float hv-delay-3 opacity-70 lg:block">
        🍬
      </span>
    </div>
  );
}
