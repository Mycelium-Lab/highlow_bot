<h3>Description</h3>

In this script, we create bots that can create, finish games, join games and receive their prizes. By default, we have 5 bots. Every { time in the app.js } we select random bot that create a new game. After creating a game, each bot joins this game. Also every { time in the app.js } by order, each bot finishes or claims his games, if exists.

In ```./utils/constants.js``` file we have contract address, range bid, and app state.

<h3>Install packages</h3>

```
npm install

```

<h3>Add .env file</h3>

```
touch .env
```
```
PRIVATE_KEY=""
SECOND_PRIVATE_KEY=""
THIRD_PRIVATE_KEY=""
FORTH_PRIVATE_KEY=""
FIFTH_PRIVATE_KEY=""
SIXTH_PRIVATE_KEY=""
JSON_RPC_PROVIDER_RINKEBY="https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
JSON_RPC_PROVIDER_EMERALD="https://emerald.oasis.dev"
JSON_RPC_PROVIDER_EMERALD_TESTNET="https://testnet.emerald.oasis.dev"
APP_STATE="test_rinkeby"
# APP_STATE="test_emerald"
# APP_STATE="main_emerald"
```
Need to add private keys and change APP_STATE on what you want.

<h3>Add Google Sheets credentials file</h3>

File name and path: ```./credentials/credentials.json``` <br>
<a href="https://javascript.plainenglish.io/how-to-use-node-js-with-google-sheets-c256c26e10fc">Get json file with credentials like in this tutorial</a><br>
Paste TABLE ID of created table to ```sheets.js```

<h3>Install and run pm2</h3>

```
npm install pm2 -g
pm2 start app.js --exp-backoff-restart-delay=100
```

<h3>Logs</h3>

```
pm2 log
```

