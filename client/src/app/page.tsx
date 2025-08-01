'use client';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Meow meow meow meow meow</h1>
      <Image
        src="/images/banner.png"
        alt="Banner"
        width={300}
        height={150}
        priority
      />
      <Input></Input>
    </div>
  );
}

