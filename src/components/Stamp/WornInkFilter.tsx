/**
 * SVG filter that makes stamp ink look uneven: fine speckles, larger faded
 * blotches and a slight warp. Stamps reference it as `filter: url(#worn)`.
 */
export function WornInkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="worn" x="-20%" y="-30%" width="140%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={7} result="speck" />
          <feColorMatrix
            in="speck"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -1.6"
            result="speckMask"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={2} result="blot" />
          <feColorMatrix
            in="blot"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.7"
            result="blotMask"
          />
          <feComposite in="speckMask" in2="blotMask" operator="arithmetic" k1={1} k2={0} k3={0} k4={0} result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" result="inked" />
          <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves={2} seed={4} result="warp" />
          <feDisplacementMap in="inked" in2="warp" scale={2.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
