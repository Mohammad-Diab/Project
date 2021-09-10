const config = require('../config.json');
const mysql = require('mysql');
const utit = require('util');

const sortBy_enum = require('../enum/sortBy')
module.exports = data = {
    getCountriesList: async function(pageNumber, filter, sortBy) {
        let filterQuery = filter ? ` where c.Region = '${filter}' ` : '';
        let sortByQuery = getSortByQuery(sortBy);
        let limit = `LIMIT ${config.rowPerPage * (pageNumber - 1)}, ${config.rowPerPage}`;
        let query = `select c.Id, c.Country, c.Region,
        SUM(CASE WHEN v.Type = 1 THEN v.Count ELSE 0 END) AS Confirmed,
        SUM(CASE WHEN v.Type = 2 THEN v.Count ELSE 0 END) AS Recovered,
        SUM(CASE WHEN v.Type = 3 THEN v.Count ELSE 0 END) AS Death
        FROM countries c
        inner join covidcases v on v.CountryId = c.Id
        ${filterQuery}
        GROUP by v.CountryId
        ${sortByQuery}
        ${limit}`;
        let result = await excuteQuery(query);
        return result;
    },

    getCountriesListCount: async function(filter) {
        let filterQuery = filter ? ` where c.Region = '${filter}' ` : '';
        let query = `select count(c.Id) AS Count FROM countries c
        ${filterQuery}`;
        let result = await excuteQuery(query);
        return result[0].Count;
    },

    getCountryDetails: async function(countryId, pageNumber) {
        let limit = `LIMIT ${config.rowPerPage * (pageNumber - 1)}, ${config.rowPerPage}`;
        let query = `select date, 
		max(CASE WHEN Type = 1 THEN Count ELSE 0 END) AS Confirmed,
        max(CASE WHEN Type = 2 THEN Count ELSE 0 END) AS Recovered,
        max(CASE WHEN Type = 3 THEN Count ELSE 0 END) AS Death
        from covidcases 
        where CountryId = '${countryId}'
        GROUP by date
        order by date DESC
        ${limit}`;
        let result = await excuteQuery(query);
        return result;
    },

    getCountryCasesCount: async function(countryId) {
        let query = `select country, region,
        sum(CASE WHEN Type = 1 THEN Count ELSE 0 END) AS Confirmed,
        sum(CASE WHEN Type = 2 THEN Count ELSE 0 END) AS Recovered,
        sum(CASE WHEN Type = 3 THEN Count ELSE 0 END) AS Death
        from covidcases
        inner join countries c on CountryId = c.id
        where CountryId = '${countryId}'
        GROUP by CountryId;`;
        let result = await excuteQuery(query);
        return result;
    },

    getAllRegions: async function() {
        let query = 'SELECT DISTINCT Region from countries ORDER by Region';
        let result = await excuteQuery(query);
        return result;
    },

}

async function excuteQuery(query) {
    let con = mysql.createConnection({
        host: config.database.server,
        user: config.database.username,
        password: config.database.password,
        database: config.database.databaseName
    });
    let result;

    const conConnect = utit.promisify(con.connect.bind(con));
    const conExecute = utit.promisify(con.query.bind(con));
    const conEnd = utit.promisify(con.end.bind(con));

    try {
        await conConnect();
        result = await conExecute(query)
    } finally {
        await conEnd();
    }

    return result;
}


function getSortByQuery(sortBy) {
    let sortQuery = ' order by ';
    switch (sortBy) {
        case sortBy_enum.region:
            sortQuery += 'c.Region';
            break;
        case sortBy_enum.confirmedCases:
            sortQuery += 'confirmed';
            break;
        case sortBy_enum.deathCases:
            sortQuery += 'death';
            break;
        case sortBy_enum.recoveredCases:
            sortQuery += 'recovered';
            break;
        default:
            sortQuery += 'c.Country'
            break;
    }

    if (sortBy > 10) {
        sortQuery = ' Desc'
    }

    sortQuery += ' '

    return sortQuery;
}