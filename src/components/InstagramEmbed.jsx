import { useEffect } from "react";

function InstagramEmbed({ url }) {
  useEffect(() => {
    if (!url) return;

    const processEmbed = () => {
      window.instgrm?.Embeds?.process();
    };

    if (window.instgrm) {
      processEmbed();
      return;
    }

    let script = document.querySelector(
      'script[src="https://www.instagram.com/embed.js"]'
    );

    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener("load", processEmbed);

    return () => {
      script.removeEventListener("load", processEmbed);
    };
  }, [url]);

  if (!url) return null;

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{
        background: "#fff",
        border: 0,
        margin: "1px auto",
        maxWidth: "540px",
        minWidth: "326px",
        padding: 0,
        width: "calc(100% - 2px)",
      }}
    />
  );
}

export default InstagramEmbed;
