DROP PROCEDURE IF EXISTS multiArtistSwitch;
DROP TRIGGER IF EXISTS multiArtistTrig;

DELIMITER $$

CREATE PROCEDURE multiArtistSwitch ()
BEGIN
    UPDATE Artist a
    SET a.name = REPLACE(a.name, ';', '&')
    WHERE a.name LIKE "%;%";
END $$

CREATE TRIGGER multiArtistTrig 
    BEFORE INSERT ON Artist
        FOR EACH ROW
    BEGIN
        SET new.name = REPLACE(new.name, ';', '&');
    END $$

DELIMITER;