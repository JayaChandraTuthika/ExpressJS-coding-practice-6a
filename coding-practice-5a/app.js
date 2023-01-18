const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1: TO GET MOVIES LIST
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `SELECT * FROM movie`;
  const dbResponse = await db.all(getMoviesQuery);
  const movieNames = dbResponse.map((movie) => {
    let { movie_name } = movie;
    return {
      movieName: movie_name,
    };
  });
  response.send(dbResponse);
});

//API 2: TO CREATE MOVIE
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  //   console.log(movieDetails);
  const addMovieQuery = `
      INSERT INTO
          movie (director_id,movie_name, lead_actor)
       VALUES (
          ${directorId},
          '${movieName}',
          '${leadActor}'
          );`;

  const dbResponse = await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//API 3: TO GET SPECIFIC MOVIE
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * FROM movie WHERE movie_id = ${movieId}`;

  const dbResponse = await db.get(getMovieQuery);
  const { movie_id, director_id, movie_name, lead_actor } = dbResponse;
  const movieDetails = {
    movieId: movie_id,
    directorId: director_id,
    movieName: movie_name,
    leadActor: lead_actor,
  };
  response.send(movieDetails);
});

//API 4: TO UPDATE MOVIE DETAILS
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE movie 
      SET 
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = "${leadActor}"
      WHERE
        movie_id = ${movieId};`;
  const dbResponse = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API 5: TO DELETE THE MOVIE
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
            DELETE FROM movie WHERE movie_id = ${movieId};`;
  const dbResponse = await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API 6: TO GET THE LIST OF ALL THE DIRECTORS
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
            SELECT * FROM director ORDER BY director_id;`;
  const dbResponse = await db.all(getDirectorsQuery);
  const directorsArray = dbResponse.map((director) => {
    return {
      directorId: director.director_id,
      directorName: director.director_name,
    };
  });
  response.send(directorsArray);
});

//API 7: TO SHOW THE MOVIES DIRECTED BY SPECIFIC DIRECTOR
app.get("/directors/:directorId/movies", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesByDirectorQuery = `
            SELECT * FROM director JOIN movie on director.director_id = movie.director_id
            WHERE director.director_id = ${directorId};`;
  const dbResponse = await db.all(getMoviesByDirectorQuery);
  const moviesDirected = dbResponse.map((movie) => {
    return {
      movieName: movie.movie_name,
    };
  });
  response.send(moviesDirected);
});
