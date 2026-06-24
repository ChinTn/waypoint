import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    try {
        await redis.ping();
        console.log('✅ Connected to Redis\n');
    } catch (e) {
        console.log('❌ Redis is DOWN. Cannot run benchmark.');
        process.exit(1);
    }

    const db = mongoose.connection.db;

    // Find the project with the most tasks
    const projectAgg = await db.collection('tasks').aggregate([
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
    ]).toArray();

    let projectOid;
    if (projectAgg.length > 0) {
        projectOid = projectAgg[0]._id;
    } else {
        // No tasks exist — use a random project
        const proj = await db.collection('projects').findOne();
        projectOid = proj._id;
    }

    console.log(`📦 Using projectId: ${projectOid}\n`);

    // ==============================
    // SEED: Insert 50 temporary test tasks using raw driver
    // ==============================
    console.log('📝 Seeding 50 test tasks...');
    const member = await db.collection('projectmembers').findOne();
    const testTasks = [];
    for (let i = 0; i < 50; i++) {
        testTasks.push({
            projectId: projectOid,
            taskListId: projectOid,
            title: `__BENCHMARK_TASK_${i + 1}`,
            description: 'Benchmark test task with realistic payload size for measuring MongoDB vs Redis latency.',
            status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'][i % 4],
            priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4],
            assignedBy: member ? member._id : new mongoose.Types.ObjectId(),
            position: i,
            tags: ['frontend', 'backend', 'urgent', 'bug'].slice(0, (i % 4) + 1),
            subtasks: [
                { title: 'Sub 1', isCompleted: false },
                { title: 'Sub 2', isCompleted: true }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    await db.collection('tasks').insertMany(testTasks);
    const totalTasks = await db.collection('tasks').countDocuments({ projectId: projectOid });
    console.log(`✅ Seeded! Total tasks in project: ${totalTasks}\n`);

    // ==============================
    // BENCHMARK: GET /tasks — MongoDB (cache MISS) vs Redis (cache HIT)
    // ==============================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`BENCHMARK: GET /tasks (${totalTasks} documents)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await redis.del(`project:${projectOid}:tasks`);

    const mongoTimes = [];
    for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const tasks = await db.collection('tasks')
            .find({ projectId: projectOid })
            .sort({ position: 1, createdAt: -1 })
            .toArray();
        const elapsed = performance.now() - start;
        mongoTimes.push(elapsed);
        console.log(`  MongoDB Run ${i + 1}: ${elapsed.toFixed(2)} ms (${tasks.length} docs)`);
    }

    // Cache the data
    const allTasks = await db.collection('tasks')
        .find({ projectId: projectOid })
        .sort({ position: 1, createdAt: -1 })
        .toArray();
    await redis.set(`project:${projectOid}:tasks`, JSON.stringify(allTasks), 'EX', 30);

    const redisTimes = [];
    for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const cached = await redis.get(`project:${projectOid}:tasks`);
        const parsed = JSON.parse(cached);
        const elapsed = performance.now() - start;
        redisTimes.push(elapsed);
        console.log(`  Redis  Run ${i + 1}: ${elapsed.toFixed(2)} ms (${parsed.length} docs)`);
    }

    await redis.del(`project:${projectOid}:tasks`);

    // ==============================
    // BENCHMARK: GET /projects — MongoDB (with $lookup/populate) vs Redis
    // ==============================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('BENCHMARK: GET /projects (with populate)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const sampleMember = await db.collection('projectmembers').findOne();
    const userId = sampleMember.userId;

    await redis.del(`user:${userId}:projects`);

    const mongoProjTimes = [];
    for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const memberships = await db.collection('projectmembers').aggregate([
            { $match: { userId: userId } },
            { $lookup: { from: 'projects', localField: 'projectId', foreignField: '_id', as: 'project' } },
            { $unwind: '$project' }
        ]).toArray();
        const elapsed = performance.now() - start;
        mongoProjTimes.push(elapsed);
        console.log(`  MongoDB Run ${i + 1}: ${elapsed.toFixed(2)} ms (${memberships.length} projects)`);
    }

    // Cache the project data
    const projData = await db.collection('projectmembers').aggregate([
        { $match: { userId: userId } },
        { $lookup: { from: 'projects', localField: 'projectId', foreignField: '_id', as: 'project' } },
        { $unwind: '$project' }
    ]).toArray();
    await redis.set(`user:${userId}:projects`, JSON.stringify(projData), 'EX', 60);

    const redisProjTimes = [];
    for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const cached = await redis.get(`user:${userId}:projects`);
        const parsed = JSON.parse(cached);
        const elapsed = performance.now() - start;
        redisProjTimes.push(elapsed);
        console.log(`  Redis  Run ${i + 1}: ${elapsed.toFixed(2)} ms (${parsed.length} projects)`);
    }

    await redis.del(`user:${userId}:projects`);

    // ==============================
    // CLEANUP
    // ==============================
    console.log('\n🧹 Cleaning up benchmark tasks...');
    const deleteResult = await db.collection('tasks').deleteMany({ title: { $regex: /^__BENCHMARK_TASK_/ } });
    console.log(`✅ Deleted ${deleteResult.deletedCount} test tasks`);

    // ==============================
    // SUMMARY
    // ==============================
    const avg = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log(`\n  GET /tasks (${totalTasks} documents):`);
    console.log(`    MongoDB (cache MISS)  → avg: ${avg(mongoTimes)} ms`);
    console.log(`    Redis   (cache HIT)   → avg: ${avg(redisTimes)} ms`);
    console.log(`    Speedup               → ${(parseFloat(avg(mongoTimes)) / parseFloat(avg(redisTimes))).toFixed(1)}x faster`);

    console.log(`\n  GET /projects (with $lookup):`);
    console.log(`    MongoDB (cache MISS)  → avg: ${avg(mongoProjTimes)} ms`);
    console.log(`    Redis   (cache HIT)   → avg: ${avg(redisProjTimes)} ms`);
    console.log(`    Speedup               → ${(parseFloat(avg(mongoProjTimes)) / parseFloat(avg(redisProjTimes))).toFixed(1)}x faster`);

    console.log('');
    await mongoose.disconnect();
    redis.disconnect();
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
