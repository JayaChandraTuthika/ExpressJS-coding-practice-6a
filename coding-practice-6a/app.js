const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1: GET ALL STATES IN STATE TABLE
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
            SELECT * FROM state ORDER BY state_id;`;
  const dbResponse = await db.all(getAllStatesQuery);
  const statesList = dbResponse.map((state) => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    };
  });
  response.send(statesList);
});

module.exports = app;

//API 2: TO GET STATE WITH ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
            SELECT * FROM state WHERE state_id = ${stateId};`;

  const dbResponse = await db.get(getStateQuery);
  const state = {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };
  response.send(state);
});

//API 3: CREATE DISTRICT IN DISTRICT TABLE
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistQuery = `
            INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
            VALUES 
                (
                    '${districtName}',
                    ${stateId},
                    ${cases},
                    ${cured},
                    ${active},
                    ${deaths}

                );`;
  const dbResponse = await db.run(createDistQuery);
  response.send("District Successfully Added");
  console.log(dbResponse.lastID);
});

//API 4: GET DISTRICT BY DISTRICT ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistQuery = `
            SELECT 
                *
                FROM
                    district
                WHERE
                    district_id = ${districtId};`;
  const res = await db.get(getDistQuery);
  const dist = {
    districtId: res.district_id,
    districtName: res.district_name,
    stateId: res.state_id,
    cases: res.cases,
    cured: res.cured,
    active: res.active,
    deaths: res.deaths,
  };
  response.send(dist);
});

//APT 5: DELETE DISTRICT BY ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistQuery = `
            DELETE FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await db.run(deleteDistQuery);
  response.send("District Removed");
});

//API 6: UPDATE DISTRICT
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistQuery = `
              UPDATE district
              SET
                  district_name = '${districtName}',
                  state_id = ${stateId},
                  cases = ${cases},
                  cured = ${cured},
                  active = ${active},
                  deaths = ${deaths}
              WHERE
                  district_id = ${districtId};`;
  const dbResponse = await db.run(updateDistQuery);
  response.send("District Details Updated");
});

//API 7: GET STATS FOR STATES
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsOfStateQuery = `
                SELECT 
                    SUM(cases) as totalCases,
                    SUM(cured) as totalCured,
                    SUM(active) as totalActive,
                    SUM(deaths) as totalDeaths 
                FROM district join state on district.state_id = state.state_id 
                GROUP BY district.state_id 
                HAVING district.state_id = ${stateId};`;
  const dbResponse = await db.get(getStatsOfStateQuery);
  response.send(dbResponse);
});

//API 8: TO GET STATE BY DISTRICT ID
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateByDistId = `
            SELECT state.state_name as stateName FROM
                district join state on district.state_id = state.state_id
                WHERE district_id = ${districtId} 
                LIMIT 1;`;
  const dbResponse = await db.get(getStateByDistId);
  response.send(dbResponse);
});
