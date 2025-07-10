DROP TRIGGER IF EXISTS favoriteGenre;
DROP TRIGGER IF EXISTS favoriteGenreUpdate;
DROP TRIGGER IF EXISTS favoriteGenreInsert;
DROP TRIGGER IF EXISTS favoriteGenreDelete;

DELIMITER //

CREATE TRIGGER favoriteGenreUpdate
    AFTER UPDATE ON Favorites
        FOR EACH ROW
    BEGIN 
    
        SET @favGenre = (SELECT DISTINCT s.genre
        FROM Song s JOIN Favorites f ON(s.spotifyTrackID = f.spotifyTrackID) 
        WHERE (SELECT COUNT(favoriteID) 
               FROM Song s1 JOIN Favorites f1 ON(s1.spotifyTrackID = f1.spotifyTrackID) 
               WHERE f1.userID = NEW.userID AND s1.genre = s.genre
               GROUP BY s1.genre) 
              = 
              (SELECT MAX(genreCount) 
               FROM (SELECT COUNT(f2.favoriteID) AS genreCount 
               FROM Song s2 JOIN Favorites f2 ON(s2.spotifyTrackID = f2.spotifyTrackID) 
               WHERE f2.userID = NEW.userID GROUP BY s2.genre) AS temp)
        LIMIT 1);
        
        UPDATE Account SET favoriteGenre = @favGenre WHERE Account.userID = NEW.userID;
    END //

CREATE TRIGGER favoriteGenreInsert
    AFTER INSERT ON Favorites
        FOR EACH ROW
    BEGIN 
    
        SET @favGenre = (SELECT DISTINCT s.genre
        FROM Song s JOIN Favorites f ON(s.spotifyTrackID = f.spotifyTrackID) 
        WHERE (SELECT COUNT(favoriteID) 
               FROM Song s1 JOIN Favorites f1 ON(s1.spotifyTrackID = f1.spotifyTrackID) 
               WHERE f1.userID = NEW.userID AND s1.genre = s.genre
               GROUP BY s1.genre) 
              = 
              (SELECT MAX(genreCount) 
               FROM (SELECT COUNT(f2.favoriteID) AS genreCount 
               FROM Song s2 JOIN Favorites f2 ON(s2.spotifyTrackID = f2.spotifyTrackID) 
               WHERE f2.userID = NEW.userID GROUP BY s2.genre) AS temp)
        LIMIT 1);
        
        UPDATE Account SET favoriteGenre = @favGenre WHERE Account.userID = NEW.userID;
    END //

CREATE TRIGGER favoriteGenreDelete
    AFTER DELETE ON Favorites
        FOR EACH ROW
    BEGIN 
    
        SET @favGenre = (SELECT DISTINCT s.genre
        FROM Song s JOIN Favorites f ON(s.spotifyTrackID = f.spotifyTrackID) 
        WHERE (SELECT COUNT(favoriteID) 
               FROM Song s1 JOIN Favorites f1 ON(s1.spotifyTrackID = f1.spotifyTrackID) 
               WHERE f1.userID = OLD.userID AND s1.genre = s.genre
               GROUP BY s1.genre) 
              = 
              (SELECT MAX(genreCount) 
               FROM (SELECT COUNT(f2.favoriteID) AS genreCount 
               FROM Song s2 JOIN Favorites f2 ON(s2.spotifyTrackID = f2.spotifyTrackID) 
               WHERE f2.userID = OLD.userID GROUP BY s2.genre) AS temp)
        LIMIT 1);
        
        UPDATE Account SET favoriteGenre = @favGenre WHERE Account.userID = OLD.userID;
    END //

DELIMITER;