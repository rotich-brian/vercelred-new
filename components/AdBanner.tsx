import { useEffect, useRef } from "react";

const AdBanner: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '8f03b174bff8e7b46b4bad1450bdaef1',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src =
      process.env.NEXT_PUBLIC_ADBANNER_SCRIPT ||
      "//www.highperformanceformat.com/8f03b174bff8e7b46b4bad1450bdaef1/invoke.js";
    invokeScript.async = true;
    if (adContainerRef.current) {
      document.head.appendChild(optionsScript);
      adContainerRef.current.appendChild(invokeScript);
    }
    return () => {
      optionsScript.remove();
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div ref={adContainerRef} className="flex justify-center py-3 bg-white" />
  );
};

export default AdBanner;
