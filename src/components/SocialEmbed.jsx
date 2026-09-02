import { useEffect, useRef } from "react";
import { detectPlatform } from "../utils/socialUtils.js";

// Instagram and X render through their own widget scripts; Facebook uses the
// plugin iframe, which needs no SDK and no App ID.
const SCRIPTS = {
  instagram: "https://www.instagram.com/embed.js",
  twitter: "https://platform.twitter.com/widgets.js",
};

// Load a platform script at most once per page and resolve when it is ready.
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${src}"]`);

    if (script) {
      if (script.dataset.loaded === "true") return resolve();
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", reject, { once: true });
      return;
    }

    script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", reject, { once: true });
    document.body.appendChild(script);
  });

function SocialEmbed({ url, theme = "dark" }) {
  const platform = detectPlatform(url);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url || !platform) return;

    const src = SCRIPTS[platform];
    if (!src) return; // facebook needs no script

    let cancelled = false;

    loadScript(src)
      .then(() => {
        if (cancelled) return;
        if (platform === "instagram") window.instgrm?.Embeds?.process();
        if (platform === "twitter") window.twttr?.widgets?.load(containerRef.current);
      })
      .catch(() => {
        // Script blocked or offline — the anchor fallback below stays visible.
      });

    return () => {
      cancelled = true;
    };
  }, [url, platform]);

  if (!url || !platform) return null;

  if (platform === "instagram") {
    return (
      <div ref={containerRef} className="flex justify-center">
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
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            इन्स्टाग्रामवर ही पोस्ट पहा
          </a>
        </blockquote>
      </div>
    );
  }

  if (platform === "twitter") {
    return (
      <div ref={containerRef} className="flex justify-center">
        <blockquote className="twitter-tweet" data-theme={theme} data-dnt="true">
          <a href={url} target="_blank" rel="noopener noreferrer">
            X वर ही पोस्ट पहा
          </a>
        </blockquote>
      </div>
    );
  }

  // Facebook plugin iframe. Height is fixed because the plugin does not report
  // its own size back to the parent page.
  return (
    <div className="flex justify-center">
      <iframe
        title="Facebook post"
        src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
          url
        )}&show_text=true&width=500`}
        width="500"
        height="600"
        style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
        scrolling="no"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        loading="lazy"
      />
    </div>
  );
}

export default SocialEmbed;
