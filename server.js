const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const crypto = require('crypto');
const util = require('util');
const Docker = require('dockerode');
require('dotenv').config();

const app = express();
const docker = new Docker();

const execPromise = util.promisify(exec);

app.use(bodyParser.json({ limit: '10mb' }));

app.get('/webhook', (req, res) => {
    console.log('GET operation not supported');
    res.status(200).send('Get operation not supported');
});

const repositoriesData = require('./repositories.json');
const repositories = repositoriesData.repositories;
const secret = process.env.GITHUB_WEBHOOK_SECRET;

for (const repo of repositories) {
    const { path, webhookPath, composeFile } = repo;

    app.post(webhookPath, async (req, res) => {
        const payload = req.body;
        const eventType = req.headers['x-github-event'];
        console.log(`Received GitHub payload on ${repo.name}:`);

        const receivedSignature = req.headers['x-hub-signature-256'];
        const computedSignature = `sha256=${crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')}`;

        if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(computedSignature))) {
            console.error(`Invalid signature for ${repo.name}. Request is not from GitHub.`);
            res.status(403).send('Invalid signature');
            return;
        }

        if (eventType !== 'push' || payload.ref !== `refs/heads/${repo.branch}`) {
            console.log('Webhook received but conditions not met.');
            res.status(200).send('Conditions not met for action.');
            return;
        }
        
        res.status(200).send('Webhook received and actions completed successfully');

        try {
            const gitCmd = `git -C ${path} pull origin ${repo.branch} --no-edit`;
            const options = { cwd: path };

            const { stdout: gitStdout, stderr: gitStderr } = await execPromise(gitCmd, options);
            console.log(`git stdout for ${repo.name}: ${gitStdout}`);

            const command = `docker-compose -f ${composeFile} down && docker-compose -f ${composeFile} up -d --build`;
            const { stdout: composeStdout, stderr: composeStderr } = await execPromise(command, options);
            console.log(`Docker compose stdout for ${repo.name}: ${composeStdout}`);
            
            
            console.log(`Webhook handler listening on port ${PORT}`);
            
            
        } catch (err) {
            console.error(`Error: ${err.message}`);
            // Handle the error or exit the process if necessary
            process.exit(1); // Exiting with status code 1 indicating an error
        }
    });
}

const PORT = 81;
app.listen(PORT, () => {
    console.log(`Webhook handler listening on port ${PORT}`);
});
