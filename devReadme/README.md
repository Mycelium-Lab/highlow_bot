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
JSON_RPC_PROVIDER_RINKEBY="https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
JSON_RPC_PROVIDER_EMERALD="https://emerald.oasis.dev"
```

<h3>Add Google Sheets credentials file</h3>

File name and path: ```./credentials/credentials.json``` <br>
<a href="https://javascript.plainenglish.io/how-to-use-node-js-with-google-sheets-c256c26e10fc">Get json file with credentials like in this tutorial</a><br>
Paste TABLE ID of created table to ```sheets.js```

<h3>Install and run pm2</h3>

```
npm install pm2 -g
pm2 start app.js
```

<h3>Logs</h3>

```
pm2 log
```

