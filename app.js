const { ethers } = require("ethers")
const cron = require("node-cron")
require("dotenv").config()

const contractJSON = require('./artifacts/contracts/Fair.sol/Fair.json')
const { gameAddress, gameAddressTest } = require("./utils/constants.js")

const seconds = 100

//Provider Testnet
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_RINKEBY)

//Provider Emerald 
// const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_EMERALD)

// Signer
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//Bot address 0xAb1F38D350729e74B22E14e3254BaC70A10cb9e1
const bot = new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, provider)
//BotCreator address 0xAb1F38D350729e74B22E14e3254BaC70A10cb9e1
const botCreator = new ethers.Wallet(process.env.THIRD_PRIVATE_KEY, provider)

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
    const randomNumber = Math.floor(Math.random() * 100) + 1
    const bidAmount = ethers.utils.formatEther(bid.toString())
    const thisGameNumbers = await contract.getNumbers(gameID)
    if (thisGameNumbers.length < 2) {
        console.log('Bot Joiner joined to the game')
        contract
            .connect(bot)
            .joinGame(gameID, randomNumber, {value: bid.toString()})
            .then(() => {
                console.log(`Bot Joiner created bid at game ${gameID}: BID amount ETH ${bidAmount}, number: ${randomNumber}`)
            })
    } else {
        console.log(`At game ${gameID} more then 1 bid`)
    }
}

//create game
const createGame = async () => {
    const randomNumber = Math.floor(Math.random() * 100) + 1
    const bidAmount = ethers.utils.parseEther('0.000001')
    console.log('Bot Creator creating new game')
    contract
        .connect(botCreator)
        .createGame( randomNumber, 10, {value: bidAmount.toString()})
        .then(() => {
            console.log(`Bot Creator created new game - BID amount: ETH ${bidAmount}, number: ${randomNumber}`)
        })
}

//every hour create new game
cron.schedule('* * * *', async () => {
    await createGame()
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
