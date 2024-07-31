import dotenv from 'dotenv';
import mysql, {Connection} from 'mysql';
import {Context} from "../midware/context";
const logger = require('pino')()

//initialise a new connection
export function mysqlConnection(ctx: {myread:Connection|undefined, mywrite: Connection|undefined}, db_acc:string, failCount = 0){
    dotenv.config();
    logger.info("Connecting to database with "+db_acc+" account");
    const host = process.env.sql_host;
    const db_host = process.env.sql_database;
    const name = process.env[`SQL_${db_acc.toUpperCase()}_NAME`];
    const pass = process.env[`SQL_${db_acc.toUpperCase()}_PASS`];

    //init connection
    const connection = mysql.createConnection({
        host: host,
        user: name,
        password: pass,
        database: db_host
    });

    //update correct context
    if(db_acc === "read"){
        ctx.myread = connection;
    }else if(db_acc === "write"){
        ctx.mywrite = connection;
    }else{
        throw new Error("Unknown db acc: "+db_acc)
    }

    //setup callbacks
    connection.connect(function (err) {
        if (err) {
            return logger.warn({db_acc,err});
        }
        logger.info("Connected to the database with "+db_acc);
    });

    connection.on('end', function(err) {
        logger.warn("Disconnecting " + db_acc);

        //auto reconnect if error
        const reconnect = ()=>{
            logger.warn({db_acc, err});
            logger.warn(`attempting re-conneection ${failCount}...`);
            mysqlConnection(ctx, db_acc, failCount + 1);
        }

        if(err) {
            if(failCount > 5){
                //TODO: alert
                setTimeout(reconnect, 20_000)
            }else {
                reconnect()
            }
        }
    })
}
