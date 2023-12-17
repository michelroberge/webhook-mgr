const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const crypto = require('crypto');
const Docker = require('dockerode');
require('dotenv').config();

const app = express();
const docker = new Docker();

app.use(bodyParser.json({ limit: '10mb' })); // Adjust the limit as needed

app.get('/webhook', (req, res) => {
    console.log('GET operation not supported');
    res.status(200).send('Get operation not supported');
});

const repositoriesData = require('./repositories.json');
const repositories = repositoriesData.repositories;
const secret = process.env.GITHUB_WEBHOOK_SECRET;

for (const repo of repositories) {
    const { secretEnvName, path, webhookPath, composeFile } = repo;

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
        // If it's not a push event or not on the 'main' branch, don't proceed
        console.log('Webhook received but conditions not met.');
        res.status(200).send('Conditions not met for action.');
        return;
    }
        res.status(200).send('Webhook received and actions completed successfully');

        // Git pull code
        const gitCmd = `git -C ${path} pull origin ${repo.branch}` ;
        const options = {
            cwd: path, 
        };

        exec(gitCmd, options, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error pulling code for ${repo.name}: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`git stderr for ${repo.name}: ${stderr}`);
            }
            console.log(`git stdout for ${repo.name}: ${stdout}`);

            // Rebuild Docker containers from Docker Compose
            try {
                const command = `docker-compose -f ${composeFile} down && docker-compose -f ${composeFile} up -d --build`;
                exec(command, options, (composeError, composeStdout, composeStderr) => {
                    if (composeError) {
                        console.error(`Error rebuilding Docker containers for ${repo.name}: ${composeError.message}`);
                        return;
                    }
                    if (composeStderr) {
                        console.error(`Docker compose stderr for ${repo.name}: ${composeStderr}`);
                    }
                    console.log(`Docker compose stdout for ${repo.name}: ${composeStdout}`);
                });
            } catch (err) {
                console.error(`Error rebuilding Docker containers for ${repo.name}: ${err.message}`);
            }
        });
    });
}

const PORT = 81;
app.listen(PORT, () => {
    console.log(`Webhook handler listening on port ${PORT}`);
});
