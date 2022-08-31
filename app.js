const { ethers } = require("ethers")
const cron = require("node-cron")
require("dotenv").config()

const contractJSON = require('./artifacts/contracts/Fair.sol/Fair.json')
const { updateAddSended, updateAddWinned } = require("./sheets")
const { gameAddress, gameAddressTest } = require("./utils/constants.js")

const seconds = 10
const rangeBID = ['0.000001', '0.000002', '0.000003', '0.000004', '0.000005']
const cronConf = '*/10 * * * *'
const cronConfFinish = '*/20 * * * * *'

//Provider Testnet
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_RINKEBY)

//Provider Emerald 
// const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_EMERALD)

// Signer
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//bots range is place in googlee sheets
const bots = [
    //0xAb1F38D350729e74B22E14e3254BaC70A10cb9e1
    {
        range: "A2:D2",
        wallet: new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, provider),
        finished: false
    },
    //0x4b3BdC039FC3A0167a63435591E8267fFf21DDd4
    {
        range: "A3:D3",
        wallet: new ethers.Wallet(process.env.THIRD_PRIVATE_KEY, provider),
        finished: false
    },
    //0x3d4AFd791676Dc22fA860a0A8B331Cf66f7e4DFF
    {
        range: "A4:D4",
        wallet: new ethers.Wallet(process.env.FORTH_PRIVATE_KEY, provider),
        finished: false
    },
    //0xc4d7A5Dd2d9829c23d10dc9C135cb8bC5C115dbD
    {
        range: "A5:D5",
        wallet: new ethers.Wallet(process.env.FIFTH_PRIVATE_KEY, provider),
        finished: false
    },
    //0x7D1703B6b84b7f39dBf0d78427Dfc5d1E80F82b2
    {
        range: "A6:D6",
        wallet: new ethers.Wallet(process.env.SIXTH_PRIVATE_KEY, provider),
        finished: false
    }
]

// Contract Testnet
const contract = new ethers.Contract(gameAddressTest, contractJSON.abi, signer);

// Contract Emerald
// const contract = new ethers.Contract(gameAddress, contractJSON.abi, signer);

//join game
const joinGame = async (gameID, bid) => {
    //number to contract
    const randomNumber = Math.floor(Math.random() * 100) + 1
    //bid in eth
    const bidAmount = ethers.utils.formatEther(bid.toString())
    //get amount of bids
    const thisGameNumbers = await contract.getNumbers(gameID)
    //get random bot
    let randomBot = Math.floor(Math.random() * bots.length)
    //get owner of the game
    const ownerOfGame = await contract.getOwner(gameID)
    //if owner == randomBot - change randomBot
    while (bots[randomBot].wallet.address === ownerOfGame) {
        randomBot = Math.floor(Math.random() * bots.length);
    }
    if (thisGameNumbers.length < 2) {
        console.log('Bot Joiner joined to the game')
        contract
            .connect(bots[randomBot].wallet)
            .joinGame(gameID, randomNumber, {value: bid.toString()})
            .then(async () => {
                console.log(`Bot Joiner ${bots[randomBot].wallet.address} created bid at game ${gameID}: BID amount ETH ${bidAmount}, number: ${randomNumber}`)
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
    const randomBID = Math.floor(Math.random() * rangeBID.length)
    const bidAmount = ethers.utils.parseEther(rangeBID[randomBID])
    // get random bot
    const randomBot = Math.floor(Math.random() * bots.length)
    console.log(`Bot Creator ${bots[randomBot].wallet.address} creating new game`)
    contract
        .connect(bots[randomBot].wallet)
        .createGame( randomNumber, 10, {value: bidAmount.toString()})
        .then(async () => {
            console.log(`Bot Creator created new game - BID amount: ETH ${bidAmount}, number: ${randomNumber}`)
            //paste to google sheets
            await updateAddSended(bots[randomBot].range, rangeBID[randomBID])
        })
}

const botGames = async (index) => {
    return contract
        .getUserGames(bots[index].wallet.address)
        .then((res) => {
            let arr = []
            let counter = 0;
            for (;counter < res.length;) {
                let obj = {}
                obj['bid'] = res[counter].toString()                    //0 - bid
                obj['createdTimestamp'] = res[counter + 1].toString()   //1 - createdTimestamp
                obj['participants'] = res[counter + 2].toString()       //2 - participants.length
                //if 'claimed' = 
                //0 prize is claimed 
                //1 the game is finished already and user allowed to claim prize
                //2 the game is ready for finish
                //3 the game in progress          
                obj['claimed'] = res[counter + 3].toString()            //3 - prize is claimed
                obj['currentGameId'] =res[counter + 4].toString()       //4 - currentGameId
                obj['pool'] = res[counter + 5].toString()               //5 - pool
                obj['luckyNumber'] = res[counter + 6].toString()        //6 - luckyNumber
                obj['prize'] = res[counter + 7].toString()              //7 - prize
                arr.push(obj)
                counter+=8
            }
            return arr
        })
}

const finish = async () => {
    let botID;
    for (let i = 0; i < bots.length; i++) {
        if (bots[i].finished === false) {
            botID = i;
            break;
        }
    }
    if (botID === undefined && bots[bots.length - 1].finished === true) {
        for (let j = 0; j < bots.length; j++) {
             bots[j].finished = false
        }
        botID = 0;
     }
    console.log(botID)
    bots[botID].finished = true;
    botGames(botID)
        .then((arr) => {
            return arr.filter((v) => v.claimed === '1' || v.claimed === '2')
        })
        .then(async (arr) => {
            console.log(arr)
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].claimed === '1') {
                    await contract.connect(bots[botID].wallet).claim(arr[i].currentGameId)
                    const prizeList = await contract.prizeList(bots[botID].wallet.address, arr[i].currentGameId)
                    if (prizeList[2] !== undefined) {
                        const prize = prizeList[2].toString()
                        await updateAddWinned(bots[botID].range, ethers.utils.formatEther(prize)) 
                    }
                    console.log(`Bot ${bots[botID].wallet.address} claimed in game ${arr[i].currentGameId}`)
                } else {
                    await contract.connect(bots[botID].wallet).finishGame(arr[i].currentGameId)
                    console.log(`Bot ${bots[botID].wallet.address} finished game ${arr[i].currentGameId}`)
                }
            }
        })
        .then(() => {
            console.log(`Finish is done`)
        })
}

createGame()
cron.schedule(cronConfFinish, async () => {
    console.log(`Start finish`)
    await finish()
})

//every 10 min create new game
//console.log(`Start schedule creating games`)
// cron.schedule(cronConf, async () => {
    // console.log("10 min")
// })


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
