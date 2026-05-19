// LCG PRNG — Math.imul za ispravno 32-bit overflow ponašanje
export function makeRng(seed: number) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}
