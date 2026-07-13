import { useState } from "react";
import PackItUp from "./BedroomSlice.jsx";
import SplashScreen from "./SplashScreen.jsx";

/**
 * Wraps the game with a cold-boot splash overlay. The game mounts and boots
 * underneath, so by the time the player taps the splash it's already ready.
 * Splash shows once per page load; dismissing it never brings it back.
 */
export default function GameWithSplash(props) {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      <PackItUp {...props} />
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </>
  );
}
