import { useEffect, useRef } from "react";

/* Temporary comparison harness for bed sprite redraw candidates.
   Visit with ?preview=bed. Delete this file once a direction is picked
   and the chosen draw fn is folded into BedroomSlice.jsx's SPRITES.bed. */

const ZOOM = 8;

const P = {
  out: "#221306",
  mustard: "#C9942E", mustardHi: "#DDAB45", mustardLo: "#A87823",
  burgundy: "#7C2E37", burgundyHi: "#96424C", burgundyLo: "#591F27",
  wood: "#5A381F", woodDark: "#3E2413", woodMid: "#6E452A", woodHi: "#8C5931",
  tan: "#CBAA78", tanHi: "#DFC495", tanLo: "#AB8B57",
};

const r = (ctx, c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

const W = 66, H = 78;

// Keeps the headboard silhouette (approved from the live room), adds
// tone-step shading + panel detail on the headboard, frame and legs,
// matching the density of the reference pixel-art bed icon.
function bedFinal(ctx) {
  // headboard
  r(ctx, P.out, 2, 0, 62, 16);
  r(ctx, P.woodHi, 3, 1, 60, 3);
  r(ctx, P.woodDark, 3, 4, 60, 10);
  r(ctx, P.woodMid, 22, 5, 1, 9); r(ctx, P.woodMid, 43, 5, 1, 9); // panel seams
  r(ctx, P.wood, 3, 13, 60, 1); // base shadow under cap

  // two tan pillows behind
  r(ctx, P.out, 4, 16, 27, 15); r(ctx, P.out, 35, 16, 27, 15);
  r(ctx, P.tan, 5, 17, 25, 13); r(ctx, P.tanHi, 5, 17, 25, 3); r(ctx, P.tanLo, 5, 27, 25, 3);
  r(ctx, P.tan, 36, 17, 25, 13); r(ctx, P.tanHi, 36, 17, 25, 3); r(ctx, P.tanLo, 36, 27, 25, 3);

  // burgundy accent pillow, front & center
  r(ctx, P.out, 16, 22, 34, 15);
  r(ctx, P.burgundy, 17, 23, 32, 13); r(ctx, P.burgundyHi, 18, 24, 30, 3);
  r(ctx, P.burgundyLo, 17, 33, 32, 2);

  // mustard/gold duvet — flat tone-stepped bands, no texture patch
  r(ctx, P.out, 1, 37, 64, 34);
  r(ctx, P.mustardHi, 2, 38, 62, 4);
  r(ctx, P.mustard, 2, 42, 62, 20);
  r(ctx, P.mustardLo, 2, 62, 62, 8);
  r(ctx, "#B6862A", 2, 48, 62, 1);
  r(ctx, "#B6862A", 2, 56, 62, 1);

  // frame + legs
  r(ctx, P.out, 1, 71, 64, 3);
  r(ctx, P.woodHi, 2, 71, 62, 1);
  r(ctx, P.woodDark, 2, 72, 62, 2);
  r(ctx, P.out, 4, 74, 4, 4); r(ctx, P.out, 58, 74, 4, 4);
  r(ctx, P.wood, 5, 74, 1, 4); r(ctx, P.woodDark, 6, 74, 2, 4);
  r(ctx, P.wood, 59, 74, 1, 4); r(ctx, P.woodDark, 60, 74, 2, 4);
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
      <Candidate label="Headboard kept, added tone-step shading + panel/frame detail" draw={bedFinal} />
    </div>
  );
}
