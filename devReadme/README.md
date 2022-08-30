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

<h3>Install and run pm2</h3>

```
npm install pm2 -g
pm2 start app.js
```

<h3>Logs</h3>

```
pm2 log
```

