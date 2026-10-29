interface Props {
  doble: boolean;
  /** Colores de lo elegido, para que asome el relleno. */
  colores: string[];
  colorTortilla: string;
}

/** Ilustración provisoria del burrito enrollado con papas `[A CONFIRMAR: render de Max]`. */
export function BurritoEnrollado({ doble, colores, colorTortilla }: Props) {
  const largo = doble ? 236 : 196;
  const alto = doble ? 96 : 84;
  const x0 = 26;
  const y0 = 92 - alto / 2;
  const puntos = colores.slice(0, 7);

  return (
    <svg viewBox="0 0 340 170" className="mx-auto w-full max-w-sm" role="img" aria-label={`Tu burrito ${doble ? 'doble tapa' : 'simple'} con papas fritas`}>
      <ellipse cx="160" cy="152" rx="140" ry="10" fill="#2B1B12" opacity=".12" />
      {/* tortilla enrollada */}
      <g transform={`rotate(-8 160 92)`}>
        <rect x={x0} y={y0} width={largo} height={alto} rx={alto / 2} fill={colorTortilla} stroke="#2B1B12" strokeWidth="4" />
        <path d={`M${x0 + 40} ${y0 + 6} q20 ${alto / 2 - 6} 0 ${alto - 12}`} fill="none" stroke="#2B1B12" strokeWidth="2.5" opacity=".35" />
        {/* papel */}
        <path
          d={`M${x0} ${y0 + 8} h66 l-10 12 l12 10 l-10 12 l12 10 l-10 12 l10 ${alto - 72} h-70 z`}
          fill="#FFFFFF"
          stroke="#2B1B12"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect x={x0 + 22} y={y0 + 8} width="14" height={alto - 8} fill="#C9431F" />
        {/* boca con relleno */}
        <ellipse cx={x0 + largo - 18} cy={y0 + alto / 2} rx="24" ry={alto / 2 - 4} fill="#F7E4B9" stroke="#2B1B12" strokeWidth="4" />
        {puntos.map((color, i) => (
          <circle
            key={i}
            cx={x0 + largo - 26 + (i % 3) * 9}
            cy={y0 + alto / 2 - 16 + Math.floor(i / 3) * 13}
            r="6.5"
            fill={color}
            stroke="#2B1B12"
            strokeWidth="2"
          />
        ))}
      </g>
      {/* papas */}
      <g transform="translate(262 52)">
        {[8, 18, 28, 38, 48].map((x, i) => (
          <rect key={x} x={x} y={i % 2 ? 4 : -6} width="8" height="56" rx="2" fill="#FFD166" stroke="#2B1B12" strokeWidth="2.5" transform={`rotate(${(i - 2) * 5} ${x + 4} 40)`} />
        ))}
        <path d="M0 30 h62 l-8 66 h-46 z" fill="#C9431F" stroke="#2B1B12" strokeWidth="4" strokeLinejoin="round" />
        <path d="M3 44 h56" stroke="#FFFFFF" strokeWidth="5" />
      </g>
    </svg>
  );
}
