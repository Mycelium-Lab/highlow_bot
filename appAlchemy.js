const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const { ethers } = require("ethers")
const contractJSON = require('./artifacts/contracts/Fair.sol/Fair.json')
require("dotenv").config()

const {
  createTopic,
  gameAddress
} = require("./utils/constants.js")

const seconds = 10
// Create the log options object.
const createGameEvent = {
    address: gameAddress,
    topics: [createTopic]
}

const web3 = createAlchemyWeb3(
    process.env.ALCHEMY_RINKEBY
);

const alchemyProvider = new ethers.providers.AlchemyProvider(network="rinkeby", process.env.ALCHEMY_RINKEBY_KEY)
// Signer
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider);
const bot = new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, alchemyProvider)
// Contract
const contract = new ethers.Contract(gameAddress, contractJSON.abi, signer);

//join game
const joinGame = async (gameID) => {
    console.log('join game')
    const randomNumber = Math.floor(Math.random() * 10) + 1
    const bidAmount = ethers.utils.parseEther('0.00001')
    console.log(randomNumber)
    console.log(bidAmount)
    await contract.connect(bot).joinGame(gameID, randomNumber, {value: bidAmount.toString()})
    console.log('bot sended eth')
    console.log(
        await contract.getBet(bot.address)
    )
}


// const testGame = async () => {
//     const randomNumber = Math.floor(Math.random() * 10) + 1
//     const bidAmount = ethers.utils.parseEther('0.00001')
//     await contract.connect(bot).joinGame(4, randomNumber, {value: bidAmount.toString()})
// }

// testGame()

//get createGame event data
const createGame = async (txn) => {
  const data = txn.data
  const parsedData = ethers.utils.defaultAbiCoder.decode(["uint"], data)
  //check if after 100 seconds exists bid
  //if bid not exists create with bot
  setTimeout(async () => {
    await joinGame()
  }, 1000 * seconds)
//   console.log('Data: ',parsedData)
}

console.log("Start listen address: ", gameAddress)
// Open the websocket and listen for events
web3.eth.subscribe("logs", createGameEvent).on("data", createGame);