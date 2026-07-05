export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Ogniwo Bielany Stats — API ready</h1>
      <p>The frontend is coming soon. Available endpoints:</p>
      <ul>
        <li>
          <code>GET /api/team</code> — team summary, W-D-L, top scorers
        </li>
        <li>
          <code>GET /api/team/matches</code> — match list
        </li>
        <li>
          <code>GET /api/players</code> — roster leaderboard
        </li>
        <li>
          <code>GET /api/players/[slug]</code> — player profile + form
        </li>
        <li>
          <code>GET /api/compare?a=&amp;b=</code> — head-to-head
        </li>
      </ul>
    </main>
  );
}
