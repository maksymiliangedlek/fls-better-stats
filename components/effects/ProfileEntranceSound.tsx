"use client";

import { useEffect } from "react";

const SOBAN_SLUG = "bartlomiej-sobanski";
const SOBAN_SOUND = "/refren-soban.wav";

export function ProfileEntranceSound({ slug }: { slug: string }) {
  useEffect(() => {
    if (slug !== SOBAN_SLUG) return;

    const audio = new Audio(SOBAN_SOUND);
    let played = false;

    const play = () => {
      if (played) return;
      audio.play()
        .then(() => {
          played = true;
        })
        .catch(() => {});
    };

    play();

    // Browsers often block autoplay — retry on first interaction.
    document.addEventListener("click", play, { once: true });
    document.addEventListener("keydown", play, { once: true });

    return () => {
      document.removeEventListener("click", play);
      document.removeEventListener("keydown", play);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [slug]);

  return null;
}
