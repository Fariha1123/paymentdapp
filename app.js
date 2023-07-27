const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/writeEth/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value, 1)
	res.send('done writing')
});

app.get('/writeBsc/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value, 0)
	res.send('done writing')
});

app.get('/read', async (req, res) => {
    
    let rs = await readFromFile()
    
	res.send(rs)
});

app.listen(process.env.PORT || 8080, () => {
	console.log('listening on port 8080');
});

function writeToFile(value, type){
    const fs = require('fs')
    let fileName;
    if(type == 1)
        fileName = "eth.txt"
    else 
        fileName = "bsc.txt"
    fs.writeFile(fileName, value, (err) => {
        if (err) throw err;
        else{
            console.log("The file is updated with the given data")
        }
    })
}

async function readFromFile(){
    const fs = require('fs')
    try {
        let dataEth = fs.readFileSync('eth.txt', 'utf8');
        let dataBsc = fs.readFileSync('bsc.txt', 'utf8');
        if(dataEth == undefined)
            dataEth = 0
        if(dataBsc == undefined)
            dataBsc = 0
        let data = dataEth + dataBsc
        console.log(data)
        return data
      } catch (err) {
        return err
    }
}