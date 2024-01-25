const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
const secret_key = "9fbb9f251f1e8c038f0e1ee495154b4d";
const access_key = "75162261d7eb28c48c5c9f4860c339c0";

/* #region - App initializer  */
admin.initializeApp({
    databaseURL: "https://petuk-8d921.firebaseio.com"
}, "app_IN");

admin.initializeApp({
    databaseURL: "https://petuk-8d921-sa01.firebaseio.com"
}, "app_ZA");

admin.initializeApp({
    databaseURL: "https://petuk-8d921-t0e1s2t.firebaseio.com"
}, "app_Test");


admin.initializeApp({
    databaseURL: "https://petuk-8d921-db2.firebaseio.com"
}, "app_IN2");

admin.initializeApp({
    databaseURL: "https://petuk-8d921-sa2.firebaseio.com"
}, "app_ZA2");

admin.initializeApp({
    databaseURL: "https://petuk-8d921-t0e1s2t.firebaseio.com"
}, "app_Test2");
function getFirebaseApp(countryCode) {
    const appMap = {
        'IN': 'app_IN',
        'ZA': 'app_ZA',
        'Test': 'app_Test'
    };
    return appMap[countryCode] || 'app_Test'; // Default to Test DB for unknown countries
}
function getFirebaseApp2(countryCode) {
    const appMap = {
        'IN': 'app_IN2',
        'ZA': 'app_ZA2',
        'Test': 'app_Test2'
    };
    return appMap[countryCode] || 'app_Test2'; // Default to Test DB for unknown countries
}
/* #endregion */

exports.instantPay = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const {
            country,
            action
        } = req.body;
        
console.log(`My IP is ${req.ip}`);
console.log(req.connection.remoteAddress);
//console.log(req.connection.remoteAddress.ip);

        let databaseURL = getFirebaseApp(country);
        const db = admin.app(databaseURL).database();

        let databaseURL2 = getFirebaseApp2(country);
        const db2 = admin.app(databaseURL2).database();
        doAction(req.body, db, db2, res, action);
    });
});
function doAction(data, db, db2, res, action) {
    if (action === 'read') {
        readData(data, db, db2, res);
    }
    else if (action === 'write') {
        writeData(data, db, db2, res);
    }
    else if (action === 'update') {
        updateData(data, db, db2, res);
    }
    else {
        res.status(201).send('Invalid Request');
    }
}

async function writeData(data, db, db2, res) {
    try {
        const {
            amount, //int
            payment_method, //int
            mobile_number,
        } = data;

        const truncatedMobileNumber = mobile_number.substring(0, 10);
        const readVendorDetailForInstantPay = db2.ref(`VendorDetailForInstantPay/${truncatedMobileNumber}`);

        //const readVendorDetailForInstantPay = db2.ref(`VendorDetailForInstantPay/${mobile_number}`);
        readVendorDetailForInstantPay.once('value', async (snapshot) => {
            const dataLog = snapshot.val();
            const beneficiary_id = dataLog.id.toString();

            const dataToSave = {
                beneficiary_id: beneficiary_id || 'NA',
                amount: amount || 0,
                payment_method: payment_method,
            };

            const URL = "https://api.frenzopay.com/api/v1/payout/";

            const REQUEST_METHOD = "POST";
            const REQUEST_PATH = "/api/v1/payout/";
            const REQUEST_QUERYSTRING = "";
            const REQUEST_BODY = JSON.stringify(dataToSave);
            const xtimestamp = Date.now();

            const digest = crypto.createHmac('sha512', secret_key)
            digest.update(REQUEST_METHOD);
            digest.update('\n');
            digest.update(REQUEST_PATH);
            digest.update('\n');
            digest.update(REQUEST_QUERYSTRING);
            digest.update('\n');
            digest.update(REQUEST_BODY);
            digest.update('\n');
            digest.update(xtimestamp.toString());
            digest.update('\n');
            const signature = digest.digest('hex');

            const headers = { 'Content-Type': 'application/json', "access_key": access_key, 'signature': signature.toString(), 'X-Timestamp': xtimestamp.toString() }

            const response = await fetch(URL, {
                method: 'POST',
                headers,
                body: REQUEST_BODY,
            });

            const responseJson = await response.json();

            if (response.status == 200) {

                //TODO: save work

                // const vendorDetailForInstantPay = db2.ref("VendorDetailForInstantPay");
                // vendorDetailForInstantPay.child(mobile_number).set(responseJson, (error) => {
                //     if (error) {
                //         errorData = error.message;
                //         return res.status(401).json({ error: "Unable to save into DB" });
                //     }
                // })
                
                return res.status(200).json(responseJson);
            } else {
                return res.status(400).json(responseJson)
            }


        });


    } catch (error) {
        console.error('Error came:', error);
        return res.status(500).json({ error: error.toString() });
    }

}

async function readData(data, db, db2, res) {
    try {
        const {
            type,
            mobile_number,
            from_date,
            to_date,
            payment_method,
        } = data;
        //0-All 1-beneficiary 2- Date Ranage 3-pay method
        
        if (type == "0") {
            const URL = "https://api.frenzopay.com/api/v1/payout/";
            const REQUEST_METHOD = "GET";
            const REQUEST_PATH = "/api/v1/payout/";
            const REQUEST_QUERYSTRING = "";
            const REQUEST_BODY = '';//JSON.stringify(dataToSave);
            const xtimestamp = Date.now();

            const digest = crypto.createHmac('sha512', secret_key)
            digest.update(REQUEST_METHOD);
            digest.update('\n');
            digest.update(REQUEST_PATH);
            digest.update('\n');
            digest.update(REQUEST_QUERYSTRING);
            digest.update('\n');
            digest.update(REQUEST_BODY);
            digest.update('\n');
            digest.update(xtimestamp.toString());
            digest.update('\n');
            const signature = digest.digest('hex');

            const headers = { 'Content-Type': 'application/json', "access_key": access_key, 'signature': signature.toString(), 'X-Timestamp': xtimestamp.toString() }

            const response = await fetch(URL, {
                method: 'GET',
                headers,
                // body: REQUEST_BODY,
            });

            const responseJson = await response.json();

            if (response.status == 200) {
                return res.status(200).json(responseJson);
            } else {
                return res.status(400).json(responseJson)
            }

        } else if (type == "1") {
            const URL = "https://api.frenzopay.com/api/v1/payout/";

            const readVendorDetailForInstantPay = db2.ref(`VendorDetailForInstantPay/${mobile_number}`);
            readVendorDetailForInstantPay.once('value', async (snapshot) => {
                const dataLog = snapshot.val();
                const beneficiary_id = dataLog.id.toString();
                const URLnew = URL + `?beneficiary=${beneficiary_id}`;

                const REQUEST_METHOD = "GET";
                const REQUEST_PATH = "/api/v1/payout/";
                const REQUEST_QUERYSTRING = `beneficiary=${beneficiary_id}`;
                const REQUEST_BODY = '';//JSON.stringify(dataToSave);
                const xtimestamp = Date.now();

                const digest = crypto.createHmac('sha512', secret_key)
                digest.update(REQUEST_METHOD);
                digest.update('\n');
                digest.update(REQUEST_PATH);
                digest.update('\n');
                digest.update(REQUEST_QUERYSTRING);
                digest.update('\n');
                digest.update(REQUEST_BODY);
                digest.update('\n');
                digest.update(xtimestamp.toString());
                digest.update('\n');
                const signature = digest.digest('hex');

                const headers = { 'Content-Type': 'application/json', "access_key": access_key, 'signature': signature.toString(), 'X-Timestamp': xtimestamp.toString() }

                const response = await fetch(URLnew, {
                    method: 'GET',
                    headers,
                    // body: REQUEST_BODY,
                });

                const responseJson = await response.json();

                if (response.status == 200) {
                    return res.status(200).json(responseJson);
                } else {
                    return res.status(400).json(responseJson)
                }
            });

      
        } else if (type == "2") {
        } else if (type == "3") {
        }

       

       


    } catch (error) {
        console.error('Error came:', error);
        return res.status(500).json({ error: error.toString() });
    }

}



// {
//     "country": "IN",
//     "action":"read",
//     "mobile_number": "9999999999"
//     "amount":100
//     "payment_method": 2
// }


// {
//     "country": "IN",
//     "action":"read",
//     "type": "0", 
//     "mobile_number": "9999999999",
//     "from_date":"2019-08-24T14:15:22Z",
//     "to_date":"2019-08-24T14:15:22Z",
//     "payment_method": 2	
// }

// //0-All 1-beneficiary 2- Date Ranage 3-pay method