// 외부 의존성 없이 PNG 아이콘 생성 (zlib 사용).
// 브랜드 핑크 배경 + 흰색 초승달 마크.
import zlib from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const bg = [0xec, 0x48, 0x99]; // brand-500
  const white = [0xff, 0xff, 0xff];

  const cx = size * 0.52;
  const cy = size * 0.48;
  const r = size * 0.3; // 흰 원 반지름
  // 초승달용 오프셋 원 (배경색으로 깎아냄)
  const ox = size * 0.64;
  const oy = size * 0.4;
  const orr = size * 0.27;

  // RGBA raw, with filter byte 0 per row
  const rowBytes = size * 4;
  const raw = Buffer.alloc((rowBytes + 1) * size);

  for (let y = 0; y < size; y++) {
    raw[y * (rowBytes + 1)] = 0; // filter
    for (let x = 0; x < size; x++) {
      const inMoon =
        (x - cx) ** 2 + (y - cy) ** 2 <= r * r &&
        (x - ox) ** 2 + (y - oy) ** 2 > orr * orr;
      const [rr, gg, bb] = inMoon ? white : bg;
      const off = y * (rowBytes + 1) + 1 + x * 4;
      raw[off] = rr;
      raw[off + 1] = gg;
      raw[off + 2] = bb;
      raw[off + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, makePng(size));
  console.log(`wrote public/icons/icon-${size}.png`);
}
