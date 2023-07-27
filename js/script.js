$(window).on('load', function () {

    // PAGE LOADER

    $('.pre-load').stop().animate({opacity:0}, 500, function(){
        $('.pre-load').css({'display':'none'});
        $('body').css({'overflow-y':'auto'});
    });

});

$(async function() {
    init();
    loadContracts();

    // FORM INPUTS
    
    $('#payInput').keyup(function(){
        let newVal;
        if(asset == 'usdt')
            newVal = $(this).val() * exchangeRate
        else {
            if(eth == 1)
                newVal = $(this).val() * exchangeRate * ethUSD
            else 
                newVal = $(this).val() * exchangeRate * bnbUSD
        } 
        $("#tokenInput").val(newVal.toFixed(0))
    });
    $('#tokenInput').keyup(function(){
        let newVal = $(this).val() / exchangeRate
        $("#payInput").val(newVal)
    });
    $('#maxBtn').click(function (e) {
        e.preventDefault();
        console.log('number : '+ formatNumber(native));
        if(eth == 1 && asset == 'eth')
            $("#payInput").val(formatNumber(native)).keyup()
        else if (eth == 1 && asset == 'usdt')
            $("#payInput").val(formatNumber(usdt)).keyup()
        else if (eth == 0 && asset == 'bnb')
            $("#payInput").val(formatNumber(native)).keyup()
        else $("#payInput").val(formatNumber(usdt)).keyup()
    });


    $("input:radio[name=coin-type]").change(function() {
        asset = $(this).val();
        if($(this).val() === "eth") {
            $("#choosenCoin").attr("src","images/eth.png").attr("alt", "ETH")
        }else if($(this).val() === "usdt") {
            $("#choosenCoin").attr("src","images/usdt.png").attr("alt", "USDT")
        }else {
            $("#choosenCoin").attr("src","images/bnb.png").attr("alt", "BNB")
        }
    })


    $('#connectWallet').click(function (e) {
        e.preventDefault();
        onConnect();
    });

    $('#buyBtn').click(async function (e) {
        e.preventDefault();
        let formVals = []
        $("#mainForm input").each(function() {
            if($(this).attr("type") === "radio") {
                if($(this).is(":checked")) {
                    formVals.push($(this).val())
                }
            }else
                formVals.push($(this).val())
        })
        if(accounts == undefined)
            alert('Connect wallet');
        let input = formVals[1];
        
        if(asset == 'eth' && eth == 1){ 
            input = ethers.BigNumber.from((input * 1e18).toString());
            ETH_PAYMENT_C.methods.ethPayment(input).send({
                from: accounts[0], // The amount of eth to send
                value: input
            }).then(() => {
                alert("Transaction confirmed, funds submitted")
                updateProgressBar();
            })
        } else if(asset == 'usdt' && eth == 1){ 
            input = ethers.BigNumber.from((input * 1e6).toString());
            usdtPayments(USDT_C, ETH_PAYMENT_C, input);
        } else if(asset == 'usdt' && eth == 0){ 
            input = ethers.BigNumber.from((input * 1e18).toString());
            usdtPayments(BUSD_C, BNB_PAYMENT_C, input);
        } else if(asset == 'bnb' && eth == 0){ 
            input = ethers.BigNumber.from((input * 1e18).toString());
            BNB_PAYMENT_C.methods.ethPayment(input).send({
                from: accounts[0],
                value: input
            }).then(() => {
                alert("Transaction confirmed, funds submitted")
                updateProgressBar();
            })
        }
    });


    
    $('#changeToBNB').click(function (e) {
        e.preventDefault();
        if(eth == 1) { // CHANGE TO BNB
            $("#coin-1").val("bnb").prop("checked", true);
            $("#coin-1-label").html("<img src='images/bnb.png' alt='BNB'> BNB");
            $("#choosenCoin").attr("src","images/bnb.png").attr("alt", "BNB")
            $("#btnCoin").html("ETH")

            eth = 0;
            asset = 'bnb';
            loadContracts()
            getNetwork()
        }else {// CHANE TO ETH
            $("#coin-1").val("eth").prop("checked", true);
            $("#coin-1-label").html("<img src='images/eth.png' alt='ETH'> ETH");
            $("#choosenCoin").attr("src","images/eth.png").attr("alt", "ETH")
            $("#btnCoin").html("BNB")

            eth = 1;
            asset = 'usdt';
            loadContracts()
            getNetwork()
        }
    });

});

async function loadContracts(){
   if(eth == 1){
      
      contractInitialization(ETH_PAYMENT_ADD, ETH_PAYMENT_ABI).then(async (C) => {
        ETH_PAYMENT_C = C;
         
        updateProgressBar();
      });
      
      contractInitialization(USDT_ADD, ERC20_ABI).then(C => {
         USDT_C = C;
      });

   } else {
      
      contractInitialization(BNB_PAYMENT_ADD, ETH_PAYMENT_ABI).then(async (C) => {
         BNB_PAYMENT_C = C;
         updateProgressBar();
      });
   
      contractInitialization(BUSD_ADD, ERC20_ABI).then(C => {
         BUSD_C = C;
      });
   }
}
async function contractInitialization(address, ABI) {
    const web3Instance = new Web3(window['ethereum']);
    return (await new web3Instance.eth.Contract(ABI, address));
}

async function getNetwork() {
    var netw = await web3.eth.net;
    var net = await netw.getNetworkType();
    var id = await netw.getId();

   if(eth == 0){
      if (net != "private" && id != 56) {
         $('#connectWallet').html('Invalid Network. Switch to Binance Smart chain Main Network');
      } else {
        $('#connectWallet').html('Connected: ' + accounts[0].substring(0, 6) + '...' + accounts[0].substring(36, 42));
        const web3Instance = new Web3(window['ethereum']);
        native = await new web3Instance.eth.getBalance(accounts[0]);
        native = native / 1e18;
        usdt = await BUSD_C.methods.balanceOf(accounts[0]).call() / 1e18;
      }
   } else {
      if (net != "goerli" && id != 1) { 
         $('#connectWallet').html('Invalid Network. Switch to ETH Main Network');
      } else {
         $('#connectWallet').html('Connected: ' + accounts[0].substring(0, 6) + '...' + accounts[0].substring(36, 42));
         const web3Instance = new Web3(window['ethereum']);
         native = await new web3Instance.eth.getBalance(accounts[0]);
         native = native / 1e18;
         usdt = await USDT_C.methods.balanceOf(accounts[0]).call() / 1e6;
      }
   }


}

async function updateProgressBar() {
    // PROGRESSBAR VALUES
    let bought, totalToBuy;
    if(eth == 1){
        bought = await ETH_PAYMENT_C.methods.soldTokens().call();
        bought = 100000000000
        bought = bought / 1e9
        await writeETH(bought)
    }
    
    else {
        bought = await BNB_PAYMENT_C.methods.soldTokens().call();
        bought = bought / 1e9
        await writeBSC(bought)
    }
    
    let totalSold = await read()
    $('#boughtVal').html(totalSold);
    $('#totalToBuyVal').html();
    $("#progressBar").css("width", totalSold/300000000*100 + "%")
}

$.getJSON( "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum", 
    function( data) {
	ethUSD = parseInt(data[0].current_price)
});

$.getJSON( "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=binancecoin", 
    function( data) {
	bnbUSD = parseInt(data[0].current_price)
});

function formatNumber(number){
    number = Math.floor(number * 1000)
    number = number / 1000
    return number
}

async function usdtPayments(TOKEN_C, PAYMENT_C, input){
    // check allowance
    let allowance = await TOKEN_C.methods.allowance(accounts[0], PAYMENT_C._address).call();
    console.log("allowance")
    if(allowance >= input){
        PAYMENT_C.methods.usdtPayment(input).send({
            from: accounts[0],
        }).then(() => {
            alert("Transaction confirmed, funds submitted")
            updateProgressBar()
        })
        .catch(e => {
            if (e.code === 4001){
                // User rejected the transaction
                console.clear();
                alert('User rejected the transaction');
                return;
            } else {
                console.clear();
                alert('ERROR sending payment');
                return;
            }
        });  
    } else {
        alert("It will be a two step process, please approve tokens first")
    await TOKEN_C.methods.approve(PAYMENT_C._address, input).send({
        from: accounts[0]
    }).then(async () => {
        alert("Transaction approved, please confirm the purchase")
        PAYMENT_C.methods.usdtPayment(input).send({
            from: accounts[0],
        }).then(() => {
            alert("Transaction confirmed, funds submitted")
            updateProgressBar()
        })
        .catch(e => {
            if (e.code === 4001){
                // User rejected the transaction
                console.clear();
                alert('User rejected the transaction');
                return;
            } else {
                console.clear();
                alert('ERROR sending payment');
                return;
            }
        });  
    })
    .catch(e => {
        if (e.code === 4001){
            // User rejected the transaction
            console.clear();
            alert('User rejected the transaction');
            return;
        } else {
            console.clear();
            alert('ERROR');
            return;
        }
    });  
    }
}

function writeETH(value){
    console.log(value)
    fetch(node_url+"/writeEth/"+value)
  	.then(response => response.text())
      .then(function(text) {
        console.log(text);
      })
  	.catch(error => {
    	console.error('Error:', error);
  	});
}

function writeBSC(value){
    console.log(value)
    fetch(node_url+"/writeBsc/"+value)
  	.then(response => response.text())
      .then(function(text) {
        console.log(text);
      })
  	.catch(error => {
    	console.error('Error:', error);
  	});
}

function read(){
    fetch(node_url+"/read")
  	.then(response => response.text())
      .then(function(text) {
        console.log(text)
        return text
      })
  	.catch(error => {
    	console.error('Error:', error);
  	});
}

let node_url= "https://filereadwrite.onrender.com";


let eth = 1, ETH_PAYMENT_C, USDT_C, BUSD_C, BNB_PAYMENT_C, accounts, native, usdt, asset='eth', ethUSD,bnbUSD, exchangeRate = 250;

let ETH_PAYMENT_ADD = "0x3a56bFD01d88dE6DeE6d6Ff71D8CD3BC7F169326";
let USDT_ADD = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
let BNB_PAYMENT_ADD = "0x750f8C94c7f04AC129b7615a4a6b421733D476Db";
let BUSD_ADD = "0x55d398326f99059fF775485246999027B3197955";

let ETH_PAYMENT_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "ethPayment",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_fundsReceiver",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokens",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "funds",
				"type": "uint256"
			}
		],
		"name": "newfunds",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "usdtPayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "getLatestData",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "soldTokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "tokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalTokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
let ERC20_ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}];