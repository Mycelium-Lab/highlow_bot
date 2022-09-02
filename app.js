const { ethers } = require("ethers")
const cron = require("node-cron")
require("dotenv").config()

const contractJSON = require('./artifacts/contracts/Fair.sol/Fair.json')
const { updateAddSended, updateAddWinned } = require("./sheets")
const { gameAddress, gameAddressTest } = require("./utils/constants.js")

const seconds = 10
const rangeBID = ['0.001', '0.002', '0.003', '0.004', '0.005']
// const rangeBID = ['20', '0.000002', '0.000003', '0.000004', '200']
const cronConfCreate = '*/2 * * * *' //every minute
const cronConfFinish = '*/30 * * * * *'

//Provider Testnet Rinkeby
// const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_RINKEBY)

//Provider Testnet Emerald
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_EMERALD_TESTNET)

//Provider Emerald 
// const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_EMERALD)

// Signer
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//bots range is place in googlee sheets
const bots = [
    //0xAb1F38D350729e74B22E14e3254BaC70A10cb9e1
    {
        id: 0,
        range: "A2:D2",
        wallet: new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, provider),
        finished: false,
        currentlyBusy: false
    },
    //0x4b3BdC039FC3A0167a63435591E8267fFf21DDd4
    {
        id: 1,
        range: "A3:D3",
        wallet: new ethers.Wallet(process.env.THIRD_PRIVATE_KEY, provider),
        finished: false,
        currentlyBusy: false
    },
    //0x3d4AFd791676Dc22fA860a0A8B331Cf66f7e4DFF
    {
        id: 2,
        range: "A4:D4",
        wallet: new ethers.Wallet(process.env.FORTH_PRIVATE_KEY, provider),
        finished: false,
        currentlyBusy: false
    },
    //0xc4d7A5Dd2d9829c23d10dc9C135cb8bC5C115dbD
    {
        id: 3,
        range: "A5:D5",
        wallet: new ethers.Wallet(process.env.FIFTH_PRIVATE_KEY, provider),
        finished: false,
        currentlyBusy: false
    },
    //0x7D1703B6b84b7f39dBf0d78427Dfc5d1E80F82b2
    {
        id: 4,
        range: "A6:D6",
        wallet: new ethers.Wallet(process.env.SIXTH_PRIVATE_KEY, provider),
        finished: false,
        currentlyBusy: false
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
    // const thisGameNumbers = await contract.getNumbers(gameID)
    //get random bot
    let randomBot = Math.floor(Math.random() * bots.length)
    //get participant of the game
    let participated = await contract.biddersList(gameID, bots[randomBot].wallet.address)
    let participatedFlag = participated[0]
    //if participatedFlag !== false and bot is busy - change randomBot
    for (;;) {
        if (participatedFlag !== false || bots[randomBot].currentlyBusy === true) {
            randomBot = Math.floor(Math.random() * bots.length);
            participated = await contract.biddersList(gameID, bots[randomBot].wallet.address)
            participatedFlag = participated[0]
        } else {
            break
        }
    }
    console.log(`Bot Joiner ${bots[randomBot].wallet.address} joined to the game`)
    bots[randomBot].currentlyBusy = true;
    contract
        .connect(bots[randomBot].wallet)
        .joinGame(gameID, randomNumber, {value: bid.toString()})
        .then(async () => {
            bots[randomBot].currentlyBusy = false;
            console.log(`Bot Joiner ${bots[randomBot].wallet.address} created bid at game ${gameID}: BID amount ETH ${bidAmount}, number: ${randomNumber}`)
            await updateAddSended(bots[randomBot].range, bidAmount.toString())
        })
        .catch(err => {
            bots[randomBot].currentlyBusy = false;
            console.error(err)
        })
}

//create game
const createGame = async () => {
    // random number to game
    const randomNumber = Math.floor(Math.random() * 100) + 1
    // get rangom bid
    const randomBID = Math.floor(Math.random() * rangeBID.length)
    const bidAmount = ethers.utils.parseEther(rangeBID[randomBID])
    // get random bot
    let randomBot = Math.floor(Math.random() * bots.length)
    for (;;) {
        if (bots[randomBot].currentlyBusy === true) {
            randomBot = Math.floor(Math.random() * bots.length)
        } else {
            break;
        }
    }
    console.log(`Bot Creator ${bots[randomBot].wallet.address} creating new game`)
    bots[randomBot].currentlyBusy = true;
    contract
        .connect(bots[randomBot].wallet)
        .createGame( randomNumber, 10, {value: bidAmount.toString()})
        .then(async () => {
            bots[randomBot].currentlyBusy = false;
            console.log(`Bot Creator ${bots[randomBot].wallet.address} created new game - BID amount: ETH ${bidAmount}, number: ${randomNumber}`)
            //paste to google sheets
            await updateAddSended(bots[randomBot].range, rangeBID[randomBID])
        })
        .catch(err => {
            bots[randomBot].currentlyBusy = false;
            console.error(err)
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
        .catch(err => console.error(err))
}

const finish = async () => {
    //we need to finish the bots in order
    //so we check if bots finished
    let arrFinished = bots.filter(v => v.finished === false)
    //if every bot finished reset the stats
    if (arrFinished.length === 0) {
        for (let i = 0; i < bots.length; i++) {
            bots[i].finished = false;
        }
    }
    //check if not finished bots not busy
    let arrNotFinishedAndNotBusy = bots.filter(v => v.finished === false && v.currentlyBusy === false)
    //get first
    let botID = arrNotFinishedAndNotBusy[0].id;
    //if bot with conditions exist
    if (botID != undefined) {
        //bot is busy now
        bots[botID].currentlyBusy = true;
        //get all bots games
        botGames(botID)
            .then((arr) => {
                //filter games 
                //the game is finished already and user allowed to claim prize
                //or the game is ready for finish
                return arr.filter((v) => v.claimed === '1' || v.claimed === '2')
            })
            .then(async (arr) => {
                console.log(`Bot ${bots[botID].wallet.address} finishing his games if exists`)
                for (let i = 0; i < arr.length; i++) {
                    //if we can claim -> claim
                    //else finish
                    if (arr[i].claimed === '1') {
                        await contract.connect(bots[botID].wallet).claim(arr[i].currentGameId)
                        const prizeList = await contract.prizeList(bots[botID].wallet.address, arr[i].currentGameId)
                        if (prizeList[2] !== undefined) {
                            const prize = prizeList[2].toString()
                            await updateAddWinned(bots[botID].range, ethers.utils.formatEther(prize)) 
                        }
                        console.log(`Bot ${bots[botID].wallet.address} claimed in game ${arr[i].currentGameId}`)
                    } else if (arr[i].claimed === '2'){
                        await contract.connect(bots[botID].wallet).finishGame(arr[i].currentGameId)
                        console.log(`Bot ${bots[botID].wallet.address} finished game ${arr[i].currentGameId}`)
                    }
                }
            })
            //bot finished and currently busy
            .then(() => {
                bots[botID].finished = true;
                bots[botID].currentlyBusy = false;
                console.log(`Finishing for ${bots[botID].wallet.address} is done`)
            })
            .catch(err => {
                bots[botID].currentlyBusy = false;
                console.error(err)
            })
    } else {
        console.log(`For finish every bot is busy`)
    }
}


// every {time} create new game
console.log(`Start schedule creating games`)
cron.schedule(cronConfCreate, async () => {
    await createGame()
})

// every {time} finishing games game
// setTimeout(() => {
    console.log(`Start schedule finishing games`)
    cron.schedule(cronConfFinish, async () => {
        await finish()
    })
// }, 20000)

console.log("Start listen address for event CreateGame: ", gameAddressTest)

//Listen CreateGame event
contract.on('CreateGame', async (gameId, bid) => {
    //create bid
    setTimeout(async () => {
        await joinGame(gameId, bid)
    }, 1000 * seconds)
    setTimeout(async () => {
        await joinGame(gameId, bid)
    }, 1000 * seconds + 40000) // after previous 30 sec 
    setTimeout(async () => {
        await joinGame(gameId, bid)
    }, 1000 * seconds + 70000) // after previous 30 sec 
    setTimeout(async () => {
        await joinGame(gameId, bid)
    }, 1000 * seconds + 100000) // after previous 30 sec 
})
