export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  duration: number;
}

// 20 trending royalty-free tracks. Audio is streamed from the public
// Google sample bucket; covers use Pexels image URLs.
export const MUSIC_LIBRARY: Song[] = [
  {
    id: 'song-1',
    title: 'Sunset Drive',
    artist: 'Aurora Beats',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    cover: 'https://images.pexels.com/photos/8928887/pexels-photo-8928887.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-2',
    title: 'Neon Nights',
    artist: 'Lunar Wave',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    cover: 'https://images.pexels.com/photos/17718741/pexels-photo-17718741.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-3',
    title: 'Golden Hour',
    artist: 'Mila Sky',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    cover: 'https://images.pexels.com/photos/30641513/pexels-photo-30641513.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-4',
    title: 'Ocean Breeze',
    artist: 'Coral Sound',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    cover: 'https://images.pexels.com/photos/39595895/pexels-photo-39595895.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-5',
    title: 'Electric Pulse',
    artist: 'Nova Ray',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cover: 'https://images.pexels.com/photos/8821332/pexels-photo-8821332.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-6',
    title: 'Dreamfield',
    artist: 'Echo Valley',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cover: 'https://images.pexels.com/photos/11808109/pexels-photo-11808109.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-7',
    title: 'Midnight Run',
    artist: 'The Vibe Collective',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    cover: 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-8',
    title: 'Crystal Waters',
    artist: 'Blue Horizon',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    cover: 'https://images.pexels.com/photos/1000653/pexels-photo-1000653.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-9',
    title: 'Lavender Skies',
    artist: 'Soft Glow',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    cover: 'https://images.pexels.com/photos/207962/pexels-photo-207962.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-10',
    title: 'Urban Groove',
    artist: 'Street Lights',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    cover: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-11',
    title: 'Paper Hearts',
    artist: 'June Fields',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cover: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-12',
    title: 'Heatwave',
    artist: 'Solar Flare',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cover: 'https://images.pexels.com/photos/2425567/pexels-photo-2425567.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-13',
    title: 'Velvet Moon',
    artist: 'Cassia',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    cover: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-14',
    title: 'Wildflower',
    artist: 'Meadow Lane',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    cover: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-15',
    title: 'Gravity',
    artist: 'Pulse Theory',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    cover: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-16',
    title: 'Sugar Rush',
    artist: 'Pop Drips',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    cover: 'https://images.pexels.com/photos/1857632/pexels-photo-1857632.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-17',
    title: 'Afterglow',
    artist: 'Wren',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cover: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-18',
    title: 'Thunder Road',
    artist: 'Bolt Action',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cover: 'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-19',
    title: 'Daydream',
    artist: 'Lull',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    cover: 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
  {
    id: 'song-20',
    title: 'Festival Lights',
    artist: 'Confetti',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    cover: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    duration: 15,
  },
];

export function findSongById(id: string): Song | undefined {
  return MUSIC_LIBRARY.find((s) => s.id === id);
}

export function songLabel(song: Song): string {
  return `${song.title} - ${song.artist}`;
}
