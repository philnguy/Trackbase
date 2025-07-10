
var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');
var connection = mysql.createConnection({
                host: '35.238.91.122',
                user: 'root',
                password: 'water7',
                database: 'SpotifyNotMil'
});

connection.connect;


var app = express();

let globalUser = "Guest";

// set up ejs view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '../public'));

/* GET home page, respond by rendering index.ejs */
app.get('/', function(req, res) {
    res.render('index', { title: 'Artist Song Search',  username: globalUser });
});

app.get('/favorites', function(req, res) {

// Render a simple favorites page
    res.render('favorites', { title: 'Favorites',  username: globalUser });
});

app.get('/success', function(req, res) {
      res.send({'message': 'Attendance marked successfully!'});
});
 

// this code is executed when a user clicks the form submit button



app.get('/search', (req, res) => {
    let artistName = req.query.artistName;
    let searchPattern = `%${artistName}%`;
    let sql = 'SELECT Song.songName, Artist.name as artistName, Song.albumName, Song.popularity, Song.spotifyTrackID FROM Song INNER JOIN Artist ON Song.artistID = Artist.artistID WHERE Artist.name LIKE ?';
    connection.query(sql, [searchPattern], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.get('/quiz', (req, res) => {
    res.render('quiz', { title: 'Quiz Page',  username: globalUser });
});

app.get('/account', (req, res) => {
    res.render('account', { title: 'Account Page',  username: globalUser });
});


app.get('/submit-quiz', (req, res) => {
    let selectedTempos = [
        req.query.option1,
        req.query.option2,
        req.query.option3,
        req.query.option4,
	 req.query.option5
    ].filter(Boolean);


    if (selectedTempos.length === 0) {
        return res.json([]); // return an empty array if no options are selected
    }
    const userID = globalUser;
    console.log(selectedTempos[0], selectedTempos[1],selectedTempos[2],selectedTempos[3],selectedTempos[4], userID); 
   let params = [
        selectedTempos[0], selectedTempos[1],selectedTempos[2],selectedTempos[3], selectedTempos[4], userID ];
    let sql = 'CALL quizProcedure(?,?,?,?,?,?)'

    connection.query(sql, params, (err, results) => {
	console.log(results);
        if (err) throw err;
        res.json(results[0]);
    });
});

// Endpoint to handle username submission
app.post('/submit', (req, res) => {
    let uname = req.body.data;
    let userSQL = '(SELECT DISTINCT userID FROM Account WHERE userId = ?)'
    connection.query(userSQL, uname, (err,results) => {
        if (err) throw err;
        if(results.length === 0) {
            res.json({ valid: false, message: 'UserID is invalid'});
        }
        else {
            globalUser = uname;
            console.log('Global Data:', globalUser);
	    res.json({ valid: true, message: 'Data received', globalUser });	      
        }
    });
});


app.post('/add-to-favorites', (req, res) => {
    const { spotifyTrackID  } = req.body;
    const userID = globalUser; // or however you retrieve the current user's ID

    // Ensure the user is logged in
    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
    }
    if (!spotifyTrackID) {
        return res.status(400).json({ success: false, message: 'spotifyTrackID is required.' });
    }

    // SQL query to insert into favorites
    const query = 'INSERT INTO Favorites (userID, spotifyTrackID) VALUES (?, ?)';
    connection.query(query, [userID, spotifyTrackID], (err) => {
        if (err) {
            console.error('Error adding to favorites:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.json({ success: true });
    });
});


// Route to handle removing from favorites
app.post('/remove-from-favorites', (req, res) => {
    const { spotifyTrackID } = req.body;
    const userID = globalUser; // Replace with your method to get the current userID

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
    }

    if (!spotifyTrackID) {
        return res.status(400).json({ success: false, message: 'spotifyTrackID is required.' });
    }
    console.log('Removing favorite for user:', userID, 'spotifyTrackID:', spotifyTrackID); // Log details

    const query = 'DELETE FROM Favorites WHERE userID = ? AND spotifyTrackID = ?';
    connection.query(query, [userID, spotifyTrackID], (err) => {
        if (err) {
            console.error('Error removing from favorites:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.json({ success: true });
    });
});




app.post('/add-Album', (req, res) => {
    const { spotifyTrackID } = req.body;
    const userID = globalUser; // or however you retrieve the current user's ID

    // Ensure the user is logged in
    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
    }
    if (!spotifyTrackID) {
        return res.status(400).json({ success: false, message: 'spotifyTrackID is required.' });
    }
	console.log(`UserID: ${userID}, SpotifyTrackID: ${spotifyTrackID}`); // Log the input values

    // Start transaction
    connection.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        // SQL query to find all songs with the same album that aren't already in user's favorites
        const selectQuery = `
            SELECT DISTINCT t1.spotifyTrackID
            FROM Song t1
            JOIN Song t2 ON t1.albumName = t2.albumName
            WHERE t2.spotifyTrackID = ? AND t1.spotifyTrackID NOT IN (SELECT f.spotifyTrackID FROM Favorites f WHERE f.userID = ?)
        `;

        connection.query(selectQuery, [spotifyTrackID, globalUser], (err, results) => {
            if (err) {
                console.error('Error selecting tracks:', err);
                return connection.rollback(() => {
                    res.status(500).json({ success: false, message: 'Database error.' });
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'No tracks found for the given album.' });
            }

            // SQL query to insert each track into favorites
            const insertQuery = 'INSERT INTO Favorites (userID, spotifyTrackID) VALUES ?';
            const values = results.map(track => [userID, track.spotifyTrackID]);

            connection.query(insertQuery, [values], (err) => {
                if (err) {
                    console.error('Error inserting into favorites:', err);
                    return connection.rollback(() => {
                        res.status(500).json({ success: false, message: 'Database error.' });
                    });
                }

                // Commit transaction
                connection.commit(err => {
                    if (err) {
                        console.error('Error committing transaction:', err);
                        return connection.rollback(() => {
                            res.status(500).json({ success: false, message: 'Database error.' });
                        });
                    }
                    res.json({ success: true, message: 'All songs from the album added to favorites!' });
                });
            });
        });
    });
});



// Endpoint to handle favorites page
app.get('/getFavorites', (req, res) => {
    let userID = globalUser;
    if (!userID) {
        return res.status(400).json({ message: 'User is not logged in' });
    }
let sql = `SELECT Song.songName, Artist.name as artistName, Song.albumName, Song.popularity, Song.spotifyTrackID FROM Favorites INNER JOIN Song ON Favorites.spotifyTrackID = Song.spotifyTrackID INNER JOIN Artist ON Song.artistID = Artist.artistID WHERE Favorites.userID = ?`
    connection.query(sql, [userID], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Endpoint to handle favorites count
app.get('/getFavoriteCount', (req, res) => {
    let userID = globalUser;
    if (!userID) {
        return res.status(400).json({ message: 'User is not logged in' });
    }
let sql = `SELECT favoritesCount FROM Account WHERE UserID = ? LIMIT 1;`
    connection.query(sql, [userID], (err, result) => {
        if (err) throw err;
        res.json(result[0]);
    });
});



app.listen(80, function () {
    console.log('Node app is running on port 80');
});

