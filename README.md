#Steam Multiplayer Games in Common

##Note
If one of the people you're comparing does not have a public profile, this program will either error or be inaccurate.

##Usage
1. Download the project
2. Run npm install
3. Create a file in the project's path named .env with the following data
```shell
API_KEY="your_steam_api_key_here"
IDS="comma_separated,list_of,vanity_urls"
```
4. Run npm start
5. Your results are in output.txt and unfiltered.txt.  If you get rate limited, unfiltered.txt will still be generated :)
