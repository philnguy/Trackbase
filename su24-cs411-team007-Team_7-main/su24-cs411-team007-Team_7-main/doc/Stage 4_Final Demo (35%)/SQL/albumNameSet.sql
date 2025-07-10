DROP PROCEDURE IF EXISTS addAlbumName;
DROP TRIGGER IF EXISTS trigAlbumName;

DELIMITER $$

CREATE PROCEDURE addAlbumName ()
BEGIN
    UPDATE Song s 
    SET s.albumName = CONCAT('Various ', (SELECT DISTINCT name FROM Artist a WHERE a.artistID = s.artistID LIMIT 1)) 
    WHERE s.albumName IS null;
END $$

CREATE TRIGGER trigAlbumName 
    BEFORE INSERT ON Song
        FOR EACH ROW
    BEGIN
        SET @checknull = (SELECT DISTINCT albumName FROM Song WHERE spotifyTrackID = new.spotifyTrackID);
        IF @checknull IS null THEN  
            SET new.albumName = CONCAT('Various ', (SELECT DISTINCT name FROM Artist a WHERE a.artistID = new.artistID)); 
        END IF;
    END $$

DELIMITER;