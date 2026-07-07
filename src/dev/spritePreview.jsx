import { useEffect, useRef } from "react";

/* Temporary comparison harness for bed sprite redraw candidates.
   Visit with ?preview=bed. Delete this file once a direction is picked
   and the chosen draw fn is folded into BedroomSlice.jsx's SPRITES.bed. */

const ZOOM = 8;

const P = {
  out: "#221306",
  mustard: "#C9942E", mustardHi: "#DDAB45", mustardLo: "#A87823",
  burgundy: "#7C2E37", burgundyLo: "#591F27",
  wood: "#5A381F", woodDark: "#3E2413",
  tan: "#CBAA78", tanHi: "#DFC495", tanLo: "#AB8B57",
};

const r = (ctx, c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const dith = (ctx, c, x, y, w, h, step = 2, off = 0) => {
  ctx.fillStyle = c;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
    if ((i + j + off) % step === 0) ctx.fillRect(i, j, 1, 1);
};

const W = 66, H = 60;

// Variant A: burgundy pillow overlapping two tan pillows behind, flat fold-band duvet
function bedA(ctx) {
  r(ctx, P.out, 2, 0, 27, 16); r(ctx, P.out, 37, 0, 27, 16);
  r(ctx, P.tan, 3, 1, 25, 14); r(ctx, P.tanHi, 3, 1, 25, 3); r(ctx, P.tanLo, 3, 12, 25, 3);
  r(ctx, P.tan, 38, 1, 25, 14); r(ctx, P.tanHi, 38, 1, 25, 3); r(ctx, P.tanLo, 38, 12, 25, 3);

  r(ctx, P.out, 15, 6, 36, 14);
  r(ctx, P.burgundy, 16, 7, 34, 12); r(ctx, "#96424C", 17, 8, 32, 3);
  r(ctx, P.burgundyLo, 16, 17, 34, 2);

  r(ctx, P.out, 1, 19, 64, 34);
  r(ctx, P.mustardHi, 2, 20, 62, 4);
  r(ctx, P.mustard, 2, 24, 62, 20);
  r(ctx, P.mustardLo, 2, 44, 62, 8);
  r(ctx, "#B6862A", 2, 30, 62, 1);
  r(ctx, "#B6862A", 2, 38, 62, 1);
  dith(ctx, P.mustardLo, 2, 24, 62, 20, 3, 0);

  r(ctx, P.out, 1, 53, 64, 3);
  r(ctx, P.woodDark, 2, 53, 62, 2);
  r(ctx, P.out, 4, 56, 4, 4); r(ctx, P.out, 58, 56, 4, 4);
  r(ctx, P.woodDark, 5, 56, 2, 3); r(ctx, P.woodDark, 59, 56, 2, 3);
}

// Variant B: three pillows fully visible side by side, quilted duvet texture
function bedB(ctx) {
  r(ctx, P.out, 0, 2, 20, 15); r(ctx, P.out, 46, 2, 20, 15);
  r(ctx, P.tan, 1, 3, 18, 13); r(ctx, P.tanHi, 1, 3, 18, 3); r(ctx, P.tanLo, 1, 13, 18, 3);
  r(ctx, P.tan, 47, 3, 18, 13); r(ctx, P.tanHi, 47, 3, 18, 3); r(ctx, P.tanLo, 47, 13, 18, 3);

  r(ctx, P.out, 21, 5, 24, 13);
  r(ctx, P.burgundy, 22, 6, 22, 11); r(ctx, "#96424C", 23, 7, 20, 3);
  r(ctx, P.burgundyLo, 22, 15, 22, 2);

  r(ctx, P.out, 1, 18, 64, 35);
  r(ctx, P.mustardHi, 2, 19, 62, 3);
  r(ctx, P.mustard, 2, 22, 62, 22);
  r(ctx, P.mustardLo, 2, 44, 62, 8);
  dith(ctx, P.mustardLo, 2, 22, 62, 22, 2, 0);
  dith(ctx, P.mustardHi, 2, 22, 62, 22, 5, 2);
  r(ctx, "#B6862A", 2, 34, 62, 1);

  r(ctx, P.out, 1, 53, 64, 3);
  r(ctx, P.wood, 2, 53, 62, 2);
  dith(ctx, P.woodDark, 2, 53, 62, 2, 3, 0);
  r(ctx, P.out, 4, 56, 4, 4); r(ctx, P.out, 58, 56, 4, 4);
  r(ctx, P.woodDark, 5, 56, 2, 3); r(ctx, P.woodDark, 59, 56, 2, 3);
}

function Candidate({ label, draw }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    c.width = W; c.height = H;
    draw(c.getContext("2d"));
  }, [draw]);
  return (
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={ref}
        style={{ width: W * ZOOM, height: H * ZOOM, imageRendering: "pixelated", border: "2px solid #4A2E17" }}
      />
      <div style={{ color: "#F2E4C0", fontFamily: "'Courier New', monospace", marginTop: 10 }}>{label}</div>
    </div>
  );
}

export default function SpritePreview() {
  return (
    <div style={{
      minHeight: "100vh", background: "#160D06", display: "flex",
      alignItems: "center", justifyContent: "center", gap: 60, flexWrap: "wrap",
    }}>
      <Candidate label="Variant A — burgundy overlapping tan pillows, flat fold bands" draw={bedA} />
      <Candidate label="Variant B — three pillows in a row, quilted duvet texture" draw={bedB} />
    </div>
  );
}
