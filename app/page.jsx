import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>BRPS</h1>
      <p>
        <Link href="/mestre">Tela do mestre</Link>
      </p>
      <p>
        <Link href="/tela">Tela dos jogadores</Link>
      </p>
    </main>
  );
}
