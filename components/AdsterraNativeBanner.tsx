import { useEffect, useRef } from "react";

const AdsterraNativeBanner: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      process.env.NEXT_PUBLIC_ADSTERRA_SCRIPT ||
      "//pl25846014.effectiveratecpm.com/db1b505556897740c7475f57aa733c5e/invoke.js";
    document.head.appendChild(script);
    return () => {
      script.remove();
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="container-db1b505556897740c7475f57aa733c5e" ref={adContainerRef} />
  );
};

export default AdsterraNativeBanner;
