const {MongoClient} = require('mongodb');

export const Collections = {
    COLLECTION_APPROVALS: 'approvals',
    COLLECTION_LOGS: 'logs',
	COLLECTION_HELPS: 'helps'
};

/**** DO NOT EXPORT ****/
let _DB_INSTANCE_;
/***********************/

export const initDB = async () => {
	if(_DB_INSTANCE_) return;
    const connectionUrl = process.env.DB_URL;
    const dbName = process.env.IS_DEV === 'true' ? 'dev' : 'prod';
	try {
		const client = await MongoClient.connect(connectionUrl, {useNewUrlParser: true, useUnifiedTopology: true});
		_DB_INSTANCE_ = client.db(dbName);
		console.log('--> Connected to DB : ' + dbName);
	} catch (error) {
		console.log('--> Error occured while connecting DB ' + error);
	}
}

export const insertIntoCollection = async (data, collectionName) => {
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

export const getHelpTopics = async () => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_HELPS);
	const items = await collection.find({}).project({"topic":1, "topicId": 1, "_id":0}).toArray();
	return items;
}

export const getHelpTopic = async (topicId) => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_HELPS);
	const topic = await collection.findOne({ topicId }, {
		projection: { '_id' : 0 }
	});
	return topic;
}

export const getTransectionCount = async (address) => {
	const collection = _DB_INSTANCE_.collection(Collections.COLLECTION_LOGS);
	const transections = await collection.find({ event : 'ON_TRANSECTION_COMPLETE', "transection.address": {"$eq" : address, "$exists" : true } }).count();
	return transections;
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