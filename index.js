import * as fs         from "fs";
import {createRequire} from "module";

const require = createRequire(import.meta.url);

const dotenv = require("dotenv");
const SteamAPI = require('steamapi');
import fetch           from "node-fetch";

dotenv.config();

const apiKey = process.env.API_KEY;
const idString = process.env.IDS;
const steam = new SteamAPI(apiKey);
const file = "output.txt";
const file2 = "unfiltered.txt";
const names = idString.split(",");
const delay = 100;

if(fs.existsSync(file))
{
	fs.rmSync(file);
	fs.appendFileSync(file, "Games in common for: " + idString + "\n");
	fs.appendFileSync(file, "<Indicates unknown if multiplayer or not>\n\n");
}

if( fs.existsSync( file2 ) )
{
	fs.rmSync(file2);
	fs.appendFileSync(file2, "Games in common for: " + idString + "\n" );
	fs.appendFileSync( file2, "Note: This is an unfiltered list.\n\n" );
}

let commonGames = [];
let first = true;

for(const i in names)
{
	const url = names[i];
	let id;

	if( url.match( /^\d+$/ ) )
	{
		id = url;
	}
	else
	{
		id = await getIdForUser(url);
	}

	const games = await getGamesForUser(id, url);

	if(first)
	{
		commonGames = games;
		first = false;
	}
	else
	{
		commonGames = keepElementsPresentInBoth(games, commonGames);
	}
}

commonGames = commonGames.sort((g1, g2) =>
                               {
	                               if(g1.name > g2.name)
	                               {
		                               return 1;
	                               }
	                               else
	                               {
		                               return -1;
	                               }
                               });

for( const i in commonGames )
{
	const game = commonGames[i];
	fs.appendFileSync( file2, game.name + "\n" );
}

for(const i in commonGames)
{
	const game = commonGames[i];
	const details = await getGameDetails(game.appID);

	if(!details)
	{
		fs.appendFileSync(file, "<" + game.name + ">\n");
		continue;
	}

	const categories = details.categories;

	for(const j in categories)
	{
		const category = categories[j];

		if(category.id === 1)
		{
			fs.appendFileSync(file, game.name + "\n");
		}
	}
}

function keepElementsPresentInBoth(arr1, arr2)
{
	const keep = [];

	for(const i in arr1)
	{
		for(const j in arr2)
		{
			if(arr1[i].name === arr2[j].name)
			{
				keep.push(arr1[i]);
			}
		}
	}

	return keep;
}

async function getIdForUser(vanityUrl)
{
	await sleep();
	console.log("getIdForUser " + vanityUrl);
	const url = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + apiKey + "&vanityurl=" +
	            vanityUrl;
	const result = await fetch(url);
	const json = await result.json();
	const id = json.response.steamid;

	console.log("\tReturn " + id);
	return id;
}

async function getGamesForUser(userId, name)
{
	await sleep();
	console.log("getGamesForUser " + userId + ", " + name);
	let games;

	try
	{
		games = await steam.getUserOwnedGames(userId);
	}
	catch( err )
	{
		console.log( "Error: " + err );
		process.exit(1);
	}

	if(!games)
	{
		console.log("Cannot retrieve games for " + name);
		return null;
	}

	console.log("\tReturn " + games.length);

	return games;
}

async function getGameDetails(appId)
{
	await sleep();
	console.log("getGameDetails " + appId);
	const url = "https://store.steampowered.com/api/appdetails?appids=" + appId;
	const result = await fetch(url);

	if(!result)
	{
		console.log("\tresult null");
		console.log("\t" + url);
		return null;
	}

	let json;

	try
	{
		//My Code Here
		json = await result.json();
	}
	catch(err)
	{
		console.log("\tError: " + err.message);
		return null;
	}

	if(JSON.stringify(result) === "{\"size\":0}")
	{
		console.log("\tRate limit; sleeping for a minute");
		await sleep(60 * 1000);
		return await getGameDetails(appId);
	}

	if(!json)
	{
		console.log("\tjson null");
		console.log("\t" + JSON.stringify(result));
		return null;
	}

	const gameObj = json[appId];

	if(!gameObj)
	{
		console.log("\tgameObj null");
		console.log("\t" + JSON.stringify(json));
		return null;
	}

	if(gameObj.success === false)
	{
		console.log("\tNot found");
		return null;
	}

	const gameData = gameObj.data;

	if(!gameData)
	{
		console.log("\tgameData null");
		console.log("\t" + JSON.stringify(gameObj));
		return null;
	}

	console.log("\tFound");
	return gameData;
}

function sleep(amt=delay)
{
	return new Promise(resolve => setTimeout(resolve, amt));
}
