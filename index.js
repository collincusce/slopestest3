const slopes = require("slopes");
const BN = require("bn.js");
const Buffer = require('buffer/').Buffer;

let bintools = slopes.BinTools.getInstance();

let ava = new slopes.Slopes("localhost", 9650, "http", 12345, "X");
let avm = ava.AVM(); //returns a reference to the AVM API used by Slopes

let managekeys = async () => {
    let myKeychain = avm.keyChain();
    let newAddress1 = myKeychain.makeKey();
    let mypk = bintools.avaDeserialize("ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN");
    let newAddress2 = myKeychain.importKey(mypk)
    let addresses = myKeychain.getAddresses(); //returns an array of all addresses managed
    let exists = myKeychain.hasKey(newAddress1); //returns true if the address is managed
    let keypair = myKeychain.getKey(newAddress1); //returns the keypair class
    let myaddress = keypair.getAddress();

let xkp = myKeychain.getKey(newAddress2);
console.log("myaddress2", bintools.avaSerialize(xkp.getAddress()));

    let pubk = keypair.getPublicKey(); //returns Buffer
    let pubkstr = keypair.getPublicKeyString(); //returns an AVA serialized string

    let privk = keypair.getPrivateKey(); //returns Buffer
    let privkstr = keypair.getPrivateKeyString(); //returns an AVA serialized string

    //creating a new random keypair
    keypair = new slopes.AVMKeyPair(); 
    keypair.generateKey();
    let mypk2 = Buffer.from("021ee5e48e70e336d82d894c8f80c8109fd75651720cf662661236d22ab7b7b6", "hex");
    let successful = keypair.importKey(mypk2); //returns boolean if private key imported successfully

    let message = Buffer.from("Wubalubadubdub");
    let signature = keypair.sign(message); //returns a Buffer with the signature
    let signerPubk = keypair.recover(message, signature);
    let isValid = keypair.verify(message, signature, signerPubk); //returns a boolean
    
    let newAddress3 = myKeychain.makeKey();
}

let creatingassets = async () => {
    // The fee to pay for the asset
    let fee = new BN(0);

    let addresses = avm.keyChain().getAddresses();
    
    // Create outputs for the asset's initial state
    let secpbase1 = new slopes.SecpOutBase(new BN(400), addresses);
    let secpbase2 = new slopes.SecpOutBase(new BN(500), [addresses[1]]);
    let secpbase3 = new slopes.SecpOutBase(new BN(600), [addresses[1], addresses[2]]);

    // Populate the initialState array
    let initialState = new slopes.InitialStates();
    initialState.addOutput(secpbase1, slopes.AVMConstants.SECPFXID);
    initialState.addOutput(secpbase2, slopes.AVMConstants.SECPFXID);
    initialState.addOutput(secpbase3, slopes.AVMConstants.SECPFXID);

    // Name our new coin and give it a symbol
    let name = "Rickcoin is the most intelligent coin";
    let symbol = "RICK";

    // Where is the decimal point indicate what 1 asset is and where fractional assets begin
    // Ex: 1 $AVA is denomination 9, so the smallest unit of $AVA is nano-AVA ($nAVA) at 10^-9 $AVA
    let denomination = 9;

    // Fetch the UTXOSet for our addresses
    let utxos = await avm.getUTXOs(addresses);

    // Make an unsigned Create Asset transaction from the data compiled earlier
    let unsigned = await avm.makeCreateAssetTx(utxos, fee, addresses, initialState, name, symbol, denomination);

    let signed = avm.keyChain().signTx(unsigned); //returns a Tx class

    // using the Tx class
    let txid = await avm.issueTx(signed); //returns an AVA serialized string for the TxID

    return txid;
}

let sendingassets = async (utxos, assetid) => {
    let myAddresses = avm.keyChain().getAddresses(); //returns an array of addresses the keychain manages

    let mybalance = utxos.getBalance(myAddresses, assetid); //returns 400 as a BN
    let sendAmount = new BN(100); //amounts are in BN format
    let friendsAddress = "X-B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"; //AVA serialized address format
    let unsignedTx = await avm.makeUnsignedTx(utxos, sendAmount, [friendsAddress], myAddresses, myAddresses, assetid); 
    let signedTx = avm.signTx(unsignedTx);
    let txid = await avm.issueTx(signedTx);

    return txid;
}

/*
let assetID = bintools.avaDeserialize("2KBJoSQV3aQ4SHrZh3HRXacFZhEvdmCRsQV1JuLzuqeWytiKWn");

managekeys().then(() => {
    let boyyy = avm.keyChain().getAddresses();
    console.log("boyyy", boyyy);
    avm.getUTXOs(boyyy).then((result) => {
        let cb = async (txid, assetid) => {  
            let myAddresses = avm.keyChain().getAddresses(); //returns an array of addresses the keychain manages
            let sendAmount = new BN(100); //amounts are in BN format
            // returns one of: "Accepted", "Processing", "Unknown", and "Rejected"
            let status = await avm.getTxStatus(txid);
            console.log(status);
            let updatedUTXOs = await avm.getUTXOs();
            console.log("updatedUTXOs", updatedUTXOs);
            let newBalance = updatedUTXOs.getBalance(myAddresses, assetid);
            console.log("New Balance ")
        };
        sendingassets(result, assetID).then((txid) => {
            setTimeout(() => cb(txid, assetID), 5000);
        })
    });
});
*/

let assetIDList = [];
let utxosGlobal;
managekeys().then(() => {
    return creatingassets();
}).then((assetid) => {
    assetIDList.push(assetid);
}).then(() => {
    return creatingassets();
}).then((assetid) => {
    assetIDList.push(assetid);
}).then(() => {
    setTimeout(() => {  
        let addrs = avm.keyChain().getAddressStrings();
        avm.getUTXOs(addrs).then((result) => {
            utxosGlobal = result;
            let cb = async (txid, assetid) => {  
                let myAddresses = avm.keyChain().getAddresses(); //returns an array of addresses the keychain manages
                let sendAmount = new BN(100); //amounts are in BN format
                // returns one of: "Accepted", "Processing", "Unknown", and "Rejected"
                let status = await avm.getTxStatus(txid);
                if(status == "Accepted"){
                    let updatedUTXOs = await avm.getUTXOs(myAddresses);
                    let newBalance = updatedUTXOs.getBalance(myAddresses, assetid);
                    console.log("New balance: " + newBalance.toNumber());
                } else {
                    console.log("Unexpected status: " + status);
                }
            };
            sendingassets(utxosGlobal, assetIDList[0]).then((txid) => {
                setTimeout(() => cb(txid, assetIDList[0]), 5000);
            }).then(()=>{
                sendingassets(utxosGlobal, assetIDList[1]).then((txid) => {
                    setTimeout(() => cb(txid, assetIDList[1]), 5000);
                }).then(() => {
                    console.log("Done sending.");
                });
            }).catch((e) => console.log(e));
        }).catch((e) => console.log(e));
    }, 5000);
}).catch((e) => console.log(e));
