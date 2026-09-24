import { Background } from '@/components/sections/Background';
import { Contact } from '@/components/sections/Contact';
import { Topology } from '@/components/sections/Topology';
import { Hero } from '@/components/sections/hero/Hero';
import { Works } from '@/components/sections/works/Works';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Works />
      <Background />
      <Topology />
      <Contact />
    </>
  );
}
