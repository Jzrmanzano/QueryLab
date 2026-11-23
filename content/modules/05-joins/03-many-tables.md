---
id: joins.many-tables
title: Joining three or more tables
dataset: chinook
---
This lesson uses **Chinook**, a digital music store with 11 tables: artists, albums, tracks, genres, playlists, customers, invoices and employees. Open the **Schema** tab to see them all. Table and column names are written like `Album` and `ArtistId`; SQLite doesn't care about upper or lower case in names, so `album.artistid` works too.

A track belongs to an album, and an album belongs to an artist:

- `Track.AlbumId` points to `Album.AlbumId`
- `Album.ArtistId` points to `Artist.ArtistId`

## Add one join at a time

To get from a track to its artist you pass through the album. Write one `JOIN` per step, each with its own `ON`:

```sql run
SELECT t.Name AS track, al.Title AS album, ar.Name AS artist
FROM Track t
JOIN Album al ON al.AlbumId = t.AlbumId
JOIN Artist ar ON ar.ArtistId = al.ArtistId
WHERE ar.Name = 'AC/DC';
```

Build it up gradually: join two tables, run it, check the rows look right, then add the next join. Short aliases (`t`, `al`, `ar`) keep long queries readable.

## Many-to-many: the linking table

A playlist has many tracks, and a track can be on many playlists. Neither table can hold a single pointer to the other, so a third table, `PlaylistTrack`, stores one row per (playlist, track) pair. To go from a playlist to its tracks, join through it:

```sql run
SELECT p.Name AS playlist, t.Name AS track
FROM Playlist p
JOIN PlaylistTrack pt ON pt.PlaylistId = p.PlaylistId
JOIN Track t ON t.TrackId = pt.TrackId
WHERE p.Name = 'Heavy Metal Classic';
```

Joins combine with everything you already know. Here they feed a `GROUP BY`:

```sql run
SELECT p.PlaylistId, p.Name, COUNT(*) AS tracks
FROM Playlist p
JOIN PlaylistTrack pt ON pt.PlaylistId = p.PlaylistId
GROUP BY p.PlaylistId, p.Name;
```

Notice that some playlist names appear twice with different ids. That's why the query groups by `PlaylistId` and not just the name.
