# Cloud Log Analyzer

Cloud Log Analyzer is a full-stack mini project for log analysis. Users upload a `.log` or `.txt` file, the backend scans each line, counts `ERROR`, `WARNING`, and `INFO` messages, stores the analysis in MongoDB, and the frontend shows the result using charts and history cards.

## 1. Project Features

- Upload log files from the browser
- Detect and count `ERROR`, `WARNING`, and `INFO` messages
- Store every analysis result in MongoDB
- Show charts for log distribution
- Display recent upload history
- Run locally with Docker
- Deploy on AWS using Docker

## 2. Suggested Project Structure

```text
CC-aat/
  backend/
  frontend/
  docker-compose.yml
  README.md
```

## 3. Technologies Used

- Frontend: React, Vite, Recharts
- Backend: Node.js, Express, Multer, Mongoose
- Database: MongoDB
- Containerization: Docker, Docker Compose
- Cloud: AWS EC2

## 4. How the System Works

1. User uploads a log file from the frontend.
2. Frontend sends the file to the backend API.
3. Backend reads the file line by line.
4. Backend checks whether a line contains `error`, `warn`, or `info`.
5. Backend counts each category and stores the result in MongoDB.
6. Frontend fetches the saved analysis and shows charts and summary cards.

## 5. Local Setup Without Docker

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### MongoDB

Install MongoDB locally or use MongoDB Atlas. Update `backend/.env` with your connection string.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cloudlogdb
CLIENT_URL=http://localhost:5173
```

## 6. Local Setup With Docker

Make sure Docker Desktop is installed and running.

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

To stop:

```bash
docker compose down
```

To stop and remove DB volume too:

```bash
docker compose down -v
```

## 7. API Endpoints

### `GET /api/health`

Checks if backend is running.

### `POST /api/logs/upload`

Uploads and analyzes a log file.

Form-data field name:

```text
logFile
```

### `GET /api/logs`

Returns all previous analysis records.

### `GET /api/logs/:id`

Returns one analysis record.

## 8. Step-By-Step Guide To Finish The Project

### Step 1: Finalize the problem statement

Use this clear version in your report:

> Build a cloud-based log analysis application that accepts system log files, automatically detects error, warning, and informational messages, stores the analysis result in MongoDB, and visualizes insights through interactive charts. The application should be containerized using Docker and deployed on AWS.

### Step 2: Define the input format clearly

Mention this in your report and presentation:

- Input file types: `.log`, `.txt`
- Each log line may contain words like `ERROR`, `WARN`, `WARNING`, `INFO`
- Matching is case-insensitive

Example:

```text
2026-04-28 10:00:01 INFO Server started
2026-04-28 10:00:05 WARNING Disk usage is high
2026-04-28 10:00:10 ERROR Database connection failed
```

### Step 3: Explain the workflow

- Upload file
- Parse file
- Count categories
- Store output
- Visualize result

### Step 4: Build the backend

- Create Express server
- Add file upload using Multer
- Parse file text
- Count severity messages
- Save results in MongoDB
- Expose REST APIs

### Step 5: Build the frontend

- Create dashboard UI
- Add upload form
- Show total lines and counts
- Show pie chart and bar chart
- Show previous uploads

### Step 6: Test with sample logs

Use 2 to 3 test files with different counts so your charts visibly change.

### Step 7: Dockerize the app

- Create backend Dockerfile
- Create frontend Dockerfile
- Use `docker-compose.yml`
- Run all services together

### Step 8: Deploy to AWS

Simplest college-demo option: AWS EC2 with Docker.

#### EC2 deployment steps

1. Create an AWS account.
2. Launch an Ubuntu EC2 instance.
3. Allow inbound ports in the security group:
   - `22` for SSH
   - `80` for frontend
   - `5000` if you want direct backend access
4. SSH into the instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

5. Install Docker:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

6. Copy your project to the server using `git clone` or SCP.
7. Run:

```bash
docker compose up --build -d
```

8. Open in browser:

```text
http://your-ec2-public-ip
```

If you want the frontend on port 80, update the frontend mapping in `docker-compose.yml` from `5173:80` to `80:80`.

### Step 9: Optional production improvement

For a stronger project, use MongoDB Atlas instead of local MongoDB on EC2. Then set:

```env
MONGODB_URI=your-mongodb-atlas-connection-string
```

and remove the `mongo` service from Docker Compose for production.

## 9. What You Should Mention Clearly In Your Report

- Problem statement
- Objective of the project
- Input format assumptions
- Technologies used
- System architecture
- Database schema
- Docker setup
- AWS deployment steps
- Output screenshots
- Future enhancements

## 10. Suggested Architecture Explanation

You can explain it like this:

- React frontend handles user upload and visualization.
- Express backend receives and processes files.
- MongoDB stores log analysis history.
- Docker packages each service for consistent deployment.
- AWS EC2 hosts the containers in the cloud.

## 11. Database Schema

Each document stores:

- file name
- upload timestamp
- total lines
- counts of error, warning, info
- percentages

## 12. Future Enhancements

- Support filtering by date and severity
- Add user login
- Add PDF report download
- Add real-time log streaming
- Detect custom patterns beyond only three levels

## 13. Viva Questions You May Get

- Why did you choose MongoDB?
- Why use Docker in this project?
- Why is cloud deployment useful here?
- How are logs parsed?
- What happens if the file contains mixed case like `error` and `ERROR`?
- What are the advantages of using charts for log analysis?

## 14. Important Notes

- For this starter, severity is detected using keyword matching.
- This is perfect for mini-project/demo level work.
- For advanced production systems, you can use log parsers, stream processing, or ML anomaly detection.

## 15. Next Things You Can Add

- Export charts as images
- Upload multiple files
- Search inside parsed log lines
- Severity-wise table view
- Dark mode toggle
