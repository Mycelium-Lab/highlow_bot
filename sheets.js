const { google } = require('googleapis')

//TABLE ID
const ID = "193RTu6e52MRi0AahlC6GZB1OAThDWz6sjxWskPD-5s0"

async function authentication() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './credentials/credentials.json',
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })

    const client = await auth.getClient()

    const sheets = google.sheets({
        version: 'v4',
        auth: client
    })

    return sheets
}

async function updateAddSended(range, add) {
    authentication()
        .then(async (sheets) => {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: ID,
                range
            })
            return {response,sheets}
        })
        .then(async ({response, sheets}) => {
            const amountBefore = parseFloat(response.data.values[0][1])
            const gamesAmount = parseInt(response.data.values[0][3]) + 1
            const amountUpdate = amountBefore + parseFloat(add)
            await sheets.spreadsheets.values.update({
                spreadsheetId: ID,
                range,
                valueInputOption: "USER_ENTERED",
                resource: {
                            values: [[,amountUpdate.toString(),,gamesAmount]]
                }
            })
            console.log(`Added Sended Amount to Google Sheets`)
        })
        .catch((e) => {
            console.log(e)
        })
}

async function updateAddWinned(range, add) {
    authentication()
        .then(async (sheets) => {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: ID,
                range
            })
            return {response,sheets}
        })
        .then(async ({response, sheets}) => {
            const amountBefore = parseFloat(response.data.values[0][2])
            const amountUpdate = amountBefore + parseFloat(add)
            await sheets.spreadsheets.values.update({
                spreadsheetId: ID,
                range,
                valueInputOption: "USER_ENTERED",
                resource: {
                            values: [[,,amountUpdate.toString()]]
                }
            })
            console.log(`Added Winned Amount to Google Sheets`)
        })
        .catch((e) => {
            console.log(e)
        })
}

module.exports = {
    updateAddSended,
    updateAddWinned
}