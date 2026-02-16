export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rlEncode(arr) {
  const runs = [];
  let i = 0;
  while (i < arr.length) {
    const val = arr[i];
    let count = 1;
    while (i + count < arr.length && arr[i + count] === val && count < 65535)
      count++;
    runs.push([val, count]);
    i += count;
  }
  return runs;
}

export function rlDecode(runs, totalLen) {
  const arr = new Uint8Array(totalLen);
  let offset = 0;
  for (const [val, count] of runs) {
    arr.fill(val, offset, offset + count);
    offset += count;
  }
  return arr;
}

export function rlDecodeSigned(runs, totalLen) {
  const arr = new Int8Array(totalLen);
  let offset = 0;
  for (const [val, count] of runs) {
    arr.fill(val, offset, offset + count);
    offset += count;
  }
  return arr;
}

// All blend functions take normalized [0,1] source and color values
export function blendMultiply(s, c) {
  return s * c;
}

export function blendOverlay(s, c) {
  return s < 0.5 ? 2 * s * c : 1 - 2 * (1 - s) * (1 - c);
}

export function blendSoftLight(s, c) {
  return (1 - 2 * c) * s * s + 2 * c * s;
}
