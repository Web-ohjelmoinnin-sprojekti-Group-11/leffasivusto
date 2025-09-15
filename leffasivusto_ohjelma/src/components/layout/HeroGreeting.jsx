import { useEffect, useState } from "react";
import "../../styles/heroGreeting.css";

/**
 * Kaunis script-tervehdys herokuvan päällä.
 * - persistent=true  => jää näkyviin (vain kevyt pop-in)
 * - persistent=false => häviää durationMs jälkeen (intro-tyyli)
 * Teksti ei blokkaa klikkauksia (pointer-events: none CSS:ssä).
 */
export default function HeroGreeting({
  text = "Which movie shall we watch today?",
  persistent = true,
  durationMs = 2500, // käytössä vain jos persistent=false
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (persistent) return;                  // pysyvä: ei aikakatkaisua
    const t = setTimeout(() => setShow(false), durationMs);
    return () => clearTimeout(t);
  }, [persistent, durationMs]);

  if (!show) return null;

  return (
    <div className="hero-greeting" aria-hidden="true">
      <span
        className={
          "hero-greeting__text " +
          (persistent ? "hero-greeting__text--static" : "hero-greeting__text--auto")
        }
      >
        {text}
      </span>
    </div>
  );
}
