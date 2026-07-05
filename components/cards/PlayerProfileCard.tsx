"use client";
import { useRouter } from "next/navigation";
import ProfileCard from "./profile-card/ProfileCard";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";

export function PlayerProfileCard({
  player,
  status,
  enableTilt = true,
}: {
  player: LeaderboardEntry;
  status?: string;
  enableTilt?: boolean;
}) {
  const router = useRouter();
  const avatar = player.avatar ?? "/crest.png";

  return (
    <ProfileCard
      avatarUrl={avatar}
      miniAvatarUrl={avatar}
      name={player.name}
      title={`${player.goals} G · ${player.assists} A`}
      handle={player.slug}
      status={status ?? `${player.games} meczów`}
      contactText="Profil"
      showUserInfo
      enableTilt={enableTilt}
      behindGlowColor="rgba(201, 162, 39, 0.45)"
      innerGradient="linear-gradient(145deg, rgba(12,69,99,0.9) 0%, rgba(201,162,39,0.35) 100%)"
      onContactClick={() => router.push(`/players/${player.slug}`)}
    />
  );
}
