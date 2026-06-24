import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));
const counts = await Task.aggregate([
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
]);
console.log(JSON.stringify(counts, null, 2));
process.exit(0);
