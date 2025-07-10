DROP TRIGGER IF EXISTS favIDUpdate;

DELIMITER //

CREATE TRIGGER favIDUpdate
	BEFORE INSERT ON Favorites
	FOR EACH ROW
	BEGIN
		SET NEW.favoriteID = (SELECT CONCAT((SELECT userID FROM Account a1 WHERE a1.userID = NEW.userID), (SELECT favoritesCount FROM Account a2 WHERE a2.userID = NEW.userID)));

	END // 

DELIMITER;