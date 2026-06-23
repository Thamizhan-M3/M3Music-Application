import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { ChevronRight } from 'lucide-react';

import { ArtistCard, AlbumCard, GenreCard } from '../components/DiscoveryCards';

const toArray = (value) => (Array.isArray(value) ? value : []);

const SectionHeader = ({ title, onSeeAll }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="h-1 w-8 bg-primary rounded-full mt-2"></div>
    </div>
    {onSeeAll && (
      <button onClick={onSeeAll} className="text-sm font-bold text-zinc-500 hover:text-primary transition-colors flex items-center gap-1">
        Show all <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

const Discovery = () => {
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artistsRes, albumsRes, genresRes] = await Promise.all([
          axiosInstance.get('/api/music/artists'),
          axiosInstance.get('/api/music/albums'),
          axiosInstance.get('/api/music/genres')
        ]);
        setArtists(toArray(artistsRes.data));
        setAlbums(toArray(albumsRes.data));
        setGenres(toArray(genresRes.data));
      } catch (err) {
        console.error('Failed to fetch discovery data', err);
        setArtists([]);
        setAlbums([]);
        setGenres([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const safeArtists = toArray(artists);
  const safeAlbums = toArray(albums);
  const safeGenres = toArray(genres);

  return (
    <div className="pb-32 animate-fade-in pt-4">
      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tight text-white mb-4 neon-text">Explore</h1>
        <p className="text-zinc-400 max-w-2xl text-lg">Discover new music by artists, albums, and your favorite genres.</p>
      </header>

      {/* Genres Section */}
      <section className="mb-12">
        <SectionHeader title="Popular Genres" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {safeGenres.length === 0 ? (
            <p className="text-sm text-zinc-500 col-span-full">No genres available.</p>
          ) : safeGenres.map((genre, i) => (
            <GenreCard key={genre} name={genre} colorIndex={i} />
          ))}
        </div>
      </section>

      {/* Artists Section */}
      <section className="mb-12">
        <SectionHeader title="Trending Artists" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {safeArtists.length === 0 ? (
            <p className="text-sm text-zinc-500 col-span-full">No artists available.</p>
          ) : safeArtists.slice(0, 6).map(artist => (
            <ArtistCard
              key={artist.name}
              name={artist.name}
              image={artist.thumbnailUrl}
            />
          ))}
        </div>
      </section>

      {/* Albums Section */}
      <section className="mb-12">
        <SectionHeader title="Popular Albums" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {safeAlbums.length === 0 ? (
            <p className="text-sm text-zinc-500 col-span-full">No albums available.</p>
          ) : safeAlbums.slice(0, 6).map(album => (
            <AlbumCard
              key={album.name}
              name={album.name}
              artist={album.artist}
              image={album.thumbnailUrl}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Discovery;
