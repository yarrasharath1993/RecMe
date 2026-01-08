/**
 * JIOSAAVN FETCHER
 * 
 * Fetches music data from JioSaavn (jiosaavn.com)
 * Useful for:
 * - Music director field
 * - Soundtrack metadata
 * - Singer information
 * - Song lists
 * 
 * Uses public API endpoints with compliance layer
 */

import { safeFetcher } from '@/lib/compliance';
import type { ComplianceDataSource } from '@/lib/compliance/types';

// ============================================================
// TYPES
// ============================================================

export interface JioSaavnSong {
  id: string;
  name: string;
  duration: number; // seconds
  singers: string[];
  music: string[];
  lyricists?: string[];
  albumId?: string;
  imageUrl?: string;
  playUrl?: string;
  language: string;
  year?: number;
}

export interface JioSaavnAlbum {
  id: string;
  name: string;
  year?: number;
  primaryArtist?: string;
  image?: string;
  songs: JioSaavnSong[];
  language: string;
  label?: string;
  releaseDate?: string;
}

export interface JioSaavnArtist {
  id: string;
  name: string;
  type: 'singer' | 'music_director' | 'lyricist';
  imageUrl?: string;
  bio?: string;
  topSongs?: string[];
}

export interface JioSaavnResult {
  album: JioSaavnAlbum | null;
  musicDirector?: string;
  singers: string[];
  songs: JioSaavnSong[];
  source: 'jiosaavn';
  url: string;
  fetchedAt: string;
}

// ============================================================
// JIOSAAVN API ENDPOINTS
// ============================================================

// JioSaavn uses internal API endpoints that can be accessed
const API_BASE = 'https://www.jiosaavn.com/api.php';

// ============================================================
// JIOSAAVN FETCHER CLASS
// ============================================================

export class JioSaavnFetcher {
  private source: ComplianceDataSource = 'jiosaavn';

  /**
   * Search for a movie album on JioSaavn
   */
  async searchMovieAlbum(movieTitle: string, year?: number): Promise<JioSaavnResult> {
    const fetchedAt = new Date().toISOString();
    const emptyResult: JioSaavnResult = {
      album: null,
      singers: [],
      songs: [],
      source: 'jiosaavn',
      url: '',
      fetchedAt,
    };

    // Build search query
    const query = year ? `${movieTitle} ${year} Telugu` : `${movieTitle} Telugu`;
    const searchUrl = `${API_BASE}?__call=autocomplete.get&query=${encodeURIComponent(query)}&_format=json&_marker=0`;

    const searchResult = await safeFetcher.safeFetch<{
      albums?: { data?: Array<{ id: string; title: string; year?: string }> };
    }>(this.source, searchUrl);

    if (!searchResult.success || !searchResult.data?.albums?.data?.length) {
      // Fallback: try HTML search
      return this.searchMovieAlbumHTML(movieTitle, year);
    }

    // Find best matching album
    const albums = searchResult.data.albums.data;
    const bestMatch = albums.find(a => 
      a.title.toLowerCase().includes(movieTitle.toLowerCase())
    ) || albums[0];

    if (!bestMatch) {
      return emptyResult;
    }

    // Fetch album details
    return this.fetchAlbum(bestMatch.id);
  }

  /**
   * Fetch album by ID
   */
  async fetchAlbum(albumId: string): Promise<JioSaavnResult> {
    const fetchedAt = new Date().toISOString();
    const url = `${API_BASE}?__call=content.getAlbumDetails&albumid=${albumId}&_format=json`;

    const result = await safeFetcher.safeFetch<Record<string, unknown>>(this.source, url);

    if (!result.success || !result.data) {
      return {
        album: null,
        singers: [],
        songs: [],
        source: 'jiosaavn',
        url,
        fetchedAt,
      };
    }

    const data = result.data;
    const songs = this.parseSongs(data);
    const album = this.parseAlbum(data, songs);
    const musicDirector = this.extractMusicDirector(data, songs);
    const singers = this.extractSingers(songs);

    return {
      album,
      musicDirector,
      singers,
      songs,
      source: 'jiosaavn',
      url,
      fetchedAt,
    };
  }

  /**
   * Fallback: Search using HTML page
   */
  private async searchMovieAlbumHTML(movieTitle: string, year?: number): Promise<JioSaavnResult> {
    const fetchedAt = new Date().toISOString();
    const query = year ? `${movieTitle} ${year}` : movieTitle;
    const searchUrl = `https://www.jiosaavn.com/search/album/${encodeURIComponent(query)}`;

    const result = await safeFetcher.safeFetch<string>(this.source, searchUrl);

    if (!result.success || !result.data) {
      return {
        album: null,
        singers: [],
        songs: [],
        source: 'jiosaavn',
        url: searchUrl,
        fetchedAt,
      };
    }

    const html = result.data;
    
    // Extract album link
    const albumMatch = html.match(/href="(\/album\/[^"]+)"/i);
    if (!albumMatch) {
      return {
        album: null,
        singers: [],
        songs: [],
        source: 'jiosaavn',
        url: searchUrl,
        fetchedAt,
      };
    }

    // Fetch album page
    const albumUrl = `https://www.jiosaavn.com${albumMatch[1]}`;
    return this.parseAlbumFromHTML(albumUrl);
  }

  /**
   * Parse album from HTML page
   */
  private async parseAlbumFromHTML(albumUrl: string): Promise<JioSaavnResult> {
    const fetchedAt = new Date().toISOString();

    const result = await safeFetcher.safeFetch<string>(this.source, albumUrl);

    if (!result.success || !result.data) {
      return {
        album: null,
        singers: [],
        songs: [],
        source: 'jiosaavn',
        url: albumUrl,
        fetchedAt,
      };
    }

    const html = result.data;
    const songs: JioSaavnSong[] = [];
    const singers = new Set<string>();

    // Extract album title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
      || html.match(/<title>([^|<]+)/i);
    const albumName = titleMatch ? titleMatch[1].trim().replace(' - JioSaavn', '') : 'Unknown Album';

    // Extract year
    const yearMatch = html.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    // Extract music director
    const musicMatch = html.match(/music[^>]*>([^<]+)|composer[^>]*>([^<]+)/i);
    const musicDirector = musicMatch ? (musicMatch[1] || musicMatch[2]).trim() : undefined;

    // Extract songs
    const songPattern = /<div[^>]*class="[^"]*song[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const songMatches = html.matchAll(songPattern);

    for (const match of songMatches) {
      const songHtml = match[0];

      // Extract song name
      const nameMatch = songHtml.match(/<a[^>]*>([^<]+)<\/a>/i);
      const name = nameMatch ? nameMatch[1].trim() : null;

      if (!name) continue;

      // Extract singers
      const singerMatch = songHtml.match(/singer[^>]*>([^<]+)|by\s+([^<]+)/i);
      const songSingers = singerMatch 
        ? (singerMatch[1] || singerMatch[2]).split(/,|&/).map(s => s.trim())
        : [];

      songSingers.forEach(s => singers.add(s));

      songs.push({
        id: `song-${songs.length}`,
        name,
        duration: 0,
        singers: songSingers,
        music: musicDirector ? [musicDirector] : [],
        language: 'Telugu',
      });

      if (songs.length >= 15) break;
    }

    const album: JioSaavnAlbum = {
      id: albumUrl,
      name: albumName,
      year,
      songs,
      language: 'Telugu',
      primaryArtist: musicDirector,
    };

    return {
      album,
      musicDirector,
      singers: Array.from(singers),
      songs,
      source: 'jiosaavn',
      url: albumUrl,
      fetchedAt,
    };
  }

  // ============================================================
  // PARSING HELPERS
  // ============================================================

  private parseSongs(data: Record<string, unknown>): JioSaavnSong[] {
    const songs: JioSaavnSong[] = [];
    const songList = (data.songs || data.list || []) as Array<Record<string, unknown>>;

    for (const song of songList) {
      const singers = this.parseArtists(song.primary_artists || song.singers || song.music);
      const music = this.parseArtists(song.music || song.composers);

      songs.push({
        id: String(song.id || song.perma_url || songs.length),
        name: String(song.song || song.title || song.name || 'Unknown'),
        duration: parseInt(String(song.duration || 0)),
        singers,
        music,
        lyricists: this.parseArtists(song.starring),
        imageUrl: String(song.image || ''),
        language: String(song.language || 'Telugu'),
        year: song.year ? parseInt(String(song.year)) : undefined,
      });
    }

    return songs;
  }

  private parseAlbum(data: Record<string, unknown>, songs: JioSaavnSong[]): JioSaavnAlbum {
    return {
      id: String(data.albumid || data.id || ''),
      name: String(data.title || data.name || data.album || 'Unknown Album'),
      year: data.year ? parseInt(String(data.year)) : undefined,
      primaryArtist: String(data.primary_artists || data.music || ''),
      image: String(data.image || ''),
      songs,
      language: String(data.language || 'Telugu'),
      label: String(data.label || ''),
      releaseDate: String(data.release_date || ''),
    };
  }

  private parseArtists(value: unknown): string[] {
    if (!value) return [];
    if (typeof value === 'string') {
      return value.split(/,|&/).map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.map(v => String(v.name || v)).filter(Boolean);
    }
    return [];
  }

  private extractMusicDirector(data: Record<string, unknown>, songs: JioSaavnSong[]): string | undefined {
    // Try from album data
    const music = data.music || data.primary_artists || data.composers;
    if (music) {
      const artists = this.parseArtists(music);
      if (artists.length > 0) return artists[0];
    }

    // Try from songs
    const allMusic = songs.flatMap(s => s.music);
    if (allMusic.length > 0) {
      // Return most common music director
      const counts = new Map<string, number>();
      allMusic.forEach(m => counts.set(m, (counts.get(m) || 0) + 1));
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0];
    }

    return undefined;
  }

  private extractSingers(songs: JioSaavnSong[]): string[] {
    const allSingers = songs.flatMap(s => s.singers);
    return [...new Set(allSingers)];
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const jioSaavnFetcher = new JioSaavnFetcher();

// ============================================================
// CONVENIENCE FUNCTION
// ============================================================

export async function fetchMovieSoundtrack(
  movieTitle: string,
  year?: number
): Promise<{
  musicDirector: string | undefined;
  singers: string[];
  songCount: number;
  songs: Array<{ name: string; singers: string[] }>;
}> {
  const result = await jioSaavnFetcher.searchMovieAlbum(movieTitle, year);

  return {
    musicDirector: result.musicDirector,
    singers: result.singers,
    songCount: result.songs.length,
    songs: result.songs.map(s => ({ name: s.name, singers: s.singers })),
  };
}

