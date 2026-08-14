"use client";
import ProfileCard from "./profile-card/ProfileCard";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";

export function PlayerProfileCard({
  player,
  enableTilt = true,
}: {
  player: LeaderboardEntry;
  status?: string;
  enableTilt?: boolean;
}) {
  return (
    <ProfileCard
      avatarUrl={player.avatar}
      miniAvatarUrl={player.avatar}
      name={player.name}
      title={`${player.goals} G · ${player.assists} A`}
      showUserInfo={false}
      enableTilt={enableTilt}
      href={`/players/${player.slug}`}
      behindGlowColor="rgba(64, 210, 230, 0.30)"
      innerGradient="linear-gradient(145deg, rgba(6,20,32,0.96) 0%, rgba(12,69,99,0.85) 55%, rgba(32,140,160,0.35) 100%)"
    />
  );
}
