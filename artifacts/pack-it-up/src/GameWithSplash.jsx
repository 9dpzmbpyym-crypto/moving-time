import { useEffect, useState } from "react";
import PackItUp from "./BedroomSlice.jsx";
import SplashScreen from "./SplashScreen.jsx";
import { warmArtCache } from "./preloadArt.js";

/**
 * Wraps the game with a cold-boot splash overlay. The game mounts and boots
 * underneath, so by the time the player taps the splash it's already ready.
 * Splash shows once per page load; dismissing it never brings it back.
 */
export default function GameWithSplash(props) {
  const [showSplash, setShowSplash] = useState(true);
  // Warm the art cache while the splash gate is up — cards/chrome first,
  // sliced screens on idle — so screens don't pop in piecemeal.
  useEffect(() => { warmArtCache(); }, []);
  return (
    <>
      <PackItUp {...props} />
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </>
  );
}
