import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes';
import { enqueue } from '../queue/producer';
import { runWorker } from '../queue/worker';

const app = express()
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
})
var corsOptions = {
    // temporary
    origin: '*',
    optionsSuccessStatus: 200,
    methods: 'POST',

};

const port = 3000
app.use(limiter)
app.use(cors(corsOptions));

type SubscribeReq = {
    url: string
}

app.post('/subscribe', async (req, res) => {
    const { url }: SubscribeReq = req.body
    if (!url || url.trim() === "") {
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "url is required in request"
        })
    }
    
    try {
        // trigger producer to enqueue entry: url and price
        await enqueue(url)
        res.status(StatusCodes.ACCEPTED).json({
            status: "entry created"
        })
    } catch {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "something went wrong"
        })
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

runWorker()
