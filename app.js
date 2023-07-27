const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/write/:value', (req, res) => {
    const value = req.params.value;
    writeToFile(value)
	res.send('done writing')
});

app.get('/read', async (req, res) => {
    
    let rs = await readFromFile()
    
	res.send(rs)
});

app.listen(process.env.PORT || 8080, () => {
	console.log('listening on port 8080');
});

function writeToFile(value){
    const fs = require('fs')
    fs.writeFile('tp.txt', value, (err) => {
        if (err) throw err;
        else{
            console.log("The file is updated with the given data")
        }
    })
}

async function readFromFile(){
    const fs = require('fs')
    try {
        const data = fs.readFileSync('tp.txt', 'utf8');
        return data
      } catch (err) {
        return err
    }
}