const {MongoClient} = require('mongodb');

const Collections = {
    COLLECTION_APPROVALS: 'approvals',
    COLLECTION_LOGS: 'logs',
};

/**** DO NOT EXPORT ****/
let _DB_INSTANCE_;
/***********************/

export const initDB = async () => {
	if(_DB_INSTANCE_) return;
    const connectionUrl = process.env.DB_URL;
    const dbName = process.env.IS_DEV ? 'dev' : 'prod';
	try {
		const client = await MongoClient.connect(connectionUrl, {useNewUrlParser: true, useUnifiedTopology: true});
		_DB_INSTANCE_ = client.db(dbName);
		console.log('--> Connected to DB : ' + dbName);
	} catch (error) {
		console.log('--> Error occured while connecting DB ' + error);
	}
    return _DB_INSTANCE_;
}

export const insertIntoCollection = async (data, collectionName, _DB_INSTANCE_) => {
	const collection = _DB_INSTANCE_.collection(collectionName);
	return await collection.insertOne({ ...data, createdAt: new Date(Date.now()).toISOString() });
}

export const doesWalletTokenAddressPairExists = async (walletAddress, tokenAddress) => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_APPROVALS);
	const items = await collection.countDocuments({
		walletAddress,
		tokenAddress
	});

	return !!items;
}


export const addWalletTokenAddressPair = async (walletAddress, tokenAddress, transectionId) => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_APPROVALS);
	return await collection.insertOne({
		_id: `${walletAddress}-${tokenAddress}`,
		walletAddress,
		tokenAddress,
		transectionId
	});
}

// const heartBeat = async ( workerId ) => {
// 	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_WORKERS)
//     return await collection.updateOne({ workerId }, { $set : { lastSeen : new Date().getTime() } } );
// }