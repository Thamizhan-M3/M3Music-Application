const absoluteUrlPattern = /^https?:\/\//i;

const getPublicBaseUrl = () => process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, '');

export const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (absoluteUrlPattern.test(value)) return value;

  const publicBaseUrl = getPublicBaseUrl();
  if (!publicBaseUrl) return value;

  return `${publicBaseUrl}/${value.replace(/^\/+/, '')}`;
};

export const toClientSong = (song) => {
  if (!song) return song;

  const plainSong = typeof song.toObject === 'function'
    ? song.toObject()
    : { ...song };

  const artworkUrl = resolveMediaUrl(plainSong.artworkUrl);
  const thumbnailUrl = resolveMediaUrl(plainSong.thumbnailUrl || plainSong.artworkUrl);

  return {
    ...plainSong,
    url: resolveMediaUrl(plainSong.url),
    artworkUrl,
    thumbnailUrl
  };
};

export const toClientSongs = (songs) => {
  if (!Array.isArray(songs)) return [];
  return songs.filter(Boolean).map(toClientSong);
};

export const toClientPlaylist = (playlist) => {
  if (!playlist) return playlist;

  const plainPlaylist = typeof playlist.toObject === 'function'
    ? playlist.toObject()
    : { ...playlist };

  return {
    ...plainPlaylist,
    songs: Array.isArray(plainPlaylist.songs)
      ? toClientSongs(plainPlaylist.songs)
      : plainPlaylist.songs,
    coverImage: resolveMediaUrl(plainPlaylist.coverImage)
  };
};
