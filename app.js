const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/writeEth/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value, "eth.txt")
	res.send('done writing')
});

app.get('/writeBsc/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value, "bsc.txt")
	res.send('done writing')
});

app.get('/read', async (req, res) => {
    
    let rs = await readFromFile("eth.txt", "bsc.txt")
    
	res.send(rs)
});

app.get('/readT', async (req, res) => {
    
    //let rs = await readFromFile("ethT.txt", "bscT.txt")
    const fs = require('fs')
    let data = fs.readFileSync(account+'.json');
    data = JSON.parse(data);
    let sum = data.eth + data.bsc
    console.log("Total tokens = " + sum)
	res.send(sum)
});

app.listen(process.env.PORT || 8080, () => {
	console.log('listening on port 8080');
});

function writeToFile(value, fileName){
    const fs = require('fs')
    fs.writeFile(fileName, value, (err) => {
        if (err) throw err;
        else{
            console.log("The file is updated with the given data")
        }
    })
}

async function readFromFile(fileA, fileB){
    const fs = require('fs')
    try {
        let dataEth = fs.readFileSync(fileA, 'utf8');
        let dataBsc = fs.readFileSync(fileB, 'utf8');
        if(dataEth == undefined)
            dataEth = 0
        if(dataBsc == undefined)
            dataBsc = 0
        let data = parseInt(dataEth) + parseInt(dataBsc)
        console.log(data)
        return data.toString()
      } catch (err) {
        return err
    }
}

app.get('/tokensEth/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value, "ethT.txt")
	res.send('done writing')
});

app.get('/tokensBsc/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value, "bscT.txt")
	res.send('done writing')
});

app.get('/tokens/:account/:type/:value', (req, res) => {
    const account = req.params.account;
    const type = req.params.type;
    const value = req.params.value;
    tokenJSON(account, type, value)
	res.send('done writing to tokens file = ' + account)
});

function tokenJSON(account, type, value){
    let info = { 
        eth: 0,
        bsc: 0
    };
    // read the data first
    const fs = require('fs')
    try {
        let data = fs.readFileSync(account+'.json');
        data = JSON.parse(data);
        if(type == 1){
            info.eth = value
            info.bsc = data.bsc
        }
            
        else{
            info.bsc = value
            info.eth = data.eth
        }
        info = JSON.stringify(info);
        fs.writeFileSync(account+'.json', info);
            
      } catch (err) {
        return err
    }

}