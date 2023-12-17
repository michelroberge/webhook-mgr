# GitHub Webhook Server

This Node.js server acts as a GitHub webhook handler, automating actions based on push events triggered in specific branches of your repositories. The server is designed to handle various repositories and their associated Dockerized applications.

### Getting Started

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Configure Environment Variables:**
    - Create a `.env` file based on `.env.example` and add your GitHub webhook secret.
    - Modify `repositories.json` to include your repository configurations.

4. **Start the Webhook Server:**
    ```bash
    node server.js
    ```

### Usage

1. **Adding Repositories:**
    - Update `repositories.json` to include repository details like `secretEnvName`, `path`, `webhookPath`, and `composeFile`.

2. **GitHub Webhook Configuration:**
    - Set up a GitHub webhook for your repositories with the payload URL pointing to your server's endpoint (`http://your-domain.com/webhook`).

3. **GitHub Event Filtering:**
    - The server processes push events only from specified branches (`refs/heads/<branch-name>`), triggering actions for successful pushes.

4. **Actions Performed:**
    - Upon receiving valid push events, the server executes `git pull` on the specified branch and rebuilds Docker containers using `docker-compose`.

### Repository Configuration

- **`repositories.json`:**
  - Define multiple repositories with their respective configurations.
  - Ensure `secretEnvName`, `path`, `webhookPath`, and `composeFile` are accurately set.

### Dependencies

- **Express:** Web framework for handling HTTP requests.
- **Body Parser:** Middleware for parsing incoming request bodies.
- **Child Process:** For executing shell commands.
- **Crypto:** Utilized for signature verification.
- **Dockerode:** Library for interacting with the Docker API.

### Notes

- Ensure proper security measures:
  - Protect `.env` file containing sensitive information.
  - Review and secure your server and webhook configurations.

### License

This project is licensed under the [MIT License](LICENSE).
