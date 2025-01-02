# Getting Started

Note that these instructions were written with the heavy assistance of Copilot.<br>
Apologies for any strange phrasing or inaccuracies, although on the surface it seems reasonable and I checked the links it gave.

Instructions are given below for a Windows development machine.<br>
It is anticipated that generally, the equivalent Linux instructions will be simpler and that the WSL instructions can be used as guidance.<br>
Unfortunately, I have no knowledge of development on Macs, but expect that what is true for Linux is likely true(ish) there too.

## Installing Node.js

This project is deployed (via Vercel) using Node.js version 22.x (the latest LTS version).
Using the same version for local development is recommended.

### Option 1: Using Node Version Manager (NVM)

Using NVM (Node Version Manager) can be desirable because it allows you to easily manage multiple versions of Node.js on your machine. This is particularly useful when working on different projects that may require different Node.js versions. With NVM, you can switch between versions with simple commands, ensuring compatibility and reducing the risk of version-related issues.

1. **Install NVM for Windows:**

- Download the NVM for Windows installer from the [releases page](https://github.com/coreybutler/nvm-windows/releases).
- Run the installer and follow the setup instructions.

2. **Install Node.js using NVM:**

- Open a new Command Prompt or PowerShell window.
- Run the following command to install the latest Long Term Support version of Node.js:
  ```sh
  nvm install --lts
  ```
- Set the installed version as the default:
  ```sh
  nvm use --lts
  ```

Further descriptions of NVM for Windows can be found on their [GitHub page](https://github.com/coreybutler/nvm-windows).

### Option 2: Direct Installation

1. **Download Node.js:**

- Go to the [Node.js download page](https://nodejs.org/).
- Download the Windows installer for the LTS (Long Term Support) version.

2. **Install Node.js:**

- Run the downloaded installer.
- Follow the setup instructions, making sure to install the npm package manager.

### Option 3: Using Windows Subsystem for Linux (WSL)

1. **Install WSL:**
2. **Set up your Linux distribution:**
   No instructions are given here, because there are several methods and generally searching online will find better instructions than we would update here.

3. **Install NVM and Node.js in WSL:**

- Open your WSL terminal.
- Install NVM:
  ```sh
  wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  ```
- (Maybe this is included in the above script...) Load NVM:
  ```sh
  export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  ```
- Install Node.js using NVM:
  ```sh
  nvm install --lts
  nvm use --lts
  ```

## Installing Docker (semi-optional)

Docker containers are used by the Supabase maintainers to provide a local version of the database infrastructure.
GLA Summit's database and user authentication is hosted by Supabase on their cloud services, but a local version is convenient for development and testing.
Without installing Docker, it would be more tricky to provision the appropriate equivalent tooling (I suspect it is possible, but I make no attempt to describe how).

### Installing Docker for Windows

If you intend to develop directly in Windows (without WSL) then install the Docker for Windows client.

1. **Download Docker Desktop:**

- Go to the [Docker Desktop download page](https://www.docker.com/products/docker-desktop).
- Download the Docker Desktop for Windows installer.

2. **Install Docker Desktop:**

- Run the downloaded installer.
- Follow the setup instructions, making sure to enable the WSL 2 feature during installation.

3. **Start Docker Desktop:**

- Once installed, start Docker Desktop from the Start menu.
- Docker Desktop will automatically start the Docker daemon.

### Installing Docker CE and CLI for WSL

Docker for Windows has a settings menu option to enable integration with WSL.
However, if you prefer to develop within WSL and wish to avoid Docker for Windows,
you can optionally instead use Docker CE (Community Edition) and the Docker CLI (Command Line Interface):

1. **Install Docker CE:**

- Open your WSL terminal.
- Update your package list:
  ```sh
  sudo apt-get update
  ```
- Install Docker's package dependencies:
  ```sh
  sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
  ```
- Add Docker's official GPG key:
  ```sh
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  ```
- Add Docker's APT repository (note, this assumes the default Ubuntu distribution for WSL - for other distributions, check the Docker CE documentation):
  ```sh
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  ```
- Update your package list again:
  ```sh
  sudo apt-get update
  ```
- Install Docker CE:

  ```sh
  sudo apt-get install docker-ce
  ```

- Docker CLI should be installed as part of Docker CE. Verify the installation:
  ```sh
  docker --version
  ```

2. **(Optional) Configure Docker to run without sudo:**

- Create the Docker group:
  ```sh
  sudo groupadd docker
  ```
- Add your user to the Docker group:
  ```sh
  sudo usermod -aG docker $USER
  ```
- Apply the new group membership:
  ```sh
  newgrp docker
  ```

3. **Start Docker:**

- Start the Docker service:
  ```sh
  sudo service docker start
  ```

## Setting up this project

### Cloning the Project and Installing Dependencies

To get started with this project, follow these steps:

1. **Clone the Repository**:

- Clone the repository using whichever method suits your GitHub account keys (SSH or HTTPS)

  ```sh
  git clone <repository-url>
  cd <repository-directory>
  ```

2. **Install Dependencies**:

- At the top-level directory (only Supabase tooling and TypeScript):

  ```sh
  npm install
  ```

- Navigate to the frontend directory and install dependencies (main dependencies for the website and development):
  ```sh
  cd frontend
  npm install
  ```

### Running the Supabase services

- Supabase can be started (for local development) by running (in the top-level directory)
  ```sh
  npx supabase start
  ```
- It will initially dowload various Docker images for their containers, and then start the containers.
- When it completes, it will print a status with various lines giving URLs or endpoints.
- Insert the 'anon key' and 'service_role key' to a .env.local file in the frontend directory, along with the 'API URL':

  ```sh
  NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
  SECRET_SUPABASE_SERVICE_KEY="<service_role key>"

  # Additionally, set the following environment variable to remove a requirement for the email server keys
  USE_MOCK_EMAIL=true

  # Add enviroment variables for test users - these are generated by the seeding process
  # Testing emails for auth setup
  TEST_ADMIN_EMAIL=Christian27@test.email
  TEST_ORGANIZER_EMAIL=Sreejith28@test.email
  TEST_PRESENTER_EMAIL=Kamalakannan35@test.email
  TEST_ATTENDEE_EMAIL=Maciej6@test.email

  # Add the sender line for emails
  EMAIL_FROM_MG="GLA Summit Organizers <web@glasummit.org>"
  ```

### Running the website locally

- From the frontend directory, to launch the website locally execute

```sh
npm run dev_fakeEmail
```

- The website will become available at http://localhost:3000 (so long as the port is not previously occupied, otherwise, a subsequent port will be chosen).
- Edits should be reflected in real time, following the file saves (Hot Module Reload).
- The environment file you created above should be listed in the "Environments" line of the printed status when running `npm run dev_fakeEmails`.
