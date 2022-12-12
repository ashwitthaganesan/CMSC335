const http = require('http');
const path = require("path");
let fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express"); 
const app = express(); 

require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: "CMSC335DB", collection:"coffeeOrders"};

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${userName}:${password}@cluster0.0ie5si3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//MONGODB FUNCTIONS 
async function insertOrder(client, databaseAndCollection, order) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(order);
}

async function findOrder(client, databaseAndCollection, phone) {
    let findByPhone = {phone: phone};
    return await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(findByPhone);
}


let portNumber = process.argv.splice(2);
portNumber = portNumber[0];

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));


//Coffee Shop Main Page 
app.get("/", (request, response) => { 
    response.render("mainPage");
});

//Get Weather Page 
app.get("/getWeather", (request, response) => { 
    const variables = { 
        cityName: request.query.cityName,
    };

    response.render('getWeather', variables);

});

//View Weather Page
app.post("/getWeather", (request, response) => { 

    const retrieveCityData = async (inputCityName) => fetch(`https://open-weather13.p.rapidapi.com/city/${inputCityName}`, {  method: 'GET', headers: {
        'X-RapidAPI-Key': 'aebb48b73bmsh4eae91c569de06dp1607dfjsn554e3c3ee40c',
        'X-RapidAPI-Host': 'open-weather13.p.rapidapi.com'
    } });

    // async function approach
    const renderFunction = async () => {
        // wait for result
        let inputCityName = request.body.cityName;
        const inputCityData = await (await retrieveCityData(inputCityName)).json();
        const variables = { 
            temperature: inputCityData.main["temp"]
        };
        response.render('viewWeather', variables);
    }
    renderFunction();
});

//Order Coffee Page 
app.get("/orderPage", (request, response) => { 
    const variables = { 
        name: request.query.name,
        email: request.query.email,
        phone: request.query.phone,
        items: request.query.items,
        additionalInfo: request.query.additionalInfo
    };

    response.render('orderPage', variables);
});

//Store the customer's order info and display thank you message 
app.post("/orderPage", (request, response) => { 
    
    let order = {name: request.body.name, email: request.body.email, phone: request.body.phone, items: request.body.items, additionalInfo: request.body.additionalInfo};
    insertOrder(client, databaseAndCollection, order);

    let totalCost = 0;
    let itemsList= request.body.items;
    if (itemsList.length == 0) {
        totalCost = 0;
    }
    else if (itemsList.length == 3) {
        totalCost = 15;
    }
    else if (itemsList.length == 2) {
        totalCost = 10;
    }
    else {
        totalCost = 5;
    }
    
    const variables = { 
        total: totalCost
    };

    response.render('orderCompletedPage', variables);
});

//Find customer by phone 
app.get("/findOrder", (request, response) => { 
    const variables = { 
        email: request.body.email
    };
    response.render('findOrder', variables);
});

//Display Order Info
app.post("/findOrder", (request, response) => { 
    let customerPhone = request.body.phone;

    let variables = {};
    let Name = "";
    let Email = "";
    let Items = "";
    let AI = "";

    findOrder(client, databaseAndCollection, customerPhone).then( data => { 
        Name = data.name;
        Email = data.email;
        Phone = data.phone;
        Items = data.items;
        AI = data.additionalInfo;

        variables = { 
            name: Name,
            email: Email,
            phone: Phone,
            itemsArray: Items,
            additionalInfo: AI
        };
        response.render('viewOrderDetails', variables);
    });
});



app.listen(portNumber); 
console.log(`Web server started and running at http://localhost:${portNumber}`);
process.stdout.write("Stop to shutdown the server: ");

process.stdin.setEncoding("utf8"); 
process.stdin.on('readable', () => {  
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0); 
        } 
        process.stdout.write("Stop to shutdown the server: ");
        process.stdin.resume();
    }
});
