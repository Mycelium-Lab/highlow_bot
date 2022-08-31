const { ethers } = require("ethers")
const cron = require("node-cron")
require("dotenv").config()

const contractJSON = require('./artifacts/contracts/Fair.sol/Fair.json')
const { updateAddSended, updateAddWinned } = require("./sheets")
const { gameAddress, gameAddressTest } = require("./utils/constants.js")

const seconds = 10
const rangeBID = ['0.000001', '0.000002', '0.000003', '0.000004', '0.000005']
const cronConf = '*/10 * * * *'

//Provider Testnet
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_RINKEBY)

//Provider Emerald 
// const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_EMERALD)

// Signer
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//bots range is place in googlee sheets
const bots = [
    {
        range: "A2:D2",
        wallet: new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, provider)
    },
    {
        range: "A3:D3",
        wallet: new ethers.Wallet(process.env.THIRD_PRIVATE_KEY, provider)
    } 
]

//Bot address 0xAb1F38D350729e74B22E14e3254BaC70A10cb9e1
const bot = {
    range: "A2:C2",
    wallet: new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, provider)
} 
//BotCreator address 0xAb1F38D350729e74B22E14e3254BaC70A10cb9e1
const botCreator = {
    range: "A3:C3",
    wallet: new ethers.Wallet(process.env.THIRD_PRIVATE_KEY, provider)
} 

// Contract Testnet
const contract = new ethers.Contract(gameAddressTest, contractJSON.abi, signer);

// Contract Emerald
// const contract = new ethers.Contract(gameAddress, contractJSON.abi, signer);

// const testGame = async () => {
    // console.log(await contract.getBet(10, bot.address))
// }

// testGame()

// const parsedData = ethers.utils.defaultAbiCoder.decode(["uint"], data)

//join game
const joinGame = async (gameID, bid) => {
    //number to contract
    const randomNumber = Math.floor(Math.random() * 100) + 1
    //bid in eth
    const bidAmount = ethers.utils.formatEther(bid.toString())
    //get amount of bids
    const thisGameNumbers = await contract.getNumbers(gameID)
    //get random bot
    let randomBot = Math.floor(Math.random() * 2)
    //get owner of the game
    const ownerOfGame = await contract.getOwner(gameID)
    //if owner == randomBot - change randomBot
    while (bots[randomBot].wallet.address === ownerOfGame) {
        randomBot = Math.floor(Math.random() * 2);
    }
    if (thisGameNumbers.length < 2) {
        console.log('Bot Joiner joined to the game')
        contract
            .connect(bots[randomBot].wallet)
            .joinGame(gameID, randomNumber, {value: bid.toString()})
            .then(async () => {
                console.log(`Bot Joiner created bid at game ${gameID}: BID amount ETH ${bidAmount}, number: ${randomNumber}`)
                await updateAddSended(bots[randomBot].range, bidAmount.toString())
            })
    } else {
        console.log(`At game ${gameID} more then 1 bid`)
    }
}

//create game
const createGame = async () => {
    // random number to game
    const randomNumber = Math.floor(Math.random() * 100) + 1
    // get rangom bid
    const randomBID = Math.floor(Math.random() * 3)
    const bidAmount = ethers.utils.parseEther(rangeBID[randomBID])
    // get random bot
    const randomBot = Math.floor(Math.random() * 2)
    console.log('Bot Creator creating new game')
    contract
        .connect(bots[randomBot].wallet)
        .createGame( randomNumber, 10, {value: bidAmount.toString()})
        .then(async () => {
            console.log(`Bot Creator created new game - BID amount: ETH ${bidAmount}, number: ${randomNumber}`)
            //paste to google sheets
            await updateAddSended(bots[randomBot].range, rangeBID[randomBID])
        })
}

const games = async () => {
    contract
        .getUserGames(bot.wallet.address)
        .then((res) => {
            let arr = []
            let counter = 0;
            for (;counter < res.length;) {
                let obj = {}
                obj['bid'] = res[counter].toString()                    //0 - bid
                obj['createdTimestamp'] = res[counter + 1].toString()   //1 - createdTimestamp
                obj['participants'] = res[counter + 2].toString()       //2 - participants.length
                obj['claimed'] = res[counter + 3].toString()            //3 - prize is claimed
                obj['currentGameId'] =res[counter + 4].toString()       //4 - currentGameId
                obj['pool'] = res[counter + 5].toString()               //5 - pool
                obj['luckyNumber'] = res[counter + 6].toString()        //6 - luckyNumber
                obj['prize'] = res[counter + 7].toString()              //7 - prize
                arr.push(obj)
                counter+=8
            }
        })
}


//every 10 min create new game
cron.schedule(cronConf, async () => {
    await createGame()
    // console.log("10 min")
})


console.log("Start listen address: ", gameAddressTest)
//Listen CreateGame event
//get id of the game and wait 100 seconds
//check if after 100 seconds bids not exists
//create bid with bot
contract.on('CreateGame', async (gameId, bid) => {
    //check if after 100 seconds exists bid
    //if bid not exists create with bot
    setTimeout(async () => {
        await joinGame(gameId, bid)
    }, 1000 * seconds)
})
